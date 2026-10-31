import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { isAccepted, normalize } from './grading';
import { exerciseFileSchema } from './schema';

describe('isAccepted', () => {
  it('ignora mayúsculas, tildes, comillas y espacios', () => {
    expect(isAccepted('  Estudiantes ', ['estudiantes'])).toBe(true);
    expect(isAccepted('`estudiantes`', ['estudiantes'])).toBe(true);
    expect(isAccepted('Informacion', ['Información'])).toBe(true);
    expect(normalize('Número  Consecutivo')).toBe('numero consecutivo');
  });

  it('acepta listas en cualquier orden y con "y"', () => {
    expect(isAccepted('grupo, documento y nombre', ['documento, nombre, grupo'], true)).toBe(true);
    expect(isAccepted('documento nombre', ['documento, nombre, grupo'], true)).toBe(false);
  });

  it('rechaza respuestas vacías o distintas', () => {
    expect(isAccepted('', ['5'])).toBe(false);
    expect(isAccepted('6', ['5', 'cinco'])).toBe(false);
  });
});

describe('content/temas/*/ejercicios.yaml', () => {
  it('el Tema 1 cumple el esquema y sus ids son del tema', () => {
    const file = fileURLToPath(new URL('../../../../content/temas/01-conceptos-basicos/ejercicios.yaml', import.meta.url));
    const { ejercicios } = exerciseFileSchema.parse(parse(readFileSync(file, 'utf8')));
    expect(ejercicios.every((exercise) => exercise.id.startsWith('T1-'))).toBe(true);
    expect(ejercicios.map((exercise) => exercise.nivel)).toEqual(['basico', 'basico', 'intermedio', 'intermedio', 'avanzado']);
  });
});
