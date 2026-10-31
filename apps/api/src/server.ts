import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { SandboxManager } from './console/sandbox.js';
import { createPool, ping } from './db.js';
import { migrate } from './db/migrations.js';
import { GradesStore } from './db/gradesStore.js';
import { Store } from './db/store.js';
import { createAiGrader } from './tasks/aiGrader.js';
import { loadTasks } from './tasks/content.js';

const config = loadConfig();
const appPool = createPool(config.appDb, 10);
// sbx_admin: aprovisiona sandboxes y cancela consultas; nunca ejecuta SQL de estudiantes
const sandboxAdminPool = createPool(config.sandboxDb, 4);

await migrate(appPool, (message) => console.log(message));

const catalog = loadTasks(config.contentDir);
const aiGrader = createAiGrader(process.env.ANTHROPIC_API_KEY);
console.log(`Tareas cargadas: ${catalog.all.length} · calificación con IA: ${aiGrader ? 'activa' : 'inactiva (falta ANTHROPIC_API_KEY)'}`);

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
  tasks: { catalog, grades: new GradesStore(appPool), aiGrader },
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
