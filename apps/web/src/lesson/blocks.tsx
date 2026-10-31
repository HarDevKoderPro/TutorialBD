import { Children, isValidElement, type ReactElement, type ReactNode, useState } from 'react';
import { Check, ChevronRight, Clock, Copy, Lock, TriangleAlert } from 'lucide-react';
import { ACCENTS, type Accent } from '../ui/accent';
import { highlightSql, type TokenKind } from './highlightSql';

// Bloques reutilizables de las lecciones (se usan desde content/temas/*/leccion.mdx)

export function Section({ id, etiqueta, titulo, children }: { id: string; etiqueta: string; titulo: ReactNode; children: ReactNode }) {
  return (
    <section id={id} data-section={etiqueta} className="flex scroll-mt-24 flex-col gap-6 border-t border-white/5 py-14 first:border-t-0 first:pt-4 [&>p]:text-lg [&>p]:text-text-2">
      <p className="section-label">{etiqueta}</p>
      <h2 className="text-3xl font-black tracking-[-0.02em] sm:text-4xl">{titulo}</h2>
      {children}
    </section>
  );
}

export function Highlight({ color = 'cyan', children }: { color?: Accent; children: ReactNode }) {
  return <span className={ACCENTS[color].text}>{children}</span>;
}

export function Paragraph({ children }: { children?: ReactNode }) {
  return <p className="max-w-3xl leading-relaxed">{children}</p>;
}

export function InlineCode({ children }: { children?: ReactNode }) {
  return <code className="rounded-md bg-white/8 px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-l">{children}</code>;
}

export function Steps({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
      {items.map((child, index) => (
        <div key={index} className="contents">
          {index > 0 && <ChevronRight aria-hidden className="mx-auto size-6 shrink-0 rotate-90 text-text-3 lg:rotate-0" />}
          {child}
        </div>
      ))}
    </div>
  );
}

export function Step({ etiqueta, color = 'cyan', muestra, children }: { etiqueta: string; color?: Accent; muestra: string; children: ReactNode }) {
  const accent = ACCENTS[color];
  const isShort = muestra.length <= 14;
  return (
    <div className={`card flex flex-1 flex-col gap-3 border p-5 ${accent.border}`}>
      <p className={`text-xs font-semibold tracking-[0.2em] uppercase ${accent.text}`}>{etiqueta}</p>
      <p className={isShort ? 'font-mono text-2xl font-semibold' : 'text-lg font-bold leading-snug'}>{muestra}</p>
      <div className="text-sm text-text-2">{children}</div>
    </div>
  );
}

export function Examples({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-[0.2em] text-text-3 uppercase">{titulo}</p>
      <ul className="grid gap-3 sm:grid-cols-3">{children}</ul>
    </div>
  );
}

export function Example({ nombre, detalle }: { nombre: string; detalle: string }) {
  return (
    <li className="card px-4 py-3">
      <p className="font-semibold">{nombre}</p>
      <p className="font-mono text-xs text-text-2">{detalle}</p>
    </li>
  );
}

const NOTE_STYLES = {
  clave: { icon: Lock, accent: ACCENTS.coral },
  error: { icon: TriangleAlert, accent: ACCENTS.coral },
  info: { icon: Check, accent: ACCENTS.cyan },
} as const;

export function Note({ tipo = 'info', titulo, children }: { tipo?: keyof typeof NOTE_STYLES; titulo?: string; children: ReactNode }) {
  const { icon: Icon, accent } = NOTE_STYLES[tipo];
  return (
    <div className={`card flex max-w-3xl items-start gap-4 border px-5 py-4 ${accent.border}`}>
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${accent.bg} ${accent.text}`}>
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="flex flex-col gap-1 text-text-2 [&_strong]:text-coral-l">
        {titulo && <p className={`font-semibold ${accent.text}`}>{titulo}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function Chips({ etiqueta, items, destacado, nota }: { etiqueta: string; items: string[]; destacado?: string; nota?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-[0.2em] text-text-3 uppercase">{etiqueta}</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className={`rounded-full border px-3 py-1 text-sm ${item === destacado ? 'border-green/45 text-green-l' : 'border-white/15 text-text-2'}`}
          >
            {item}
            {item === destacado && nota && <span className="ml-1.5 text-xs">✓ {nota}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ComingSoon({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-w-3xl items-center gap-3 rounded-[18px] border border-dashed border-amber/40 px-5 py-4 text-amber-l">
      <Clock aria-hidden className="size-5 shrink-0" />
      <div className="text-sm">{children}</div>
    </div>
  );
}

const TOKEN_CLASSES: Record<TokenKind, string> = {
  keyword: 'text-violet-l',
  type: 'text-amber-l',
  constraint: 'text-green-l',
  string: 'text-pink-l',
  number: 'text-cyan-l',
  comment: 'text-text-3',
  plain: 'text-text',
};

// Bloque de código de la lección: ```sql ... ``` en el MDX
export function CodeBlock({ children }: { children?: ReactNode }) {
  const code = isValidElement(children) ? (children as ReactElement<{ children?: string; className?: string }>) : null;
  const source = (code?.props.children ?? '').replace(/\n$/, '');
  const language = code?.props.className?.replace('language-', '') ?? '';
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-3xl overflow-hidden rounded-[18px] border border-white/10 bg-bg-code">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-xs tracking-[0.2em] text-cyan uppercase">{language || 'código'}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-text-2 transition hover:bg-white/5 hover:text-text"
        >
          {copied ? <Check aria-hidden className="size-3.5 text-green" /> : <Copy aria-hidden className="size-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
        <code>
          {language === 'sql'
            ? highlightSql(source).map((token, index) => (
                <span key={index} className={TOKEN_CLASSES[token.kind]}>
                  {token.text}
                </span>
              ))
            : source}
        </code>
      </pre>
    </div>
  );
}
