import { BrowserRouter, Link, Outlet, Route, Routes } from 'react-router';
import { HomePage } from './pages/HomePage';
import { LessonPage } from './pages/LessonPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="temas/:slug" element={<LessonPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  return (
    // La versión publicada no se muestra; queda como atributo para verificarla (y en /api/health)
    <div className="flex min-h-screen flex-col" data-version={__APP_COMMIT__} data-build-date={__APP_BUILD_DATE__}>
      <header className="sticky top-0 z-20 border-b border-white/5 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="size-8" />
            <span className="font-semibold tracking-tight">SQL desde cero</span>
          </Link>
          <Link to="/" className="text-sm text-text-2 transition hover:text-text">
            Ruta del curso
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        <Outlet />
      </div>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-8">
        <p className="border-t border-white/10 pt-4 font-mono text-xs text-text-3">
          SQL desde cero · Aprende bases de datos en el navegador
        </p>
      </footer>
    </div>
  );
}
