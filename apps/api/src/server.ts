import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool, ping } from './db.js';

const config = loadConfig();
const appPool = createPool(config.appDb, 10);
const sandboxPool = createPool(config.sandboxDb, 2);

const app = buildApp({
  commit: config.commit,
  buildDate: config.buildDate,
  logger: true,
  checkDatabases: async () => {
    const [appStatus, sandboxStatus] = await Promise.all([ping(appPool), ping(sandboxPool)]);
    return { app: appStatus, sandbox: sandboxStatus };
  },
});

// Cierre ordenado al detener el contenedor
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await app.close();
    await Promise.allSettled([appPool.end(), sandboxPool.end()]);
    process.exit(0);
  });
}

await app.listen({ port: config.port, host: config.host });
