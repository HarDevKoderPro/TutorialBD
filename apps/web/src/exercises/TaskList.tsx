import { Fragment, type ReactNode, useCallback, useEffect, useState } from 'react';
import { Check, Loader2, Send, Sparkles, X } from 'lucide-react';
import { useParams } from 'react-router';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { LEVELS } from './ExerciseList';
import type { ExerciseLevel } from './schema';

// Tarea calificable del tema: dos entregas por ejercicio, cuenta la mejor nota (0,0 a 5,0).
// Las respuestas correctas viven solo en el servidor; la solución aparece al agotar las entregas.

interface Attempt {
  attempt: number;
  answer: unknown;
  grade: number | null;
  justification: string | null;
  criteria: { criterio: string; cumple: 'si' | 'parcial' | 'no' }[] | null;
  gradedBy: 'auto' | 'ia' | 'pendiente' | 'docente';
  items: boolean[] | null;
}

interface Task {
  id: string;
  nivel: ExerciseLevel;
  objetivo: string;
  enunciado: string;
  aviso?: string;
  tabla?: { nombre: string; columnas: string[]; filas: string[][] };
  tipo: 'respuestas' | 'clasificar' | 'seleccion' | 'abierta';
  preguntas?: { pregunta: string }[];
  opciones?: string[];
  items?: { texto: string }[];
  preguntas_guia?: string[];
  rubrica?: string[];
  attempts: Attempt[];
  attemptsLeft: number;
  final: { grade: number | null; source: 'auto' | 'ia' | 'docente' | 'pendiente'; justification: string | null } | null;
  solution: string | null;
}

export const formatGrade = (value: number) => value.toFixed(1).replace('.', ',');

export function gradeColor(value: number | null): string {
  if (value === null) return 'text-text-3';
  if (value >= 4) return 'text-neon-ok';
  if (value >= 3) return 'text-amber';
  return 'text-coral-l';
}

export function TaskList() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api<{ tasks: Task[] }>(`/api/tasks/${slug}`);
      setTasks(data.tasks);
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, [slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (error) return <p className="text-coral-l">{error}</p>;
  if (!tasks) return <p className="text-text-2">Cargando la tarea…</p>;
  if (tasks.length === 0) return null;

  const graded = tasks.filter((task) => task.final?.grade !== null && task.final?.grade !== undefined);
  const average = graded.length ? graded.reduce((sum, task) => sum + (task.final!.grade ?? 0), 0) / graded.length : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="card flex max-w-3xl flex-wrap items-center justify-between gap-4 border border-cyan/30 p-5">
        <div className="text-sm text-text-2">
          <p>
            <strong className="text-text">{graded.length}</strong> de {tasks.length} tareas calificadas · 2 entregas por tarea, cuenta la mejor.
          </p>
          <p>Las respuestas abiertas las revisa y califica tu docente con la rúbrica.</p>
        </div>
        <div className="text-right">
          <p className="text-xs tracking-[0.18em] text-text-3 uppercase">Tu nota del tema</p>
          <p className={`font-mono text-3xl font-bold ${gradeColor(average)}`}>{average === null ? '—' : formatGrade(Math.round(average * 10) / 10)}</p>
        </div>
      </div>
      {user?.role === 'docente' && (
        <p className="max-w-3xl rounded-lg bg-amber/10 px-4 py-2 text-sm text-amber-l">Vista de docente: aquí entregan tus estudiantes. Las notas las ves en el panel.</p>
      )}
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} canSubmit={user?.role === 'estudiante'} onUpdated={(next) => setTasks((list) => list!.map((item) => (item.id === next.id ? next : item)))} />
      ))}
    </div>
  );
}

