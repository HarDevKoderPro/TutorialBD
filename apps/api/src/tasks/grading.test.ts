import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadTasks, publicTask, type Task } from './content';
import { gradeClosed } from './grading';

const catalog = loadTasks(fileURLToPath(new URL('../../../../content', import.meta.url)));
const task = (id: string) => catalog.byId.get(id)!.task as Exclude<Task, { tipo: 'abierta' }>;

describe('tareas del Tema 1', () => {
  it('se cargan en orden y con ids de tarea', () => {
    expect(catalog.bySlug.get('01-conceptos-basicos')?.map((t) => t.id)).toEqual(['T1-PB1', 'T1-PB2', 'T1-PI1', 'T1-PI2', 'T1-PA1']);
  });

  it('la versión pública no incluye respuestas ni referencia', () => {
    const json = JSON.stringify(catalog.all.map(({ task: t }) => publicTask(t)));
    expect(json).not.toContain('aceptadas');
    expect(json).not.toContain('"respuesta"');
    expect(json).not.toContain('correcta');
    expect(json).not.toContain('referencia');
  });
});

describe('gradeClosed', () => {
  it('respuestas: nota proporcional y justificación sin revelar la respuesta', () => {
    const result = gradeClosed(task('T1-PB1'), ['Productos', 'precio, codigo y nombre', '5', '$59.900']);
    expect(result.items).toEqual([true, true, false, true]);
    expect(result.grade).toBe(3.8);
    expect(result.justification).toContain('Acertaste 3 de 4');
    expect(result.justification).not.toContain('cuatro');
  });

  it('clasificar: todo correcto es 5,0', () => {
    const result = gradeClosed(task('T1-PB2'), ['Dato', 'Información', 'Dato', 'Información', 'Dato']);
    expect(result.grade).toBe(5);
  });

  it('selección: 5,0 o 0,0', () => {
    expect(gradeClosed(task('T1-PI2'), 'Número consecutivo (id_producto)').grade).toBe(5);
    expect(gradeClosed(task('T1-PI2'), 'Precio').grade).toBe(0);
  });

  it('respuesta vacía o con formato inválido es 0,0', () => {
    expect(gradeClosed(task('T1-PB1'), null).grade).toBe(0);
  });
});
