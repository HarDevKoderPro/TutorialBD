import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { SESSION_DAYS, type Role, type Store, type User } from '../db/store.js';
import { hashPassword, verifyPassword } from './passwords.js';

export const SESSION_COOKIE = 'sdc_session';

declare module 'fastify' {
  interface FastifyRequest {
    user: User | null;
  }
}

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,30}$/, 'El usuario debe tener de 3 a 30 caracteres: letras, números, punto, guion o guion bajo.');
const passwordSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(200);

const registerSchema = z.object({
  code: z.string().trim().toUpperCase().length(6, 'El código del grupo tiene 6 caracteres.'),
  fullName: z.string().trim().min(3, 'Escribe tu nombre completo.').max(80),
  username: usernameSchema,
  password: passwordSchema,
});

const loginSchema = z.object({ username: z.string().trim().toLowerCase().min(1), password: z.string().min(1) });

// Freno a intentos de ingreso por IP: 10 fallos cada 15 minutos
const failures = new Map<string, { count: number; until: number }>();
const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60_000;

function tooManyFailures(ip: string): boolean {
  const entry = failures.get(ip);
  if (!entry || entry.until < Date.now()) return false;
  return entry.count >= MAX_FAILURES;
}

function recordFailure(ip: string): void {
  const entry = failures.get(ip);
  if (!entry || entry.until < Date.now()) failures.set(ip, { count: 1, until: Date.now() + WINDOW_MS });
  else entry.count += 1;
}

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Datos no válidos.';
}

export function publicUser(user: User) {
  return { id: user.id, username: user.username, fullName: user.fullName, role: user.role, groupName: user.groupName };
}

// Exige sesión (y opcionalmente un rol) antes de llegar al manejador
export function requireUser(role?: Role) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) return reply.code(401).send({ error: 'Debes ingresar para continuar.' });
    if (role && request.user.role !== role) return reply.code(403).send({ error: 'No tienes permiso para esta acción.' });
  };
}

export async function registerAuth(app: FastifyInstance, store: Store, secureCookies: boolean): Promise<void> {
  app.decorateRequest('user', null);
  app.addHook('onRequest', async (request) => {
    const token = request.cookies[SESSION_COOKIE];
    request.user = token ? await store.findUserBySession(token) : null;
  });

  const startSession = async (reply: FastifyReply, userId: number) => {
    const token = await store.createSession(userId);
    reply.setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DAYS * 24 * 3600,
    });
  };

  app.post('/api/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: firstIssue(parsed.error) });
    const { code, fullName, username, password } = parsed.data;

    const group = await store.findActiveGroupByCode(code);
    if (!group) return reply.code(404).send({ error: 'No encontramos un grupo activo con ese código. Revísalo con tu docente.' });
    if (await store.usernameExists(username)) return reply.code(409).send({ error: 'Ese usuario ya existe. Elige otro.' });

    const userId = await store.createUser({ username, fullName, role: 'estudiante', passwordHash: await hashPassword(password), groupId: group.id });
    await startSession(reply, userId);
    return reply.code(201).send({ user: { id: userId, username, fullName, role: 'estudiante', groupName: group.name } });
  });

  app.post('/api/auth/login', async (request, reply) => {
    if (tooManyFailures(request.ip)) return reply.code(429).send({ error: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' });
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Escribe tu usuario y tu contraseña.' });

    const user = await store.findUserForLogin(parsed.data.username);
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      recordFailure(request.ip);
      return reply.code(401).send({ error: 'Usuario o contraseña incorrectos.' });
    }
    failures.delete(request.ip);
    await startSession(reply, user.id);
    return { user: publicUser(user) };
  });

  app.post('/api/auth/logout', async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    if (token) await store.deleteSession(token);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/api/auth/me', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Sin sesión.' });
    return { user: publicUser(request.user) };
  });
}
