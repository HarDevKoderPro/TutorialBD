import { z } from 'zod';

// Esquemas del contenido en content/: si un archivo no cumple, la app no compila (ver ruta.test.ts)

export const blockSchema = z.enum(['diseno', 'estructura', 'crud', 'avanzadas', 'integracion']);
export type Block = z.infer<typeof blockSchema>;

export const topicSchema = z.object({
  numero: z.number().int().positive(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  titulo: z.string().min(1),
  resumen: z.string().min(1),
  bloque: blockSchema,
  estado: z.enum(['disponible', 'proximamente']),
});
export type Topic = z.infer<typeof topicSchema>;

export const routeSchema = z.object({
  temas: z.array(topicSchema).min(1),
});

export const lessonFrontmatterSchema = z.object({
  numero: z.number().int().positive(),
  titulo: z.string().min(1),
  resumen: z.string().min(1),
  temas: z.array(z.string()).default([]),
});
export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;

export const BLOCK_LABELS: Record<Block, string> = {
  diseno: 'Diseño',
  estructura: 'Estructura',
  crud: 'CRUD',
  avanzadas: 'Consultas avanzadas',
  integracion: 'Integración',
};
