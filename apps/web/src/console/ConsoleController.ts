import type { Terminal } from '@xterm/xterm';
import { formatResult } from './formatResult';
import type { ServerMessage } from './protocol';
import { type Statement, StatementBuffer } from './statementBuffer';

export type ConsoleStatus = 'connecting' | 'ready' | 'closed';

export interface ConsoleCallbacks {
  onStatus: (status: ConsoleStatus) => void;
  onError: (code: number | null) => void;
}

const PROMPT = 'mysql> ';
const ESC = '\x1b';
const HISTORY_KEY = 'sql-desde-cero:historial';
const SESSION_KEY = 'sql-desde-cero:sesion';
const MAX_HISTORY = 200;

const color = {
  error: (text: string) => `\x1b[38;2;253;164;175m${text}\x1b[0m`,
  notice: (text: string) => `\x1b[38;2;252;211;77m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[38;2;154;166;200m${text}\x1b[0m`,
};

const HELP = [
  'Comandos de la consola:',
  '  help      Muestra esta ayuda',
  '  clear     Descarta la instrucción a medio escribir (también \\c)',
  '  exit      Cierra la sesión (también quit)',
  '',
  'Termina cada instrucción con ; (o \\G para ver los resultados en vertical).',
  'Atajos: ↑/↓ historial · Ctrl+C cancela · Ctrl+L limpia la pantalla.',
];

// Identificador anónimo de este navegador: define el sandbox del estudiante
export function getSessionKey(): string {
  let key = localStorage.getItem(SESSION_KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, key);
  }
  return key;
}

// Emula el cliente mysql en una terminal xterm.js: edición de línea, historial,
// sentencias de varias líneas y ejecución una por una a través del WebSocket.
export class ConsoleController {
  private socket: WebSocket | null = null;
  private status: ConsoleStatus = 'connecting';
  private buffer = new StatementBuffer();
  private line = '';
  private cursor = 0;
  private input = '';
  private pending: Statement[] = [];
  private running: Statement | null = null;
  private nextId = 1;
  private history: string[] = [];
  private historyIndex = -1;
  private disposed = false;
  private processing = false;

  constructor(
    private readonly term: Terminal,
    private readonly callbacks: ConsoleCallbacks,
  ) {
    try {
      this.history = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as string[];
    } catch {
      this.history = [];
    }
    term.onData((data) => this.onData(data));
  }

