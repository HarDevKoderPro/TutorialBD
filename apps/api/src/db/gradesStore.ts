import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// Datos de tareas calificables, ajustes del docente y asistencia (aula_app). Consultas parametrizadas.

export type GradedBy = 'auto' | 'ia' | 'pendiente';
export type AttendanceStatus = 'presente' | 'tarde' | 'ausente' | 'excusa';

export interface Submission {
  taskId: string;
  attempt: number;
  answer: unknown;
  grade: number | null;
  justification: string | null;
  criteria: unknown;
  gradedBy: GradedBy;
  createdAt: string;
}

export interface Override {
  taskId: string;
  grade: number;
  comment: string | null;
}

const toSubmission = (row: RowDataPacket): Submission => ({
  taskId: String(row.task_id),
  attempt: Number(row.attempt),
  answer: typeof row.answer === 'string' ? JSON.parse(row.answer) : row.answer,
  grade: row.grade === null ? null : Number(row.grade),
  justification: row.justification ?? null,
  criteria: typeof row.criteria === 'string' ? JSON.parse(row.criteria) : (row.criteria ?? null),
  gradedBy: row.graded_by as GradedBy,
  createdAt: String(row.created_at),
});

const SUBMISSION_COLUMNS = 's.user_id, s.task_id, s.attempt, s.answer, s.grade, s.justification, s.criteria, s.graded_by, s.created_at';

export class GradesStore {
  constructor(private readonly pool: Pool) {}

