// Mensajes del WebSocket de la consola (deben coincidir con apps/api/src/console/session.ts)

export type ExecResult =
  | { kind: 'rows'; columns: string[]; numeric: boolean[]; rows: (string | null)[][]; total: number; ms: number }
  | { kind: 'ok'; affectedRows: number; info: string; warnings: number; ms: number; message?: string }
  | { kind: 'error'; code: number | null; sqlState: string | null; message: string };

export type ServerMessage =
  | { type: 'ready'; database: string }
  | { type: 'result'; id: number; result: ExecResult }
  | { type: 'reset-done' }
  | { type: 'notice'; message: string }
  | { type: 'fatal'; message: string };
