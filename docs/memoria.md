# Memoria del proyecto

Registro vivo de decisiones, estado y acuerdos con el docente. **Claude Code debe leerlo al empezar y actualizarlo** cuando se tome una decisión, se cierre una fase o el docente apruebe/cambie algo. Formato: fecha · decisión · motivo.

## Acuerdos con el docente (planeación inicial, oct-2026)
- 2026-10-30 · Curso de bases de datos SQL para estudiantes orientados a desarrollo de software · Enfoque práctico, conceptos básicos primero.
- 2026-10-30 · Se trabaja por **temas continuos**, no por clases; el docente avanza a su ritmo.
- 2026-10-30 · Se incluyen **diseño (DER) y normalización (hasta 3FN)** antes del SQL, sobre el mismo caso.
- 2026-10-30 · Caso base único **TecnoTienda** (categorías, productos, clientes, pedidos, detalle_pedido); caso de transferencia **Biblioteca**.
- 2026-10-30 · Motor y sintaxis: **MySQL** (en la app, MySQL 8 real para conservar códigos de error).
- 2026-10-30 · Notación del DER: **pata de gallo**; Chen solo como referencia.
- 2026-10-30 · Metodología: predice → ejecuta → explica, errores provocados, script acumulativo, ejercicios en 3 niveles.
- 2026-10-30 · El contenido se construye **tema por tema y el docente aprueba cada uno** antes de continuar.
- 2026-10-30 · Requisito: los estudiantes **no instalan nada**; todo desde el navegador.
- 2026-10-31 · **La app es un producto propio y de uso general, sin vínculo con el SENA**: no se menciona el SENA en la interfaz ni en el contenido · Decisión del autor. Vocabulario general: *docente, estudiante, grupo, aula, entregable* (reemplaza instructor, aprendiz, ficha, ambiente, evidencia).
- 2026-10-30 · La app debe incluir una **consola para practicar SQL como en un entorno real** y terminar con un **proyecto CRUD completo** desde el diseño hasta el frontend.

## Estado de las etapas
| Etapa | Estado |
|---|---|
| 0 · Base y despliegue continuo | **Cerrada 2026-10-31**: push a `main` → CI → despliegue en https://sql.smarteksoft.com verificado de punta a punta (run 41174860351) |
| 1 · Tema 1 | En curso: 1.1 ruta + lección interactiva (publicada) · 1.2 consola (aprobada) · 1.3 ejercicios (publicados) · 1.4 ingreso por grupo y panel docente (publicado, pendiente de prueba del docente) |

## Estado del contenido
| Tema | Estado |
|---|---|
| 1 · Conceptos básicos | Desarrollado y maquetado en PDF (`presentaciones/`); pendiente aprobación final del docente |
| 2–10 | Propuesta en `temario.md`; **pendiente de aprobación tema por tema** |
| Proyecto final | Propuesta en `proyecto-final-crud.md`; pendiente de aprobación |

> Regla: no reescribir el enfoque pedagógico ni cambiar el caso base sin consultarlo con el docente. Ajustes de redacción, corrección de errores y detalles técnicos sí se pueden hacer, dejando nota aquí.

## Preferencias del docente
- 2026-10-31 · **Tema visual de PIA** (paleta Night Owl, Open Sans, fondo oscuro liso, acentos turquesa/menta y verde) para mejorar la visibilidad y la comodidad visual; reemplaza el estilo neón de cuadrícula. Ver `identidad-visual.md`. Diagramas antes que texto largo.
- Quiere reutilizar esa misma estructura y estética en todo el material.
- Respuestas y contenidos en español.

