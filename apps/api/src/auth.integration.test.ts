import type { FastifyInstance } from 'fastify';
import type { Pool } from 'mysql2/promise';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { hashPassword } from './auth/passwords.js';
import { createPool } from './db.js';
import { migrate } from './db/migrations.js';
import { Store } from './db/store.js';

// Pruebas contra MySQL real. En CI las activa TEST_DB_HOST (servicio mysql:8.4 de GitHub Actions).
const host = process.env.TEST_DB_HOST;

describe.skipIf(!host)('ingreso por grupo, avance y panel docente (MySQL real)', () => {
  let pool: Pool;
  let app: FastifyInstance;
  let store: Store;
  let joinCode = '';
  let groupId = 0;

  const cookieFrom = (setCookie: string | string[] | undefined) => String(Array.isArray(setCookie) ? setCookie[0] : setCookie).split(';')[0]!;

  beforeAll(async () => {
    pool = createPool(
      { host: host!, port: Number(process.env.TEST_DB_PORT ?? 3306), user: 'root', password: process.env.TEST_DB_PASSWORD ?? 'root', database: 'aula_test' },
      5,
    );
    await pool.query('DROP TABLE IF EXISTS exercise_progress, sessions');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DROP TABLE IF EXISTS users, course_groups, schema_migrations');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    await migrate(pool);
    await migrate(pool); // idempotente
    store = new Store(pool);
    app = await buildApp({ commit: 'test', buildDate: '', checkDatabases: async () => ({ app: 'ok', sandbox: 'ok' }), store });
    await store.createUser({ username: 'profe', fullName: 'Docente de prueba', role: 'docente', passwordHash: await hashPassword('clave-docente'), groupId: null });
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  it('el docente ingresa y crea un grupo con código de 6 caracteres', async () => {
    const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'PROFE', password: 'clave-docente' } });
    expect(login.statusCode).toBe(200);
    const cookie = cookieFrom(login.headers['set-cookie']);

    const created = await app.inject({ method: 'POST', url: '/api/groups', headers: { cookie }, payload: { name: 'Grupo 2758' } });
    expect(created.statusCode).toBe(201);
    joinCode = created.json().group.joinCode;
    groupId = created.json().group.id;
    expect(joinCode).toMatch(/^[A-Z2-9]{6}$/);
  });

  it('un estudiante se registra con el código y guarda su avance', async () => {
    const bad = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { code: 'XXXXXX', fullName: 'Laura Gómez', username: 'laura', password: 'clave-laura' } });
    expect(bad.statusCode).toBe(404);

    const register = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { code: joinCode.toLowerCase(), fullName: 'Laura Gómez', username: 'Laura', password: 'clave-laura' },
    });
    expect(register.statusCode).toBe(201);
    const cookie = cookieFrom(register.headers['set-cookie']);

    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } });
    expect(me.json().user).toMatchObject({ username: 'laura', role: 'estudiante', groupName: 'Grupo 2758' });

    const save = (body: object) => app.inject({ method: 'PUT', url: '/api/progress/T1-B1', headers: { cookie }, payload: body });
    expect((await save({ status: 'correct', attempts: 2 })).statusCode).toBe(200);
    // Un intento posterior no le quita el "correcto" ni baja los intentos
    expect((await save({ status: 'attempted', attempts: 1 })).statusCode).toBe(200);
    const progress = await app.inject({ method: 'GET', url: '/api/progress', headers: { cookie } });
    expect(progress.json().progress['T1-B1']).toMatchObject({ status: 'correct', attempts: 2 });

    const duplicated = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { code: joinCode, fullName: 'Otra Laura', username: 'laura', password: 'clave-otra1' } });
    expect(duplicated.statusCode).toBe(409);
  });

  it('el docente ve el avance de su grupo; el estudiante no puede', async () => {
    const teacher = cookieFrom((await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'profe', password: 'clave-docente' } })).headers['set-cookie']);
    const student = cookieFrom((await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'laura', password: 'clave-laura' } })).headers['set-cookie']);

    const list = await app.inject({ method: 'GET', url: `/api/groups/${groupId}/students`, headers: { cookie: teacher } });
    expect(list.json().students).toHaveLength(1);
    expect(list.json().students[0].progress['T1-B1'].status).toBe('correct');

    expect((await app.inject({ method: 'GET', url: `/api/groups/${groupId}/students`, headers: { cookie: student } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'GET', url: '/api/groups' })).statusCode).toBe(401);
  });

  it('un grupo cerrado no admite registros y la contraseña errada no entra', async () => {
    const teacher = cookieFrom((await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'profe', password: 'clave-docente' } })).headers['set-cookie']);
    await app.inject({ method: 'PATCH', url: `/api/groups/${groupId}`, headers: { cookie: teacher }, payload: { active: false } });
    const closed = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { code: joinCode, fullName: 'Pedro Díaz', username: 'pedro', password: 'clave-pedro' } });
    expect(closed.statusCode).toBe(404);
    expect((await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'laura', password: 'mala-clave' } })).statusCode).toBe(401);
  });
});
