import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { z } from 'zod';
import { firstIssue, requireUser } from '../auth/routes.js';
import type { AttendanceStatus, GradesStore, Submission } from '../db/gradesStore.js';
import type { AiGrader } from './aiGrader.js';
import { publicTask, type Task, type TaskCatalog, taskSolution } from './content.js';
import { gradeClosed } from './grading.js';
import { buildStudentReport, taskGrade } from './report.js';

export const MAX_ATTEMPTS = 2;
const MAX_ATTEMPTS_LIMIT = MAX_ATTEMPTS;

export interface TasksDeps {
  catalog: TaskCatalog;
  grades: GradesStore;
  aiGrader: AiGrader | null;
}

const taskIdSchema = z.string().regex(/^T\d+-P[BIA]\d+$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const idSchema = z.coerce.number().int().positive();
const overrideSchema = z.object({
  studentId: z.number().int().positive(),
  taskId: taskIdSchema,
  grade: z.number().min(0).max(5).nullable(),
  comment: z.string().max(2000).nullable().optional(),
});
const submissionGradeSchema = z.object({
  studentId: z.number().int().positive(),
  taskId: taskIdSchema,
  attempt: z.number().int().min(1).max(MAX_ATTEMPTS_LIMIT),
  grade: z.number().min(0).max(5),
  comment: z.string().max(2000).nullable().optional(),
});
const attendanceSchema = z.object({
  date: dateSchema,
  records: z.record(z.string().regex(/^\d+$/), z.enum(['presente', 'tarde', 'ausente', 'excusa'])),
});

// Valida la forma de la respuesta según el tipo de tarea
function answerSchema(task: Task) {
  switch (task.tipo) {
    case 'respuestas':
      return z.array(z.string().max(500)).length(task.preguntas.length);
    case 'clasificar':
      return z.array(z.string().max(100)).length(task.items.length);
    case 'seleccion':
      return z.string().max(200);
    case 'abierta':
      return z.string().trim().min(10, 'Tu respuesta es muy corta.').max(8000);
  }
}

// Vista de una tarea para el estudiante: entregas, nota vigente y, al agotar las entregas, la solución
function studentView(task: Task, submissions: Submission[], override: { grade: number; comment: string | null } | undefined) {
  const own = submissions.filter((submission) => submission.taskId === task.id);
  const finished = own.length >= MAX_ATTEMPTS;
  return {
    ...publicTask(task),
    attempts: own.map((submission) => ({
      attempt: submission.attempt,
      answer: submission.answer,
      grade: submission.grade,
      justification: submission.justification,
      criteria: submission.criteria,
      gradedBy: submission.gradedBy,
      // En tareas cerradas: qué ítems acertó (sin decir la respuesta correcta)
      items: task.tipo === 'abierta' ? null : gradeClosed(task, submission.answer).items,
    })),
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - own.length),
    final: own.length || override ? taskGrade(own, override ? { taskId: task.id, ...override } : undefined) : null,
    solution: finished ? taskSolution(task) : null,
  };
}

async function grade(task: Task, answer: unknown, aiGrader: AiGrader | null, log: FastifyBaseLogger) {
  if (task.tipo !== 'abierta') {
    const result = gradeClosed(task, answer);
    return { grade: result.grade, justification: result.justification, criteria: null, gradedBy: 'auto' as const };
  }
  if (!aiGrader) {
    return { grade: null, justification: 'Tu docente revisará y calificará esta respuesta.', criteria: null, gradedBy: 'pendiente' as const };
  }
  try {
    const result = await aiGrader.grade(task, String(answer));
    return { grade: result.grade, justification: result.justification, criteria: result.criteria, gradedBy: 'ia' as const };
  } catch (error) {
    log.error({ err: error, task: task.id }, 'La IA no pudo calificar');
    return { grade: null, justification: 'La calificación automática no está disponible ahora; tu docente calificará esta respuesta.', criteria: null, gradedBy: 'pendiente' as const };
  }
}

