# SQL desde cero · App interactiva para enseñar bases de datos

App web para que un instructor del SENA enseñe bases de datos SQL a aprendices orientados a desarrollo de software. Incluye lecciones interactivas por tema, una **consola MySQL realista en el navegador**, ejercicios con validación automática y un **proyecto final CRUD** guiado (diseño → BD → API → frontend).

## Lee primero
- @docs/memoria.md — decisiones, estado y acuerdos con el instructor (léelo siempre y mantenlo al día)
- @docs/contexto-pedagogico.md — público, enfoque y metodología
- @docs/plan-implementacion.md — fases y criterios de aceptación

Consulta según la tarea:
- `docs/especificacion-app.md` — módulos y requisitos funcionales/no funcionales
- `docs/consola-sql.md` — consola SQL: motor, aislamiento, UX tipo cliente `mysql`, seguridad, validación
- `docs/temario.md` — los 10 temas con contenido, errores provocados y ejercicios (con soluciones)
- `docs/caso-base-tecnotienda.md` + `docs/sql/` — caso base, DER, planilla, schema y seed de referencia
- `docs/proyecto-final-crud.md` — alcance, API, estructura y rúbrica del proyecto final
- `docs/identidad-visual.md` — tokens de diseño (estilo neón oscuro)
- `docs/presentaciones/` — presentación PDF del Tema 1 (referencia visual)

## Stack
- **Web:** React 18 + Vite + TypeScript + Tailwind (tokens de `identidad-visual.md`), React Router, xterm.js (consola), CodeMirror 6 (editor SQL, dialecto MySQL), Mermaid y React Flow (DER), Framer Motion (animaciones didácticas).
- **API:** Node.js LTS + Fastify + TypeScript + `mysql2/promise`, WebSocket para la consola, `node-sql-parser` (dialecto MySQL) para análisis/reescritura de sentencias.
- **BD:** MySQL 8.4 LTS en Docker. Dos usos separados: `aula_app` (usuarios, progreso) y sandboxes de aprendices (`sbx_<id>_*`).
- **Proyecto final del aprendiz** (carpeta `proyecto-final/`): Node + Express + mysql2 + HTML/CSS/JS sin framework (deliberadamente simple).
- **Pruebas:** Vitest (unidad), Playwright (e2e), pruebas de integración contra MySQL real.

Si propones cambiar algo del stack, explica el motivo y regístralo en `docs/memoria.md`.

## Estructura objetivo
```
apps/web/            # frontend React
apps/api/            # backend Fastify
content/
  temas/NN-slug/     # leccion.mdx + ejercicios.yaml por tema
  errores.yaml       # catálogo de errores MySQL explicados en español
  sql/               # scripts de referencia por punto de partida (desde docs/sql)
proyecto-final/
  referencia/        # solución completa (solo instructor)
  plantilla/         # starter con TODO por etapa
infra/               # docker-compose, configuración MySQL, despliegue
docs/                # documentación de este traspaso (fuente de verdad)
```

## Comandos
_(mantener esta sección actualizada)_
- `npm install` — dependencias de todo el monorepo (workspaces `apps/api`, `apps/web`)
- `npm run dev:web` / `npm run dev:api` — desarrollo (la web redirige `/api` a `localhost:3000`)
- `npm run typecheck` · `npm run lint` · `npm test` · `npm run build` — lo mismo que ejecuta la CI
- `docker compose up -d --build` — web + API + `mysql-app` + `mysql-sbx` (requiere `.env`, ver `.env.example`, y la red externa `proxy`)
- `npm run test:ejercicios` — _(pendiente, Etapa 3)_ ejecuta todas las soluciones de `content/` contra MySQL

## Despliegue
- Push a `main` → GitHub Actions (`.github/workflows/deploy.yml`) verifica y despliega en el VPS → https://sql.smarteksoft.com. El pie de página muestra el commit publicado.
- En el VPS: `/opt/apps/tutorialbd`, `scripts/deploy.sh` (comando forzado de la llave de Actions), bloque de Caddy en `infra/caddy/`.

## Reglas del proyecto
1. **Idioma:** interfaz, contenido, mensajes de error y commits en español de Colombia. Código de `apps/` con identificadores en inglés y comentarios en español; código de `proyecto-final/` con identificadores y comentarios en español (es material de aprendizaje).
2. **Contenido pedagógico:** no inventes temas, ejercicios ni cambies el caso base o el enfoque sin aprobación del instructor. Implementa lo que dice `docs/temario.md`. Si detectas un error (SQL que no corre, dato inconsistente), corrígelo y déjalo anotado en `docs/memoria.md`.
3. **Contenido separado del código:** lecciones y ejercicios viven en `content/`, nunca incrustados en componentes.
4. **Seguridad SQL:** toda consulta con datos de usuario va **parametrizada**; nunca concatenar. La consola de aprendices nunca usa `root` ni el usuario de `aula_app`; cada aprendiz solo accede a sus sandboxes. Respetar la lista de bloqueos y límites de `docs/consola-sql.md`.
5. **Fidelidad MySQL:** los mensajes de la consola deben verse como los del cliente `mysql` (formato de tabla, `Query OK`, `ERROR 1062 (23000): …`). Los ejercicios se validan ejecutando la solución en el mismo motor, nunca con resultados escritos a mano.
6. **Diseño:** usa siempre los tokens de `docs/identidad-visual.md`; diagramas en SVG/HTML propios; nada de texto con degradado; máximo ~60 palabras de texto corrido por bloque de lección.
7. **Datos personales mínimos** de aprendices; contraseñas con hash.
8. **Trabajo por fases:** sigue `docs/plan-implementacion.md`. Al cerrar cada fase, verifica sus criterios de aceptación, actualiza `docs/memoria.md` y resume lo hecho para que el instructor lo revise antes de seguir.

## Definición de terminado (cada tarea)
- Compila sin errores de tipos; lint limpio.
- Pruebas relevantes escritas y pasando (incluida la validación de ejercicios afectados).
- Revisado visualmente en el navegador (capturas con Playwright cuando sea UI).
- `docs/memoria.md` actualizado si hubo decisiones.
