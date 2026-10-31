import Fastify, { type FastifyInstance } from 'fastify';

export type ServiceStatus = 'ok' | 'error';

export interface AppDeps {
  commit: string;
  buildDate: string;
  // Verifica cada base de datos; se inyecta para poder probar sin MySQL
  checkDatabases: () => Promise<{ app: ServiceStatus; sandbox: ServiceStatus }>;
  logger?: boolean;
}

export function buildApp(deps: AppDeps): FastifyInstance {
  const app = Fastify({ logger: deps.logger ?? false });

  // Estado del servicio: lo usan el despliegue (verificación) y el pie de página de la web
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

  return app;
}
