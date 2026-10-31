import { Fragment, type ReactNode, useState } from 'react';
import { Check, Eye, Lightbulb, Send, X } from 'lucide-react';
import { useParams } from 'react-router';
import { isAccepted, MAX_ATTEMPTS_BEFORE_SOLUTION } from './grading';
import { useAllProgress, useExerciseProgress } from './progress';
import { exercisesFor } from './catalog';
import type { Exercise, ExerciseLevel } from './schema';

export const LEVELS: Record<ExerciseLevel, { label: string; badge: string; border: string }> = {
  basico: { label: 'Básico', badge: 'border-green/45 text-green-l', border: 'border-green/25' },
  intermedio: { label: 'Intermedio', badge: 'border-amber/45 text-amber-l', border: 'border-amber/25' },
  avanzado: { label: 'Avanzado', badge: 'border-pink/45 text-pink-l', border: 'border-pink/25' },
};

export function ExerciseList() {
  const { slug = '' } = useParams();
  const exercises = exercisesFor(slug);
  const progress = useAllProgress();
  const done = exercises.filter((exercise) => ['correct', 'submitted'].includes(progress[exercise.id]?.status ?? '')).length;

  if (exercises.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-3xl items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div className="h-full rounded-full bg-green transition-all duration-300" style={{ width: `${(done / exercises.length) * 100}%` }} />
        </div>
        <p className="font-mono text-sm text-text-2">
          {done} de {exercises.length} completados
        </p>
      </div>
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
      <p className="max-w-3xl text-xs text-text-3">Tu avance se guarda en tu cuenta: tu docente lo ve en su panel.</p>
    </div>
  );
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const level = LEVELS[exercise.nivel];
  const [progress] = useExerciseProgress(exercise.id);

  return (
    <article id={exercise.id} className={`card flex max-w-3xl flex-col gap-4 border p-5 sm:p-6 ${level.border}`}>
      <header className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${level.badge}`}>{level.label}</span>
        <span className="font-mono text-sm text-text-3">{exercise.id}</span>
        {progress?.status === 'correct' && <span className="ml-auto text-sm font-semibold text-neon-ok">✓ PASA</span>}
        {progress?.status === 'submitted' && <span className="ml-auto text-sm font-semibold text-cyan-l">✓ Entregado</span>}
      </header>

      <p className="text-xs font-semibold tracking-[0.18em] text-text-3 uppercase">Objetivo · {exercise.objetivo}</p>
      <p className="text-lg">{inline(exercise.enunciado)}</p>
      {exercise.aviso && (
        <p className="w-fit rounded-lg bg-amber/10 px-3 py-1.5 text-sm text-amber-l">
          <span className="font-semibold">Aviso:</span> {exercise.aviso}
        </p>
      )}
      {exercise.tabla && <DataTable {...exercise.tabla} />}

      {exercise.tipo === 'respuestas' && <AnswersExercise exercise={exercise} />}
      {exercise.tipo === 'clasificar' && <ClassifyExercise exercise={exercise} />}
      {exercise.tipo === 'seleccion' && <ChoiceExercise exercise={exercise} />}
      {exercise.tipo === 'abierta' && <OpenExercise exercise={exercise} />}
    </article>
  );
}

// Lógica común de los ejercicios autocalificados: intentos, pistas y solución
function useGraded(exercise: Exercise) {
  const [progress, update] = useExerciseProgress(exercise.id);
  const [hints, setHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const attempts = progress?.attempts ?? 0;
  const solved = progress?.status === 'correct';

  const grade = (correct: boolean) =>
    update((current) => ({
      ...current,
      attempts: current.attempts + 1,
      status: correct || current.status === 'correct' ? 'correct' : 'attempted',
    }));

  return { attempts, solved, hints, setHints, showSolution, setShowSolution, grade };
}

function GradedFooter({
  exercise,
  state,
  onCheck,
  feedback,
}: {
  exercise: Exercise;
  state: ReturnType<typeof useGraded>;
  onCheck: () => void;
  feedback: ReactNode;
}) {
  const canSeeSolution = state.attempts >= MAX_ATTEMPTS_BEFORE_SOLUTION && !state.solved;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCheck}
          className="btn-primary px-4 py-2 text-sm"
        >
          <Check aria-hidden className="size-4" /> Comprobar
        </button>
        {state.hints < exercise.pistas.length && !state.solved && (
          <button
            type="button"
            onClick={() => state.setHints(state.hints + 1)}
            className="flex items-center gap-2 rounded-full border border-amber/40 px-4 py-2 text-sm text-amber-l transition hover:bg-amber/10"
          >
            <Lightbulb aria-hidden className="size-4" /> {state.hints === 0 ? 'Ver pista' : 'Otra pista'}
          </button>
        )}
        {canSeeSolution && !state.showSolution && (
          <button
            type="button"
            onClick={() => state.setShowSolution(true)}
            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-text-2 transition hover:bg-white/5"
          >
            <Eye aria-hidden className="size-4" /> Ver solución
          </button>
        )}
        {state.attempts > 0 && <span className="font-mono text-xs text-text-3">intentos: {state.attempts}</span>}
      </div>
      {exercise.pistas.slice(0, state.hints).map((hint, index) => (
        <p key={index} className="flex items-start gap-2 text-sm text-amber-l">
          <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0" /> <span>Pista {index + 1}: {hint}</span>
        </p>
      ))}
      {feedback}
    </div>
  );
}

function Mark({ correct }: { correct: boolean | undefined }) {
  if (correct === undefined) return null;
  return correct ? <Check aria-label="Correcto" className="size-5 shrink-0 text-green" /> : <X aria-label="Incorrecto" className="size-5 shrink-0 text-coral" />;
}

function AnswersExercise({ exercise }: { exercise: Extract<Exercise, { tipo: 'respuestas' }> }) {
  const state = useGraded(exercise);
  const [answers, setAnswers] = useState<string[]>(() => exercise.preguntas.map(() => ''));
  const [checked, setChecked] = useState<boolean[] | null>(null);

  const check = () => {
    const result = exercise.preguntas.map((question, index) => isAccepted(answers[index] ?? '', question.aceptadas, question.lista));
    setChecked(result);
    state.grade(result.every(Boolean));
  };

  return (
    <>
      <ol className="flex flex-col gap-3">
        {exercise.preguntas.map((question, index) => (
          <li key={question.pregunta} className="grid gap-2 sm:grid-cols-[1fr_16rem] sm:items-center">
            <label htmlFor={`${exercise.id}-${index}`} className="text-text-2">
              {index + 1}. {question.pregunta}
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`${exercise.id}-${index}`}
                value={answers[index]}
                onChange={(event) => {
                  const next = [...answers];
                  next[index] = event.target.value;
                  setAnswers(next);
                  setChecked(null);
                }}
                onKeyDown={(event) => event.key === 'Enter' && check()}
                autoComplete="off"
                className={`w-full rounded-lg border bg-bg-elev px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-cyan/50 ${
                  checked ? (checked[index] ? 'border-green/60' : 'border-coral/60') : 'border-white/10'
                }`}
              />
              <Mark correct={checked?.[index]} />
            </div>
            {state.showSolution && <p className="text-sm text-text-3 sm:col-start-2">Respuesta: {question.aceptadas[0]}</p>}
          </li>
        ))}
      </ol>
      <GradedFooter exercise={exercise} state={state} onCheck={check} feedback={checked && <Feedback correct={checked.every(Boolean)} />} />
    </>
  );
}

function ClassifyExercise({ exercise }: { exercise: Extract<Exercise, { tipo: 'clasificar' }> }) {
  const state = useGraded(exercise);
  const [choices, setChoices] = useState<(string | null)[]>(() => exercise.items.map(() => null));
  const [checked, setChecked] = useState<boolean[] | null>(null);

  const check = () => {
    const result = exercise.items.map((item, index) => choices[index] === item.respuesta);
    setChecked(result);
    state.grade(result.every(Boolean));
  };

  return (
    <>
      <ul className="flex flex-col gap-2">
        {exercise.items.map((item, index) => (
          <li key={item.texto} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
            <span>«{item.texto}»</span>
            <span className="flex items-center gap-2">
              <span className="flex gap-1 rounded-full border border-white/10 p-1" role="radiogroup" aria-label={item.texto}>
                {exercise.opciones.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={choices[index] === option}
                    onClick={() => {
                      const next = [...choices];
                      next[index] = option;
                      setChoices(next);
                      setChecked(null);
                    }}
                    className={`rounded-full px-3 py-1 text-sm transition ${choices[index] === option ? 'bg-violet/25 text-violet-l' : 'text-text-2 hover:bg-white/5'}`}
                  >
                    {option}
                  </button>
                ))}
              </span>
              <Mark correct={checked?.[index]} />
              {state.showSolution && <span className="text-sm text-text-3">{item.respuesta}</span>}
            </span>
          </li>
        ))}
      </ul>
      <GradedFooter exercise={exercise} state={state} onCheck={check} feedback={checked && <Feedback correct={checked.every(Boolean)} />} />
    </>
  );
}

function ChoiceExercise({ exercise }: { exercise: Extract<Exercise, { tipo: 'seleccion' }> }) {
  const state = useGraded(exercise);
  const [choice, setChoice] = useState<string | null>(null);
  const [checked, setChecked] = useState<boolean | null>(null);

  const check = () => {
    const correct = choice === exercise.correcta;
    setChecked(correct);
    state.grade(correct);
  };

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={exercise.enunciado}>
        {exercise.opciones.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={choice === option}
            onClick={() => {
              setChoice(option);
              setChecked(null);
            }}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              state.showSolution && option === exercise.correcta
                ? 'border-green/60 bg-green/10 text-green-l'
                : choice === option
                ? checked === null
                  ? 'border-violet/60 bg-violet/15'
                  : checked
                    ? 'border-green/60 bg-green/10'
                    : 'border-coral/60 bg-coral/10'
                : 'border-white/10 hover:bg-white/5'
            }`}
          >
            {option}
            {state.showSolution && option === exercise.correcta && <span className="ml-2 text-xs">✓ respuesta correcta</span>}
          </button>
        ))}
      </div>
      <GradedFooter
        exercise={exercise}
        state={state}
        onCheck={check}
        feedback={
          (checked !== null || state.showSolution) && (
            <>
              {checked !== null && !state.showSolution && <Feedback correct={checked} wrong="✗ Esa no es la mejor opción. Piensa en la pista e inténtalo de nuevo." />}
              {(checked || state.showSolution) && <p className="text-sm text-text-2">{exercise.explicacion}</p>}
            </>
          )
        }
      />
    </>
  );
}