function TaskCard({ task, canSubmit, onUpdated }: { task: Task; canSubmit: boolean; onUpdated: (task: Task) => void }) {
  const level = LEVELS[task.nivel];
  const last = task.attempts[task.attempts.length - 1];
  const [answer, setAnswer] = useState<unknown>(() => last?.answer ?? emptyAnswer(task));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const finished = task.attemptsLeft === 0;

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await api<{ task: Task }>(`/api/tasks/${task.id}/submit`, { method: 'POST', body: { answer } });
      onUpdated(data.task);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const disabled = !canSubmit || finished || busy;
  const lastItems = last?.items ?? null;

  return (
    <article id={task.id} className={`card flex max-w-3xl flex-col gap-4 border p-5 sm:p-6 ${level.border}`}>
      <header className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${level.badge}`}>{level.label}</span>
        <span className="font-mono text-sm text-text-3">{task.id}</span>
        <span className="rounded-full border border-cyan/40 px-2.5 py-0.5 text-xs text-cyan">Calificable</span>
        {task.final && (
          <span className={`ml-auto font-mono text-xl font-bold ${gradeColor(task.final.grade)}`}>
            {task.final.grade === null ? 'Por calificar' : formatGrade(task.final.grade)}
          </span>
        )}
      </header>

      <p className="text-xs font-semibold tracking-[0.18em] text-text-3 uppercase">Objetivo · {task.objetivo}</p>
      <p className="text-lg">{inline(task.enunciado)}</p>
      {task.aviso && (
        <p className="w-fit rounded-lg bg-amber/10 px-3 py-1.5 text-sm text-amber-l">
          <span className="font-semibold">Aviso:</span> {task.aviso}
        </p>
      )}
      {task.tabla && <DataTable {...task.tabla} />}

      {task.tipo === 'respuestas' && (
        <ol className="flex flex-col gap-3">
          {task.preguntas!.map((question, index) => (
            <li key={question.pregunta} className="grid gap-2 sm:grid-cols-[1fr_16rem] sm:items-center">
              <label htmlFor={`${task.id}-${index}`} className="text-text-2">
                {index + 1}. {question.pregunta}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`${task.id}-${index}`}
                  disabled={disabled}
                  value={(answer as string[])[index] ?? ''}
                  onChange={(event) => setAnswer(replaceAt(answer as string[], index, event.target.value))}
                  autoComplete="off"
                  className={`w-full rounded-lg border bg-bg-elev px-3 py-2 font-mono text-sm outline-none focus:border-cyan disabled:opacity-70 ${itemBorder(lastItems, index)}`}
                />
                <Mark correct={lastItems?.[index]} />
              </div>
            </li>
          ))}
        </ol>
      )}

      {task.tipo === 'clasificar' && (
        <ul className="flex flex-col gap-2">
          {task.items!.map((item, index) => (
            <li key={item.texto} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <span>«{item.texto}»</span>
              <span className="flex items-center gap-2">
                <span className="flex gap-1 rounded-full border border-line p-1" role="radiogroup" aria-label={item.texto}>
                  {task.opciones!.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      disabled={disabled}
                      aria-checked={(answer as string[])[index] === option}
                      onClick={() => setAnswer(replaceAt(answer as string[], index, option))}
                      className={`rounded-full px-3 py-1 text-sm transition ${(answer as string[])[index] === option ? 'bg-violet/25 text-violet-l' : 'text-text-2 hover:bg-white/5'}`}
                    >
                      {option}
                    </button>
                  ))}
                </span>
                <Mark correct={lastItems?.[index]} />
              </span>
            </li>
          ))}
        </ul>
      )}

      {task.tipo === 'seleccion' && (
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={task.enunciado}>
          {task.opciones!.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              disabled={disabled}
              aria-checked={answer === option}
              onClick={() => setAnswer(option)}
              className={`rounded-xl border px-4 py-3 text-left transition ${answer === option ? 'border-violet/60 bg-violet/15' : 'border-line hover:bg-white/5'}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {task.tipo === 'abierta' && (
        <>
          {task.preguntas_guia && task.preguntas_guia.length > 0 && (
            <ol className="flex list-decimal flex-col gap-1 pl-6 text-text-2">
              {task.preguntas_guia.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          )}
          {task.rubrica && (
            <details className="text-sm text-text-2">
              <summary className="cursor-pointer text-cyan">Ver la rúbrica con la que se califica</summary>
              <ul className="mt-2 list-disc pl-5">
                {task.rubrica.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          )}
          <textarea
            value={String(answer ?? '')}
            disabled={disabled}
            onChange={(event) => setAnswer(event.target.value)}
            rows={7}
            placeholder="Escribe aquí tu respuesta…"
            className="rounded-xl border border-line bg-bg-elev px-4 py-3 text-sm leading-relaxed outline-none focus:border-cyan disabled:opacity-70"
          />
        </>
      )}

      {canSubmit && !finished && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void submit()} disabled={busy} className="btn-primary px-4 py-2 text-sm">
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
            {busy ? 'Enviando…' : `Entregar (entrega ${task.attempts.length + 1} de 2)`}
          </button>
          {task.attempts.length === 1 && <span className="text-xs text-text-3">Te queda una entrega: si mejoras, cuenta la mejor nota.</span>}
        </div>
      )}
      {error && <p className="text-sm text-coral-l">{error}</p>}

      {task.attempts.length > 0 && (
        <div className="flex flex-col gap-3">
          {[...task.attempts].reverse().map((attempt) => (
            <AttemptResult key={attempt.attempt} attempt={attempt} />
          ))}
        </div>
      )}

      {task.final?.source === 'docente' && (
        <p className="rounded-xl border border-cyan/30 bg-cyan/5 p-3 text-sm">
          <span className="font-semibold text-cyan-l">Nota ajustada por tu docente: {formatGrade(task.final.grade ?? 0)}.</span>{' '}
          <span className="text-text-2">{task.final.justification}</span>
        </p>
      )}

      {task.solution && (
        <div className="rounded-xl border border-green/30 bg-green/5 p-4 text-sm">
          <p className="font-semibold text-green">Solución</p>
          <p className="mt-1 whitespace-pre-line text-text-2">{task.solution}</p>
        </div>
      )}
    </article>
  );
}

