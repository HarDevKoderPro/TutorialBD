import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { firstIssue, requireUser } from '../auth/routes.js';
import type { Store } from '../db/store.js';

const exerciseIdSchema = z.string().regex(/^T\d+-[BIA]\d+$/);
const entrySchema = z.object({
  status: z.enum(['attempted', 'correct', 'submitted']),
  attempts: z.number().int().min(0).max(10_000),
  answer: z.string().max(10_000).nullable().optional(),
});

// Avance de ejercicios del usuario con sesión
export function registerProgress(app: FastifyInstance, store: Store): void {
  app.get('/api/progress', { preHandler: requireUser() }, async (request) => ({ progress: await store.progressFor(request.user!.id) }));

  app.put<{ Params: { exerciseId: string } }>('/api/progress/:exerciseId', { preHandler: requireUser() }, async (request, reply) => {
    const id = exerciseIdSchema.safeParse(request.params.exerciseId);
    const entry = entrySchema.safeParse(request.body);
    if (!id.success) return reply.code(400).send({ error: 'Ejercicio no válido.' });
    if (!entry.success) return reply.code(400).send({ error: firstIssue(entry.error) });
    await store.saveProgress(request.user!.id, id.data, { ...entry.data, answer: entry.data.answer ?? null });
    return { ok: true };
  });
}
