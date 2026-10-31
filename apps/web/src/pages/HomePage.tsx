import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router';
import { route } from '../content/route';
import { type Block, BLOCK_LABELS, type Topic } from '../content/schema';
import { ACCENTS, type Accent } from '../ui/accent';

const BLOCK_ACCENT: Record<Block, Accent> = {
  diseno: 'violet',
  estructura: 'cyan',
  crud: 'green',
  avanzadas: 'amber',
  integracion: 'pink',
};

export function HomePage() {
  const firstAvailable = route.temas.find((topic) => topic.estado === 'disponible');

  return (
    <main className="flex flex-col gap-14 py-14">
      <div className="flex flex-col gap-5">
        <p className="section-label">00 · Recorrido</p>
        <h1 className="max-w-4xl text-5xl font-bold tracking-[-0.01em] sm:text-6xl">
          Bases de datos con SQL desde <span className="text-green">cero</span>
        </h1>
        <p className="max-w-2xl text-lg text-text-2">
          Diseña, crea y consulta una base de datos MySQL real desde el navegador, con un solo caso que crece tema a tema:
          TecnoTienda.
        </p>
        {firstAvailable && (
          <Link
            to={`/temas/${firstAvailable.slug}`}
            className="btn-primary w-fit px-5 py-2.5"
          >
            Empezar el Tema {firstAvailable.numero} <ArrowRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>

      <section className="flex flex-col gap-4" aria-label="Temas del curso">
        <h2 className="text-2xl font-bold tracking-[-0.01em]">
          Un solo camino, <span className="text-cyan-l">diez temas</span>
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {route.temas.map((topic) => (
            <li key={topic.slug}>
              <TopicCard topic={topic} />
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

function TopicCard({ topic }: { topic: Topic }) {
  const accent = ACCENTS[BLOCK_ACCENT[topic.bloque]];
  const available = topic.estado === 'disponible';
  const number = topic.bloque === 'integracion' ? '★' : String(topic.numero).padStart(2, '0');

  const content = (
    <div className={`card flex h-full items-start gap-4 border p-4 transition ${available ? `${accent.border} hover:bg-white/5` : 'border-white/10 opacity-60'}`}>
      <span className={`font-mono text-2xl font-bold ${available ? accent.text : 'text-text-3'}`}>{number}</span>
      <div className="flex flex-1 flex-col gap-1">
        <p className={`text-xs font-semibold tracking-[0.18em] uppercase ${accent.text}`}>{BLOCK_LABELS[topic.bloque]}</p>
        <p className="font-bold">{topic.titulo}</p>
        <p className="font-mono text-xs text-text-2">{topic.resumen}</p>
      </div>
      {available ? (
        <ArrowRight aria-hidden className={`mt-1 size-5 ${accent.text}`} />
      ) : (
        <span className="flex items-center gap-1 text-xs text-text-3">
          <Clock aria-hidden className="size-3.5" /> Pronto
        </span>
      )}
    </div>
  );

  return available ? (
    <Link to={`/temas/${topic.slug}`} className="block h-full rounded-[18px]" aria-label={`Tema ${topic.numero}: ${topic.titulo}`}>
      {content}
    </Link>
  ) : (
    content
  );
}
