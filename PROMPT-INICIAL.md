# Prompt inicial para Claude Code

Copia los archivos de esta carpeta en la raíz de un repositorio nuevo (vacío), ábrelo con Claude Code y pega el siguiente mensaje:

---

Vamos a construir la app descrita en `CLAUDE.md`: una plataforma web para enseñar bases de datos SQL a aprendices del SENA, con lecciones interactivas, una consola MySQL realista en el navegador, ejercicios con validación automática y un proyecto final CRUD guiado.

1. Lee `CLAUDE.md` y todos los documentos de `docs/` (incluidos los scripts de `docs/sql/`).
2. Antes de escribir código, dame en un mensaje corto:
   - Tu entendimiento del proyecto en 5 líneas.
   - Dudas o contradicciones que encuentres en la documentación.
   - El plan concreto de la **Fase 0** (spike de la consola) según `docs/plan-implementacion.md`.
3. Espera mi aprobación y luego ejecuta la Fase 0. Al terminar, muéstrame la demostración (dos aprendices simultáneos creando `tecnotienda` con los mismos nombres), registra la decisión de aislamiento en `docs/memoria.md` y detente para que lo revise.

Reglas: trabaja fase por fase, no cambies el contenido pedagógico ni el caso base sin preguntarme y mantén `docs/memoria.md` actualizado.

---

## Sugerencias para las siguientes sesiones
- Inicia cada sesión con: «Lee `docs/memoria.md` y continúa con la siguiente fase pendiente.»
- Cuando apruebes un tema nuevo del temario, pídele: «Actualiza `docs/temario.md` con estos cambios y marca el Tema N como aprobado en `docs/memoria.md`.»
- Para revisar avances visuales: «Toma capturas con Playwright de las pantallas que cambiaste y muéstramelas.»
