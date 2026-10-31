// Reglas de la consola de estudiantes (docs/consola-sql.md §6) y reescritura del nombre
// lógico de la base ("practica") al nombre físico del sandbox (sbx_<id>_practica).

export const LOGICAL_DATABASE = 'practica';

interface Segment {
  code: boolean;
  text: string;
}

// Separa el SQL en partes de código y partes literales (strings, identificadores con comillas, comentarios)
export function segmentSql(sql: string): Segment[] {
  const segments: Segment[] = [];
  let code = '';
  let i = 0;
  const flush = () => {
    if (code) segments.push({ code: true, text: code });
    code = '';
  };
  while (i < sql.length) {
    const ch = sql[i]!;
    const next = sql[i + 1];
    if (ch === "'" || ch === '"') {
      flush();
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === '\\') j += 2;
        else if (sql[j] === ch && sql[j + 1] === ch) j += 2;
        else if (sql[j] === ch) break;
        else j += 1;
      }
      segments.push({ code: false, text: sql.slice(i, j + 1) });
      i = j + 1;
    } else if ((ch === '-' && next === '-' && /\s/.test(sql[i + 2] ?? ' ')) || ch === '#') {
      flush();
      const end = sql.indexOf('\n', i);
      const j = end === -1 ? sql.length : end;
      segments.push({ code: false, text: sql.slice(i, j) });
      i = j;
    } else if (ch === '/' && next === '*') {
      flush();
      const end = sql.indexOf('*/', i + 2);
      const j = end === -1 ? sql.length : end + 2;
      segments.push({ code: false, text: sql.slice(i, j) });
      i = j;
    } else {
      code += ch;
      i += 1;
    }
  }
  flush();
  return segments;
}

// Solo el código, en mayúsculas y con espacios normalizados (sin strings ni comentarios)
function normalizedCode(sql: string): string {
  return segmentSql(sql)
    .map((segment) => (segment.code ? segment.text : ' '))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

const BLOCKED: { pattern: RegExp; label: string }[] = [
  { pattern: /^(GRANT|REVOKE)\b/, label: 'GRANT / REVOKE' },
  { pattern: /^(CREATE|DROP|ALTER|RENAME) (USER|ROLE)\b/, label: 'gestión de usuarios' },
  { pattern: /^SET (GLOBAL|PERSIST|PERSIST_ONLY|ROLE|DEFAULT ROLE|PASSWORD)\b|@@(GLOBAL|PERSIST)/, label: 'SET GLOBAL / PERSIST' },
  { pattern: /\bLOAD (DATA|XML)\b/, label: 'LOAD DATA' },
  { pattern: /\bINTO (OUTFILE|DUMPFILE)\b/, label: 'INTO OUTFILE' },
  { pattern: /^(SHUTDOWN|RESTART|KILL)\b/, label: 'SHUTDOWN / KILL' },
  { pattern: /^(INSTALL|UNINSTALL) (PLUGIN|COMPONENT)\b/, label: 'plugins' },
  { pattern: /^CREATE SERVER\b/, label: 'CREATE SERVER' },
  { pattern: /\b(SLEEP|BENCHMARK)\s*\(/, label: 'SLEEP / BENCHMARK' },
  { pattern: /^(CREATE|DROP|ALTER) (DEFINER ?= ?\S+ )?(PROCEDURE|FUNCTION|TRIGGER|EVENT)\b|^CALL\b/, label: 'procedimientos, funciones y triggers' },
  { pattern: /^(PREPARE|EXECUTE|DEALLOCATE|HANDLER)\b/, label: 'sentencias preparadas' },
  { pattern: /^(FLUSH|RESET|PURGE|CHANGE (MASTER|REPLICATION)|START (REPLICA|SLAVE)|STOP (REPLICA|SLAVE))\b/, label: 'administración del servidor' },
];

export type PolicyResult =
  | { allowed: true; sql: string; changesDatabase: boolean }
  | { allowed: false; message: string };

export function applyPolicy(sql: string, physicalDatabase: string): PolicyResult {
  const code = normalizedCode(sql);

  for (const { pattern, label } of BLOCKED) {
    if (pattern.test(code)) {
      return { allowed: false, message: `Esta instrucción no está disponible en la consola del curso (${label}).` };
    }
  }

  if (/^(CREATE|DROP|ALTER) (DATABASE|SCHEMA)\b/.test(code)) {
    return {
      allowed: false,
      message: `Por ahora trabajas dentro de la base «${LOGICAL_DATABASE}». Crear y borrar bases de datos se practica en el Tema 4.`,
    };
  }

  const use = /^USE `?([A-Z0-9_$]+)`?\s*$/.exec(code);
  if (use && use[1] !== LOGICAL_DATABASE.toUpperCase()) {
    return { allowed: false, message: `Por ahora solo existe la base «${LOGICAL_DATABASE}». Escribe: USE ${LOGICAL_DATABASE};` };
  }

  return { allowed: true, sql: toPhysical(sql, physicalDatabase), changesDatabase: Boolean(use) };
}

// practica.tabla, USE practica y SHOW ... FROM/IN practica → nombre físico (solo en partes de código)
export function toPhysical(sql: string, physicalDatabase: string): string {
  const name = LOGICAL_DATABASE;
  return segmentSql(sql)
    .map((segment) =>
      segment.code
        ? segment.text
            .replace(new RegExp(`(\`?)\\b${name}\\1(?=\\s*\\.)`, 'gi'), `$1${physicalDatabase}$1`)
            .replace(new RegExp(`\\b(USE|FROM|IN)(\\s+)(\`?)${name}\\3(?![\\w$])`, 'gi'), `$1$2$3${physicalDatabase}$3`)
        : segment.text,
    )
    .join('');
}

// Lo que ve el estudiante nunca incluye el prefijo del sandbox ni su usuario interno
export function toLogical(text: string, physicalDatabase: string, mysqlUser: string): string {
  return text.split(physicalDatabase).join(LOGICAL_DATABASE).split(mysqlUser).join('estudiante');
}
