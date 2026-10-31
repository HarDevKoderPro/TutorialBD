import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

describe('GET /api/health', () => {
  it('responde 200 con versión cuando ambas bases están disponibles', async () => {
    const app = await buildApp({
      commit: 'abc1234',
      buildDate: '2026-10-31T00:00:00Z',
      checkDatabases: async () => ({ app: 'ok', sandbox: 'ok' }),
    });

    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      commit: 'abc1234',
      buildDate: '2026-10-31T00:00:00Z',
      databases: { app: 'ok', sandbox: 'ok' },
    });
  });

  it('responde 503 si alguna base no está disponible', async () => {
    const app = await buildApp({
      commit: 'abc1234',
      buildDate: '2026-10-31T00:00:00Z',
      checkDatabases: async () => ({ app: 'ok', sandbox: 'error' }),
    });

    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 'degraded' });
  });
});
