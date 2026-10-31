# Plan de implementación por fases

Cada fase termina con algo usable y con sus criterios de aceptación cumplidos. Al cerrar una fase: actualizar `docs/memoria.md` (decisiones y estado) y mostrar al instructor el resultado antes de continuar.

## Fase 0 · Spike técnico de la consola (decisión de arquitectura)
- `docker compose` con MySQL 8.4 + API mínima + página con xterm.js.
- Probar el mapeo de nombres lógicos ↔ físicos por aprendiz (ver `consola-sql.md` §2) con 2 usuarios simultáneos creando `tecnotienda`.
- Medir RAM/CPU con 35 sesiones simuladas.
- **Aceptación:** dos aprendices ejecutan el script completo de TecnoTienda con los mismos nombres sin interferir; `SHOW DATABASES`, `USE`, errores y `SHOW CREATE TABLE` muestran nombres lógicos; decisión registrada en `memoria.md` (mapeo vs. contenedor por aprendiz).

## Fase 1 · Base del proyecto
- Monorepo (`apps/web`, `apps/api`, `content/`, `proyecto-final/`, `infra/`).
- Sistema de diseño con los tokens de `identidad-visual.md`; layout, navegación, ruta de aprendizaje.
- Autenticación simple (fichas con código de ingreso), roles aprendiz/instructor.
- Cargador de contenido (`content/temas/*/leccion.mdx`, `ejercicios.yaml`, `content/errores.yaml`) con validación de esquema.
- **Aceptación:** un aprendiz se registra con código de ficha, ve la ruta y abre una lección de ejemplo; el instructor ve la lista de su ficha.

## Fase 2 · Consola SQL completa
- Todo lo de `consola-sql.md`: terminal tipo `mysql`, explorador de esquema, modo editor, explicación de errores, restaurar punto de partida, «mi script», límites y seguridad.
- **Aceptación:** se pueden ejecutar, desde el navegador, todos los ejemplos y errores provocados de `temario.md` con salida idéntica en formato al cliente `mysql`; las sentencias bloqueadas se rechazan; `Ctrl+C` cancela una consulta larga.

## Fase 3 · Motor de ejercicios + temas SQL núcleo (1, 4, 5, 6)
- Validadores `resultado`, `estructura`, `estado`, `error`, `manual`, con base temporal por intento.
- Lecciones y ejercicios de los temas 1, 4, 5 y 6 con sus bloques interactivos.
- **Aceptación:** pruebas automáticas que ejecutan cada solución de `temario.md` y la marcan como correcta, y una variante incorrecta que se marca como incorrecta.

## Fase 4 · Temas 7, 8 y 9
- Transacciones en la consola, diagrama de Venn con filas reales, animación de `GROUP BY`, vistas.
- **Aceptación:** igual que la Fase 3 para estos temas.

## Fase 5 · Diseño: temas 2 y 3
- Editor de DER (visual + Mermaid), generación de `CREATE TABLE`, laboratorio de normalización.
- **Aceptación:** el aprendiz dibuja el DER de TecnoTienda, lo compara con la referencia y genera el DDL; completa la planilla hasta 3FN.

## Fase 6 · Tema 10 y proyecto final
- Laboratorio de inyección SQL aislado.
- `proyecto-final/referencia` (funcional, con pruebas) y `proyecto-final/plantilla` (con TODO por etapa).
- Módulo guiado del proyecto en la app con verificación automática de las etapas 3 y 4.
- **Aceptación:** la referencia arranca con `npm install && npm start` contra el MySQL del sandbox y cumple toda la tabla de API de `proyecto-final-crud.md`; la plantilla arranca sin errores aunque falten los TODO.

## Fase 7 · Panel del instructor, pulido y despliegue
- Progreso, mapa de calor, errores frecuentes, exportar CSV, modo proyección.
- Pruebas e2e (Playwright) del recorrido aprendiz e instructor; prueba de carga de 35 consolas.
- Guía de despliegue (`infra/README.md`): servidor del centro / VPS / portátil del instructor en red local; copias de seguridad.
- **Aceptación:** checklist de requisitos no funcionales de `especificacion-app.md` §3.
