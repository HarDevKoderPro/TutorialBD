import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { lessonFrontmatterSchema, routeSchema } from './schema';

const contentDir = fileURLToPath(new URL('../../../../content', import.meta.url));
const route = routeSchema.parse(parse(readFileSync(`${contentDir}/ruta.yaml`, 'utf8')));

describe('content/ruta.yaml', () => {
  it('numera los temas en orden y sin repetir slugs', () => {
    expect(route.temas.map((topic) => topic.numero)).toEqual(route.temas.map((_, index) => index + 1));
    expect(new Set(route.temas.map((topic) => topic.slug)).size).toBe(route.temas.length);
  });

  it('cada tema disponible tiene su lección con frontmatter válido', () => {
    for (const topic of route.temas.filter((t) => t.estado === 'disponible')) {
      const file = `${contentDir}/temas/${topic.slug}/leccion.mdx`;
      expect(existsSync(file), topic.slug).toBe(true);
      const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, 'utf8'));
      const frontmatter = lessonFrontmatterSchema.parse(parse(match?.[1] ?? ''));
      expect(frontmatter.numero).toBe(topic.numero);
    }
  });
});

describe('content/errores.yaml', () => {
  it('cumple el esquema y no repite códigos', async () => {
    const { errorCatalogSchema } = await import('./errors.schema');
    const catalog = errorCatalogSchema.parse(parse(readFileSync(`${contentDir}/errores.yaml`, 'utf8')));
    const codes = catalog.errores.map((entry) => entry.codigo);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain(1062);
  });
});
