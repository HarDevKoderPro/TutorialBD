import { useState } from 'react';
import { ArrowDown, ArrowUp, Database, MonitorSmartphone } from 'lucide-react';
import { ACCENT_ORDER, ACCENTS } from '../ui/accent';

// Diagramas interactivos propios (HTML/SVG), alimentados con datos desde el MDX

interface Node {
  nombre: string;
  detalle: string;
}

export function DbmsFlow({
  aplicacion,
  sgbd,
  base,
  ida,
  vuelta,
  acceso,
}: {
  aplicacion: Node;
  sgbd: Node;
  base: string;
  ida: string;
  vuelta: string;
  acceso: string;
}) {
  return (
    <figure
      className="card flex flex-col items-stretch gap-4 p-6 md:flex-row md:items-center md:gap-0"
      aria-label={`${aplicacion.nombre} envía ${ida} al ${sgbd.nombre}, que ${acceso} la ${base} y devuelve ${vuelta}.`}
    >
      <div className="card flex flex-col gap-1 border border-cyan/45 p-4 md:w-52">
        <div className="flex items-center gap-2 text-lg font-bold">
          <MonitorSmartphone aria-hidden className="size-5 text-cyan" />
          {aplicacion.nombre}
        </div>
        <p className="text-xs text-text-2">{aplicacion.detalle}</p>
      </div>

      {/* Ida (SQL) y vuelta (resultados) */}
      <div className="flex justify-center gap-10 md:flex-1 md:flex-col md:gap-3 md:px-3">
        <FlowArrow label={ida} direction="forward" tone="cyan" />
        <FlowArrow label={vuelta} direction="back" tone="green" dashed />
      </div>

      <div className="card flex flex-col items-center gap-1 border border-violet/50 p-5 text-center shadow-[0_0_40px_-12px_var(--color-violet)] md:w-56">
        <p className="text-2xl font-bold">{sgbd.nombre}</p>
        <p className="text-xs text-text-2">{sgbd.detalle}</p>
      </div>

      <div className="flex justify-center md:flex-1 md:px-3">
        <FlowArrow label={acceso} direction="forward" tone="cyan" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <Database aria-hidden className="size-16 text-green" strokeWidth={1.25} />
        <p className="font-bold">{base}</p>
      </div>
    </figure>
  );
}

function FlowArrow({ label, direction, tone, dashed = false }: { label: string; direction: 'forward' | 'back'; tone: 'cyan' | 'green'; dashed?: boolean }) {
  const accent = ACCENTS[tone];
  const forward = direction === 'forward';
  return (
    <div className={`flex flex-col items-center gap-1 ${accent.text}`}>
      <span className={`rounded-full border px-2.5 py-0.5 font-mono text-xs whitespace-nowrap ${accent.border}`}>{label}</span>
      {/* Horizontal en escritorio */}
      <div className={`relative hidden h-4 w-full items-center md:flex ${forward ? '' : 'flex-row-reverse'}`}>
        <div className={`h-0 flex-1 border-t-2 ${dashed ? 'border-dashed' : ''} ${tone === 'cyan' ? 'border-cyan/70' : 'border-green/70'}`} />
        <span className={`size-0 border-y-[6px] border-y-transparent ${forward ? 'border-l-[9px]' : 'border-r-[9px]'} ${tone === 'cyan' ? 'border-l-cyan border-r-cyan' : 'border-l-green border-r-green'}`} />
        <span className={`flow-dot absolute size-2 rounded-full ${tone === 'cyan' ? 'bg-cyan-l' : 'bg-green-l'} ${forward ? 'flow-dot-forward' : 'flow-dot-back'}`} />
      </div>
      {/* Vertical en móvil */}
      <span className="md:hidden">{forward ? <ArrowDown aria-hidden className="size-5" /> : <ArrowUp aria-hidden className="size-5" />}</span>
    </div>
  );
}

type Part = 'tabla' | 'campo' | 'registro' | 'valor';

