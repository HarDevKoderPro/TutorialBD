import { useCallback, useEffect, useState } from 'react';
import { CheckCheck, Save, Trash2 } from 'lucide-react';
import { api } from '../api';

type Status = 'presente' | 'tarde' | 'ausente' | 'excusa';

const STATUSES: { value: Status; label: string; active: string }[] = [
  { value: 'presente', label: 'Presente', active: 'bg-green/20 text-green border-green/50' },
  { value: 'tarde', label: 'Tarde', active: 'bg-amber/20 text-amber border-amber/50' },
  { value: 'ausente', label: 'Ausente', active: 'bg-coral/20 text-coral-l border-coral/50' },
  { value: 'excusa', label: 'Excusa', active: 'bg-cyan/20 text-cyan border-cyan/50' },
];

// Fecha de hoy en Colombia (AAAA-MM-DD)
const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

interface Student {
  id: number;
  fullName: string;
  username: string;
}

// Registro de asistencia por día; el porcentaje aparece en la pestaña de notas
export function AttendanceTab({ groupId }: { groupId: number }) {
  const [date, setDate] = useState(todayIso);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<number, Status>>({});
  const [dates, setDates] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [list, attendance] = await Promise.all([
        api<{ students: Student[] }>(`/api/groups/${groupId}/students`),
        api<{ records: Record<string, Status>; dates: string[] }>(`/api/groups/${groupId}/attendance?date=${date}`),
      ]);
      setStudents(list.students);
      setRecords(Object.fromEntries(Object.entries(attendance.records).map(([id, status]) => [Number(id), status])));
      setDates(attendance.dates);
      setMessage('');
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, [groupId, date]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const save = async () => {
    try {
      await api(`/api/groups/${groupId}/attendance`, { method: 'PUT', body: { date, records } });
      setMessage(`Asistencia del ${date} guardada.`);
      if (!dates.includes(date)) setDates([...dates, date].sort());
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  const removeDay = async () => {
    await api(`/api/groups/${groupId}/attendance/${date}`, { method: 'DELETE' }).catch(() => undefined);
    setRecords({});
    setDates(dates.filter((day) => day !== date));
    setMessage(`Se borró la asistencia del ${date}.`);
  };

  const complete = students.every((student) => records[student.id]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-2">Fecha de la clase</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-lg border border-line bg-bg-elev px-3 py-2 outline-none focus:border-cyan [color-scheme:dark]"
          />
        </label>
        <button
          type="button"
          onClick={() => setRecords(Object.fromEntries(students.map((student) => [student.id, 'presente' as Status])))}
          className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-text-2 hover:text-text"
        >
          <CheckCheck aria-hidden className="size-4" /> Todos presentes
        </button>
        <button type="button" onClick={() => void save()} disabled={students.length === 0} className="btn-primary px-4 py-2 text-sm">
          <Save aria-hidden className="size-4" /> Guardar asistencia
        </button>
        {dates.includes(date) && (
          <button type="button" onClick={() => void removeDay()} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-text-2 hover:text-coral-l">
            <Trash2 aria-hidden className="size-4" /> Borrar este día
          </button>
        )}
      </div>

      {dates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-text-3">Días registrados:</span>
          {dates.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setDate(day)}
              className={`rounded-full border px-3 py-0.5 font-mono text-xs ${day === date ? 'border-cyan/60 text-cyan' : 'border-line text-text-2 hover:text-text'}`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {message && <p className="rounded-lg bg-green/10 px-3 py-2 text-sm text-green">{message}</p>}
      {error && <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral-l">{error}</p>}
      {!complete && students.length > 0 && <p className="text-xs text-amber">Hay estudiantes sin marcar: no se guardan hasta que elijas su estado.</p>}

      <ul className="flex flex-col divide-y divide-line/60 rounded-xl border border-line">
        {students.map((student) => (
          <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span>
              <span className="font-semibold">{student.fullName}</span> <span className="font-mono text-xs text-text-3">{student.username}</span>
            </span>
            <span className="flex flex-wrap gap-1" role="radiogroup" aria-label={`Asistencia de ${student.fullName}`}>
              {STATUSES.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  role="radio"
                  aria-checked={records[student.id] === status.value}
                  onClick={() => setRecords({ ...records, [student.id]: status.value })}
                  className={`rounded-lg border px-3 py-1 text-sm transition ${records[student.id] === status.value ? status.active : 'border-line text-text-2 hover:text-text'}`}
                >
                  {status.label}
                </button>
              ))}
            </span>
          </li>
        ))}
        {students.length === 0 && <li className="px-4 py-3 text-text-2">Aún no hay estudiantes en este grupo.</li>}
      </ul>
      <p className="text-xs text-text-3">Asistencia % = (presente + tarde) ÷ (clases registradas − excusas).</p>
    </div>
  );
}
