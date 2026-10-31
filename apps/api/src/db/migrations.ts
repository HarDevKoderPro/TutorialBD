import type { Pool, RowDataPacket } from 'mysql2/promise';

// Migraciones de aula_app. Se aplican en orden al arrancar la API; nunca se editan las ya publicadas.
export const MIGRATIONS: { id: number; name: string; statements: string[] }[] = [
  {
    id: 1,
    name: 'usuarios, grupos, sesiones y progreso',
    statements: [
      `CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(30) NOT NULL UNIQUE,
        full_name VARCHAR(80) NOT NULL,
        role ENUM('docente', 'estudiante') NOT NULL,
        password_hash VARCHAR(200) NOT NULL,
        group_id INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME NULL
      )`,
      `CREATE TABLE course_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(80) NOT NULL,
        join_code CHAR(6) NOT NULL UNIQUE,
        teacher_id INT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_groups_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE RESTRICT
      )`,
      `ALTER TABLE users ADD CONSTRAINT fk_users_group FOREIGN KEY (group_id) REFERENCES course_groups (id) ON DELETE SET NULL`,
      `CREATE TABLE sessions (
        token_hash CHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE exercise_progress (
        user_id INT NOT NULL,
        exercise_id VARCHAR(20) NOT NULL,
        status ENUM('attempted', 'correct', 'submitted') NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        answer TEXT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, exercise_id),
        CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
    ],
  },
  {
    id: 2,
    name: 'revisión del docente en ejercicios abiertos',
    statements: [
      `ALTER TABLE exercise_progress
        ADD COLUMN review ENUM('aprobado', 'por_mejorar') NULL AFTER answer,
        ADD COLUMN review_comment TEXT NULL AFTER review,
        ADD COLUMN reviewed_at DATETIME NULL AFTER review_comment`,
    ],
  },
  {
    id: 3,
    name: 'tareas calificables, ajustes de nota y asistencia',
    statements: [
      `CREATE TABLE task_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        task_id VARCHAR(20) NOT NULL,
        attempt TINYINT NOT NULL,
        answer JSON NOT NULL,
        grade DECIMAL(2,1) NULL,
        justification TEXT NULL,
        criteria JSON NULL,
        graded_by ENUM('auto', 'ia', 'pendiente') NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_submission_attempt (user_id, task_id, attempt),
        CONSTRAINT chk_submission_grade CHECK (grade BETWEEN 0 AND 5),
        CONSTRAINT fk_submissions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE task_overrides (
        user_id INT NOT NULL,
        task_id VARCHAR(20) NOT NULL,
        grade DECIMAL(2,1) NOT NULL,
        comment TEXT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, task_id),
        CONSTRAINT chk_override_grade CHECK (grade BETWEEN 0 AND 5),
        CONSTRAINT fk_overrides_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE attendance_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        session_date DATE NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_attendance_day (group_id, session_date),
        CONSTRAINT fk_attendance_sessions_group FOREIGN KEY (group_id) REFERENCES course_groups (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE attendance (
        session_id INT NOT NULL,
        user_id INT NOT NULL,
        status ENUM('presente', 'tarde', 'ausente', 'excusa') NOT NULL,
        PRIMARY KEY (session_id, user_id),
        CONSTRAINT fk_attendance_session FOREIGN KEY (session_id) REFERENCES attendance_sessions (id) ON DELETE CASCADE,
        CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
    ],
  },
  {
    id: 4,
    name: 'calificación del docente por entrega',
    statements: [
      `ALTER TABLE task_submissions
        MODIFY graded_by ENUM('auto', 'ia', 'pendiente', 'docente') NOT NULL,
        ADD COLUMN graded_at DATETIME NULL AFTER graded_by`,
    ],
  },
];

export async function migrate(pool: Pool, log: (message: string) => void = () => undefined): Promise<void> {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id INT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM schema_migrations');
  const applied = new Set(rows.map((row) => Number(row.id)));

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    // MySQL hace commit implícito con DDL: cada sentencia se aplica por separado
    for (const statement of migration.statements) await pool.query(statement);
    await pool.query('INSERT INTO schema_migrations (id, name) VALUES (?, ?)', [migration.id, migration.name]);
    log(`Migración ${migration.id} aplicada: ${migration.name}`);
  }
}
