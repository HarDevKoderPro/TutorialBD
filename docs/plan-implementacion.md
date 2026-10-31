# Plan de implementación por etapas

> **Reorganizado el 2026-10-31** (ver `memoria.md`): primero una versión usable para la Clase 1 publicada en el VPS, y luego un tema por delante del grupo, en el orden del curso. El plan original por fases (0–7) quedó absorbido en estas etapas.

Cada etapa termina con algo usable, publicado en https://sql.smarteksoft.com y con sus criterios de aceptación cumplidos. Al cerrar una etapa: actualizar `docs/memoria.md` (decisiones y estado) y mostrar al instructor el resultado antes de continuar.

## Etapa 0 · Base y despliegue continuo
- Monorepo (`apps/web`, `apps/api`, `infra/`, `scripts/`), tokens de `identidad-visual.md` en Tailwind.
- `compose.yml` con web, API, `mysql-app` y `mysql-sbx` (MySQL 8.4, con límites de memoria/CPU), integrado a la estructura del VPS (`/opt/apps/tutorialbd`, Caddy, red `proxy`).
- GitHub Actions: tipos, lint, pruebas y build → despliegue por SSH con llave de comando forzado → `scripts/deploy.sh` (verificación del commit y rollback) → verificación pública.
- **Aceptación:** un push a `main` se publica solo; al refrescar la página se ve el commit nuevo en el pie; si la verificación falla, el VPS vuelve al commit anterior.

## Etapa 1 · Versión Clase 1 (Tema 1)
- Ingreso con código de ficha (aprendiz) y cuenta de instructor; ruta del curso con el Tema 1 activo.
- Cargador de contenido (`content/temas/01-.../leccion.mdx`, `ejercicios.yaml`, `content/errores.yaml`) con validación de esquema.
- Lección del Tema 1 con diagramas propios (dato/información, App→SGBD→BD, anatomía de tabla, PK/FK) y bloques predice → ejecuta → explica.
- Consola v0 (xterm.js) con formato del cliente `mysql`, una base `practica` por aprendiz, reinicio, historial, bloqueos y límites de `consola-sql.md` §6, tarjetas de error en español.
- Ejercicios T1 (selección con calificación inmediata; abiertos con rúbrica y referencia); mini-quiz (redactado y aprobado por el instructor).
- Instructor: crear ficha, ver aprendices y avance, leer respuestas abiertas, modo proyección.
- Copias de seguridad diarias de `aula_app`; prueba de carga de 35 consolas en el VPS.
- **Aceptación:** un aprendiz entra con el código de ficha, recorre la lección, ejecuta el script del Tema 1 y provoca el error 1062 con la salida idéntica al cliente `mysql`; el instructor ve su avance.

## Etapa 2 · Temas 2 y 3 (versión ligera)
- Lecciones, DER en código Mermaid con vista previa, planilla interactiva, ejercicios `manual` con rúbrica.
- **Aceptación:** el aprendiz escribe el DER de TecnoTienda y lo compara con la referencia; recorre la planilla hasta 3FN.

## Etapa 3 · Consola completa y motor de ejercicios (antes del Tema 4)
- Aislamiento con nombres lógicos ↔ físicos (`consola-sql.md` §2): prueba con 2 aprendices creando `tecnotienda` y decisión registrada (mapeo vs. contenedor por aprendiz).
- Explorador de esquema, modo editor, restaurar punto de partida, «mi script», `Ctrl+C`.
- Validadores `resultado`, `estructura`, `estado`, `error`, `manual`, con base temporal por intento.
- **Aceptación:** dos aprendices ejecutan el script completo de TecnoTienda con los mismos nombres sin interferir; `SHOW DATABASES`, `USE`, errores y `SHOW CREATE TABLE/VIEW` muestran nombres lógicos; las sentencias bloqueadas se rechazan.

## Etapa 4 · Temas 4, 5 y 6
- **Aceptación:** pruebas automáticas que ejecutan cada solución de `temario.md` y la marcan como correcta, y una variante incorrecta que se marca como incorrecta.

## Etapa 5 · Temas 7, 8 y 9
- Transacciones en la consola, diagrama de Venn con filas reales, animación de `GROUP BY`, vistas.
- **Aceptación:** igual que la Etapa 4 para estos temas.

## Etapa 6 · Tema 10 y proyecto final
- Laboratorio de inyección SQL aislado.
- `proyecto-final/referencia` (funcional, con pruebas) y `proyecto-final/plantilla` (con TODO por etapa).
- Módulo guiado del proyecto con verificación automática de las etapas 3 y 4.
- **Aceptación:** la referencia arranca con `npm install && npm start` contra el MySQL del sandbox y cumple toda la tabla de API de `proyecto-final-crud.md`; la plantilla arranca sin errores aunque falten los TODO.

## Etapa 7 · Pulido (en paralelo, sin bloquear clases)
- Editor visual de DER (React Flow) y laboratorio de normalización completo.
- Panel del instructor completo: mapa de calor, errores frecuentes, exportar CSV.
- Pruebas e2e (Playwright) del recorrido aprendiz e instructor.
- Guía de despliegue (`infra/README.md`) para otros entornos (servidor del centro, portátil en red local).
- **Aceptación:** checklist de requisitos no funcionales de `especificacion-app.md` §3.
