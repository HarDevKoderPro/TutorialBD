import { useEffect, useRef, useState } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { ConsoleProvider } from '../console/ConsoleContext';
import { findTopic, type Lesson, loadLesson, nextTopic } from '../content/route';
import { BLOCK_LABELS } from '../content/schema';
import { mdxComponents } from '../lesson/mdxComponents';
import { NotFoundPage } from './NotFoundPage';

export function LessonPage() {
  const { slug = '' } = useParams();
  const topic = findTopic(slug);
  // Lección cargada junto con su slug: si el slug cambió, se considera "cargando"
  const [loaded, setLoaded] = useState<{ slug: string; lesson: Lesson | undefined } | null>(null);
  const lesson = loaded?.slug === slug ? loaded.lesson : null;

  useEffect(() => {
    let active = true;
    loadLesson(slug).then((result) => active && setLoaded({ slug, lesson: result }));
    return () => {
      active = false;
    };
  }, [slug]);

  if (!topic || topic.estado !== 'disponible' || lesson === undefined) return <NotFoundPage />;
  if (lesson === null) return <p className="py-20 text-text-2">Cargando lección…</p>;

  const { Content, frontmatter } = lesson;
  const next = nextTopic(slug);

  return (
    <main className="grid gap-10 py-10 lg:grid-cols-[13rem_1fr]">
      <SectionNav key={slug} />

      <article className="min-w-0">
        <Link to="/" className="mb-8 flex w-fit items-center gap-2 text-sm text-text-2 transition hover:text-text">
          <ArrowLeft aria-hidden className="size-4" /> Ruta del curso
        </Link>

        <header className="flex flex-col gap-4 pb-6">
          <p className="section-label">
            Tema {String(frontmatter.numero).padStart(2, '0')} · {BLOCK_LABELS[topic.bloque]}
          </p>
          <h1 className="text-5xl font-black tracking-[-0.02em] sm:text-6xl">{frontmatter.titulo}</h1>
          <p className="max-w-2xl text-lg text-text-2">{frontmatter.resumen}</p>
          <ul className="flex flex-wrap gap-2">
            {frontmatter.temas.map((item) => (
              <li key={item} className="rounded-full border border-white/15 px-3 py-1 text-sm text-text-2">
                {item}
              </li>
            ))}
          </ul>
        </header>

        <div data-lesson-content>
          <ConsoleProvider>
            <MDXProvider components={mdxComponents}>
              <Content />
            </MDXProvider>
          </ConsoleProvider>
        </div>

        {next && (
          <footer className="mt-6 flex justify-end border-t border-white/5 pt-8">
            {next.estado === 'disponible' ? (
              <Link to={`/temas/${next.slug}`} className="flex items-center gap-2 font-semibold text-cyan-l hover:underline">
                Siguiente: Tema {next.numero} · {next.titulo} <ArrowRight aria-hidden className="size-4" />
              </Link>
            ) : (
              <p className="flex items-center gap-2 text-sm text-text-3">
                <Clock aria-hidden className="size-4" /> Siguiente: Tema {next.numero} · {next.titulo} (pronto)
              </p>
            )}
          </footer>
        )}
      </article>
    </main>
  );
}

// Índice lateral: lee las secciones del contenido renderizado y resalta la que está en pantalla
function SectionNav() {
  const [sections, setSections] = useState<{ id: string; label: string }[]>([]);
  const [current, setCurrent] = useState<string>('');
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const collect = () => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-lesson-content] [data-section]'));
      if (elements.length === 0) return false;
      setSections(elements.map((element) => ({ id: element.id, label: element.dataset.section ?? element.id })));
      observer.current = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((entry) => entry.isIntersecting);
          if (visible[0]) setCurrent(visible[0].target.id);
        },
        { rootMargin: '-30% 0px -60% 0px' },
      );
      elements.forEach((element) => observer.current?.observe(element));
      return true;
    };
    // El contenido MDX se monta después de cargar; reintentar hasta encontrarlo
    const timer = setInterval(() => collect() && clearInterval(timer), 100);
    return () => {
      clearInterval(timer);
      observer.current?.disconnect();
    };
  }, []);

  return (
    <nav aria-label="Secciones de la lección" className="hidden lg:block">
      <ol className="sticky top-24 flex flex-col gap-1 border-l border-white/10">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`-ml-px flex gap-2 border-l-2 py-1.5 pl-4 text-sm transition ${
                current === section.id ? 'border-cyan text-cyan-l' : 'border-transparent text-text-3 hover:text-text-2'
              }`}
            >
              <span className="font-mono">{String(index + 1).padStart(2, '0')}</span>
              {section.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