  connect(): void {
    this.setStatus('connecting');
    this.term.writeln(color.dim('Conectando con el servidor MySQL…'));
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${location.host}/ws/console?session=${getSessionKey()}`);
    this.socket = socket;
    socket.onmessage = (event) => this.onMessage(JSON.parse(String(event.data)) as ServerMessage);
    socket.onclose = () => {
      if (this.disposed || this.socket !== socket) return;
      this.running = null;
      this.pending = [];
      this.input = '';
      this.term.writeln('');
      this.term.writeln(color.notice('Conexión cerrada. Usa «Reconectar» para continuar.'));
      this.setStatus('closed');
    };
  }

  dispose(): void {
    this.disposed = true;
    this.socket?.close();
  }

  // Escribe un bloque de SQL como si se hubiera pegado en la terminal
  run(sql: string): void {
    this.term.focus();
    if (this.line) this.replaceLine('');
    this.input += `${sql.replace(/\r\n/g, '\n').trimEnd()}\n`;
    this.processInput();
  }

  reset(): void {
    if (this.status !== 'ready') return;
    this.send({ type: 'reset' });
  }

  clearScreen(): void {
    this.term.clear();
  }

  private setStatus(status: ConsoleStatus): void {
    this.status = status;
    this.callbacks.onStatus(status);
  }

  private onMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'ready':
        this.term.writeln(color.dim(`Conectado a MySQL 8.4 · base de datos: ${message.database}`));
        this.term.writeln(color.dim('Escribe help; para ver la ayuda. Termina cada instrucción con ;'));
        this.term.writeln('');
        this.setStatus('ready');
        this.prompt();
        this.processInput();
        break;
      case 'result': {
        const statement = this.running;
        this.running = null;
        const lines = formatResult(message.result, statement?.vertical);
        const paint = message.result.kind === 'error' ? color.error : (text: string) => text;
        lines.forEach((line) => this.term.writeln(paint(line)));
        this.term.writeln('');
        this.callbacks.onError(message.result.kind === 'error' ? message.result.code : null);
        this.runNext();
        break;
      }
      case 'reset-done':
        this.term.writeln('');
        this.term.writeln(color.notice('La base «practica» se reinició: ahora está vacía.'));
        this.term.writeln('');
        this.callbacks.onError(null);
        if (!this.running) this.prompt();
        break;
      case 'notice':
        this.term.writeln('');
        this.term.writeln(color.notice(message.message));
        break;
      case 'fatal':
        this.term.writeln(color.error(message.message));
        break;
    }
  }

  private onData(data: string): void {
    // Ctrl+C durante una ejecución: cancelar en el servidor y descartar lo pegado
    if (data === '\x03' && this.running) {
      this.term.write('^C');
      this.input = '';
      this.pending = [];
      this.send({ type: 'cancel' });
      return;
    }
    this.input += data;
    this.processInput();
  }

  // Consume la entrada solo cuando no hay nada ejecutándose (igual que el cliente mysql)
  private processInput(): void {
    if (this.processing) return;
    this.processing = true;
    try {
      this.consumeInput();
    } finally {
      this.processing = false;
    }
  }

  private consumeInput(): void {
    while (this.input && !this.running && this.status === 'ready') {
      // Secuencias de escape de las flechas y Supr (ESC [ …)
      const escape = this.input.startsWith(ESC) ? /^\[(\d*~|[A-D])/.exec(this.input.slice(1)) : null;
      if (escape) {
        this.input = this.input.slice(escape[0].length + 1);
        this.onEscape(escape[1]!);
        continue;
      }
      const ch = this.input[0]!;
      this.input = this.input.slice(1);
      if (ch === '\r' || ch === '\n') {
        if (ch === '\r' && this.input[0] === '\n') this.input = this.input.slice(1);
        this.term.write('\r\n');
        const line = this.line;
        this.line = '';
        this.cursor = 0;
        this.onLine(line);
      } else if (ch === '\x7f' || ch === '\b') {
        if (this.cursor > 0) {
          this.line = this.line.slice(0, this.cursor - 1) + this.line.slice(this.cursor);
          this.cursor -= 1;
          this.redraw();
        }
      } else if (ch === '\x03') {
        this.term.write('^C\r\n');
        this.buffer.clear();
        this.line = '';
        this.cursor = 0;
        this.prompt();
      } else if (ch === '\x0c') {
        this.term.clear();
        this.redraw();
      } else if (ch === '\x15') {
        this.replaceLine('');
      } else if (ch >= ' ' || ch === '\t') {
        const text = ch === '\t' ? '  ' : ch;
        this.line = this.line.slice(0, this.cursor) + text + this.line.slice(this.cursor);
        this.cursor += text.length;
        if (this.cursor === this.line.length) this.term.write(text);
        else this.redraw();
      }
    }
  }

  private onEscape(code: string): void {
    if (code === 'A' || code === 'B') {
      if (this.history.length === 0) return;
      if (code === 'A') this.historyIndex = Math.min(this.historyIndex + 1, this.history.length - 1);
      else this.historyIndex = Math.max(this.historyIndex - 1, -1);
      this.replaceLine(this.historyIndex === -1 ? '' : this.history[this.history.length - 1 - this.historyIndex]!);
    } else if (code === 'C' && this.cursor < this.line.length) {
      this.cursor += 1;
      this.term.write('\x1b[C');
    } else if (code === 'D' && this.cursor > 0) {
      this.cursor -= 1;
      this.term.write('\x1b[D');
    } else if (code === '3~' && this.cursor < this.line.length) {
      this.line = this.line.slice(0, this.cursor) + this.line.slice(this.cursor + 1);
      this.redraw();
    }
  }

  private onLine(line: string): void {
    this.historyIndex = -1;
    if (line.trim()) this.remember(line);

    // Comandos propios del cliente (sin punto y coma, solo al inicio de una instrucción)
    const command = line.trim().replace(/;$/, '').toLowerCase();
    if (this.buffer.isEmpty && ['help', '\\h', '?'].includes(command)) {
      HELP.forEach((text) => this.term.writeln(text));
      this.term.writeln('');
      return this.prompt();
    }
    if (['clear', '\\c'].includes(command) || line.trim().endsWith('\\c')) {
      this.buffer.clear();
      return this.prompt();
    }
    if (this.buffer.isEmpty && ['exit', 'quit', '\\q'].includes(command)) {
      this.term.writeln('Bye');
      this.socket?.close();
      return;
    }

    this.pending.push(...this.buffer.pushLine(line));
    this.runNext();
  }

  private runNext(): void {
    const statement = this.pending.shift();
    if (!statement) {
      this.prompt();
      this.processInput();
      return;
    }
    this.running = statement;
    this.send({ type: 'exec', id: this.nextId++, sql: statement.sql });
  }

  private prompt(): void {
    this.term.write(this.buffer.isEmpty ? PROMPT : this.buffer.continuationPrompt);
  }

  private currentPrompt(): string {
    return this.buffer.isEmpty ? PROMPT : this.buffer.continuationPrompt;
  }

  private replaceLine(text: string): void {
    this.line = text;
    this.cursor = text.length;
    this.redraw();
  }

  private redraw(): void {
    const back = this.line.length - this.cursor;
    this.term.write(`\r\x1b[K${this.currentPrompt()}${this.line}${back > 0 ? `\x1b[${back}D` : ''}`);
  }

  private remember(line: string): void {
    if (this.history[this.history.length - 1] === line) return;
    this.history = [...this.history, line].slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
  }

  private send(payload: object): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(payload));
  }
}
