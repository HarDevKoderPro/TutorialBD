import Fastify, { type FastifyInstance } from 'fastify';
import { type ConsoleDeps, registerConsole } from './console/routes.js';

export type ServiceStatus = 'ok' | 'error';

export interface AppDeps {
  commit: string;
  buildDate: string;
  // Verifica cada base de datos; se inyecta para poder probar sin MySQL
  checkDatabases: () => Promise<{ app: ServiceStatus; sandbox: ServiceStatus }>;
  console?: ConsoleDeps;
  logger?: boolean;
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({ logger: deps.logger ?? false });

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

  if (deps.console) await registerConsole(app, deps.console);

  return app;
}
