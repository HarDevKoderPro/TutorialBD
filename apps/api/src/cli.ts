import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { hashPassword } from './auth/passwords.js';
import { loadConfig } from './config.js';
import { createPool } from './db.js';
import { migrate } from './db/migrations.js';
import { Store } from './db/store.js';

// Herramientas de administración. Uso dentro del contenedor:
//   docker compose exec api node dist/cli.js crear-docente

const [command] = process.argv.slice(2);

if (command !== 'crear-docente') {
  console.log('Uso: node dist/cli.js crear-docente');
  process.exit(1);
}

// Salida que se puede silenciar para no mostrar la contraseña mientras se escribe
let muted = false;
const output = new Writable({
  write(chunk, _encoding, done) {
    if (!muted) process.stdout.write(chunk);
    done();
  },
});
const rl = createInterface({ input: process.stdin, output, terminal: true });

const askHidden = async (question: string) => {
  process.stdout.write(question);
  muted = true;
  const answer = await rl.question('');
  muted = false;
  process.stdout.write('\n');
  return answer;
};

const pool = createPool(loadConfig().appDb, 2);
try {
  await migrate(pool);
  const store = new Store(pool);

  const fullName = (await rl.question('Nombre completo del docente: ')).trim();
  const username = (await rl.question('Usuario para ingresar: ')).trim().toLowerCase();
  const password = await askHidden('Contraseña (mínimo 8 caracteres, no se muestra): ');
  const confirm = await askHidden('Repite la contraseña: ');

  if (fullName.length < 3) throw new Error('Escribe el nombre completo.');
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new Error('Usuario no válido: de 3 a 30 letras, números, punto o guiones.');
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  if (password !== confirm) throw new Error('Las contraseñas no coinciden.');
  if (await store.usernameExists(username)) throw new Error('Ese usuario ya existe.');

  await store.createUser({ username, fullName, role: 'docente', passwordHash: await hashPassword(password), groupId: null });
  console.log(`Docente «${username}» creado. Ya puede ingresar en la app.`);
} catch (error) {
  console.error(`No se creó el docente: ${(error as Error).message}`);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
