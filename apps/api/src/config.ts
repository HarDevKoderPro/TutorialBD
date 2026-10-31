import { resolve } from 'node:path';

// Configuración leída de variables de entorno (ver .env.example en la raíz)

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
}

export interface Config {
  port: number;
  host: string;
  commit: string;
  buildDate: string;
  // Secreto para derivar el usuario y la contraseña de cada sandbox
  sessionSecret: string;
  // Carpeta content/ del repositorio (tareas calificables)
  contentDir: string;
  appDb: DbConfig;
  sandboxDb: DbConfig;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export function loadConfig(): Config {
  return {
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? '0.0.0.0',
    commit: process.env.GIT_COMMIT ?? 'dev',
    buildDate: process.env.BUILD_DATE ?? new Date().toISOString(),
    sessionSecret: required('SBX_SESSION_SECRET'),
    contentDir: process.env.CONTENT_DIR ?? resolve(process.cwd(), '../../content'),
    appDb: {
      host: process.env.APP_DB_HOST ?? 'mysql-app',
      port: Number(process.env.APP_DB_PORT ?? 3306),
      user: required('APP_DB_USER'),
      password: required('APP_DB_PASSWORD'),
      database: process.env.APP_DB_NAME ?? 'aula_app',
    },
    sandboxDb: {
      host: process.env.SBX_DB_HOST ?? 'mysql-sbx',
      port: Number(process.env.SBX_DB_PORT ?? 3306),
      user: required('SBX_ADMIN_USER'),
      password: required('SBX_ADMIN_PASSWORD'),
    },
  };
}
