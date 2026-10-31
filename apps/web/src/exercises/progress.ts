import { useCallback, useSyncExternalStore } from 'react';

// Avance de ejercicios guardado en este navegador. Cuando exista el ingreso por grupo
// (Etapa 1.4) se sincronizará con el servidor para que el docente lo vea.

export interface ExerciseProgress {
  status: 'attempted' | 'correct' | 'submitted';
  attempts: number;
  answer?: string;
}

type ProgressMap = Record<string, ExerciseProgress>;

const KEY = 'sql-desde-cero:progreso';
const listeners = new Set<() => void>();
let cache: ProgressMap | null = null;

function read(): ProgressMap {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '{}') as ProgressMap;
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: ProgressMap): void {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAllProgress(): ProgressMap {
  return useSyncExternalStore(subscribe, read, () => ({}));
}

export function useExerciseProgress(id: string) {
  const progress = useAllProgress()[id];

  const update = useCallback(
    (change: (current: ExerciseProgress) => ExerciseProgress) => {
      const all = read();
      write({ ...all, [id]: change(all[id] ?? { status: 'attempted', attempts: 0 }) });
    },
    [id],
  );

  return [progress, update] as const;
}
