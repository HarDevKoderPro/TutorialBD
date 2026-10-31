# Especificación funcional · App «SQL desde cero»

App web propia y de uso general para enseñar bases de datos SQL a personas orientadas a desarrollo de software: lecciones interactivas por tema, consola MySQL realista, ejercicios con validación automática y un proyecto final CRUD guiado.

## 1. Roles
| Rol | Puede |
|---|---|
| **Estudiante** | Seguir la ruta, usar la consola, resolver ejercicios, guardar su script, avanzar en el proyecto final. |
| **Docente** | Todo lo anterior + crear grupos, invitar estudiantes (código de grupo), ver progreso, desbloquear temas, ver/ocultar soluciones, reiniciar sandboxes, exportar reportes CSV. |

Autenticación simple: el docente crea el grupo y obtiene un **código de ingreso**; el estudiante se registra con ese código, nombre y contraseña. Sin integraciones externas en v1. Guardar el mínimo de datos personales.

## 2. Módulos

### 2.1 Ruta de aprendizaje (inicio)
- Los 10 temas + Proyecto final como camino visual continuo (bloques Diseño / Estructura / CRUD / Consultas avanzadas, con sus colores).
- Estado por tema: bloqueado (si el docente lo decide) · disponible · en curso · completado; porcentaje de ejercicios.
- «Continuar donde quedé».

### 2.2 Lección interactiva (una por tema)
Contenido en archivos (`content/temas/NN-slug/leccion.mdx`) editables sin tocar código. Bloques reutilizables:
- **Concepto** (texto corto + diagrama).
- **Predice → ejecuta → explica**: pregunta de predicción (selección o respuesta corta) → bloque SQL ejecutable en consola embebida → explicación tras ejecutar.
- **Error provocado**: SQL que falla a propósito + tarjeta explicativa.
- **Diagramas interactivos** (componentes propios, no imágenes):
  - Anatomía de tabla con hover que resalta campo / registro / valor (Tema 1).
  - Flujo App → SGBD → BD animado (Tema 1, 10).
  - DER en pata de gallo con relaciones que se leen en ambos sentidos al pasar el cursor (Tema 2).
  - Planilla → 1FN → 2FN → 3FN como animación paso a paso (Tema 3).
  - Constructor visual de `CREATE TABLE` que muestra el SQL generado (Tema 4).
  - Diagrama de Venn **con filas reales** para INNER/LEFT JOIN (Tema 8).
  - Filas que se agrupan en cajas para `GROUP BY` (Tema 9).
  - Simulación de inyección SQL mostrando la cadena SQL que se forma (Tema 10).
- **Mini-quiz** al cierre de la lección.
- Navegación por secciones con progreso; máximo ~60 palabras de texto corrido por bloque.

### 2.3 Consola SQL
Ver `consola-sql.md`. Disponible: a pantalla completa (menú principal), embebida en lecciones y en ejercicios.

### 2.4 Ejercicios
- Listado por tema y nivel (Básico verde, Intermedio ámbar, Avanzado rosa).
- Definidos en `content/temas/NN-slug/ejercicios.yaml` (id, nivel, enunciado, aviso, objetivo, tipo de validación, estado inicial, solución, verificación, pistas, rúbrica para manuales).
- Pistas graduales; la solución se muestra tras 3 intentos o si el docente lo habilita.
- Ejercicios `manual` (DER, normalización, preguntas abiertas): el estudiante entrega texto o diagrama; se muestra rúbrica y solución de referencia; el docente puede marcar revisado.

### 2.5 Editor de DER (temas 2–3 y proyecto final)
- Editor visual de entidades, atributos (PK/FK/UK) y relaciones con cardinalidad pata de gallo (p. ej. React Flow), con alternativa en código Mermaid `erDiagram` y vista previa.
- Exportar a imagen y **generar el `CREATE TABLE` sugerido** (puente al Tema 4).
- Comparación opcional con el DER de referencia (entidades y relaciones faltantes/sobrantes), como retroalimentación, no como nota.

### 2.6 Laboratorio de normalización (Tema 3)
- La planilla desordenada en una grilla; el estudiante separa celdas multivaluadas (1FN) y arrastra columnas a nuevas tablas (2FN/3FN).
- La app señala anomalías al editar (p. ej. cambiar el teléfono de Laura en una fila y no en otra).

### 2.7 Laboratorio de inyección SQL (Tema 10)
- Login vulnerable y su versión corregida, ejecutándose **solo** contra una base sandbox propia del estudiante con datos ficticios.
- Muestra en vivo la cadena SQL que se arma con lo que escribe el usuario.

### 2.8 Proyecto final guiado
Ver `proyecto-final-crud.md`. En la app: lista de etapas con checklist, entregables por etapa, enlace a la plantilla y verificación automática de la BD del estudiante (estructura y datos mínimos).

### 2.9 Panel del docente
- Grupos y estudiantes; progreso por tema/ejercicio (tabla y mapa de calor).
- Ejercicios con más intentos fallidos y errores SQL más frecuentes (para reforzar en clase).
- Desbloquear temas, habilitar soluciones, reiniciar sandbox de un estudiante.
- Modo proyección: abrir cualquier lección o consola en pantalla grande (fuente ampliada).
- Exportar CSV.

## 3. Requisitos no funcionales
- **Sin instalación** para el estudiante: navegador moderno (Chrome/Edge/Firefox recientes).
- **Desktop primero** (equipos del aula); usable en tablet; en móvil, lectura de lecciones (la consola puede ser limitada).
- **Concurrencia:** un grupo completo (~35 estudiantes) usando la consola a la vez en un servidor modesto (4 vCPU, 8 GB).
- **Despliegue** con `docker compose up` en un servidor del centro o un VPS; también en un portátil del docente en red local.
- **Accesibilidad:** contraste AA sobre fondo oscuro, navegación por teclado, textos alternativos en diagramas.
- **Idioma:** toda la interfaz y el contenido en español de Colombia.
- **Contenido separado del código** (`content/`), versionado en Git, editable por el docente.
- **Privacidad:** datos mínimos de estudiantes; contraseñas con hash (argon2/bcrypt).

## 4. Fuera de alcance (v1)
Procedimientos almacenados, triggers, índices avanzados/optimización, NoSQL, otros motores (PostgreSQL), integración con plataformas institucionales, calificación automática del proyecto final completo.
