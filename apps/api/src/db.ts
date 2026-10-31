import mysql, { type Pool } from 'mysql2/promise';
import type { DbConfig } from './config.js';

export function createPool(config: DbConfig, connectionLimit: number): Pool {
  return mysql.createPool({
    ...config,
    connectionLimit,
    charset: 'utf8mb4_unicode_ci',
    timezone: '-05:00',
  });
}

// Devuelve 'ok' si el servidor responde a un SELECT 1 en menos de 2 s
export async function ping(pool: Pool): Promise<'ok' | 'error'> {
  try {
    await pool.query({ sql: 'SELECT 1', timeout: 2000 });
    return 'ok';
  } catch {
    return 'error';
  }
}
