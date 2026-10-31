import { type FormEvent, type ReactNode, useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';

type Mode = 'login' | 'register';

export function LoginPage() {
  const { user, login, register } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (user) return <Navigate to={user.role === 'docente' && from === '/' ? '/docente' : from} replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) ?? '');
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(field('username'), field('password'));
      } else {
        if (field('password') !== field('confirm')) throw new Error('Las contraseñas no coinciden.');
        await register({ code: field('code'), fullName: field('fullName'), username: field('username'), password: field('password') });
      }
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 py-16">
      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-4xl font-bold">SQL desde cero</h1>
        <p className="text-text-2">Aprende bases de datos con una consola MySQL real, desde el navegador.</p>
      </div>

      <div className="card flex flex-col gap-5 p-6">
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-line p-1" role="tablist">
          <Tab active={mode === 'login'} onClick={() => setMode('login')} icon={<LogIn aria-hidden className="size-4" />}>
            Ingresar
          </Tab>
          <Tab active={mode === 'register'} onClick={() => setMode('register')} icon={<UserPlus aria-hidden className="size-4" />}>
            Soy nuevo
          </Tab>
        </div>

        <form className="flex flex-col gap-4" onSubmit={submit} key={mode}>
          {mode === 'register' && (
            <>
              <Field name="code" label="Código del grupo" hint="Te lo da tu docente (6 caracteres)" autoComplete="off" maxLength={6} upper />
              <Field name="fullName" label="Nombre completo" autoComplete="name" />
            </>
          )}
          <Field name="username" label="Usuario" hint={mode === 'register' ? 'Con él ingresas siempre (letras, números, punto o guion)' : undefined} autoComplete="username" />
          <Field name="password" label="Contraseña" type="password" hint={mode === 'register' ? 'Mínimo 8 caracteres' : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          {mode === 'register' && <Field name="confirm" label="Repite la contraseña" type="password" autoComplete="new-password" />}

          {error && (
            <p role="alert" className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral-l">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary justify-center px-4 py-2.5">
            {busy ? 'Un momento…' : mode === 'login' ? 'Ingresar' : 'Crear mi cuenta'}
          </button>
        </form>
      </div>
    </main>
  );
}

function Tab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
        active ? 'bg-line text-cyan' : 'text-text-2 hover:text-text'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Field({
  name,
  label,
  hint,
  type = 'text',
  autoComplete,
  maxLength,
  upper = false,
}: {
  name: string;
  label: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
  maxLength?: number;
  upper?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={`rounded-lg border border-line bg-bg-elev px-3 py-2.5 outline-none focus:border-cyan ${upper ? 'font-mono tracking-[0.3em] uppercase' : ''}`}
      />
      {hint && <span className="text-xs text-text-3">{hint}</span>}
    </label>
  );
}
