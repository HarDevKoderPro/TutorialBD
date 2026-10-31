import { createHash, createHmac } from 'node:crypto';
import mysql, { type Connection, type Pool } from 'mysql2/promise';
import type { DbConfig } from '../config.js';
import { LOGICAL_DATABASE } from './policy.js';

// Privilegios del estudiante sobre su propia base: sin rutinas, triggers ni eventos (fuera del curso)
const STUDENT_PRIVILEGES =
  'SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES, CREATE VIEW, SHOW VIEW, CREATE TEMPORARY TABLES, LOCK TABLES';

export interface Sandbox {
  id: string;
  user: string;
  password: string;
  database: string;
}

// Usuario y base derivados de la sesión del navegador: el id no revela la sesión y la contraseña
// se recalcula con el secreto del servidor (no se guarda en ningún lado)
export function deriveSandbox(sessionKey: string, secret: string): Sandbox {
  const id = createHash('sha256').update(`${secret}:${sessionKey}`).digest('hex').slice(0, 12);
  return {
    id,
    user: `u_${id}`,
    password: createHmac('sha256', secret).update(id).digest('hex').slice(0, 32),
    database: `sbx_${id}_${LOGICAL_DATABASE}`,
  };
}

// En GRANT el "_" es comodín: se escapa para que el permiso aplique solo a esta base
function grantTarget(database: string): string {
  return `\`${database.replace(/_/g, '\\_')}\`.*`;
}

export class SandboxManager {
  constructor(
    private readonly admin: Pool,
    private readonly server: Pick<DbConfig, 'host' | 'port'>,
  ) {}

  async ensure(sandbox: Sandbox): Promise<void> {
    await this.admin.query('CREATE USER IF NOT EXISTS ?@? IDENTIFIED BY ? WITH MAX_USER_CONNECTIONS 4', [sandbox.user, '%', sandbox.password]);
    await this.admin.query(`CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(sandbox.database)}`);
    await this.admin.query(`GRANT ${STUDENT_PRIVILEGES} ON ${grantTarget(sandbox.database)} TO ?@?`, [sandbox.user, '%']);
  }

  async reset(sandbox: Sandbox): Promise<void> {
    await this.admin.query(`DROP DATABASE IF EXISTS ${mysql.escapeId(sandbox.database)}`);
    await this.admin.query(`CREATE DATABASE ${mysql.escapeId(sandbox.database)}`);
  }

  // Interrumpe la sentencia en curso de una conexión del estudiante (Ctrl+C o tiempo máximo)
  async killQuery(threadId: number): Promise<void> {
    await this.admin.query(`KILL QUERY ${Number(threadId)}`);
  }

  connect(sandbox: Sandbox): Promise<Connection> {
    return mysql.createConnection({
      host: this.server.host,
      port: this.server.port,
      user: sandbox.user,
      password: sandbox.password,
      database: sandbox.database,
      charset: 'utf8mb4_unicode_ci',
      dateStrings: true,
      rowsAsArray: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
      multipleStatements: false,
    });
  }
}
