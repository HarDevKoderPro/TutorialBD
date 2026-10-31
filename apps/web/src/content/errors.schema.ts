import { z } from 'zod';

export const errorCatalogSchema = z.object({
  errores: z.array(
    z.object({
      codigo: z.number().int(),
      titulo: z.string().min(1),
      que_paso: z.string().min(1),
      como_corregir: z.string().min(1),
    }),
  ),
});

export type ErrorExplanation = z.infer<typeof errorCatalogSchema>['errores'][number];
