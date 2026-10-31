import { createHash, randomBytes, randomInt } from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// Acceso a datos de aula_app. Todas las consultas van parametrizadas.

export type Role = 'docente' | 'estudiante';
export type ProgressStatus = 'attempted' | 'correct' | 'submitted';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  groupId: number | null;
  groupName: string | null;
}

export interface ProgressEntry {
  status: ProgressStatus;
  attempts: number;
  answer: string | null;
  updatedAt: string;
}

export const SESSION_DAYS = 30;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

function toUser(row: RowDataPacket): User {
  return {
    id: Number(row.id),
    username: String(row.username),
    fullName: String(row.full_name),
    role: row.role as Role,
    groupId: row.group_id === null ? null : Number(row.group_id),
    groupName: row.group_name === null ? null : String(row.group_name),
  };
}

const USER_COLUMNS = 'u.id, u.username, u.full_name, u.role, u.group_id, g.name AS group_name';

export class Store {
  constructor(private readonly pool: Pool) {}

  // ---------- usuarios y sesiones ----------

  async findUserForLogin(username: string): Promise<(User & { passwordHash: string }) | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${USER_COLUMNS}, u.password_hash FROM users u LEFT JOIN course_groups g ON g.id = u.group_id WHERE u.username = ?`,
      [username],
    );
    const row = rows[0];
    return row ? { ...toUser(row), passwordHash: String(row.password_hash) } : null;
  }

  async usernameExists(username: string): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT 1 FROM users WHERE username = ?', [username]);
    return rows.length > 0;
  }

  async createUser(input: { username: string; fullName: string; role: Role; passwordHash: string; groupId: number | null }): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      'INSERT INTO users (username, full_name, role, password_hash, group_id) VALUES (?, ?, ?, ?, ?)',
      [input.username, input.fullName, input.role, input.passwordHash, input.groupId],
    );
    return result.insertId;
  }

  async createSession(userId: number): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await this.pool.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, NOW() + INTERVAL ? DAY)', [
      hashToken(token),
      userId,
      SESSION_DAYS,
    ]);
    await this.pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [userId]);
    return token;
  }

  async findUserBySession(token: string): Promise<User | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${USER_COLUMNS} FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN course_groups g ON g.id = u.group_id
       WHERE s.token_hash = ? AND s.expires_at > NOW()`,
      [hashToken(token)],
    );
    return rows[0] ? toUser(rows[0]) : null;
  }

  async deleteSession(token: string): Promise<void> {
    await this.pool.query('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
  }

  // ---------- grupos ----------

  async findActiveGroupByCode(code: string): Promise<{ id: number; name: string } | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT id, name FROM course_groups WHERE join_code = ? AND active = TRUE', [code]);
    return rows[0] ? { id: Number(rows[0].id), name: String(rows[0].name) } : null;
  }

  async createGroup(teacherId: number, name: string): Promise<{ id: number; joinCode: string }> {
    // Reintenta si el código aleatorio ya existe (muy poco probable)
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const joinCode = Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
      try {
        const [result] = await this.pool.query<ResultSetHeader>('INSERT INTO course_groups (name, join_code, teacher_id) VALUES (?, ?, ?)', [
          name,
          joinCode,
          teacherId,
        ]);
        return { id: result.insertId, joinCode };
      } catch (error) {
        if ((error as { errno?: number }).errno !== 1062) throw error;
      }
    }
    throw new Error('No se pudo generar un código de grupo único');
  }

  async listGroups(teacherId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT g.id, g.name, g.join_code, g.active, g.created_at, COUNT(u.id) AS students
       FROM course_groups g LEFT JOIN users u ON u.group_id = g.id AND u.role = 'estudiante'
       WHERE g.teacher_id = ?
       GROUP BY g.id, g.name, g.join_code, g.active, g.created_at
       ORDER BY g.created_at DESC`,
      [teacherId],
    );
    return rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      joinCode: String(row.join_code),
      active: Boolean(row.active),
      students: Number(row.students),
    }));
  }

  async setGroupActive(teacherId: number, groupId: number, active: boolean): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>('UPDATE course_groups SET active = ? WHERE id = ? AND teacher_id = ?', [
      active,
      groupId,
      teacherId,
    ]);
    return result.affectedRows > 0;
  }

  async groupStudents(teacherId: number, groupId: number) {
    const [owner] = await this.pool.query<RowDataPacket[]>('SELECT 1 FROM course_groups WHERE id = ? AND teacher_id = ?', [groupId, teacherId]);
    if (owner.length === 0) return null;

    const [students] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, username, full_name, created_at, last_login_at FROM users
       WHERE group_id = ? AND role = 'estudiante' ORDER BY full_name`,
      [groupId],
    );
    const [progress] = await this.pool.query<RowDataPacket[]>(
      `SELECT p.user_id, p.exercise_id, p.status, p.attempts, p.answer, p.updated_at
       FROM exercise_progress p JOIN users u ON u.id = p.user_id
       WHERE u.group_id = ? AND u.role = 'estudiante'`,
      [groupId],
    );

    return students.map((student) => ({
      id: Number(student.id),
      username: String(student.username),
      fullName: String(student.full_name),
      lastLoginAt: student.last_login_at ? String(student.last_login_at) : null,
      progress: Object.fromEntries(
        progress
          .filter((row) => Number(row.user_id) === Number(student.id))
          .map((row) => [
            String(row.exercise_id),
            { status: row.status as ProgressStatus, attempts: Number(row.attempts), answer: row.answer ?? null, updatedAt: String(row.updated_at) },
          ]),
      ),
    }));
  }

  // ---------- progreso ----------

  async progressFor(userId: number): Promise<Record<string, ProgressEntry>> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT exercise_id, status, attempts, answer, updated_at FROM exercise_progress WHERE user_id = ?',
      [userId],
    );
    return Object.fromEntries(
      rows.map((row) => [
        String(row.exercise_id),
        { status: row.status as ProgressStatus, attempts: Number(row.attempts), answer: row.answer ?? null, updatedAt: String(row.updated_at) },
      ]),
    );
  }

  // Un ejercicio ya correcto no vuelve a "intentado"; los intentos nunca bajan
  async saveProgress(userId: number, exerciseId: string, entry: { status: ProgressStatus; attempts: number; answer: string | null }): Promise<void> {
    await this.pool.query(
      `INSERT INTO exercise_progress (user_id, exercise_id, status, attempts, answer) VALUES (?, ?, ?, ?, ?) AS incoming
       ON DUPLICATE KEY UPDATE
         status = IF(exercise_progress.status = 'correct' AND incoming.status = 'attempted', exercise_progress.status, incoming.status),
         attempts = GREATEST(exercise_progress.attempts, incoming.attempts),
         answer = COALESCE(incoming.answer, exercise_progress.answer)`,
      [userId, exerciseId, entry.status, entry.attempts, entry.answer],
    );
  }
}