const PART_STYLES: Record<Part, { badge: string; text: string }> = {
  tabla: { badge: 'bg-amber/20 text-amber-l', text: 'text-amber-l' },
  campo: { badge: 'bg-cyan/20 text-cyan-l', text: 'text-cyan-l' },
  registro: { badge: 'bg-violet/20 text-violet-l', text: 'text-violet-l' },
  valor: { badge: 'bg-pink/20 text-pink-l', text: 'text-pink-l' },
};

export function TableAnatomy({
  nombre,
  columnas,
  filas,
  campo,
  registro,
  partes,
}: {
  nombre: string;
  columnas: string[];
  filas: string[][];
  campo: number;
  registro: number;
  partes: { parte: Part; nombre: string; texto: string }[];
}) {
  // Parte resaltada: null muestra campo, registro y valor a la vez
  const [active, setActive] = useState<Part | null>(null);
  const show = (part: Part) => active === null || active === part;
  const valor = filas[registro]?.[campo];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <figure
        className={`card flex flex-col gap-4 p-5 transition ${active === 'tabla' ? 'ring-2 ring-amber/60' : ''}`}
        aria-label={`Tabla ${nombre}: el campo ${columnas[campo]}, el registro ${registro + 1} y el valor ${valor}.`}
      >
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-amber/45 px-2.5 py-0.5 text-xs font-semibold text-amber-l">TABLA</span>
          <span className="font-mono text-lg">{nombre}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-sm">
            <thead>
              <tr>
                {columnas.map((column, c) => (
                  <th
                    key={column}
                    className={`px-3 py-2 text-left text-xs font-medium transition ${c === campo && show('campo') ? 'bg-cyan/15 text-cyan-l' : 'text-text-3'}`}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((row, r) => (
                <tr key={r} className={`border-t border-white/5 transition ${r === registro && show('registro') ? 'bg-violet/15' : ''}`}>
                  {row.map((cell, c) => {
                    const isValue = r === registro && c === campo && show('valor');
                    const isField = c === campo && show('campo');
                    return (
                      <td
                        key={c}
                        className={`px-3 py-2.5 transition ${isValue ? 'outline-2 -outline-offset-2 outline-pink bg-pink/20 text-pink-l' : isField ? 'bg-cyan/10' : ''}`}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="flex gap-4 text-xs text-text-2">
          {(['campo', 'registro', 'valor'] as const).map((part) => (
            <li key={part} className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-sm ${PART_STYLES[part].badge}`} /> {part}
            </li>
          ))}
        </ul>
      </figure>

      <ol className="flex flex-col gap-2" onMouseLeave={() => setActive(null)}>
        {partes.map((part, index) => (
          <li key={part.parte}>
            <button
              type="button"
              aria-pressed={active === part.parte}
              onMouseEnter={() => setActive(part.parte)}
              onFocus={() => setActive(part.parte)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(active === part.parte ? null : part.parte)}
              className={`flex w-full items-start gap-3 rounded-[14px] p-3 text-left transition hover:bg-white/5 ${active === part.parte ? 'bg-white/5' : ''}`}
            >
              <span className={`grid size-7 shrink-0 place-items-center rounded-md font-mono text-sm font-bold ${PART_STYLES[part.parte].badge}`}>
                {index + 1}
              </span>
              <span>
                <span className={`block font-bold ${PART_STYLES[part.parte].text}`}>{part.nombre}</span>
                <span className="text-sm text-text-2">{part.texto}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function DataTypes({ tipos }: { tipos: { tipo: string; descripcion: string; ejemplo: string }[] }) {
  return (
    <ul className="grid max-w-3xl gap-2">
      {tipos.map((item, index) => (
        <li key={item.tipo} className="card grid grid-cols-[7rem_1fr] items-center gap-3 px-4 py-3 sm:grid-cols-[7rem_1fr_auto]">
          <span className={`font-mono font-bold ${ACCENTS[ACCENT_ORDER[index % ACCENT_ORDER.length]!].text}`}>{item.tipo}</span>
          <span className="font-semibold">{item.descripcion}</span>
          <code className="col-span-2 font-mono text-sm text-text-2 sm:col-span-1">{item.ejemplo}</code>
        </li>
      ))}
    </ul>
  );
}

interface KeyTable {
  nombre: string;
  pk: string;
  campos: string[];
  fk?: string;
}

export function KeysDiagram({
  padre,
  hija,
  relacion,
  pk,
  fk,
  analogia,
}: {
  padre: KeyTable;
  hija: KeyTable;
  relacion: string;
  pk: { nombre: string; texto: string };
  fk: { nombre: string; texto: string };
  analogia: string;
}) {
  // Al pasar por la FK o la PK se resaltan ambas: así se ve qué une a las tablas
  const [linked, setLinked] = useState(false);
  const hover = { onMouseEnter: () => setLinked(true), onMouseLeave: () => setLinked(false), onFocus: () => setLinked(true), onBlur: () => setLinked(false), tabIndex: 0 };

  return (
    <div className="card flex flex-col gap-6 p-6">
      <figure
        className="flex flex-col items-center gap-3 md:flex-row md:items-center md:justify-between"
        aria-label={`La FK ${hija.fk} de ${hija.nombre} ${relacion} la PK ${padre.pk} de ${padre.nombre}.`}
      >
        <KeyTableCard table={padre} tone="cyan" linked={linked} hover={hover} />
        <div className={`flex flex-col items-center gap-1 transition md:flex-1 md:px-4 ${linked ? 'text-green-l' : 'text-green'}`}>
          <span className="font-mono text-xs">{relacion}</span>
          <div className="hidden w-full items-center md:flex">
            <span className="size-0 border-y-[6px] border-r-[9px] border-y-transparent border-r-green" />
            <div className={`h-0 flex-1 border-t-2 border-green/70 ${linked ? 'border-green' : ''}`} />
          </div>
          <ArrowUp aria-hidden className="size-5 md:hidden" />
        </div>
        <KeyTableCard table={hija} tone="violet" linked={linked} hover={hover} />
      </figure>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="font-bold text-amber-l">{pk.nombre}</p>
          <p className="text-sm text-text-2">{pk.texto}</p>
        </div>
        <div>
          <p className="font-bold text-green-l">{fk.nombre}</p>
          <p className="text-sm text-text-2">{fk.texto}</p>
        </div>
      </div>
      <p className="text-sm text-text-2">{analogia}</p>
    </div>
  );
}

function KeyTableCard({
  table,
  tone,
  linked,
  hover,
}: {
  table: KeyTable;
  tone: 'cyan' | 'violet';
  linked: boolean;
  hover: Record<string, unknown>;
}) {
  const accent = ACCENTS[tone];
  return (
    <div className={`card w-full max-w-64 border p-3 ${accent.border}`}>
      <p className={`mb-2 px-2 font-mono font-bold ${accent.text}`}>{table.nombre}</p>
      <ul className="flex flex-col gap-1 font-mono text-sm">
        <li
          {...(table.fk ? {} : hover)}
          className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition ${table.fk ? 'bg-amber/10' : linked ? 'bg-amber/25 ring-1 ring-amber/60' : 'bg-amber/10'}`}
        >
          <span className="text-[10px] font-bold text-amber">PK</span> {table.pk}
        </li>
        {table.campos.map((campo) => (
          <li key={campo} className="px-2 py-1 pl-8 text-text-2">
            {campo}
          </li>
        ))}
        {table.fk && (
          <li {...hover} className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition ${linked ? 'bg-green/25 ring-1 ring-green/60' : 'bg-green/10'}`}>
            <span className="text-[10px] font-bold text-green">FK</span> {table.fk}
          </li>
        )}
      </ul>
    </div>
  );
}
