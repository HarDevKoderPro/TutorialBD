import websocket from '@fastify/websocket';
import type { FastifyInstance } from 'fastify';
import { deriveSandbox, type SandboxManager } from './sandbox.js';
import { ConsoleSession } from './session.js';

export interface ConsoleDeps {
  manager: SandboxManager;
  secret: string;
}

// WebSocket de la consola: una conexión MySQL dedicada por pestaña (conserva USE, variables y transacciones).
// El sandbox pertenece al usuario con sesión: lo encuentra desde cualquier navegador.
export async function registerConsole(app: FastifyInstance, deps: ConsoleDeps): Promise<void> {
  await app.register(websocket, { options: { maxPayload: 256 * 1024 } });

  app.get(
    '/ws/console',
    {
      websocket: true,
      // Antes de aceptar la conexión: sin sesión no hay consola
      preValidation: async (request, reply) => {
        if (!request.user) await reply.code(401).send({ error: 'Debes ingresar para usar la consola.' });
      },
    },
    (socket, request) => {
      const user = request.user!;
      const session = new ConsoleSession(socket, deps.manager, deriveSandbox(`user:${user.id}`, deps.secret), request.log);
      // Los mensajes se procesan en orden, uno a la vez; la cancelación (Ctrl+C) no hace fila
      let queue = session.start();
      socket.on('message', (data) => {
        const text = data.toString();
        if (/^\{"type":"cancel"/.test(text)) void session.handle(text);
        else queue = queue.then(() => session.handle(text));
      });
      socket.on('close', () => {
        void queue.then(() => session.close());
      });
    },
  );
}
