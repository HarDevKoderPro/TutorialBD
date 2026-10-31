import { describe, expect, it } from 'vitest';
import type { Submission } from '../db/gradesStore';
import { buildStudentReport } from './report';

const student = { id: 1, username: 'laura', fullName: 'Laura Gómez' };
const submission = (taskId: string, attempt: number, grade: number | null, justification = 'Bien.'): Submission => ({
  taskId,
  attempt,
  answer: null,
  grade,
  justification,
  criteria: null,
  gradedBy: grade === null ? 'pendiente' : 'auto',
  createdAt: '',
});

describe('buildStudentReport', () => {
  it('cuenta la mejor de las dos entregas y promedia las tareas calificadas', () => {
    const report = buildStudentReport(
      student,
      ['T1-PB1', 'T1-PB2', 'T1-PI1'],
      [submission('T1-PB1', 1, 2.5), submission('T1-PB1', 2, 4.0), submission('T1-PB2', 1, 5.0)],
      [],
      undefined,
    );
    expect(report.grades['T1-PB1']?.grade).toBe(4);
    expect(report.definitive).toBe(4.5);
    expect(report.gradedTasks).toBe(2);
    expect(report.comment).toBe('Promedio de 2 tareas: 4,5. Mejor resultado: T1-PB2 (5,0).');
  });

  it('el ajuste del docente reemplaza la nota y el comentario señala lo que debe mejorar', () => {
    const report = buildStudentReport(
      student,
      ['T1-PB1', 'T1-PA1'],
      [submission('T1-PB1', 1, 5), submission('T1-PA1', 1, 4)],
      [{ taskId: 'T1-PA1', grade: 2.0, comment: 'No identificó las claves foráneas. Revisa el ejemplo.' }],
      { presente: 3, tarde: 1, ausente: 1, excusa: 2 },
    );
    expect(report.grades['T1-PA1']).toMatchObject({ grade: 2, source: 'docente' });
    expect(report.definitive).toBe(3.5);
    expect(report.comment).toContain('Por mejorar T1-PA1 (2,0): No identificó las claves foráneas.');
    expect(report.attendance).toEqual({ attended: 4, total: 5, percent: 80 });
  });

  it('sin entregas no hay definitiva', () => {
    const report = buildStudentReport(student, ['T1-PB1'], [], [], undefined);
    expect(report.definitive).toBeNull();
    expect(report.comment).toBe('Aún no ha entregado tareas.');
  });

  it('una tarea pendiente de la IA no cuenta en el promedio', () => {
    const report = buildStudentReport(student, ['T1-PB1', 'T1-PI1'], [submission('T1-PB1', 1, 3), submission('T1-PI1', 1, null)], [], undefined);
    expect(report.definitive).toBe(3);
    expect(report.comment).toContain('1 pendiente(s) de calificar');
  });
});
