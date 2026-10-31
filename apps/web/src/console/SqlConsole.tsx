import { useEffect, useRef, useState } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { Eraser, Lightbulb, PlugZap, RotateCcw, TriangleAlert } from 'lucide-react';
import { explainError } from '../content/errors';
import { ConsoleController, type ConsoleStatus } from './ConsoleController';
import { useRegisterConsole } from './ConsoleContext';

const STATUS_LABEL: Record<ConsoleStatus, { text: string; dot: string }> = {
  connecting: { text: 'Conectando…', dot: 'bg-amber' },
  ready: { text: 'Conectado', dot: 'bg-green' },
  closed: { text: 'Desconectado', dot: 'bg-coral' },
};

// Consola MySQL en el navegador (docs/consola-sql.md): terminal + tarjeta que explica el último error
export function SqlConsole({ height = 420 }: { height?: number }) {
  const container = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ConsoleController | null>(null);
  const [status, setStatus] = useState<ConsoleStatus>('connecting');
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const register = useRegisterConsole();

  useEffect(() => {
    if (!container.current) return;
    const term = new Terminal({
      fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', 'DejaVu Sans Mono', monospace",
      fontSize: 14,
      lineHeight: 1.25,
      cursorBlink: true,
      cursorStyle: 'bar',
      cursorWidth: 2,
      cursorInactiveStyle: 'none',
      scrollback: 3000,
      theme: {
        background: '#050915',
        foreground: '#eef2ff',
        cursor: '#22d3ee',
        cursorAccent: '#050915',
        selectionBackground: 'rgba(167, 139, 250, 0.35)',
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container.current);
    fit.fit();

    const resize = new ResizeObserver(() => fit.fit());
    resize.observe(container.current);

    const instance = new ConsoleController(term, { onStatus: setStatus, onError: setErrorCode });
    instance.connect();
    controllerRef.current = instance;
    const unregister = register?.(instance);

    return () => {
      unregister?.();
      resize.disconnect();
      instance.dispose();
      controllerRef.current = null;
      term.dispose();
    };
  }, [register]);

  const explanation = explainError(errorCode);
  const label = STATUS_LABEL[status];

  return (
    <div className="flex flex-col gap-3" data-console>
      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-bg-code">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="tracking-[0.2em] text-cyan uppercase">Consola MySQL</span>
            <span className="flex items-center gap-1.5 text-text-2">
              <span className={`size-2 rounded-full ${label.dot}`} /> {label.text}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {status === 'closed' && (
              <ToolbarButton onClick={() => controllerRef.current?.connect()} icon={PlugZap} label="Reconectar" />
            )}
            <ToolbarButton onClick={() => controllerRef.current?.clearScreen()} icon={Eraser} label="Limpiar pantalla" />
            {confirmReset ? (
              <span className="flex items-center gap-1 rounded-md bg-coral/10 px-2 py-1 text-coral-l">
                ¿Borrar todas tus tablas?
                <button
                  type="button"
                  className="rounded px-1.5 font-semibold hover:bg-coral/20"
                  onClick={() => {
                    controllerRef.current?.reset();
                    setConfirmReset(false);
                  }}
                >
                  Sí, reiniciar
                </button>
                <button type="button" className="rounded px-1.5 hover:bg-white/10" onClick={() => setConfirmReset(false)}>
                  Cancelar
                </button>
              </span>
            ) : (
              <ToolbarButton onClick={() => setConfirmReset(true)} icon={RotateCcw} label="Reiniciar base" disabled={status !== 'ready'} />
            )}
          </div>
        </div>
        {/* El margen va en el contenedor externo: FitAddon mide el alto del interno sin padding */}
        <div className="px-3 py-2">
          <div ref={container} style={{ height }} />
        </div>
      </div>

      {explanation && (
        <div className="card flex items-start gap-4 border border-coral/40 px-5 py-4" role="status">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-coral/15 text-coral-l">
            <TriangleAlert aria-hidden className="size-5" />
          </span>
          <div className="flex flex-col gap-1.5 text-sm">
            <p className="font-semibold text-coral-l">
              <span className="font-mono">ERROR {errorCode}</span> · {explanation.titulo}
            </p>
            <p className="text-text-2">{explanation.que_paso}</p>
            <p className="flex items-start gap-2 text-text">
              <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-amber" /> {explanation.como_corregir}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  icon: Icon,
  label,
  disabled = false,
}: {
  onClick: () => void;
  icon: typeof Eraser;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-text-2 transition hover:bg-white/5 hover:text-text disabled:opacity-40"
    >
      <Icon aria-hidden className="size-3.5" /> {label}
    </button>
  );
}
