import { describe, expect, it } from 'vitest';
import { formatResult } from './formatResult';

describe('formatResult', () => {
  it('dibuja la tabla como el cliente mysql (números a la derecha)', () => {
    const lines = formatResult({
      kind: 'rows',
      columns: ['id_cliente', 'nombre', 'ciudad'],
      numeric: [true, false, false],
      rows: [
        ['1', 'Laura Gómez', 'Bogotá'],
        ['2', 'Andrés Ruiz', null],
      ],
      total: 2,
      ms: 1.2,
    });
    expect(lines).toEqual([
      '+------------+-------------+--------+',
      '| id_cliente | nombre      | ciudad |',
      '+------------+-------------+--------+',
      '|          1 | Laura Gómez | Bogotá |',
      '|          2 | Andrés Ruiz | NULL   |',
      '+------------+-------------+--------+',
      '2 rows in set (0.00 sec)',
    ]);
  });

  it('formatea Query OK, Empty set y errores', () => {
    expect(formatResult({ kind: 'ok', affectedRows: 3, info: 'Records: 3  Duplicates: 0  Warnings: 0', warnings: 0, ms: 12 })).toEqual([
      'Query OK, 3 rows affected (0.01 sec)',
      'Records: 3  Duplicates: 0  Warnings: 0',
    ]);
    expect(formatResult({ kind: 'ok', affectedRows: 1, info: '', warnings: 0, ms: 3 })).toEqual(['Query OK, 1 row affected (0.00 sec)']);
    expect(formatResult({ kind: 'rows', columns: ['a'], numeric: [false], rows: [], total: 0, ms: 0 })).toEqual(['Empty set (0.00 sec)']);
    expect(formatResult({ kind: 'error', code: 1062, sqlState: '23000', message: "Duplicate entry '1' for key 'clientes.PRIMARY'" })).toEqual([
      "ERROR 1062 (23000): Duplicate entry '1' for key 'clientes.PRIMARY'",
    ]);
  });

  it('salida vertical con \\G', () => {
    const lines = formatResult({ kind: 'rows', columns: ['id', 'nombre'], numeric: [true, false], rows: [['1', 'Laura']], total: 1, ms: 0 }, true);
    expect(lines).toEqual(['*************************** 1. row ***************************', '    id: 1', 'nombre: Laura', '1 row in set (0.00 sec)']);
  });
});