function AttemptResult({ attempt }: { attempt: Attempt }) {
  return (
    <div className="rounded-xl border border-line bg-bg-code p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">
          Entrega {attempt.attempt}
          {attempt.gradedBy === 'docente' && <span className="ml-2 text-xs font-normal text-cyan">calificada por tu docente</span>}
          {attempt.gradedBy === 'ia' && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-violet">
              <Sparkles aria-hidden className="size-3.5" /> calificada por IA
            </span>
          )}
        </p>
        <p className={`font-mono text-lg font-bold ${gradeColor(attempt.grade)}`}>{attempt.grade === null ? 'Por calificar' : formatGrade(attempt.grade)}</p>
      </div>
      {attempt.justification && <p className="mt-1 text-text-2">{attempt.justification}</p>}
      {attempt.criteria && attempt.criteria.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {attempt.criteria.map((criterion) => (
            <li key={criterion.criterio} className="flex items-start gap-2 text-text-2">
              <span className={criterion.cumple === 'si' ? 'text-green' : criterion.cumple === 'parcial' ? 'text-amber' : 'text-coral-l'}>
                {criterion.cumple === 'si' ? '✓' : criterion.cumple === 'parcial' ? '◐' : '✗'}
              </span>
              {criterion.criterio}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function emptyAnswer(task: Task): unknown {
  if (task.tipo === 'respuestas') return task.preguntas!.map(() => '');
  if (task.tipo === 'clasificar') return task.items!.map(() => '');
  return '';
}

function replaceAt(list: string[], index: number, value: string): string[] {
  const next = [...list];
  next[index] = value;
  return next;
}

function itemBorder(items: boolean[] | null, index: number): string {
  if (!items) return 'border-line';
  return items[index] ? 'border-green/60' : 'border-coral/60';
}

function Mark({ correct }: { correct: boolean | undefined }) {
  if (correct === undefined) return null;
  return correct ? <Check aria-label="Correcto" className="size-5 shrink-0 text-green" /> : <X aria-label="Incorrecto" className="size-5 shrink-0 text-coral" />;
}

function DataTable({ nombre, columnas, filas }: { nombre: string; columnas: string[]; filas: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-bg-code">
      <p className="border-b border-line px-4 py-2 font-mono text-sm text-amber-l">{nombre}</p>
      <table className="w-full font-mono text-sm">
        <thead>
          <tr>
            {columnas.map((column) => (
              <th key={column} className="px-4 py-2 text-left text-xs font-medium text-cyan-l">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((row, r) => (
            <tr key={r} className="border-t border-line/60">
              {row.map((cell, c) => (
                <td key={c} className="px-4 py-2 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function inline(text: string): ReactNode {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('`')) return <code key={index} className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-l">{part.slice(1, -1)}</code>;
    if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}
