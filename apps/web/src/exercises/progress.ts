import { useCallback, useSyncExternalStore } from 'react';
import { api } from '../api';

// Avance de ejercicios del estudiante, guardado en el servidor (lo ve el docente en su panel).
// Se actualiza al instante en pantalla y se envía a la API en segundo plano.

export interface ExerciseProgress {
  status: 'attempted' | 'correct' | 'submitted';
  attempts: number;
  answer?: string | null;
}

type ProgressMap = Record<string, ExerciseProgress>;

const LEGACY_KEY = 'sql-desde-cero:progreso';
const listeners = new Set<() => void>();
let state: ProgressMap = {};

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function save(id: string, entry: ExerciseProgress): Promise<unknown> {
  return api(`/api/progress/${id}`, { method: 'PUT', body: { status: entry.status, attempts: entry.attempts, answer: entry.answer ?? null } });
}

// Al ingresar: trae el avance del servidor y sube, una sola vez, el que quedó guardado en este navegador
export async function loadProgress(): Promise<void> {
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      const entries = Object.entries(JSON.parse(legacy) as ProgressMap);
      await Promise.all(entries.map(([id, entry]) => save(id, entry)));
      localStorage.removeItem(LEGACY_KEY);
    } catch (error) {
      console.error(error);
    }
  }
  const { progress } = await api<{ progress: ProgressMap }>('/api/progress').catch(() => ({ progress: {} as ProgressMap }));
  state = progress;
  emit();
}

export function resetProgress(): void {
  state = {};
  emit();
}

export function useAllProgress(): ProgressMap {
  return useSyncExternalStore(subscribe, () => state);
}

export function useExerciseProgress(id: string) {
  const progress = useAllProgress()[id];

  const update = useCallback(
    (change: (current: ExerciseProgress) => ExerciseProgress) => {
      const next = change(state[id] ?? { status: 'attempted', attempts: 0 });
      state = { ...state, [id]: next };
      emit();
      save(id, next).catch((error: unknown) => console.error('No se pudo guardar el avance', error));
    },
    [id],
  );

  return [progress, update] as const;
}
