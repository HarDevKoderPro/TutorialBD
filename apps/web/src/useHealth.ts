import { useEffect, useState } from 'react';

export type ServiceStatus = 'ok' | 'error';

export interface Health {
  status: 'ok' | 'degraded';
  commit: string;
  buildDate: string;
  databases: { app: ServiceStatus; sandbox: ServiceStatus };
}

// Consulta /api/health una vez; null mientras carga, 'offline' si la API no responde
export function useHealth(): Health | null | 'offline' {
  const [health, setHealth] = useState<Health | null | 'offline'>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.json() as Promise<Health>)
      .then(setHealth)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error);
          setHealth('offline');
        }
      });
    return () => controller.abort();
  }, []);

  return health;
}
