import { route } from '../content/route';
import { type Exercise, exerciseFileSchema } from './schema';

// Los ejercicios viven en content/temas/<slug>/ejercicios.yaml
const files = import.meta.glob<{ default: unknown }>('../../../../content/temas/*/ejercicios.yaml', { eager: true });

export function exercisesFor(slug: string): Exercise[] {
  const file = files[`../../../../content/temas/${slug}/ejercicios.yaml`];
  return file ? exerciseFileSchema.parse(file.default).ejercicios : [];
}

// Ejercicios de los temas habilitados, agrupados por tema (para el panel del docente)
export function availableExercises() {
  return route.temas
    .filter((topic) => topic.estado === 'disponible')
    .map((topic) => ({ topic, exercises: exercisesFor(topic.slug) }))
    .filter((entry) => entry.exercises.length > 0);
}