function OpenExercise({ exercise }: { exercise: Extract<Exercise, { tipo: 'abierta' }> }) {
  const [progress, update] = useExerciseProgress(exercise.id);
  const [text, setText] = useState(progress?.answer ?? '');
  const submitted = progress?.status === 'submitted';

  return (
    <>
      {exercise.preguntas_guia.length > 0 && (
        <ol className="flex list-decimal flex-col gap-1 pl-6 text-text-2">
          {exercise.preguntas_guia.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      )}
      <label className="flex flex-col gap-2">
        <span className="text-sm text-text-2">Tu respuesta</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={6}
          className="rounded-xl border border-white/10 bg-bg-elev px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-cyan/50"
          placeholder="Escribe aquí tu respuesta…"
        />
      </label>
      <button
        type="button"
        disabled={!text.trim()}
        onClick={() => update((current) => ({ ...current, status: 'submitted', attempts: current.attempts + 1, answer: text }))}
        className="btn-primary w-fit px-4 py-2 text-sm disabled:opacity-40"
      >
        <Send aria-hidden className="size-4" /> {submitted ? 'Actualizar respuesta' : 'Entregar'}
      </button>
      {submitted && (
        <div className="grid gap-4 rounded-xl border border-cyan/25 bg-cyan/5 p-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-cyan-l">Revisa tu respuesta con esta rúbrica</p>
            <ul className="flex flex-col gap-1.5 text-sm text-text-2">
              {exercise.rubrica.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-cyan" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-cyan-l">Respuesta de referencia</p>
            <p className="text-sm whitespace-pre-line text-text-2">{exercise.referencia.trim()}</p>
          </div>
        </div>
      )}
    </>
  );
}

function Feedback({ correct, wrong = '✗ Revisa las respuestas marcadas en rojo e inténtalo de nuevo.' }: { correct: boolean; wrong?: string }) {
  return correct ? <p className="text-sm font-semibold text-neon-ok">✓ ¡Correcto!</p> : <p className="text-sm text-coral-l">{wrong}</p>;
}

function DataTable({ nombre, columnas, filas }: { nombre: string; columnas: string[]; filas: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-bg-code">
      <p className="border-b border-white/10 px-4 py-2 font-mono text-sm text-amber-l">{nombre}</p>
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
            <tr key={r} className="border-t border-white/5">
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

// Markdown mínimo para enunciados: `código` y **negrita**
function inline(text: string): ReactNode {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('`')) return <code key={index} className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-l">{part.slice(1, -1)}</code>;
    if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}
