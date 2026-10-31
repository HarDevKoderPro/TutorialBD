import { describe, expect, it } from 'vitest';
import { StatementBuffer } from './statementBuffer';

describe('StatementBuffer', () => {
  it('une varias líneas hasta el punto y coma', () => {
    const buffer = new StatementBuffer();
    expect(buffer.pushLine('CREATE TABLE clientes (')).toEqual([]);
    expect(buffer.continuationPrompt).toBe('    -> ');
    expect(buffer.pushLine('  id INT PRIMARY KEY')).toEqual([]);
    expect(buffer.pushLine(');')).toEqual([{ sql: 'CREATE TABLE clientes (\n  id INT PRIMARY KEY\n)', vertical: false }]);
    expect(buffer.isEmpty).toBe(true);
  });

  it('separa varias sentencias en una línea', () => {
    const buffer = new StatementBuffer();
    expect(buffer.pushLine('SELECT 1; SELECT 2;')).toEqual([
      { sql: 'SELECT 1', vertical: false },
      { sql: 'SELECT 2', vertical: false },
    ]);
  });

  it('ignora el punto y coma dentro de strings y avisa con el prompt de comillas', () => {
    const buffer = new StatementBuffer();
    expect(buffer.pushLine("INSERT INTO t VALUES ('a;b")).toEqual([]);
    expect(buffer.continuationPrompt).toBe("    '> ");
    expect(buffer.pushLine("c');")).toEqual([{ sql: "INSERT INTO t VALUES ('a;b\nc')", vertical: false }]);
  });

  it('reconoce \\G como salida vertical', () => {
    const buffer = new StatementBuffer();
    expect(buffer.pushLine('SELECT * FROM clientes\\G')).toEqual([{ sql: 'SELECT * FROM clientes', vertical: true }]);
  });

  it('no corta en ; dentro de comentarios', () => {
    const buffer = new StatementBuffer();
    expect(buffer.pushLine('SELECT 1 -- hola; mundo')).toEqual([]);
    expect(buffer.pushLine(';')).toEqual([{ sql: 'SELECT 1 -- hola; mundo', vertical: false }]);
  });
});
