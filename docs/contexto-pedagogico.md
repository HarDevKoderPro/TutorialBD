# Contexto pedagógico

## Público y entorno
- **Quién enseña:** el autor de la app (docente) u otros docentes; producto propio y de uso general, sin vínculo con ninguna institución.
- **Quién aprende:** estudiantes de formación técnica orientada a **desarrollo de software**. Nivel inicial en bases de datos: pueden no haber escrito nunca SQL.
- **Dónde:** aula con computadores y navegador. **No se debe exigir instalar nada** en los equipos de los estudiantes; todo funciona desde el navegador.
- **Vocabulario** que usa la app: *docente*, *estudiante/estudiantes*, *grupo*, *aula*, *entregable*. Producto general: no usar términos ni códigos de una institución concreta; si se necesitan competencias o resultados de aprendizaje, dejarlos como campos configurables por el docente.
- **Idioma:** español de Colombia, tuteo, tono cercano y directo. Ejemplos con contexto colombiano (pesos COP, ciudades del país, Nequi).

## Enfoque
1. **Práctico desde el primer minuto.** Cada concepto se ve funcionando en la consola antes de formalizarlo.
2. **Un solo caso que crece** (TecnoTienda): no hay ejemplos sueltos; cada tema construye sobre el anterior.
3. **Recorrido continuo, no clases.** Los temas no están atados a sesiones; el estudiante avanza a su ritmo y el docente puede ir más rápido o más lento.
4. **Diseño antes que código:** DER y normalización se hacen sobre el mismo caso y producen exactamente las tablas que luego se crean.
5. **Orientado a desarrollo de software:** todo apunta a cómo una aplicación usa la BD (paginación, borrado lógico, transacciones, consultas parametrizadas, manejo de errores), y termina en un proyecto CRUD completo.
6. **Diagramas antes que texto:** máximo ~60 palabras de texto corrido por bloque de lección; procesos, relaciones y comparaciones se dibujan.

## Metodología en cada tema
- **Predice → ejecuta → explica.** Antes de ejecutar un ejemplo, la lección pide predecir el resultado (pregunta corta o selección). Luego se ejecuta y se compara.
- **Errores provocados a propósito.** Cada tema incluye instrucciones que el estudiante ejecuta para ver fallar al SGBD (clave duplicada, FK inexistente, `DELETE` sin `WHERE`…). La app explica cada error en lenguaje sencillo.
- **Script acumulativo.** El estudiante conserva su propio script del caso; la app lo guarda y le permite reconstruir su BD en cualquier momento.
- **Ejercicios en tres niveles:** Básico (verde), Intermedio (ámbar), Avanzado (rosa), ordenados de menor a mayor complejidad; los avanzados incluyen un **caso de transferencia** (Biblioteca) para demostrar que el estudiante puede repetir el proceso solo.
- **Retroalimentación inmediata:** validación automática con pistas graduales (pista 1 conceptual → pista 2 estructural → solución tras 3 intentos o a criterio del docente).

## Evaluación (sugerida)
- Progreso por tema y ejercicios resueltos (seguimiento de conocimiento/desempeño).
- Proyecto final CRUD con rúbrica (entregable final). Ver `proyecto-final-crud.md`.
- El docente decide pesos y fechas; la app solo registra y reporta.

## Materiales complementarios
- El docente proyecta presentaciones PDF (la de Tema 1 está en `presentaciones/`, con el estilo neón anterior). La app usa el tema de PIA (ver `identidad-visual.md`).