  async submissionsFor(userId: number): Promise<Submission[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${SUBMISSION_COLUMNS} FROM task_submissions s WHERE s.user_id = ? ORDER BY s.task_id, s.attempt`,
      [userId],
    );
    return rows.map(toSubmission);
  }

  async overridesFor(userId: number): Promise<Override[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT task_id, grade, comment FROM task_overrides WHERE user_id = ?', [userId]);
    return rows.map((row) => ({ taskId: String(row.task_id), grade: Number(row.grade), comment: row.comment ?? null }));
  }

  // El índice único (usuario, tarea, intento) impide guardar dos veces el mismo intento
  async addSubmission(userId: number, entry: Omit<Submission, 'createdAt'>): Promise<void> {
    await this.pool.query(
      `INSERT INTO task_submissions (user_id, task_id, attempt, answer, grade, justification, criteria, graded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        entry.taskId,
        entry.attempt,
        JSON.stringify(entry.answer),
        entry.grade,
        entry.justification,
        entry.criteria === null || entry.criteria === undefined ? null : JSON.stringify(entry.criteria),
        entry.gradedBy,
      ],
    );
  }

  // ---------- docente ----------

  async teacherOwnsGroup(teacherId: number, groupId: number): Promise<{ name: string } | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT name FROM course_groups WHERE id = ? AND teacher_id = ?', [groupId, teacherId]);
    return rows[0] ? { name: String(rows[0].name) } : null;
  }

  async studentInTeacherGroups(teacherId: number, studentId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT 1 FROM users u JOIN course_groups g ON g.id = u.group_id WHERE u.id = ? AND u.role = 'estudiante' AND g.teacher_id = ?`,
      [studentId, teacherId],
    );
    return rows.length > 0;
  }

  async groupStudents(groupId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, username, full_name FROM users WHERE group_id = ? AND role = 'estudiante' ORDER BY full_name`,
      [groupId],
    );
    return rows.map((row) => ({ id: Number(row.id), username: String(row.username), fullName: String(row.full_name) }));
  }

  async groupSubmissions(groupId: number): Promise<(Submission & { userId: number })[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${SUBMISSION_COLUMNS} FROM task_submissions s JOIN users u ON u.id = s.user_id
       WHERE u.group_id = ? AND u.role = 'estudiante' ORDER BY s.task_id, s.attempt`,
      [groupId],
    );
    return rows.map((row) => ({ ...toSubmission(row), userId: Number(row.user_id) }));
  }

  async groupOverrides(groupId: number): Promise<(Override & { userId: number })[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT o.user_id, o.task_id, o.grade, o.comment FROM task_overrides o JOIN users u ON u.id = o.user_id
       WHERE u.group_id = ? AND u.role = 'estudiante'`,
      [groupId],
    );
    return rows.map((row) => ({ userId: Number(row.user_id), taskId: String(row.task_id), grade: Number(row.grade), comment: row.comment ?? null }));
  }

  async setOverride(studentId: number, taskId: string, grade: number | null, comment: string | null): Promise<void> {
    if (grade === null) {
      await this.pool.query('DELETE FROM task_overrides WHERE user_id = ? AND task_id = ?', [studentId, taskId]);
      return;
    }
    await this.pool.query(
      `INSERT INTO task_overrides (user_id, task_id, grade, comment) VALUES (?, ?, ?, ?) AS incoming
       ON DUPLICATE KEY UPDATE grade = incoming.grade, comment = incoming.comment`,
      [studentId, taskId, grade, comment],
    );
  }

  // ---------- asistencia ----------

  async attendanceDates(groupId: number): Promise<string[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(session_date, '%Y-%m-%d') AS day FROM attendance_sessions WHERE group_id = ? ORDER BY session_date`,
      [groupId],
    );
    return rows.map((row) => String(row.day));
  }

  async attendanceFor(groupId: number, date: string): Promise<Record<number, AttendanceStatus>> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT a.user_id, a.status FROM attendance a JOIN attendance_sessions s ON s.id = a.session_id
       WHERE s.group_id = ? AND s.session_date = ?`,
      [groupId, date],
    );
    return Object.fromEntries(rows.map((row) => [Number(row.user_id), row.status as AttendanceStatus]));
  }

  async saveAttendance(groupId: number, date: string, records: Record<number, AttendanceStatus>): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('INSERT IGNORE INTO attendance_sessions (group_id, session_date) VALUES (?, ?)', [groupId, date]);
      const [rows] = await connection.query<RowDataPacket[]>('SELECT id FROM attendance_sessions WHERE group_id = ? AND session_date = ?', [
        groupId,
        date,
      ]);
      const sessionId = Number(rows[0]!.id);
      // Solo se guardan estudiantes que pertenecen al grupo
      const [members] = await connection.query<RowDataPacket[]>(`SELECT id FROM users WHERE group_id = ? AND role = 'estudiante'`, [groupId]);
      const memberIds = new Set(members.map((member) => Number(member.id)));
      for (const [userId, status] of Object.entries(records)) {
        if (!memberIds.has(Number(userId))) continue;
        await connection.query(
          `INSERT INTO attendance (session_id, user_id, status) VALUES (?, ?, ?) AS incoming
           ON DUPLICATE KEY UPDATE status = incoming.status`,
          [sessionId, Number(userId), status],
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Por estudiante: sesiones registradas por tipo
  async attendanceSummary(groupId: number): Promise<Map<number, Record<AttendanceStatus, number>>> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT a.user_id, a.status, COUNT(*) AS total FROM attendance a JOIN attendance_sessions s ON s.id = a.session_id
       WHERE s.group_id = ? GROUP BY a.user_id, a.status`,
      [groupId],
    );
    const summary = new Map<number, Record<AttendanceStatus, number>>();
    for (const row of rows) {
      const userId = Number(row.user_id);
      const entry = summary.get(userId) ?? { presente: 0, tarde: 0, ausente: 0, excusa: 0 };
      entry[row.status as AttendanceStatus] = Number(row.total);
      summary.set(userId, entry);
    }
    return summary;
  }

  async deleteAttendanceDay(groupId: number, date: string): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>('DELETE FROM attendance_sessions WHERE group_id = ? AND session_date = ?', [groupId, date]);
    return result.affectedRows > 0;
  }
}
