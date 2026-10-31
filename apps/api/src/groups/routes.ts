import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { firstIssue, requireUser } from '../auth/routes.js';
import type { Store } from '../db/store.js';

const groupSchema = z.object({ name: z.string().trim().min(2, 'Escribe el nombre del grupo.').max(80) });
const activeSchema = z.object({ active: z.boolean() });
const idSchema = z.coerce.number().int().positive();

// Grupos del docente: crear, listar, activar/cerrar el ingreso y ver el avance de sus estudiantes
export function registerGroups(app: FastifyInstance, store: Store): void {
  const teacher = { preHandler: requireUser('docente') };

  app.get('/api/groups', teacher, async (request) => ({ groups: await store.listGroups(request.user!.id) }));

  app.post('/api/groups', teacher, async (request, reply) => {
    const parsed = groupSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: firstIssue(parsed.error) });
    const group = await store.createGroup(request.user!.id, parsed.data.name);
    return reply.code(201).send({ group: { ...group, name: parsed.data.name, active: true, students: 0 } });
  });

  app.patch<{ Params: { id: string } }>('/api/groups/:id', teacher, async (request, reply) => {
    const id = idSchema.safeParse(request.params.id);
    const body = activeSchema.safeParse(request.body);
    if (!id.success || !body.success) return reply.code(400).send({ error: 'Datos no válidos.' });
    const updated = await store.setGroupActive(request.user!.id, id.data, body.data.active);
    return updated ? { ok: true } : reply.code(404).send({ error: 'Grupo no encontrado.' });
  });

  app.get<{ Params: { id: string } }>('/api/groups/:id/students', teacher, async (request, reply) => {
    const id = idSchema.safeParse(request.params.id);
    if (!id.success) return reply.code(400).send({ error: 'Grupo no válido.' });
    const students = await store.groupStudents(request.user!.id, id.data);
    return students ? { students } : reply.code(404).send({ error: 'Grupo no encontrado.' });
  });
}
