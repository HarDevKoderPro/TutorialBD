import { useEffect, useState } from 'react';
import { LogOut, Presentation } from 'lucide-react';
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { HomePage } from './pages/HomePage';
import { LessonPage } from './pages/LessonPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TeacherPage } from './pages/TeacherPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="ingresar" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route index element={<HomePage />} />
              <Route path="temas/:slug" element={<LessonPage />} />
            </Route>
            <Route element={<RequireAuth role="docente" />}>
              <Route path="docente" element={<TeacherPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Sin sesión se va a /ingresar y luego vuelve a la página que pidió
function RequireAuth({ role }: { role?: 'docente' }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="py-20 text-text-2">Cargando…</p>;
  if (!user) return <Navigate to="/ingresar" replace state={{ from: location.pathname + location.hash }} />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Modo proyección: agranda toda la interfaz (y la consola) para el video beam
function useProjectionMode() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem('sql-desde-cero:proyeccion') === '1');
  useEffect(() => {
    document.documentElement.classList.toggle('projection', enabled);
    localStorage.setItem('sql-desde-cero:proyeccion', enabled ? '1' : '0');
  }, [enabled]);
  return [enabled, setEnabled] as const;
}

function Layout() {
  const { user, logout } = useAuth();
  const [projection, setProjection] = useProjectionMode();
  const navClass = ({ isActive }: { isActive: boolean }) => `text-sm transition ${isActive ? 'text-cyan' : 'text-text-2 hover:text-text'}`;

  return (
    // La versión publicada no se muestra; queda como atributo para verificarla (y en /api/health)
    <div className="flex min-h-screen flex-col" data-version={__APP_COMMIT__} data-build-date={__APP_BUILD_DATE__}>
      <header className="sticky top-0 z-20 border-b border-line/60 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="size-8" />
            <span className="font-semibold tracking-tight">SQL desde cero</span>
          </Link>
          {user && (
            <nav className="flex flex-wrap items-center gap-5">
              <NavLink to="/" end className={navClass}>
                Ruta del curso
              </NavLink>
              {user.role === 'docente' && (
                <NavLink to="/docente" className={navClass}>
                  Panel del docente
                </NavLink>
              )}
              <button
                type="button"
                onClick={() => setProjection(!projection)}
                aria-pressed={projection}
                title="Agranda la letra para proyectar"
                className={`flex items-center gap-1.5 text-sm transition ${projection ? 'text-cyan' : 'text-text-2 hover:text-text'}`}
              >
                <Presentation aria-hidden className="size-4" /> Proyección
              </button>
              <span className="text-sm text-text-3">
                {user.fullName}
                {user.groupName && ` · ${user.groupName}`}
              </span>
              <button type="button" onClick={() => void logout()} className="flex items-center gap-1.5 text-sm text-text-2 hover:text-coral-l">
                <LogOut aria-hidden className="size-4" /> Salir
              </button>
            </nav>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        <Outlet />
      </div>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-8">
        <p className="border-t border-line/60 pt-4 font-mono text-xs text-text-3">SQL desde cero · Aprende bases de datos en el navegador</p>
      </footer>
    </div>
  );
}