export function registerTasks(app: FastifyInstance, deps: TasksDeps): void {
  const { catalog, grades } = deps;
  const teacher = { preHandler: requireUser('docente') };

  // ---------- estudiante ----------

  app.get<{ Params: { slug: string } }>('/api/tasks/:slug', { preHandler: requireUser() }, async (request) => {
    const tasks = catalog.bySlug.get(request.params.slug) ?? [];
    const [submissions, overrides] = await Promise.all([grades.submissionsFor(request.user!.id), grades.overridesFor(request.user!.id)]);
    return {
      maxAttempts: MAX_ATTEMPTS,
      tasks: tasks.map((task) => studentView(task, submissions, overrides.find((item) => item.taskId === task.id))),
    };
  });

  app.post<{ Params: { taskId: string } }>('/api/tasks/:taskId/submit', { preHandler: requireUser('estudiante') }, async (request, reply) => {
    const entry = catalog.byId.get(request.params.taskId);
    if (!entry) return reply.code(404).send({ error: 'Tarea no encontrada.' });
    const { task } = entry;

    const parsed = answerSchema(task).safeParse((request.body as { answer?: unknown } | null)?.answer);
    if (!parsed.success) return reply.code(400).send({ error: firstIssue(parsed.error) });

    const userId = request.user!.id;
    const previous = (await grades.submissionsFor(userId)).filter((submission) => submission.taskId === task.id);
    if (previous.length >= MAX_ATTEMPTS) return reply.code(409).send({ error: 'Ya usaste tus dos entregas de esta tarea.' });

    const result = await grade(task, parsed.data, deps.aiGrader, request.log);
    try {
      await grades.addSubmission(userId, { taskId: task.id, attempt: previous.length + 1, answer: parsed.data, ...result });
    } catch (error) {
      if ((error as { errno?: number }).errno === 1062) return reply.code(409).send({ error: 'Esta entrega ya se registró.' });
      throw error;
    }

    const [submissions, overrides] = await Promise.all([grades.submissionsFor(userId), grades.overridesFor(userId)]);
    return { task: studentView(task, submissions, overrides.find((item) => item.taskId === task.id)) };
  });

  // ---------- docente: notas ----------

  app.get<{ Params: { id: string } }>('/api/groups/:id/grades', teacher, async (request, reply) => {
    const groupId = idSchema.safeParse(request.params.id);
    if (!groupId.success) return reply.code(400).send({ error: 'Grupo no válido.' });
    const group = await grades.teacherOwnsGroup(request.user!.id, groupId.data);
    if (!group) return reply.code(404).send({ error: 'Grupo no encontrado.' });

    const [students, submissions, overrides, attendance, dates] = await Promise.all([
      grades.groupStudents(groupId.data),
      grades.groupSubmissions(groupId.data),
      grades.groupOverrides(groupId.data),
      grades.attendanceSummary(groupId.data),
      grades.attendanceDates(groupId.data),
    ]);
    const taskIds = catalog.all.map(({ task }) => task.id);

    return {
      group: { id: groupId.data, name: group.name, sessions: dates.length },
      tasks: catalog.all.map(({ task, slug }) => ({ id: task.id, slug, nivel: task.nivel, tipo: task.tipo, objetivo: task.objetivo })),
      students: students.map((student) =>
        buildStudentReport(
          student,
          taskIds,
          submissions.filter((submission) => submission.userId === student.id),
          overrides.filter((override) => override.userId === student.id),
          attendance.get(student.id),
        ),
      ),
    };
  });

  // Detalle de una tarea de un estudiante: enunciado completo, rúbrica, referencia y entregas
  app.get<{ Params: { studentId: string; taskId: string } }>('/api/students/:studentId/tasks/:taskId', teacher, async (request, reply) => {
    const studentId = idSchema.safeParse(request.params.studentId);
    const entry = catalog.byId.get(request.params.taskId);
    if (!studentId.success || !entry) return reply.code(404).send({ error: 'No encontrado.' });
    if (!(await grades.studentInTeacherGroups(request.user!.id, studentId.data))) return reply.code(404).send({ error: 'Estudiante no encontrado.' });

    const [submissions, overrides] = await Promise.all([grades.submissionsFor(studentId.data), grades.overridesFor(studentId.data)]);
    const own = submissions.filter((submission) => submission.taskId === entry.task.id);
    const override = overrides.find((item) => item.taskId === entry.task.id);
    return { task: entry.task, solution: taskSolution(entry.task), submissions: own, override: override ?? null, final: taskGrade(own, override) };
  });

  app.put('/api/grades/override', teacher, async (request, reply) => {
    const parsed = overrideSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: firstIssue(parsed.error) });
    const { studentId, taskId, grade: value, comment } = parsed.data;
    if (!catalog.byId.has(taskId)) return reply.code(404).send({ error: 'Tarea no encontrada.' });
    if (!(await grades.studentInTeacherGroups(request.user!.id, studentId))) return reply.code(404).send({ error: 'Estudiante no encontrado.' });
    await grades.setOverride(studentId, taskId, value === null ? null : Math.round(value * 10) / 10, comment?.trim() || null);
    return { ok: true };
  });

  // Calificación del docente sobre una entrega (respuestas abiertas)
  app.put('/api/submissions/grade', teacher, async (request, reply) => {
    const parsed = submissionGradeSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: firstIssue(parsed.error) });
    const { studentId, taskId, attempt, grade: value, comment } = parsed.data;
    const updated = await grades.gradeSubmission(request.user!.id, studentId, taskId, attempt, Math.round(value * 10) / 10, comment?.trim() || null);
    return updated ? { ok: true } : reply.code(404).send({ error: 'No se encontró esa entrega en tus grupos.' });
  });

  // ---------- docente: asistencia ----------

  app.get<{ Params: { id: string }; Querystring: { date?: string } }>('/api/groups/:id/attendance', teacher, async (request, reply) => {
    const groupId = idSchema.safeParse(request.params.id);
    const date = dateSchema.safeParse(request.query.date);
    if (!groupId.success || !date.success) return reply.code(400).send({ error: 'Datos no válidos.' });
    if (!(await grades.teacherOwnsGroup(request.user!.id, groupId.data))) return reply.code(404).send({ error: 'Grupo no encontrado.' });
    const [records, dates] = await Promise.all([grades.attendanceFor(groupId.data, date.data), grades.attendanceDates(groupId.data)]);
    return { date: date.data, dates, records };
  });

  app.put<{ Params: { id: string } }>('/api/groups/:id/attendance', teacher, async (request, reply) => {
    const groupId = idSchema.safeParse(request.params.id);
    const body = attendanceSchema.safeParse(request.body);
    if (!groupId.success || !body.success) return reply.code(400).send({ error: 'Datos no válidos.' });
    if (!(await grades.teacherOwnsGroup(request.user!.id, groupId.data))) return reply.code(404).send({ error: 'Grupo no encontrado.' });
    await grades.saveAttendance(groupId.data, body.data.date, body.data.records as Record<number, AttendanceStatus>);
    return { ok: true };
  });

  app.delete<{ Params: { id: string; date: string } }>('/api/groups/:id/attendance/:date', teacher, async (request, reply) => {
    const groupId = idSchema.safeParse(request.params.id);
    const date = dateSchema.safeParse(request.params.date);
    if (!groupId.success || !date.success) return reply.code(400).send({ error: 'Datos no válidos.' });
    if (!(await grades.teacherOwnsGroup(request.user!.id, groupId.data))) return reply.code(404).send({ error: 'Grupo no encontrado.' });
    return (await grades.deleteAttendanceDay(groupId.data, date.data)) ? { ok: true } : reply.code(404).send({ error: 'No hay asistencia ese día.' });
  });
}
