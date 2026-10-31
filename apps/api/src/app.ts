import cookie from '@fastify/cookie';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerAuth } from './auth/routes.js';
import { type ConsoleDeps, registerConsole } from './console/routes.js';
import type { Store } from './db/store.js';
import { registerGroups } from './groups/routes.js';
import { registerProgress } from './progress/routes.js';
import { registerTasks, type TasksDeps } from './tasks/routes.js';

export type ServiceStatus = 'ok' | 'error';

export interface AppDeps {
  commit: string;
  buildDate: string;
  // Verifica cada base de datos; se inyecta para poder probar sin MySQL
  checkDatabases: () => Promise<{ app: ServiceStatus; sandbox: ServiceStatus }>;
  store?: Store;
  console?: ConsoleDeps;
  tasks?: TasksDeps;
  secureCookies?: boolean;
  logger?: boolean;
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  // trustProxy: la IP real llega de Caddy (necesaria para frenar intentos de ingreso)
  const app = Fastify({ logger: deps.logger ?? false, trustProxy: true });
  await app.register(cookie);

  // Estado del servicio: lo usan el despliegue (verificación) y el monitoreo
  app.get('/api/health', async (_request, reply) => {
    const databases = await deps.checkDatabases();
    const healthy = databases.app === 'ok' && databases.sandbox === 'ok';
    reply.code(healthy ? 200 : 503);
    return {
      status: healthy ? 'ok' : 'degraded',
      commit: deps.commit,
      buildDate: deps.buildDate,
      databases,
    };
  });

  if (deps.store) {
    await registerAuth(app, deps.store, deps.secureCookies ?? false);
    registerProgress(app, deps.store);
    registerGroups(app, deps.store);
    if (deps.tasks) registerTasks(app, deps.tasks);
  }
  if (deps.console) await registerConsole(app, deps.console);

  return app;
}
