import type { ComponentType } from 'react';
import type { MDXProps } from 'mdx/types';
import rawRoute from '@content/ruta.yaml';
import { type LessonFrontmatter, lessonFrontmatterSchema, routeSchema, type Topic } from './schema';

export const route = routeSchema.parse(rawRoute);

interface LessonModule {
  default: ComponentType<MDXProps>;
  frontmatter: unknown;
}

// Cada lección se carga bajo demanda desde content/temas/<slug>/leccion.mdx
const lessonModules = import.meta.glob<LessonModule>('../../../../content/temas/*/leccion.mdx');

export interface Lesson {
  Content: ComponentType<MDXProps>;
  frontmatter: LessonFrontmatter;
}

export function findTopic(slug: string): Topic | undefined {
  return route.temas.find((topic) => topic.slug === slug);
}

export function nextTopic(slug: string): Topic | undefined {
  const index = route.temas.findIndex((topic) => topic.slug === slug);
  return index >= 0 ? route.temas[index + 1] : undefined;
}

export async function loadLesson(slug: string): Promise<Lesson | undefined> {
  const loader = lessonModules[`../../../../content/temas/${slug}/leccion.mdx`];
  if (!loader) return undefined;
  const module = await loader();
  return { Content: module.default, frontmatter: lessonFrontmatterSchema.parse(module.frontmatter) };
}
