import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { SandboxManager } from './console/sandbox.js';
import { createPool, ping } from './db.js';
import { migrate } from './db/migrations.js';
import { Store } from './db/store.js';

const config = loadConfig();
const appPool = createPool(config.appDb, 10);
// sbx_admin: aprovisiona sandboxes y cancela consultas; nunca ejecuta SQL de estudiantes
const sandboxAdminPool = createPool(config.sandboxDb, 4);

await migrate(appPool, (message) => console.log(message));

const app = await buildApp({
  commit: config.commit,
  buildDate: config.buildDate,
  logger: true,
  secureCookies: process.env.NODE_ENV === 'production',
  checkDatabases: async () => {
    const [appStatus, sandboxStatus] = await Promise.all([ping(appPool), ping(sandboxAdminPool)]);
    return { app: appStatus, sandbox: sandboxStatus };
  },
  store: new Store(appPool),
  console: {
    manager: new SandboxManager(sandboxAdminPool, config.sandboxDb),
    secret: config.sessionSecret,
  },
});

// Cierre ordenado al detener el contenedor
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await app.close();
    await Promise.allSettled([appPool.end(), sandboxAdminPool.end()]);
    process.exit(0);
  });
}

await app.listen({ port: config.port, host: config.host });
