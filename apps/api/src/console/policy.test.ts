import { describe, expect, it } from 'vitest';
import { applyPolicy, segmentSql, toLogical, toPhysical } from './policy';

const DB = 'sbx_abc123_practica';

describe('applyPolicy', () => {
  it.each([
    'GRANT ALL ON *.* TO x',
    'create user pepe',
    'SET GLOBAL max_connections = 1',
    'SET @@global.sql_mode = ""',
    "LOAD DATA INFILE '/etc/passwd' INTO TABLE t",
    "SELECT * FROM clientes INTO OUTFILE '/tmp/x'",
    'KILL 12',
    'SELECT SLEEP(10)',
    'SELECT BENCHMARK(1000000, MD5(1))',
    'CREATE PROCEDURE p() SELECT 1',
    'CREATE DEFINER = root TRIGGER t BEFORE INSERT ON x FOR EACH ROW SET @a = 1',
    "PREPARE s FROM 'GRANT ALL ON *.* TO x'",
    'FLUSH PRIVILEGES',
    '/* oculto */ GRANT SELECT ON x TO y',
  ])('bloquea: %s', (sql) => {
    expect(applyPolicy(sql, DB).allowed).toBe(false);
  });

  it.each([
    'SELECT * FROM clientes',
    "INSERT INTO clientes VALUES (1, 'grant sleep(5) load data', 'Bogotá', '300', '2026-01-15')",
    'CREATE TABLE clientes (id_cliente INT PRIMARY KEY)',
    'SHOW TABLES',
    'DESCRIBE clientes',
    '-- GRANT en un comentario\nSELECT 1',
  ])('permite: %s', (sql) => {
    expect(applyPolicy(sql, DB).allowed).toBe(true);
  });

  it('no deja crear ni borrar bases en el Tema 1', () => {
    const result = applyPolicy('CREATE DATABASE tecnotienda', DB);
    expect(result).toMatchObject({ allowed: false });
  });

  it('acepta USE practica y lo traduce al sandbox', () => {
    expect(applyPolicy('USE practica', DB)).toEqual({ allowed: true, sql: `USE ${DB}`, changesDatabase: true });
    expect(applyPolicy('use `practica`', DB)).toEqual({ allowed: true, sql: `use \`${DB}\``, changesDatabase: true });
    expect(applyPolicy('USE otra', DB).allowed).toBe(false);
  });
});

describe('toPhysical / toLogical', () => {
  it('traduce nombres calificados sin tocar strings', () => {
    expect(toPhysical("SELECT * FROM practica.clientes WHERE nombre = 'practica.x'", DB)).toBe(
      `SELECT * FROM ${DB}.clientes WHERE nombre = 'practica.x'`,
    );
    expect(toPhysical('SHOW TABLES FROM practica', DB)).toBe(`SHOW TABLES FROM ${DB}`);
  });

  it('no cambia tablas o columnas que se llamen distinto', () => {
    expect(toPhysical('SELECT practicas FROM clientes', DB)).toBe('SELECT practicas FROM clientes');
  });

  it('oculta el nombre físico y el usuario interno en los mensajes', () => {
    expect(toLogical(`Table '${DB}.x' doesn't exist`, DB, 'u_abc123')).toBe("Table 'practica.x' doesn't exist");
    expect(toLogical("Access denied for user 'u_abc123'@'%'", DB, 'u_abc123')).toBe("Access denied for user 'estudiante'@'%'");
  });

  it('segmenta strings con comillas escapadas', () => {
    expect(segmentSql("SELECT 'it''s', 1").map((s) => s.code)).toEqual([true, false, true]);
  });
});
