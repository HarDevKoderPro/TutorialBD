import { describe, expect, it } from 'vitest';
import { highlightSql } from './highlightSql';

describe('highlightSql', () => {
  it('clasifica palabras clave, tipos, restricciones, strings y números', () => {
    const tokens = highlightSql("CREATE TABLE t (id INT PRIMARY KEY, nombre VARCHAR(50)); INSERT INTO t VALUES (1, 'Laura Gómez');")
      .filter((token) => token.kind !== 'plain')
      .map((token) => `${token.kind}:${token.text}`);

    expect(tokens).toEqual([
      'keyword:CREATE',
      'keyword:TABLE',
      'type:INT',
      'constraint:PRIMARY',
      'constraint:KEY',
      'type:VARCHAR',
      'number:50',
      'keyword:INSERT',
      'keyword:INTO',
      'keyword:VALUES',
      'number:1',
      "string:'Laura Gómez'",
    ]);
  });

  it('conserva el texto original completo', () => {
    const source = "SELECT * FROM clientes -- todos\nWHERE ciudad = 'Bogotá';";
    expect(highlightSql(source).map((token) => token.text).join('')).toBe(source);
  });

  it('reconoce comentarios de línea', () => {
    expect(highlightSql('-- hola\nSELECT 1;')[0]).toEqual({ kind: 'comment', text: '-- hola' });
  });
});
