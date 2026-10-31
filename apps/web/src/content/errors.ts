import rawErrors from '@content/errores.yaml';
import { errorCatalogSchema } from './errors.schema';

import type { ErrorExplanation } from './errors.schema';

export type { ErrorExplanation };

const catalog = new Map(errorCatalogSchema.parse(rawErrors).errores.map((entry) => [entry.codigo, entry]));

export function explainError(code: number | null): ErrorExplanation | undefined {
  return code === null ? undefined : catalog.get(code);
}
