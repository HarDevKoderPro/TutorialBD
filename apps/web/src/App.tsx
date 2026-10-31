import { type Health, useHealth } from './useHealth';

const BLOCKS = [
  { name: 'Diseño', topics: 'Temas 1–3', color: 'text-violet-l border-violet/40' },
  { name: 'Estructura', topics: 'Tema 4', color: 'text-cyan-l border-cyan/40' },
  { name: 'CRUD', topics: 'Temas 5–7', color: 'text-green-l border-green/40' },
  { name: 'Consultas avanzadas', topics: 'Temas 8–10', color: 'text-amber-l border-amber/40' },
];

export function App() {
  const health = useHealth();

  return (
    // La versión publicada no se muestra; queda como atributo para verificarla (y en /api/health)
    <div
      className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10"
      data-version={__APP_COMMIT__}
      data-build-date={__APP_BUILD_DATE__}
    >
      <header className="flex items-center gap-3">
        <img src="/favicon.svg" alt="" className="size-9" />
        <span className="font-semibold tracking-tight">SQL desde cero</span>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-10 py-16">
        <div className="flex flex-col gap-5">
          <p className="section-label">00 · Bienvenida</p>
          <h1 className="text-5xl font-black tracking-[-0.02em] sm:text-6xl">
            Bases de datos con SQL desde <span className="text-cyan-l">cero</span>
          </h1>
          <p className="max-w-2xl text-lg text-text-2">
            Aprende a diseñar, crear y consultar bases de datos MySQL directamente en el navegador, con
            un solo caso que crece tema a tema: TecnoTienda.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BLOCKS.map((block) => (
            <li key={block.name} className={`card border px-5 py-4 ${block.color}`}>
              <p className="font-semibold">{block.name}</p>
              <p className="text-sm text-text-2">{block.topics}</p>
            </li>
          ))}
        </ul>

        <ServiceStatus health={health} />
      </main>

      <footer className="border-t border-white/10 pt-4 font-mono text-xs text-text-3">
        SQL desde cero · Aprende bases de datos en el navegador
      </footer>
    </div>
  );
}

function ServiceStatus({ health }: { health: Health | null | 'offline' }) {
  const items =
    health && health !== 'offline'
      ? [
          { label: 'API', ok: true },
          { label: 'MySQL de la app', ok: health.databases.app === 'ok' },
          { label: 'MySQL de práctica', ok: health.databases.sandbox === 'ok' },
        ]
      : [{ label: 'API', ok: health === null ? null : false }];

  return (
    <section className="card flex flex-col gap-3 px-5 py-4" aria-live="polite">
      <p className="section-label">Estado del servidor</p>
      <ul className="flex flex-wrap gap-3 font-mono text-sm">
        {items.map((item) => (
          <li
            key={item.label}
            className={`rounded-full border px-3 py-1 ${
              item.ok === null
                ? 'border-white/15 text-text-2'
                : item.ok
                  ? 'border-green/45 text-green-l'
                  : 'border-coral/45 text-coral-l'
            }`}
          >
            {item.ok === null ? '… ' : item.ok ? '✓ ' : '✗ '}
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
