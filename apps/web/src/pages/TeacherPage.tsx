import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Check, Copy, Lock, LockOpen, Plus, RefreshCw, Users, X } from 'lucide-react';
import { api } from '../api';
import { availableExercises } from '../exercises/catalog';
import { LEVELS } from '../exercises/ExerciseList';
import type { Exercise } from '../exercises/schema';

interface Group {
  id: number;
  name: string;
  joinCode: string;
  active: boolean;
  students: number;
}

interface StudentProgress {
  status: 'attempted' | 'correct' | 'submitted';
  attempts: number;
  answer: string | null;
  review: 'aprobado' | 'por_mejorar' | null;
  reviewComment: string | null;
  updatedAt: string;
}

interface Student {
  id: number;
  username: string;
  fullName: string;
  lastLoginAt: string | null;
  progress: Record<string, StudentProgress>;
}

const REFRESH_MS = 30_000;

// Panel del docente: grupos con su código de ingreso y avance de cada estudiante por ejercicio
export function TeacherPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadGroups = useCallback(async () => {
    try {
      const { groups: list } = await api<{ groups: Group[] }>('/api/groups');
      setGroups(list);
      setSelected((current) => current ?? list[0]?.id ?? null);
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, []);

  useEffect(() => {
    // Carga inicial: el setState ocurre en la respuesta asíncrona
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadGroups();
  }, [loadGroups]);

  const createGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get('name') ?? '');
    try {
      const { group } = await api<{ group: Group }>('/api/groups', { method: 'POST', body: { name } });
      form.reset();
      setGroups((list) => [group, ...list]);
      setSelected(group.id);
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  const toggleActive = async (group: Group) => {
    await api(`/api/groups/${group.id}`, { method: 'PATCH', body: { active: !group.active } });
    setGroups((list) => list.map((item) => (item.id === group.id ? { ...item, active: !item.active } : item)));
  };

  const current = groups.find((group) => group.id === selected) ?? null;

  return (
    <main className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-2">
        <p className="section-label">Panel del docente</p>
        <h1 className="text-4xl font-bold">Mis grupos</h1>
        <p className="text-text-2">Comparte el código con tus estudiantes: con él se registran una sola vez.</p>
      </div>

      {error && <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral-l">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="flex flex-col gap-3">
          <form onSubmit={createGroup} className="flex gap-2">
            <input
              name="name"
              required
              minLength={2}
              placeholder="Nombre del nuevo grupo"
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm outline-none focus:border-cyan"
            />
            <button type="submit" className="btn-primary px-3 py-2 text-sm" aria-label="Crear grupo">
              <Plus aria-hidden className="size-4" />
            </button>
          </form>
          {groups.length === 0 && <p className="text-sm text-text-3">Aún no tienes grupos. Crea el primero.</p>}
          <ul className="flex flex-col gap-2">
            {groups.map((group) => (
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => setSelected(group.id)}
                  className={`card flex w-full flex-col gap-1 border p-3 text-left transition ${group.id === selected ? 'border-cyan/60' : 'hover:border-cyan/40'}`}
                >
                  <span className="font-semibold">{group.name}</span>
                  <span className="flex items-center gap-3 text-xs text-text-2">
                    <span className="font-mono tracking-[0.2em] text-cyan">{group.joinCode}</span>
                    <span className="flex items-center gap-1">
                      <Users aria-hidden className="size-3.5" /> {group.students}
                    </span>
                    {!group.active && <span className="text-amber">ingreso cerrado</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {current && <GroupDetail key={current.id} group={current} onToggleActive={() => toggleActive(current)} />}
      </div>
    </main>
  );
}

function GroupDetail({ group, onToggleActive }: { group: Group; onToggleActive: () => void }) {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewing, setViewing] = useState<{ student: Student; exercise: Exercise } | null>(null);
  const catalog = availableExercises();
  const allExercises = catalog.flatMap((entry) => entry.exercises);

  const load = useCallback(async () => {
    const { students: list } = await api<{ students: Student[] }>(`/api/groups/${group.id}/students`);
    setStudents(list);
  }, [group.id]);

  useEffect(() => {
    // Se actualiza solo cada 30 s para seguir el avance durante la clase
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(group.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="flex min-w-0 flex-col gap-5">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">{group.name}</h2>
          <p className="text-sm text-text-2">{students ? `${students.length} estudiantes registrados` : 'Cargando…'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-bg-code px-4 py-2">
            <span className="text-xs text-text-3">Código</span>
            <span className="font-mono text-2xl font-bold tracking-[0.25em] text-cyan-l">{group.joinCode}</span>
            <button type="button" onClick={copyCode} className="rounded p-1 text-text-2 hover:text-cyan" aria-label="Copiar código">
              {copied ? <Check aria-hidden className="size-4 text-green" /> : <Copy aria-hidden className="size-4" />}
            </button>
          </div>
          <button type="button" onClick={onToggleActive} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-text-2 hover:text-text">
            {group.active ? <Lock aria-hidden className="size-4" /> : <LockOpen aria-hidden className="size-4" />}
            {group.active ? 'Cerrar ingreso' : 'Abrir ingreso'}
          </button>
          <button type="button" onClick={() => void load()} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-text-2 hover:text-text">
            <RefreshCw aria-hidden className="size-4" /> Actualizar
          </button>
        </div>
      </div>

      {students && students.length === 0 && (
        <p className="text-text-2">
          Nadie se ha registrado todavía. Los estudiantes entran a la app, eligen «Soy nuevo» y escriben el código{' '}
          <span className="font-mono text-cyan">{group.joinCode}</span>.
        </p>
      )}

      {students && students.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-bg-code">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Estudiante</th>
                <th className="px-3 py-3 text-left font-semibold">Avance</th>
                {allExercises.map((exercise) => (
                  <th key={exercise.id} className="px-2 py-3 text-center font-mono text-xs font-medium">
                    <span className={LEVELS[exercise.nivel].badge.split(' ').find((name) => name.startsWith('text-'))}>{exercise.id}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const done = allExercises.filter((exercise) => ['correct', 'submitted'].includes(student.progress[exercise.id]?.status ?? '')).length;
                return (
                  <tr key={student.id} className="border-t border-line/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{student.fullName}</p>
                      <p className="font-mono text-xs text-text-3">{student.username}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-green" style={{ width: `${allExercises.length ? (done / allExercises.length) * 100 : 0}%` }} />
                        </div>
                        <span className="font-mono text-xs text-text-2">
                          {done}/{allExercises.length}
                        </span>
                      </div>
                    </td>
                    {allExercises.map((exercise) => (
                      <td key={exercise.id} className="px-2 py-3 text-center">
                        <ProgressCell entry={student.progress[exercise.id]} onOpen={() => setViewing({ student, exercise })} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="flex flex-wrap gap-4 text-xs text-text-3">
        <span className="text-neon-ok">✓ correcto</span>
        <span className="text-cyan">● por revisar (clic)</span>
        <span className="text-amber">↺ por mejorar</span>
        <span className="text-coral-l">✗ intentos sin acertar</span>
        <span>· sin empezar</span>
      </p>

      {viewing && (
        <AnswerPanel
          key={`${viewing.student.id}-${viewing.exercise.id}`}
          {...viewing}
          onClose={() => setViewing(null)}
          onReviewed={(review, comment) => {
            const { student, exercise } = viewing;
            setStudents((list) =>
              (list ?? []).map((item) =>
                item.id === student.id
                  ? { ...item, progress: { ...item.progress, [exercise.id]: { ...item.progress[exercise.id]!, review, reviewComment: comment } } }
                  : item,
              ),
            );
            setViewing(null);
          }}
        />
      )}
    </section>
  );
}

function ProgressCell({ entry, onOpen }: { entry: StudentProgress | undefined; onOpen: () => void }) {
  if (!entry) return <span className="text-text-3">·</span>;
  if (entry.status === 'correct') return <span className="text-neon-ok" title={`${entry.attempts} intentos`}>✓</span>;
  if (entry.status === 'submitted') {
    const look =
      entry.review === 'aprobado'
        ? { symbol: '✓', color: 'text-neon-ok', title: 'Aprobado (clic para ver)' }
        : entry.review === 'por_mejorar'
          ? { symbol: '↺', color: 'text-amber', title: 'Por mejorar (clic para ver)' }
          : { symbol: '●', color: 'text-cyan', title: 'Pendiente de revisión (clic para revisar)' };
    return (
      <button type="button" onClick={onOpen} className={`rounded px-1.5 hover:bg-cyan/15 ${look.color}`} title={look.title}>
        {look.symbol}
      </button>
    );
  }
  return (
    <span className="font-mono text-xs text-coral-l" title={`${entry.attempts} intentos`}>
      ✗{entry.attempts}
    </span>
  );
}

function AnswerPanel({
  student,
  exercise,
  onClose,
  onReviewed,
}: {
  student: Student;
  exercise: Exercise;
  onClose: () => void;
  onReviewed: (review: 'aprobado' | 'por_mejorar', comment: string | null) => void;
}) {
  const entry = student.progress[exercise.id];
  const [comment, setComment] = useState(entry?.reviewComment ?? '');
  const [error, setError] = useState('');

  const review = async (decision: 'aprobado' | 'por_mejorar') => {
    try {
      await api('/api/reviews', { method: 'PUT', body: { studentId: student.id, exerciseId: exercise.id, review: decision, comment: comment.trim() || null } });
      onReviewed(decision, comment.trim() || null);
    } catch (caught) {
      setError((caught as Error).message);
    }
  };
  return (
    <div className="card flex flex-col gap-3 border border-cyan/40 p-5" role="dialog" aria-label={`Respuesta de ${student.fullName}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-text-3">{exercise.id}</p>
          <p className="font-semibold">{student.fullName}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-text-2 hover:text-text" aria-label="Cerrar">
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <p className="text-sm text-text-2">{exercise.enunciado.replace(/[`*]/g, '')}</p>
      <p className="rounded-lg bg-bg-code p-4 text-sm whitespace-pre-line">{entry?.answer ?? '(sin respuesta)'}</p>
      {exercise.tipo === 'abierta' && (
        <details className="text-sm text-text-2">
          <summary className="cursor-pointer text-cyan">Ver rúbrica y respuesta de referencia</summary>
          <ul className="mt-2 list-disc pl-5">
            {exercise.rubrica.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-2 whitespace-pre-line">{exercise.referencia.trim()}</p>
        </details>
      )}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-text-2">Comentario para el estudiante (opcional)</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={2}
          className="rounded-lg border border-line bg-bg-elev px-3 py-2 outline-none focus:border-cyan"
        />
      </label>
      {error && <p className="text-sm text-coral-l">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void review('aprobado')} className="btn-primary px-4 py-2 text-sm">
          <Check aria-hidden className="size-4" /> Aprobar
        </button>
        <button
          type="button"
          onClick={() => void review('por_mejorar')}
          className="flex items-center gap-2 rounded-lg border border-amber/50 px-4 py-2 text-sm font-semibold text-amber transition hover:bg-amber/10"
        >
          ↺ Por mejorar
        </button>
        {entry?.review && <span className="self-center text-xs text-text-3">Estado actual: {entry.review === 'aprobado' ? 'aprobado' : 'por mejorar'}</span>}
      </div>
    </div>
  );
}
