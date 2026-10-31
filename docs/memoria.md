# Memoria del proyecto

Registro vivo de decisiones, estado y acuerdos con el instructor. **Claude Code debe leerlo al empezar y actualizarlo** cuando se tome una decisión, se cierre una fase o el instructor apruebe/cambie algo. Formato: fecha · decisión · motivo.

## Acuerdos con el instructor (planeación inicial, oct-2026)
- 2026-10-30 · Curso de bases de datos SQL para aprendices SENA orientados a desarrollo de software · Enfoque práctico, conceptos básicos primero.
- 2026-10-30 · Se trabaja por **temas continuos**, no por clases; el instructor avanza a su ritmo.
- 2026-10-30 · Se incluyen **diseño (DER) y normalización (hasta 3FN)** antes del SQL, sobre el mismo caso.
- 2026-10-30 · Caso base único **TecnoTienda** (categorías, productos, clientes, pedidos, detalle_pedido); caso de transferencia **Biblioteca**.
- 2026-10-30 · Motor y sintaxis: **MySQL** (en la app, MySQL 8 real para conservar códigos de error).
- 2026-10-30 · Notación del DER: **pata de gallo**; Chen solo como referencia.
- 2026-10-30 · Metodología: predice → ejecuta → explica, errores provocados, script acumulativo, ejercicios en 3 niveles.
- 2026-10-30 · El contenido se construye **tema por tema y el instructor aprueba cada uno** antes de continuar.
- 2026-10-30 · Requisito: los aprendices **no instalan nada**; todo desde el navegador.
- 2026-10-30 · La app debe incluir una **consola para practicar SQL como en un entorno real** y terminar con un **proyecto CRUD completo** desde el diseño hasta el frontend.

## Estado del contenido
| Tema | Estado |
|---|---|
| 1 · Conceptos básicos | Desarrollado y maquetado en PDF (`presentaciones/`); pendiente aprobación final del instructor |
| 2–10 | Propuesta en `temario.md`; **pendiente de aprobación tema por tema** |
| Proyecto final | Propuesta en `proyecto-final-crud.md`; pendiente de aprobación |

> Regla: no reescribir el enfoque pedagógico ni cambiar el caso base sin consultarlo con el instructor. Ajustes de redacción, corrección de errores y detalles técnicos sí se pueden hacer, dejando nota aquí.

## Preferencias del instructor
- Estilo visual oscuro de cuadrícula técnica con acentos neón (cian, violeta, rosa, ámbar, verde, coral), tipografía Inter, títulos en negrita con una palabra clave en color, diagramas antes que texto largo. Ver `identidad-visual.md`.
- Quiere reutilizar esa misma estructura y estética en todo el material.
- Respuestas y contenidos en español.

## Decisiones técnicas
_(vacío — registrar aquí la decisión de la Fase 0 sobre aislamiento de la consola y cualquier otra decisión de arquitectura)_

## Pendientes / preguntas abiertas
- Aislamiento de la consola: mapeo de nombres vs. contenedor por aprendiz (Fase 0).
- ¿Dónde se desplegará? (servidor del centro, VPS, portátil del instructor en red local).
- ¿El proyecto final permite dominios distintos a TecnoTienda?
- ¿Pesos de la rúbrica y relación con las evidencias formales?
