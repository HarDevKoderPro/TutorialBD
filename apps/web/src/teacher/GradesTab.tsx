import { useCallback, useEffect, useState } from 'react';
import { Download, ImageIcon, RefreshCw, Share2, Sparkles, X } from 'lucide-react';
import { api } from '../api';
import { LEVELS } from '../exercises/ExerciseList';
import type { ExerciseLevel } from '../exercises/schema';
import { formatGrade, gradeColor } from '../exercises/TaskList';
import { downloadBlob, renderGradesImage, shareOnWhatsApp } from './gradesImage';

interface TaskGrade {
  grade: number | null;
  source: 'auto' | 'ia' | 'docente' | 'pendiente';
  attempts: number;
  justification: string | null;
}

interface StudentReport {
  id: number;
  username: string;
  fullName: string;
  grades: Record<string, TaskGrade>;
  definitive: number | null;
  gradedTasks: number;
  attendance: { attended: number; total: number; percent: number | null };
  comment: string;
}

interface Report {
  group: { id: number; name: string; sessions: number };
  tasks: { id: string; slug: string; nivel: ExerciseLevel; tipo: string; objetivo: string }[];
  students: StudentReport[];
}

const REFRESH_MS = 30_000;
const today = () => new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'long', year: 'numeric' });

// Notas del grupo: se recalculan con cada entrega; imagen y botón para compartir por WhatsApp
export function GradesTab({ groupId }: { groupId: number }) {
  const [report, setReport] = useState<Report | null>(null);
  const [selected, setSelected] = useState<{ student: StudentReport; taskId: string } | null>(null);
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setReport(await api<Report>(`/api/groups/${groupId}/grades`));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, [groupId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const buildImage = async () => {
    if (!report) return null;
    const blob = await renderGradesImage({
      groupName: report.group.name,
      date: today(),
      taskIds: report.tasks.map((task) => task.id),
      students: report.students.map((student) => ({
        fullName: student.fullName,
        grades: Object.fromEntries(report.tasks.map((task) => [task.id, student.grades[task.id]?.grade ?? null])),
        definitive: student.definitive,
        attendance: student.attendance.percent,
        comment: student.comment,
      })),
    });
    if (preview) URL.revokeObjectURL(preview.url);
    const next = { url: URL.createObjectURL(blob), blob };
    setPreview(next);
    return next;
  };

  const fileName = () => `notas-${(report?.group.name ?? 'grupo').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;

  const share = async () => {
    const image = preview ?? (await buildImage());
    if (!image || !report) return;
    const text = `Notas de ${report.group.name} (corte al ${today()}). Definitiva = promedio de las tareas calificadas; 3,0 aprueba.`;
    const result = await shareOnWhatsApp(image.blob, fileName(), text);
    setNotice(result === 'fallback' ? 'Descargamos la imagen y abrimos WhatsApp: elige el chat del grupo y adjunta la imagen descargada.' : '');
  };

  if (error) return <p className="text-coral-l">{error}</p>;
  if (!report) return <p className="text-text-2">Cargando notas…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void buildImage()} className="btn-primary px-3 py-2 text-sm">
          <ImageIcon aria-hidden className="size-4" /> Generar imagen
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="flex items-center gap-2 rounded-lg border border-green/50 px-3 py-2 text-sm font-semibold text-green transition hover:bg-green/10"
        >
          <Share2 aria-hidden className="size-4" /> Compartir por WhatsApp
        </button>
        <button type="button" onClick={() => void load()} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-text-2 hover:text-text">
          <RefreshCw aria-hidden className="size-4" /> Actualizar
        </button>
        <span className="text-xs text-text-3">Definitiva = promedio de las tareas calificadas · {report.group.sessions} sesiones con asistencia</span>
      </div>
      {notice && <p className="rounded-lg bg-green/10 px-3 py-2 text-sm text-green">{notice}</p>}

      {report.students.length === 0 ? (
        <p className="text-text-2">Aún no hay estudiantes en este grupo.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-bg-code">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Estudiante</th>
                {report.tasks.map((task) => (
                  <th key={task.id} className="px-2 py-3 text-center font-mono text-xs font-medium whitespace-nowrap" title={task.objetivo}>
                    <span className={LEVELS[task.nivel].badge.split(' ').find((name) => name.startsWith('text-'))}>{task.id}</span>
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-semibold text-cyan-l">Definitiva</th>
                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">Asist.</th>
                <th className="min-w-72 px-4 py-3 text-left font-semibold">Comentario</th>
              </tr>
            </thead>
            <tbody>
              {report.students.map((student) => (
                <tr key={student.id} className="border-t border-line/60 align-top">
                  <td className="min-w-44 px-4 py-3">
                    <p className="font-semibold">{student.fullName}</p>
                    <p className="font-mono text-xs text-text-3">{student.username}</p>
                  </td>
                  {report.tasks.map((task) => {
                    const entry = student.grades[task.id];
                    return (
                      <td key={task.id} className="px-2 py-3 text-center">
                        {entry ? (
                          <button
                            type="button"
                            onClick={() => setSelected({ student, taskId: task.id })}
                            className={`rounded px-1.5 py-0.5 font-mono font-semibold hover:bg-white/5 ${gradeColor(entry.grade)}`}
                            title={entry.justification ?? ''}
                          >
                            {entry.grade === null ? '…' : formatGrade(entry.grade)}
                            {entry.source === 'ia' && <Sparkles aria-label="IA" className="ml-0.5 inline size-3 text-violet" />}
                            {entry.source === 'docente' && <span className="ml-0.5 text-[10px] text-cyan">D</span>}
                          </button>
                        ) : (
                          <span className="text-text-3">·</span>
                        )}
                      </td>
                    );
                  })}
                  <td className={`px-3 py-3 text-center font-mono text-lg font-bold ${gradeColor(student.definitive)}`}>
                    {student.definitive === null ? '—' : formatGrade(student.definitive)}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap text-text-2">{student.attendance.percent === null ? '—' : `${student.attendance.percent} %`}</td>
                  <td className="px-4 py-3 text-xs text-text-2">{student.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="flex flex-wrap gap-4 text-xs text-text-3">
        <span>Clic en una nota para ver las entregas y ajustarla</span>
        <span className="flex items-center gap-1">
          <Sparkles aria-hidden className="size-3 text-violet" /> calificada por IA
        </span>
        <span>
          <span className="text-cyan">D</span> ajustada por el docente
        </span>
        <span>… pendiente de calificar</span>
      </p>

      {selected && (
        <TaskDetail
          key={`${selected.student.id}-${selected.taskId}`}
          studentId={selected.student.id}
          studentName={selected.student.fullName}
          taskId={selected.taskId}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            void load();
          }}
        />
      )}

      {preview && (
        <div className="card flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Vista previa de la imagen</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => downloadBlob(preview.blob, fileName())} className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm text-text-2 hover:text-text">
                <Download aria-hidden className="size-4" /> Descargar
              </button>
              <button type="button" onClick={() => setPreview(null)} className="rounded p-1 text-text-2 hover:text-text" aria-label="Cerrar vista previa">
                <X aria-hidden className="size-5" />
              </button>
            </div>
          </div>
          <img src={preview.url} alt={`Tabla de notas de ${report.group.name}`} className="w-full rounded-lg border border-line" />
        </div>
      )}
    </div>
  );
}

interface Submission {
  attempt: number;
  answer: unknown;
  grade: number | null;
  justification: string | null;
  criteria: { criterio: string; cumple: string }[] | null;
  gradedBy: string;
}

function TaskDetail({
  studentId,
  studentName,
  taskId,
  onClose,
  onSaved,
}: {
  studentId: number;
  studentName: string;
  taskId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState<{
    task: { enunciado: string; tipo: string; preguntas?: { pregunta: string }[]; items?: { texto: string }[]; rubrica?: string[] };
    solution: string;
    submissions: Submission[];
    override: { grade: number; comment: string | null } | null;
  } | null>(null);
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<NonNullable<typeof data>>(`/api/students/${studentId}/tasks/${taskId}`)
      .then((result) => {
        setData(result);
        setGrade(result.override ? String(result.override.grade).replace('.', ',') : '');
        setComment(result.override?.comment ?? '');
      })
      .catch((caught: Error) => setError(caught.message));
  }, [studentId, taskId]);

  const save = async (clear = false) => {
    const value = clear ? null : Number(grade.replace(',', '.'));
    if (!clear && (Number.isNaN(value) || value! < 0 || value! > 5)) {
      setError('La nota debe estar entre 0,0 y 5,0.');
      return;
    }
    try {
      await api('/api/grades/override', { method: 'PUT', body: { studentId, taskId, grade: value, comment: comment.trim() || null } });
      onSaved();
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  const describe = (submission: Submission) => {
    if (!data) return '';
    const answer = submission.answer;
    if (Array.isArray(answer)) {
      const labels = data.task.preguntas?.map((q) => q.pregunta) ?? data.task.items?.map((item) => `«${item.texto}»`) ?? [];
      return answer.map((value, index) => `${labels[index] ?? index + 1}: ${value || '(vacío)'}`).join('\n');
    }
    return String(answer ?? '');
  };

  return (
    <div className="card flex flex-col gap-4 border border-cyan/40 p-5" role="dialog" aria-label={`${taskId} de ${studentName}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-text-3">{taskId}</p>
          <p className="font-semibold">{studentName}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-text-2 hover:text-text" aria-label="Cerrar">
          <X aria-hidden className="size-5" />
        </button>
      </div>
      {!data && !error && <p className="text-text-2">Cargando…</p>}
      {data && (
        <>
          <p className="text-sm text-text-2">{data.task.enunciado.replace(/[`*]/g, '')}</p>
          {data.submissions.map((submission) => (
            <div key={submission.attempt} className="rounded-xl border border-line bg-bg-code p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  Entrega {submission.attempt} {submission.gradedBy === 'ia' && <span className="text-xs font-normal text-violet">· IA</span>}
                </p>
                <p className={`font-mono text-lg font-bold ${gradeColor(submission.grade)}`}>{submission.grade === null ? 'Por calificar' : formatGrade(submission.grade)}</p>
              </div>
              <p className="mt-2 whitespace-pre-line">{describe(submission)}</p>
              {submission.justification && <p className="mt-2 text-text-2">{submission.justification}</p>}
            </div>
          ))}
          <details className="text-sm text-text-2">
            <summary className="cursor-pointer text-cyan">Ver solución / referencia</summary>
            <p className="mt-2 whitespace-pre-line">{data.solution}</p>
          </details>
          <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-text-2">Nota (0,0–5,0)</span>
              <input
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                inputMode="decimal"
                placeholder="4,5"
                className="rounded-lg border border-line bg-bg-elev px-3 py-2 font-mono outline-none focus:border-cyan"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-text-2">Comentario que justifica la nota</span>
              <input value={comment} onChange={(event) => setComment(event.target.value)} className="rounded-lg border border-line bg-bg-elev px-3 py-2 outline-none focus:border-cyan" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void save()} className="btn-primary px-4 py-2 text-sm">
              Guardar nota del docente
            </button>
            {data.override && (
              <button type="button" onClick={() => void save(true)} className="rounded-lg border border-line px-4 py-2 text-sm text-text-2 hover:text-text">
                Quitar ajuste (volver a la nota calculada)
              </button>
            )}
          </div>
        </>
      )}
      {error && <p className="text-sm text-coral-l">{error}</p>}
    </div>
  );
}
