import type { FastifyBaseLogger } from 'fastify';
import type { Connection, FieldPacket, ResultSetHeader } from 'mysql2/promise';
import type { WebSocket } from 'ws';
import { applyPolicy, LOGICAL_DATABASE, toLogical } from './policy.js';
import type { Sandbox, SandboxManager } from './sandbox.js';

// Límites de docs/consola-sql.md §6
export const LIMITS = {
  statementTimeoutMs: 5000,
  maxRows: 500,
  maxStatementLength: 100_000,
  rateWindowMs: 10_000,
  rateMaxStatements: 30,
  idleTimeoutMs: 20 * 60_000,
};

export type ExecResult =
  | { kind: 'rows'; columns: string[]; numeric: boolean[]; rows: (string | null)[][]; total: number; ms: number }
  | { kind: 'ok'; affectedRows: number; info: string; warnings: number; ms: number; message?: string }
  | { kind: 'error'; code: number | null; sqlState: string | null; message: string };

type ClientMessage = { type: 'exec'; id: number; sql: string } | { type: 'cancel' } | { type: 'reset' };

// Tipos de columna numéricos de MySQL: el cliente mysql los alinea a la derecha
const NUMERIC_TYPES = new Set([0, 1, 2, 3, 4, 5, 8, 9, 13, 246]);

export class ConsoleSession {
  private connection: Connection | null = null;
  private running = false;
  private recent: number[] = [];
  private idleTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly socket: WebSocket,
    private readonly manager: SandboxManager,
    private readonly sandbox: Sandbox,
    private readonly log: FastifyBaseLogger,
  ) {}

  async start(): Promise<void> {
    try {
      await this.manager.ensure(this.sandbox);
      this.connection = await this.manager.connect(this.sandbox);
      this.send({ type: 'ready', database: LOGICAL_DATABASE });
      this.touch();
    } catch (error) {
      this.log.error({ err: error }, 'No se pudo preparar el sandbox');
      this.send({ type: 'fatal', message: 'No se pudo conectar con el servidor de práctica. Intenta de nuevo en unos segundos.' });
      this.socket.close();
    }
  }

  async handle(raw: string): Promise<void> {
    let message: ClientMessage;
    try {
      message = JSON.parse(raw) as ClientMessage;
    } catch {
      return;
    }
    this.touch();
    if (message.type === 'exec') await this.exec(message.id, String(message.sql ?? ''));
    else if (message.type === 'cancel') await this.cancel();
    else if (message.type === 'reset') await this.reset();
  }

  async close(): Promise<void> {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    // Cerrar la conexión hace ROLLBACK implícito de cualquier transacción abierta
    this.connection?.destroy();
    this.connection = null;
  }

  private async exec(id: number, sql: string): Promise<void> {
    const reply = (result: ExecResult) => this.send({ type: 'result', id, result });

    if (this.running) return reply({ kind: 'error', code: null, sqlState: null, message: 'Espera a que termine la instrucción anterior.' });
    if (sql.length > LIMITS.maxStatementLength) return reply({ kind: 'error', code: null, sqlState: null, message: 'La instrucción es demasiado larga.' });

    const now = Date.now();
    this.recent = this.recent.filter((time) => now - time < LIMITS.rateWindowMs);
    if (this.recent.length >= LIMITS.rateMaxStatements) {
      return reply({ kind: 'error', code: null, sqlState: null, message: 'Demasiadas instrucciones seguidas. Espera unos segundos.' });
    }
    this.recent.push(now);

    const policy = applyPolicy(sql, this.sandbox.database);
    if (!policy.allowed) return reply({ kind: 'error', code: null, sqlState: null, message: policy.message });

    const connection = await this.ensureConnection();
    if (!connection) return reply({ kind: 'error', code: 2013, sqlState: 'HY000', message: 'Lost connection to MySQL server during query' });

    this.running = true;
    const threadId = connection.threadId;
    const timer = setTimeout(() => {
      if (threadId !== null) void this.manager.killQuery(threadId).catch(() => undefined);
    }, LIMITS.statementTimeoutMs);
    const started = process.hrtime.bigint();

    try {
      const [rows, fields] = await connection.query(policy.sql);
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      reply(this.toResult(rows, fields, ms, policy.changesDatabase));
    } catch (error) {
      reply(this.toError(error));
    } finally {
      clearTimeout(timer);
      this.running = false;
    }
  }

  private toResult(rows: unknown, fields: FieldPacket[] | undefined, ms: number, changedDatabase: boolean): ExecResult {
    const logical = (text: string) => toLogical(text, this.sandbox.database, this.sandbox.user);
    if (Array.isArray(rows) && fields) {
      const data = (rows as unknown[][]).slice(0, LIMITS.maxRows).map((row) =>
        row.map((value) => (value === null ? null : logical(Buffer.isBuffer(value) ? value.toString('utf8') : String(value)))),
      );
      return {
        kind: 'rows',
        columns: fields.map((field) => logical(field.name)),
        numeric: fields.map((field) => NUMERIC_TYPES.has(field.columnType ?? field.type ?? -1)),
        rows: data,
        total: rows.length,
        ms,
      };
    }
    const header = rows as ResultSetHeader;
    return {
      kind: 'ok',
      affectedRows: header.affectedRows ?? 0,
      info: logical(header.info ?? ''),
      warnings: header.warningStatus ?? 0,
      ms,
      ...(changedDatabase ? { message: 'Database changed' } : {}),
    };
  }

  private toError(error: unknown): ExecResult {
    const err = error as { errno?: number; sqlState?: string; sqlMessage?: string; message?: string; fatal?: boolean };
    if (err.fatal) this.connection = null;
    return {
      kind: 'error',
      code: err.errno ?? null,
      sqlState: err.sqlState ?? null,
      message: toLogical(err.sqlMessage ?? err.message ?? 'Error desconocido', this.sandbox.database, this.sandbox.user),
    };
  }

  private async cancel(): Promise<void> {
    const threadId = this.connection?.threadId;
    if (this.running && threadId) await this.manager.killQuery(threadId).catch(() => undefined);
  }

  private async reset(): Promise<void> {
    if (this.running) await this.cancel();
    try {
      await this.manager.reset(this.sandbox);
      // La conexión quedó apuntando a la base borrada: se abre una nueva
      this.connection?.destroy();
      this.connection = await this.manager.connect(this.sandbox);
      this.send({ type: 'reset-done' });
    } catch (error) {
      this.log.error({ err: error }, 'No se pudo reiniciar el sandbox');
      this.send({ type: 'notice', message: 'No se pudo reiniciar la base. Intenta de nuevo.' });
    }
  }

  private async ensureConnection(): Promise<Connection | null> {
    if (this.connection) return this.connection;
    try {
      this.connection = await this.manager.connect(this.sandbox);
      return this.connection;
    } catch {
      return null;
    }
  }

  private touch(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.send({ type: 'notice', message: 'La sesión se cerró por inactividad (20 min). Las transacciones abiertas se deshicieron.' });
      this.socket.close();
    }, LIMITS.idleTimeoutMs);
  }

  private send(payload: object): void {
    if (this.socket.readyState === this.socket.OPEN) this.socket.send(JSON.stringify(payload));
  }
}
