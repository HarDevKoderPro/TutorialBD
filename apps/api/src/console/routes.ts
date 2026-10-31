import websocket from '@fastify/websocket';
import type { FastifyInstance } from 'fastify';
import { deriveSandbox, type SandboxManager } from './sandbox.js';
import { ConsoleSession } from './session.js';

const SESSION_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ConsoleDeps {
  manager: SandboxManager;
  secret: string;
}

// WebSocket de la consola: una conexión MySQL dedicada por pestaña (conserva USE, variables y transacciones)
export async function registerConsole(app: FastifyInstance, deps: ConsoleDeps): Promise<void> {
  await app.register(websocket, { options: { maxPayload: 256 * 1024 } });

  app.get('/ws/console', { websocket: true }, (socket, request) => {
    const sessionKey = (request.query as { session?: string }).session ?? '';
    if (!SESSION_KEY.test(sessionKey)) {
      socket.close(1008, 'Sesión inválida');
      return;
    }

    const session = new ConsoleSession(socket, deps.manager, deriveSandbox(sessionKey, deps.secret), request.log);
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
  });
}
