# Consola SQL · especificación

Objetivo: que el aprendiz trabaje **como en un servidor MySQL real** (cliente `mysql` en terminal), pero desde el navegador, sin instalar nada y sin poder dañar el trabajo de otros.

## 1. Motor
- **MySQL 8.4 LTS real** (contenedor Docker), no un emulador. Motivo: los temas enseñan códigos y mensajes de error de MySQL (1062, 1451, 1452, 1048, 3819, 1175, 1824…); SQLite/PGlite o MariaDB devuelven códigos y mensajes distintos.
- Modo estricto activado (`STRICT_TRANS_TABLES`, valor por defecto en MySQL 8).
- Charset `utf8mb4`, collation `utf8mb4_unicode_ci`, zona horaria `America/Bogota`.

## 2. Aislamiento por aprendiz (decisión a validar en la Fase 0)
Cada aprendiz debe poder ejecutar `CREATE DATABASE tecnotienda;` y `USE tecnotienda;` con los nombres reales del curso, sin chocar con los otros 30 aprendices del mismo servidor.

**Propuesta recomendada — mapeo de nombres en la API:**
- Cada aprendiz tiene un usuario MySQL propio `u_<id>` con privilegios **solo** sobre las bases `sbx_<id>_%` (`GRANT ALL ON \`sbx\_<id>\_%\`.*`), sin privilegios globales (sin FILE, SUPER, PROCESS, GRANT OPTION).
- La API reescribe nombres lógicos ↔ físicos: `tecnotienda` ↔ `sbx_<id>_tecnotienda` en `CREATE/DROP/ALTER DATABASE`, `USE`, `SHOW DATABASES`, `SHOW TABLES FROM`, nombres calificados `bd.tabla` y referencias en FK. Se usa un parser de MySQL (p. ej. `node-sql-parser`) y, si una sentencia no se puede analizar con seguridad, se rechaza con un mensaje claro en vez de ejecutarla sin reescribir.
- Los mensajes de error y resultados (`SHOW DATABASES`, `SHOW CREATE TABLE`, `information_schema`) se devuelven con los nombres lógicos, de forma que el aprendiz nunca vea el prefijo.
- `SHOW DATABASES` muestra solo las bases del aprendiz (más `information_schema` si se consulta).

**Alternativa a evaluar:** un contenedor MySQL por aprendiz bajo demanda (máxima fidelidad, sin reescritura; más RAM: ~300–400 MB por contenedor). Documentar la decisión en `docs/memoria.md` tras el spike.

## 3. Sesión
- Una **conexión dedicada** por pestaña de consola (no del pool compartido) para conservar `USE`, variables de sesión, `LAST_INSERT_ID()` y transacciones abiertas (`START TRANSACTION` … `COMMIT/ROLLBACK`).
- Cierre por inactividad (p. ej. 20 min) con `ROLLBACK` implícito; se avisa al aprendiz.
- Comunicación por WebSocket (permite cancelar y respuestas en streaming).

## 4. Experiencia de terminal (xterm.js)
Debe imitar al cliente `mysql`:
```
mysql> SELECT nombre, ciudad FROM clientes WHERE ciudad = 'Bogotá';
+----------------+--------+
| nombre         | ciudad |
+----------------+--------+
| Laura Gómez    | Bogotá |
| Julián Herrera | Bogotá |
| Natalia Pardo  | Bogotá |
+----------------+--------+
3 rows in set (0.00 sec)

mysql> INSERT INTO clientes (documento, nombre, fecha_registro) VALUES ('1012345678', 'Pedro', '2026-03-01');
ERROR 1062 (23000): Duplicate entry '1012345678' for key 'clientes.documento'
```
- Prompt `mysql>` y continuación `    ->` hasta encontrar `;` (o `\G` para salida vertical).
- Mensajes reales: `Query OK, 1 row affected (0.01 sec)`, `Rows matched: 1  Changed: 1  Warnings: 0`, `Empty set`, `Database changed`.
- Historial con ↑/↓ (persistente por aprendiz), `Ctrl+C` cancela la sentencia en curso (`KILL QUERY`), `Ctrl+L` limpia, `Tab` autocompleta palabras clave, tablas y columnas de la BD actual.
- Comandos del cliente: `help`, `clear` / `\c`, `status`, `exit` (cierra la sesión), `source <nombre>` para cargar scripts de la lección (p. ej. `source tecnotienda-seed`).
- Pegado de scripts multilínea con varias sentencias.
- Acentos y `ñ` correctos.

## 5. Complementos alrededor de la terminal
- **Explorador de esquema** (panel lateral): bases → tablas → columnas con iconos PK/FK/UK; se actualiza tras cada DDL. Clic en tabla = `DESCRIBE`.
- **Modo editor** (CodeMirror 6, dialecto MySQL): escribir varias líneas y ejecutar todo o la selección; resultados en la misma terminal.
- **Explicación de errores en español:** al recibir un error, una tarjeta debajo explica qué pasó y cómo corregirlo, según el código (catálogo editable en `content/errores.yaml`). Ej.: 1452 → «Estás usando un id_categoria que no existe en la tabla categorias. Primero crea la categoría o usa un id existente.»
- **Restaurar punto de partida:** botón «Restaurar TecnoTienda al inicio del Tema N» (reconstruye la base con el script de referencia hasta ese tema; pide confirmación).
- **Mi script:** el aprendiz guarda/descarga su script acumulativo (`.sql`).
- **Consola embebida** en lecciones y ejercicios (mismo componente, con base y estado preparados para ese bloque).

## 6. Seguridad y límites
- Lista de sentencias bloqueadas antes de llegar al servidor (además de no tener privilegios): `GRANT`, `REVOKE`, `CREATE/DROP/ALTER USER`, `SET GLOBAL`, `SET PERSIST`, `LOAD DATA`, `SELECT … INTO OUTFILE/DUMPFILE`, `SHUTDOWN`, `KILL` (salvo el interno), `INSTALL/UNINSTALL PLUGIN`, `CREATE SERVER`, `SLEEP()` largos, `BENCHMARK()`. Procedimientos, funciones y triggers: fuera del alcance del curso; bloqueados en v1.
- Tiempo máximo por sentencia: 5 s (`max_execution_time` para SELECT + cancelación por la API para el resto).
- Máximo de filas mostradas: 500 (avisar «mostrando 500 de N»).
- Cuotas por aprendiz: máx. 5 bases, máx. 50 MB, máx. 30 sentencias/10 s (anti-bucle).
- Usuarios `u_<id>` con `MAX_USER_CONNECTIONS` limitado.
- Bitácora de sentencias por aprendiz (útil para el instructor y para depurar), sin datos sensibles.

## 7. Validación de ejercicios (usa la misma infraestructura)
- Cada intento se ejecuta en una **base temporal** creada desde el estado de partida del ejercicio, para que el resultado no dependa de lo que el aprendiz hizo antes; se destruye al terminar.
- Tipos `resultado`, `estructura`, `estado`, `error`, `manual` definidos en `temario.md`.
- `resultado`: comparar multiconjuntos de filas normalizando tipos (DECIMAL vs. número, fechas) e ignorando nombres de columna salvo que el ejercicio exija alias; respetar orden solo si el ejercicio lo marca.
- La solución se ejecuta en el mismo motor, nunca se compara contra resultados escritos a mano.
