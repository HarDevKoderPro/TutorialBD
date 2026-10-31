import type { MDXComponents } from 'mdx/types';
import {
  Chips,
  CodeBlock,
  ComingSoon,
  Example,
  Examples,
  Highlight,
  InlineCode,
  Note,
  Paragraph,
  Section,
  Step,
  Steps,
} from './blocks';
import { SqlConsole } from '../console/SqlConsole';
import { ExerciseList } from '../exercises/ExerciseList';
import { TaskList } from '../exercises/TaskList';
import { DataTypes, DbmsFlow, KeysDiagram, TableAnatomy } from './diagrams';

// Nombres en español que usan las lecciones de content/ → componentes de la app
export const mdxComponents: MDXComponents = {
  Seccion: Section,
  Clave: Highlight,
  Pasos: Steps,
  Paso: Step,
  Ejemplos: Examples,
  Ejemplo: Example,
  Nota: Note,
  Chips,
  Proximamente: ComingSoon,
  Consola: SqlConsole,
  Ejercicios: ExerciseList,
  Tareas: TaskList,
  FlujoSGBD: DbmsFlow,
  AnatomiaTabla: TableAnatomy,
  TiposDato: DataTypes,
  DiagramaClaves: KeysDiagram,
  p: Paragraph,
  pre: CodeBlock,
  code: InlineCode,
};
