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