## Decisiones técnicas
- 2026-10-31 · **Plan reorganizado en etapas** (`plan-implementacion.md`): etapas en el orden de los temas (2–3 antes que 4); cada tema se habilita al terminarse y aprobarse, sin fechas ligadas a clases · El tutorial se consume por temas; el plan original ponía DER/normalización después de los temas 7–9.
- 2026-10-31 · **Despliegue en el VPS Contabo del docente**, en https://sql.smarteksoft.com, siguiendo su patrón de proyectos: `/opt/apps/tutorialbd` (clon de `main`), Caddy compartido en `/opt/caddy` con la red externa `proxy`, `scripts/deploy.sh` como comando forzado de una llave SSH dedicada, verificación del commit publicado y rollback automático · Consistencia con los demás proyectos del VPS.
- 2026-10-31 · **CI antes de desplegar**: GitHub Actions ejecuta tipos, lint, pruebas y build; solo si pasan se despliega. Las imágenes se construyen en el VPS (como los demás proyectos) · El VPS tiene 8 vCPU / 23 GB.
- 2026-10-31 · **Dos MySQL 8.4 separados**: `mysql-app` (`aula_app`) y `mysql-sbx` (sandboxes) en red interna, con límites de memoria/CPU (sandbox: 2 GB / 2 CPU) · Un estudiante no puede afectar los datos de la app ni a los otros proyectos del VPS. La API usa `sbx_admin` (sin acceso root) para aprovisionar.
- 2026-10-31 · **El Tema 1 no necesita el mapeo de nombres**: cada estudiante tiene una base `practica` propia y abre la consola ya dentro de ella (resuelve el `ERROR 1046` del ejemplo del Tema 1). El mapeo se implementa en la Etapa 3, antes del Tema 4 · Aun con RAM suficiente para un contenedor por estudiante, se prefiere el mapeo porque controlar Docker desde la API equivale a darle root.
- 2026-10-31 · **Contenido en MDX con componentes en español**: las lecciones (`content/temas/*/leccion.mdx`) usan etiquetas como `<Seccion>`, `<AnatomiaTabla>`, `<DiagramaClaves>` que la app mapea a sus componentes (`apps/web/src/lesson/mdxComponents.tsx`); los datos de cada diagrama van como props en el MDX. La ruta vive en `content/ruta.yaml` y se valida con zod · Contenido editable sin tocar código.
- 2026-10-31 · **Consola v0 con sesión anónima por navegador**: un UUID en localStorage deriva (con `SBX_SESSION_SECRET`) el usuario MySQL `u_<id>` y la base `sbx_<id>_practica`; el estudiante solo tiene privilegios de datos/DDL sobre esa base. Al llegar el ingreso por grupo (1.4) el sandbox se asociará al estudiante · Permite usar la consola desde ya sin cuentas.
- 2026-10-31 · **Cuentas y grupos**: el docente se crea por CLI en el VPS; crea grupos con código de 6 caracteres; el estudiante se registra con código, nombre, usuario y contraseña (sin correo ni documento: datos mínimos). Contraseñas con scrypt (incluido en Node, sin dependencias nativas; equivalente a argon2/bcrypt). Sesión con cookie httpOnly de 30 días. Toda la app (salvo /ingresar) requiere sesión. El sandbox de la consola pasa a ser de la cuenta (`user:<id>`), no del navegador · Spec §1 y criterio de la Fase 1.
- 2026-10-31 · **Tareas calificables** (pedido del docente): los ejercicios de cada tema quedan como **ejemplos sin nota** (con pistas y solución) y se agregan **ejercicios propuestos calificables** en `content/temas/<slug>/tareas.yaml` (IDs `T<n>-P<nivel><n>`). Nota 0,0–5,0; **dos entregas por tarea, cuenta la mejor**; la solución aparece al agotar las entregas. Respuesta corta: proporción de aciertos × 5 con justificación automática. Abiertas: **las califica el docente** por entrega (nota + comentario) desde el panel, con cola «Calificar la siguiente»; el estudiante las ve «Por calificar» mientras tanto. **Sin IA por decisión del docente (2026-10-31)**: el módulo `apps/api/src/tasks/aiGrader.ts` queda inactivo (solo se activaría con `ANTHROPIC_API_KEY`). Las respuestas solo las lee la API. **Definitiva = promedio de las tareas calificadas** (se recalcula con cada entrega). **Asistencia** por día (presente/tarde/ausente/excusa), se muestra en %, no afecta la nota. Imagen PNG de la tabla de notas con comentario por estudiante y botón para compartir por WhatsApp (menú de compartir del sistema o descarga + WhatsApp Web) · Decisiones del docente del 2026-10-31.
- 2026-10-31 · React Router 7 (no 8: exige React 19).
- 2026-10-31 · Versiones: React 18.3, Vite 8, Tailwind 4, TypeScript 6.0 (no 7: typescript-eslint aún no lo soporta), Fastify 5, mysql2 3, Vitest 5, Node 22. Fuentes Inter y JetBrains Mono autoalojadas (`@fontsource`), sin CDN externo.

## Errores detectados en la documentación (pendientes de aprobación)
- Tema 7: `UPDATE productos SET precio = 0;` "sin safe updates" no produce el desastre esperado: `chk_productos_precio` lo rechaza con 3819. Propuesta: usar `UPDATE productos SET stock = 0;`.
- Tema 3: el caso base dice que Laura Gómez tiene 3 pedidos en la planilla, pero el CSV tiene 2; y la 3FN se explica con la descripción de la categoría, columna que la planilla no tiene. Propuesta: agregar la fila del pedido 10 y la columna `descripcion_categoria`.
- Tema 1: el primer script no tiene `USE` (daría 1046) y su `clientes` difiere de la de TecnoTienda. Resuelto por diseño: la consola del Tema 1 abre en la base `practica`.

## Contenido redactado por Claude (pendiente de aprobación del docente)
- Tema 1, `tareas.yaml`: las 5 tareas calificables (T1-PB1 a T1-PA1), sus rúbricas y respuestas de referencia.
- Tema 1, `ejercicios.yaml`: pistas de T1-B1, T1-B2 y T1-I2; respuesta de referencia de ejemplo de T1-I1 (el temario no la trae); primera frase de la referencia de T1-A1 (qué se repite y por qué es un problema); rúbricas de T1-I1 y T1-A1.
- `content/errores.yaml`: explicaciones de los 20 errores del catálogo.

## Pendientes / preguntas abiertas
- **Repositorio público**: `tareas.yaml` (con respuestas) queda visible en GitHub. Recomendado: pasar el repo a privado y dar al VPS una llave de solo lectura.
- Aislamiento de la consola: mapeo de nombres vs. contenedor por estudiante (Etapa 3).
- Repositorio `HarDevKoderPro/TutorialBD` es público: decidir si pasa a privado antes de subir `proyecto-final/referencia`.
- ¿Ambiente de pruebas separado (`sql-dev.smarteksoft.com`)?
- Copia cifrada de respaldos con rclone (remoto `tutorialbd-crypt:`).
- Limpieza automática de sandboxes sin uso (usuarios `u_*` y bases `sbx_*` de sesiones abandonadas).
- ¿El proyecto final permite dominios distintos a TecnoTienda?
- ¿Pesos de la rúbrica y relación con la calificación formal?
