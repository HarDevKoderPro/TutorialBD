import type { Task } from './content.js';

// Calificación automática de tareas de respuesta cerrada (0,0 a 5,0) con justificación.
// No revela las respuestas correctas: solo dice cuáles fallaron.

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[`'"«»“”$]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSet(text: string): string {
  return normalize(text)
    .replace(/\./g, '')
    .split(/\s*(?:,|;|\by\b|\s)\s*/)
    .filter(Boolean)
    .sort()
    .join('|');
}

export function isAccepted(answer: string, accepted: string[], list = false): boolean {
  if (!answer.trim()) return false;
  if (list) return accepted.some((option) => toSet(option) === toSet(answer));
  return accepted.some((option) => normalize(option) === normalize(answer));
}

export const roundGrade = (value: number) => Math.round(Math.min(5, Math.max(0, value)) * 10) / 10;

export interface ClosedGrade {
  grade: number;
  justification: string;
  // Por ítem: acertó o no (sin decir la respuesta correcta)
  items: boolean[];
}

export function gradeClosed(task: Exclude<Task, { tipo: 'abierta' }>, answer: unknown): ClosedGrade {
  if (task.tipo === 'seleccion') {
    const correct = typeof answer === 'string' && answer === task.correcta;
    return {
      grade: correct ? 5 : 0,
      items: [correct],
      justification: correct ? 'Elegiste la opción correcta.' : 'La opción elegida no es la mejor clave primaria. Revisa si puede repetirse o cambiar.',
    };
  }

  const answers = Array.isArray(answer) ? answer.map((value) => String(value ?? '')) : [];
  const items =
    task.tipo === 'respuestas'
      ? task.preguntas.map((question, index) => isAccepted(answers[index] ?? '', question.aceptadas, question.lista))
      : task.items.map((item, index) => answers[index] === item.respuesta);

  const hits = items.filter(Boolean).length;
  const labels = task.tipo === 'respuestas' ? task.preguntas.map((question) => question.pregunta) : task.items.map((item) => `«${item.texto}»`);
  const failed = labels.filter((_, index) => !items[index]);
  const justification =
    failed.length === 0
      ? `Acertaste ${hits} de ${items.length}.`
      : `Acertaste ${hits} de ${items.length}. Revisa: ${failed.join('; ')}${/[.?!»]$/.test(failed[failed.length - 1] ?? '') ? '' : '.'}`;

  return { grade: roundGrade((hits / items.length) * 5), items, justification };
}
