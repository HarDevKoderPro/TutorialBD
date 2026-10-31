import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

// Tareas calificables (content/temas/<slug>/tareas.yaml). Solo las lee la API:
// las respuestas y referencias nunca viajan al navegador antes de agotar las entregas.

const tableSchema = z.object({ nombre: z.string(), columnas: z.array(z.string()), filas: z.array(z.array(z.string())) });

const base = {
  id: z.string().regex(/^T\d+-P[BIA]\d+$/),
  nivel: z.enum(['basico', 'intermedio', 'avanzado']),
  objetivo: z.string(),
  enunciado: z.string(),
  aviso: z.string().optional(),
  tabla: tableSchema.optional(),
};

export const taskSchema = z.discriminatedUnion('tipo', [
  z.object({
    ...base,
    tipo: z.literal('respuestas'),
    preguntas: z.array(z.object({ pregunta: z.string(), aceptadas: z.array(z.string()).min(1), lista: z.boolean().default(false) })).min(1),
  }),
  z.object({
    ...base,
    tipo: z.literal('clasificar'),
    opciones: z.array(z.string()).min(2),
    items: z.array(z.object({ texto: z.string(), respuesta: z.string() })).min(1),
  }),
  z.object({ ...base, tipo: z.literal('seleccion'), opciones: z.array(z.string()).min(2), correcta: z.string(), explicacion: z.string() }),
  z.object({
    ...base,
    tipo: z.literal('abierta'),
    preguntas_guia: z.array(z.string()).default([]),
    rubrica: z.array(z.string()).min(1),
    referencia: z.string(),
  }),
]);

export type Task = z.infer<typeof taskSchema>;

export interface TaskCatalog {
  bySlug: Map<string, Task[]>;
  byId: Map<string, { task: Task; slug: string }>;
  // Orden de la ruta: tema por tema
  all: { task: Task; slug: string }[];
}

export function loadTasks(contentDir: string): TaskCatalog {
  const catalog: TaskCatalog = { bySlug: new Map(), byId: new Map(), all: [] };
  const topicsDir = join(contentDir, 'temas');
  if (!existsSync(topicsDir)) return catalog;

  for (const slug of readdirSync(topicsDir).sort()) {
    const file = join(topicsDir, slug, 'tareas.yaml');
    if (!existsSync(file)) continue;
    const { tareas } = z.object({ tareas: z.array(taskSchema) }).parse(parse(readFileSync(file, 'utf8')));
    catalog.bySlug.set(slug, tareas);
    for (const task of tareas) {
      if (catalog.byId.has(task.id)) throw new Error(`Tarea repetida: ${task.id}`);
      catalog.byId.set(task.id, { task, slug });
      catalog.all.push({ task, slug });
    }
  }
  return catalog;
}

// Lo que ve el estudiante antes de terminar sus entregas (sin respuestas ni referencia)
export function publicTask(task: Task) {
  const common = { id: task.id, nivel: task.nivel, objetivo: task.objetivo, enunciado: task.enunciado, aviso: task.aviso, tabla: task.tabla, tipo: task.tipo };
  switch (task.tipo) {
    case 'respuestas':
      return { ...common, preguntas: task.preguntas.map((question) => ({ pregunta: question.pregunta })) };
    case 'clasificar':
      return { ...common, opciones: task.opciones, items: task.items.map((item) => ({ texto: item.texto })) };
    case 'seleccion':
      return { ...common, opciones: task.opciones };
    case 'abierta':
      return { ...common, preguntas_guia: task.preguntas_guia, rubrica: task.rubrica };
  }
}

// Solución que se muestra al agotar las entregas
export function taskSolution(task: Task): string {
  switch (task.tipo) {
    case 'respuestas':
      return task.preguntas.map((question, index) => `${index + 1}. ${question.pregunta}: ${question.aceptadas[0]}`).join('\n');
    case 'clasificar':
      return task.items.map((item) => `«${item.texto}»: ${item.respuesta}`).join('\n');
    case 'seleccion':
      return `${task.correcta}. ${task.explicacion}`;
    case 'abierta':
      return task.referencia.trim();
  }
}
