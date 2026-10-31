import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="flex flex-col items-start gap-4 py-20">
      <p className="font-mono text-sm text-coral-l">ERROR 404</p>
      <h1 className="text-4xl font-black tracking-[-0.02em]">
        Esta página <span className="text-coral-l">no existe</span>
      </h1>
      <Link to="/" className="text-cyan-l hover:underline">
        Volver a la ruta del curso
      </Link>
    </main>
  );
}
