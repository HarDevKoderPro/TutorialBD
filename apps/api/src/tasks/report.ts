import type { AttendanceStatus, Override, Submission } from '../db/gradesStore.js';

// Nota de cada tarea, definitiva y comentario que la justifica (0,0 a 5,0).
// Nota de una tarea = ajuste del docente si existe; si no, la mejor de las entregas calificadas.
// Definitiva = promedio de las tareas con nota hasta el momento (se recalcula con cada entrega).

export interface TaskGrade {
  grade: number | null;
  source: 'auto' | 'ia' | 'docente' | 'pendiente';
  attempts: number;
  justification: string | null;
}

export interface StudentReport {
  id: number;
  username: string;
  fullName: string;
  grades: Record<string, TaskGrade>;
  definitive: number | null;
  gradedTasks: number;
  attendance: { attended: number; total: number; percent: number | null };
  comment: string;
}

export const formatGrade = (value: number) => value.toFixed(1).replace('.', ',');

function firstSentence(text: string | null): string {
  if (!text) return '';
  const sentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return sentence.length > 110 ? `${sentence.slice(0, 107)}…` : sentence;
}

export function taskGrade(submissions: Submission[], override: Override | undefined): TaskGrade {
  const graded = submissions.filter((submission) => submission.grade !== null);
  if (override) {
    return { grade: override.grade, source: 'docente', attempts: submissions.length, justification: override.comment ?? 'Nota ajustada por el docente.' };
  }
  if (graded.length === 0) {
    return { grade: null, source: submissions.length ? 'pendiente' : 'pendiente', attempts: submissions.length, justification: null };
  }
  const best = graded.reduce((a, b) => ((b.grade ?? 0) > (a.grade ?? 0) ? b : a));
  return { grade: best.grade, source: best.gradedBy === 'ia' ? 'ia' : 'auto', attempts: submissions.length, justification: best.justification };
}

export function attendanceOf(counts: Record<AttendanceStatus, number> | undefined) {
  const c = counts ?? { presente: 0, tarde: 0, ausente: 0, excusa: 0 };
  // Las excusas no cuentan en contra: se sacan del total
  const total = c.presente + c.tarde + c.ausente;
  const attended = c.presente + c.tarde;
  return { attended, total, percent: total ? Math.round((attended / total) * 100) : null };
}

export function buildStudentReport(
  student: { id: number; username: string; fullName: string },
  taskIds: string[],
  submissions: Submission[],
  overrides: Override[],
  attendanceCounts: Record<AttendanceStatus, number> | undefined,
): StudentReport {
  const grades: Record<string, TaskGrade> = {};
  for (const taskId of taskIds) {
    const own = submissions.filter((submission) => submission.taskId === taskId);
    const override = overrides.find((item) => item.taskId === taskId);
    if (own.length || override) grades[taskId] = taskGrade(own, override);
  }

  const withGrade = Object.entries(grades).filter(([, value]) => value.grade !== null) as [string, TaskGrade & { grade: number }][];
  const definitive = withGrade.length ? Math.round((withGrade.reduce((sum, [, value]) => sum + value.grade, 0) / withGrade.length) * 10) / 10 : null;

  let comment = 'Aún no ha entregado tareas.';
  if (definitive !== null) {
    const weakest = withGrade.reduce((a, b) => (b[1].grade < a[1].grade ? b : a));
    const best = withGrade.reduce((a, b) => (b[1].grade > a[1].grade ? b : a));
    const plural = withGrade.length === 1 ? 'tarea' : 'tareas';
    comment = `Promedio de ${withGrade.length} ${plural}: ${formatGrade(definitive)}.`;
    if (weakest[1].grade < 3) {
      comment += ` Por mejorar ${weakest[0]} (${formatGrade(weakest[1].grade)}): ${firstSentence(weakest[1].justification)}`;
    } else {
      comment += ` Mejor resultado: ${best[0]} (${formatGrade(best[1].grade)}).`;
    }
    const pending = Object.values(grades).filter((value) => value.grade === null).length;
    if (pending) comment += ` ${pending} pendiente(s) de calificar.`;
  }

  return {
    ...student,
    grades,
    definitive,
    gradedTasks: withGrade.length,
    attendance: attendanceOf(attendanceCounts),
    comment: comment.trim(),
  };
}
