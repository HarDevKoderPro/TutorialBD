import { z } from 'zod';

// Esquema de content/temas/*/ejercicios.yaml

const tableSchema = z.object({
  nombre: z.string(),
  columnas: z.array(z.string()).min(1),
  filas: z.array(z.array(z.string())),
});

const base = {
  id: z.string().regex(/^T\d+-[BIA]\d+$/),
  nivel: z.enum(['basico', 'intermedio', 'avanzado']),
  objetivo: z.string().min(1),
  enunciado: z.string().min(1),
  aviso: z.string().optional(),
  tabla: tableSchema.optional(),
  pistas: z.array(z.string()).default([]),
};

export const exerciseSchema = z.discriminatedUnion('tipo', [
  z.object({
    ...base,
    tipo: z.literal('respuestas'),
    preguntas: z
      .array(z.object({ pregunta: z.string(), aceptadas: z.array(z.string()).min(1), lista: z.boolean().default(false) }))
      .min(1),
  }),
  z.object({
    ...base,
    tipo: z.literal('clasificar'),
    opciones: z.array(z.string()).min(2),
    items: z.array(z.object({ texto: z.string(), respuesta: z.string() })).min(1),
  }),
  z.object({
    ...base,
    tipo: z.literal('seleccion'),
    opciones: z.array(z.string()).min(2),
    correcta: z.string(),
    explicacion: z.string(),
  }),
  z.object({
    ...base,
    tipo: z.literal('abierta'),
    preguntas_guia: z.array(z.string()).default([]),
    rubrica: z.array(z.string()).min(1),
    referencia: z.string().min(1),
  }),
]);

export const exerciseFileSchema = z
  .object({ ejercicios: z.array(exerciseSchema).min(1) })
  .superRefine((file, ctx) => {
    const ids = file.ejercicios.map((exercise) => exercise.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'Hay ids de ejercicio repetidos' });
    for (const exercise of file.ejercicios) {
      if (exercise.tipo === 'clasificar' && exercise.items.some((item) => !exercise.opciones.includes(item.respuesta))) {
        ctx.addIssue({ code: 'custom', message: `${exercise.id}: una respuesta no está entre las opciones` });
      }
      if (exercise.tipo === 'seleccion' && !exercise.opciones.includes(exercise.correcta)) {
        ctx.addIssue({ code: 'custom', message: `${exercise.id}: la opción correcta no está entre las opciones` });
      }
    }
  });

export type Exercise = z.infer<typeof exerciseSchema>;
export type ExerciseLevel = Exercise['nivel'];
