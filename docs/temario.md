# Temario · Bases de datos con SQL desde cero

> Estado: **propuesta para validación del instructor.** El Tema 1 está desarrollado y maquetado (presentación PDF); los temas 2 a 10 son la propuesta de contenido acordada en la planeación y pueden cambiar.
>
> Los temas **no son clases**: forman un recorrido continuo. El instructor avanza a su ritmo y el aprendiz continúa donde quedó.

Todos los temas usan el **caso base TecnoTienda** (ver `caso-base-tecnotienda.md`). Cada tema tiene:

- **Objetivo** de aprendizaje.
- **Contenido** (lo que la lección debe explicar, con diagramas antes que texto).
- **Ejemplo base** sobre TecnoTienda.
- **Errores provocados**: instrucciones que el aprendiz ejecuta a propósito para ver fallar al SGBD y entender la regla.
- **Ejercicios** en tres niveles (Básico, Intermedio, Avanzado), ordenados de menor a mayor complejidad.

### Formato de los ejercicios

Cada ejercicio tiene un ID `T<tema>-<nivel><n>` (ej. `T6-B2`) y un **tipo de validación** que la app usa para corregirlo automáticamente:

| Tipo | Cómo se valida |
|---|---|
| `resultado` | Se ejecuta la consulta del aprendiz y la solución sobre los mismos datos y se comparan los conjuntos de resultados (sin importar el orden, salvo que el enunciado pida `ORDER BY`; nombres de columna/alias no importan salvo que se pidan). |
| `estructura` | Se inspecciona `information_schema` (tablas, columnas, tipos, PK, FK, UNIQUE, NOT NULL) contra lo esperado. |
| `estado` | Se ejecuta lo del aprendiz y luego una consulta de verificación que debe devolver lo esperado (para INSERT/UPDATE/DELETE). |
| `error` | El ejercicio pide provocar un error; se valida el código de error MySQL esperado. |
| `manual` | Respuesta abierta o diagrama; la app muestra una rúbrica y la solución de referencia tras el intento. |

Las soluciones `SQL` están escritas para MySQL 8 sobre los datos de `sql/tecnotienda-seed.sql`.

---

## Mapa del recorrido

| # | Tema | Bloque | Resultado en TecnoTienda |
|---|---|---|---|
| 1 | Conceptos básicos | Diseño | Entienden qué es una BD y cómo se organiza |
| 2 | Modelo entidad-relación (DER) | Diseño | DER de la tienda |
| 3 | Normalización (1FN, 2FN, 3FN) | Diseño | DER validado desde la planilla desordenada |
| 4 | Crear la estructura (DDL) | Estructura | BD y 5 tablas creadas con restricciones |
| 5 | Insertar datos (`INSERT`) | CRUD | Tablas con datos de prueba |
| 6 | Consultar datos (`SELECT`) | CRUD | Consultas con filtros, orden y paginación |
| 7 | Modificar y eliminar (`UPDATE`, `DELETE`) | CRUD | CRUD completo y transacciones |
| 8 | Consultas entre tablas (`JOIN`) | Consultas avanzadas | Pedidos con cliente y productos |
| 9 | Resúmenes y reportes (`GROUP BY`) | Consultas avanzadas | Ventas por categoría, mejores clientes, vistas |
| 10 | SQL desde la aplicación | Consultas avanzadas | Consultas parametrizadas, inyección SQL, puente al proyecto final |
| — | **Proyecto final** | Integración | App CRUD completa: diseño → BD → API → frontend (ver `proyecto-final-crud.md`) |

---

## Tema 1 · Conceptos básicos

**Objetivo:** identificar los elementos de una base de datos y reconocerlos en una tabla real.

**Contenido**
1. Dato vs. información. «3001234567» es un dato; «El teléfono de Laura es 3001234567» es información.
2. Base de datos: conjunto de datos relacionados y organizados sobre un mismo tema. Ejemplos cercanos: Sofía Plus (aprendices, fichas, notas), Nequi (usuarios, movimientos), contactos del celular.
3. SGBD: software que administra la BD (MySQL, MariaDB, PostgreSQL, SQL Server). Diagrama: Aplicación → SQL → SGBD → BD, y resultados de vuelta. La app nunca toca los datos directamente.
4. Anatomía de una tabla: tabla, campo (columna), registro (fila), valor (cruce).
5. Tipos de dato (introducción): `INT`, `DECIMAL`, `VARCHAR`, `DATE`, `BOOLEAN`.
6. Claves: PK (identifica cada registro, no se repite; analogía: número de documento) y FK (apunta a la PK de otra tabla y las une).

**Ejemplo base:** tabla `clientes` (3 registros) y diagrama `clientes` ← `pedidos` por `id_cliente`.

**Primer contacto con la consola** (el aprendiz solo pega y observa; aún no se explica la sintaxis):
```sql
CREATE TABLE clientes (
  id_cliente INT PRIMARY KEY,
  nombre VARCHAR(50),
  ciudad VARCHAR(40),
  telefono VARCHAR(15),
  fecha_registro DATE
);
INSERT INTO clientes VALUES
(1, 'Laura Gómez', 'Bogotá', '3001234567', '2026-01-15'),
(2, 'Andrés Ruiz', 'Medellín', '3109876543', '2026-02-03'),
(3, 'Camila Torres', 'Cali', '3205551234', '2026-02-20');
SELECT * FROM clientes;
```

**Error provocado:** `INSERT INTO clientes VALUES (1, 'Pedro Díaz', 'Pasto', '3150000000', '2026-03-01');` → error 1062 *Duplicate entry '1' for key 'clientes.PRIMARY'*. Pregunta: ¿por qué lo rechaza?

**Ejercicios**
- `T1-B1` (manual) · En la tabla `aprendices` (documento, nombre, ficha; 5 registros: Sara León 2758, Juan Pérez 2758, Ana Mora 2759, Luis Rojas 2758, Eva Díaz 2759): nombre de la tabla, campos, número de registros y el valor de `ficha` para Ana Mora. *Respuesta: aprendices; documento, nombre, ficha; 5; 2759.*
- `T1-B2` (manual, selección) · Clasificar como dato o información: «Bogotá», «La ficha 2758 tiene 32 aprendices», «15», «El producto más vendido fue el mouse». *Respuesta: dato, información, dato, información.*
- `T1-I1` (manual) · Para `producto` y `proveedor`, proponer 4–5 campos con tipo de dato y elegir la PK. Aviso: justificar cada tipo.
- `T1-I2` (manual, selección) · ¿Mejor PK para un cliente: nombre, teléfono, correo o número consecutivo? Aviso: ¿puede repetirse? ¿puede cambiar? *Respuesta: consecutivo (o documento); los demás se repiten o cambian.*
- `T1-A1` (manual) · Planilla `prestamos_biblioteca` (libro, autor, lector, tel_lector, fecha) con datos repetidos: ¿qué se repite y qué problema causa?, ¿qué tablas deberían existir?, ¿PK de cada una?, ¿qué campo las uniría? Aviso: todavía sin SQL. *Referencia: autores, libros, lectores, prestamos; FK id_libro e id_lector en prestamos; id_autor en libros.*

---

## Tema 2 · Modelo entidad-relación (DER)

**Objetivo:** representar un problema real como entidades, atributos y relaciones antes de escribir SQL.

**Contenido**
1. ¿Por qué diseñar antes de programar? Cambiar un dibujo es gratis; cambiar una BD con datos no.
2. **Entidad** (cosa de la que se guardan datos → futura tabla), **atributo** (característica → futuro campo), **identificador** (→ PK).
3. **Relación** y **cardinalidad**: 1:1 (persona–cédula), 1:N (cliente–pedidos), N:M (pedidos–productos).
4. Cómo leer una relación en ambos sentidos: «un cliente hace *muchos* pedidos; un pedido es de *un* cliente».
5. **Notación pata de gallo** (la de trabajo): `||` uno y solo uno, `o{` cero o muchos, `|{` uno o muchos. Notación Chen solo como referencia en una diapositiva.
6. Método para construir un DER desde un texto: subrayar sustantivos (entidades/atributos) y verbos (relaciones).
7. Una N:M no se puede implementar directamente: se convierte en una **entidad intermedia** (`detalle_pedido`) con atributos propios (cantidad, precio_unitario).

**Ejemplo base:** enunciado de TecnoTienda (ver caso base) → DER completo (diagrama Mermaid en el caso base).

**Herramientas sugeridas:** el DER se dibuja dentro de la app (editor visual o código Mermaid) y, como alternativa externa, diagrams.net o dbdiagram.io.

**Ejercicios**
- `T2-B1` (manual) · Del texto «Un gimnasio registra a sus socios con nombre, documento y teléfono. Cada socio puede inscribirse en varias clases; cada clase tiene nombre, horario e instructor» subrayar entidades y atributos. *Ref.: socio, clase, instructor (o atributo de clase).*
- `T2-B2` (manual, selección) · Cardinalidad de: país–capital, docente–fichas que orienta, estudiante–cursos, factura–cliente. *Ref.: 1:1, 1:N, N:M, N:1.*
- `T2-I1` (manual) · Leer en voz alta (escribir) las 4 relaciones del DER de TecnoTienda en ambos sentidos.
- `T2-I2` (manual) · Convertir la N:M estudiante–curso en entidad intermedia `matricula` y proponer 2 atributos propios. *Ref.: fecha_matricula, nota_final.*
- `T2-A1` (manual, DER) · DER completo de la biblioteca del ejercicio T1-A1 con cardinalidades en pata de gallo. Aviso: un libro puede tener varios autores. *Ref.: autores N:M libros (libro_autor), lectores 1:N prestamos, libros 1:N prestamos.*

---

## Tema 3 · Normalización (1FN, 2FN, 3FN)

**Objetivo:** detectar y eliminar redundancias para evitar errores en los datos; validar el DER.

**Contenido**
1. Punto de partida: `sql/planilla-desordenada.csv` (un pedido por fila, varios productos en una celda, cliente repetido, nombres escritos distinto: «Laura Gómez» / «Laura Gomez», «Bogotá» / «Bogota», teléfonos con formatos distintos).
2. **Anomalías** (el porqué de normalizar):
   - Actualización: Laura cambia de teléfono → hay que corregir N filas; si se olvida una, la BD se contradice.
   - Inserción: no se puede registrar un producto nuevo hasta que alguien lo compre.
   - Eliminación: si se borra el único pedido de un producto, el producto desaparece.
3. **1FN**: valores atómicos (una celda = un dato), sin grupos repetidos, cada fila identificable. → separar productos de la celda «productos» en filas.
4. **2FN**: estar en 1FN y que todo atributo dependa de **toda** la clave. Con clave (pedido, producto), `nombre_producto` y `precio` dependen solo de producto → tabla `productos`; datos del cliente dependen solo del pedido → tabla `pedidos`/`clientes`.
5. **3FN**: estar en 2FN y sin dependencias transitivas (un no-clave que depende de otro no-clave). Ej.: `categoria_descripcion` depende de `categoria`, no del producto → tabla `categorias`. Ejemplo extra: si clientes tuviera `ciudad` y `departamento`, departamento depende de ciudad.
6. Resultado: las 5 tablas de TecnoTienda; coincide con el DER del Tema 2 (validación cruzada).
7. Nota para desarrollo: normalizar hasta 3FN es lo estándar; `precio_unitario` en `detalle_pedido` **no** es redundancia: congela el precio histórico de la venta.

**Visual clave:** animación «antes → después» de la planilla en cada forma normal.

**Ejercicios**
- `T3-B1` (manual, selección) · En la planilla, señalar un ejemplo de cada anomalía.
- `T3-B2` (manual, selección) · ¿Qué celdas violan la 1FN? *Ref.: productos, categoria, precios.*
- `T3-I1` (manual) · Llevar la planilla de la biblioteca a 1FN (tabla resultante con filas).
- `T3-I2` (manual) · Tabla `notas(documento, nombre_aprendiz, codigo_competencia, nombre_competencia, nota)` con PK (documento, codigo_competencia): identificar dependencias parciales y llevar a 2FN. *Ref.: aprendices(documento, nombre), competencias(codigo, nombre), notas(documento, codigo, nota).*
- `T3-A1` (manual) · Llevar la biblioteca a 3FN y comparar con el DER hecho en T2-A1; explicar las diferencias.

---

## Tema 4 · Crear la estructura (DDL)

**Objetivo:** transformar el DER en una base de datos real con SQL.

**Contenido**
1. Del DER al SQL: entidad → `CREATE TABLE`, atributo → columna, identificador → `PRIMARY KEY`, relación 1:N → FK en el lado «muchos», N:M → tabla intermedia con PK compuesta.
2. Comandos de exploración (como en un servidor real): `SHOW DATABASES;`, `CREATE DATABASE`, `USE`, `SHOW TABLES;`, `DESCRIBE tabla;`, `SHOW CREATE TABLE tabla;`.
3. Tipos de dato en detalle: `INT`, `DECIMAL(p,s)` (dinero; nunca `FLOAT`), `VARCHAR(n)` vs `CHAR(n)`, `TEXT`, `DATE`, `DATETIME`, `BOOLEAN`, `ENUM`. Teléfonos y documentos como `VARCHAR` (no se opera con ellos y pueden tener ceros a la izquierda).
4. Restricciones: `PRIMARY KEY`, `AUTO_INCREMENT`, `NOT NULL`, `UNIQUE`, `DEFAULT`, `CHECK`, `FOREIGN KEY ... REFERENCES` con `ON DELETE RESTRICT | CASCADE | SET NULL`.
5. **Orden de creación**: primero las tablas padre (sin FK), luego las hijas.
6. Modificar: `ALTER TABLE ... ADD COLUMN | MODIFY COLUMN | DROP COLUMN | ADD CONSTRAINT`, `RENAME TABLE`. Eliminar: `DROP TABLE`, `DROP DATABASE` (y por qué en producción casi nunca se usan).
7. Convenciones: nombres en minúscula, `snake_case`, tablas en plural, PK `id_<singular>`.

**Ejemplo base:** `sql/tecnotienda-schema.sql`, construido paso a paso (una tabla por vez, verificando con `DESCRIBE`).

**Errores provocados**
- Crear `productos` antes que `categorias` → error 1824 *Failed to open the referenced table 'categorias'*.
- `nombre VARCHAR` sin longitud → error 1064 de sintaxis.
- `DROP TABLE categorias;` con productos que la referencian → error 3730.

**Ejercicios**
- `T4-B1` (estructura) · Crear la BD `tecnotienda` y la tabla `categorias` (id_categoria INT AI PK, nombre VARCHAR(50) NOT NULL UNIQUE, descripcion VARCHAR(150)).
- `T4-B2` (estructura) · Crear `clientes` según el DER (documento único y obligatorio, correo único opcional).
- `T4-I1` (estructura) · Crear `productos` con FK a `categorias`, `precio DECIMAL(10,2) NOT NULL` con `CHECK (precio > 0)` y `stock` por defecto 0.
- `T4-I2` (estructura) · `ALTER TABLE clientes ADD COLUMN direccion VARCHAR(100);` y luego eliminarla. Verificar con `DESCRIBE`.
- `T4-A1` (estructura) · Crear `pedidos` (estado `ENUM` con default 'pendiente') y `detalle_pedido` con PK compuesta, dos FK, `ON DELETE CASCADE` hacia pedidos y `RESTRICT` hacia productos. Aviso: piensa en el orden de creación.
- `T4-A2` (estructura) · Transferencia: crear en una BD `biblioteca` las tablas en 3FN obtenidas en T3-A1.

---

## Tema 5 · Insertar datos (`INSERT`)

**Objetivo:** cargar datos respetando las restricciones e interpretar los errores del SGBD.

**Contenido**
1. `INSERT INTO tabla (col1, col2) VALUES (...)`: siempre nombrar las columnas (buena práctica en código de aplicaciones).
2. Inserción múltiple en una sola instrucción.
3. `AUTO_INCREMENT`: no se envía el id; `LAST_INSERT_ID()`.
4. `DEFAULT` y `NULL`: qué pasa al omitir columnas.
5. Texto entre comillas simples; fechas `'AAAA-MM-DD'`; decimales con punto.
6. Orden de carga: padres antes que hijos.

**Ejemplo base:** `sql/tecnotienda-seed.sql` cargado por partes (categorías → productos → clientes → pedidos → detalle).

**Errores provocados**
- Documento repetido → 1062 *Duplicate entry*.
- Producto con `id_categoria = 99` → 1452 *Cannot add or update a child row: a foreign key constraint fails*.
- Cliente sin nombre → 1048 *Column 'nombre' cannot be null*.
- Producto con precio -5 → 3819 *Check constraint 'chk_productos_precio' is violated*.
- Nombre de 100 caracteres en `VARCHAR(50)` → 1406 *Data too long* (en modo estricto).

**Ejercicios**
- `T5-B1` (estado) · Insertar la categoría «Audio» (descripción «Audífonos y parlantes»). Verificación: `SELECT COUNT(*) FROM categorias WHERE nombre='Audio'` = 1.
- `T5-B2` (estado) · Insertar 2 productos de la categoría Audio en una sola instrucción (usar el id que generó la categoría).
- `T5-I1` (estado) · Insertar un cliente sin correo ni teléfono y comprobar qué valor quedó (`NULL`).
- `T5-I2` (error) · Provocar el error de FK insertando un producto con categoría inexistente. Código esperado: 1452.
- `T5-A1` (estado) · Registrar un pedido completo para Diego Castro (id 8): encabezado con estado por defecto y 2 líneas de detalle con el precio vigente del producto. Aviso: necesitas el id del pedido recién creado (`LAST_INSERT_ID()`). Verificación: Diego tiene 1 pedido con 2 líneas.

---

## Tema 6 · Consultar datos (`SELECT`)

**Objetivo:** obtener exactamente la información que necesita una pantalla de la aplicación.

**Contenido**
1. `SELECT columnas FROM tabla`; `*` solo para explorar.
2. Alias con `AS`; columnas calculadas (`precio * 1.19 AS precio_con_iva`).
3. `DISTINCT`.
4. `WHERE` con `=, <>, <, >, <=, >=`, `BETWEEN`, `IN`, `LIKE` (`%`, `_`), `IS NULL` / `IS NOT NULL`; combinación con `AND`, `OR`, `NOT` y paréntesis.
5. `ORDER BY` (ASC/DESC, varias columnas).
6. `LIMIT` y `OFFSET` → **paginación** de listados en una app.
7. Orden lógico de ejecución: FROM → WHERE → SELECT → ORDER BY → LIMIT.

**Errores provocados**
- `WHERE correo = NULL` → no devuelve filas (no es error, es un error lógico). Corregir con `IS NULL`.
- Columna mal escrita → 1054 *Unknown column*.
- Texto sin comillas → 1054.

**Ejercicios** (validación `resultado`)
- `T6-B1` · Nombre y precio de todos los productos.
  ```sql
  SELECT nombre, precio FROM productos;
  ```
- `T6-B2` · Clientes de Bogotá.
  ```sql
  SELECT * FROM clientes WHERE ciudad = 'Bogotá';
  ```
- `T6-B3` · Productos ordenados del más caro al más barato (orden importa).
  ```sql
  SELECT nombre, precio FROM productos ORDER BY precio DESC;
  ```
- `T6-I1` · Productos activos con stock entre 1 y 10.
  ```sql
  SELECT nombre, stock FROM productos WHERE activo = TRUE AND stock BETWEEN 1 AND 10;
  ```
- `T6-I2` · Clientes sin correo registrado.
  ```sql
  SELECT nombre FROM clientes WHERE correo IS NULL;
  ```
- `T6-I3` · Productos cuyo nombre contiene «Monitor» o «Portátil».
  ```sql
  SELECT nombre FROM productos WHERE nombre LIKE '%Monitor%' OR nombre LIKE '%Portátil%';
  ```
- `T6-A1` · Nombre, precio y precio con IVA (19 %) redondeado a 0 decimales de los productos de las categorías 1 y 3. Columnas: `nombre, precio, precio_con_iva`.
  ```sql
  SELECT nombre, precio, ROUND(precio * 1.19, 0) AS precio_con_iva
  FROM productos WHERE id_categoria IN (1, 3);
  ```
- `T6-A2` · Paginación: segunda página de productos ordenados por nombre, 5 por página (orden importa).
  ```sql
  SELECT id_producto, nombre FROM productos ORDER BY nombre LIMIT 5 OFFSET 5;
  ```
- `T6-A3` · Ciudades distintas de los clientes, en orden alfabético.
  ```sql
  SELECT DISTINCT ciudad FROM clientes ORDER BY ciudad;
  ```

---

## Tema 7 · Modificar y eliminar (`UPDATE`, `DELETE`)

**Objetivo:** cambiar y borrar datos de forma segura, como lo hace una aplicación en producción.

**Contenido**
1. `UPDATE tabla SET col = valor WHERE condición`; varias columnas; valores calculados (`stock = stock - 2`).
2. `DELETE FROM tabla WHERE condición`.
3. **La regla de oro**: primero `SELECT` con el mismo `WHERE`, luego `UPDATE`/`DELETE`.
4. Modo seguro: `SET sql_safe_updates = 1` bloquea `UPDATE`/`DELETE` sin `WHERE` por clave.
5. Integridad referencial en acción: `RESTRICT` (error 1451) vs `CASCADE` (borrar un pedido borra su detalle).
6. **Borrado lógico** (`activo = FALSE`) vs. borrado físico: por qué las apps reales casi nunca borran.
7. **Transacciones**: `START TRANSACTION`, `COMMIT`, `ROLLBACK`. Ejemplo: vender un producto = insertar detalle + descontar stock; o todo o nada.

**Errores provocados**
- `UPDATE productos SET precio = 0;` sin `WHERE` (con safe updates → error 1175; sin él → desastre y `ROLLBACK` dentro de una transacción).
- `DELETE FROM clientes WHERE id_cliente = 1;` → 1451 (tiene pedidos).
- `UPDATE productos SET stock = -1 WHERE id_producto = 3;` → 3819 (CHECK).

**Ejercicios** (validación `estado`, salvo indicación)
- `T7-B1` · Cambiar el teléfono de Laura Gómez a 3009998877. Verificación: el teléfono de id 1.
  ```sql
  UPDATE clientes SET telefono = '3009998877' WHERE id_cliente = 1;
  ```
- `T7-B2` · Marcar el pedido 9 como 'pagado'.
- `T7-I1` · Subir 5 % el precio de todos los productos de la categoría Periféricos (id 2).
  ```sql
  UPDATE productos SET precio = ROUND(precio * 1.05, 2) WHERE id_categoria = 2;
  ```
- `T7-I2` · Desactivar (borrado lógico) los productos con stock 0.
  ```sql
  UPDATE productos SET activo = FALSE WHERE stock = 0;
  ```
- `T7-I3` (error) · Intentar eliminar al cliente Andrés Ruiz; código esperado 1451. Explicar por qué.
- `T7-A1` · Eliminar el pedido cancelado (id 5) y comprobar que su detalle también desapareció (CASCADE).
  ```sql
  DELETE FROM pedidos WHERE id_pedido = 5;
  -- verificación: SELECT COUNT(*) FROM detalle_pedido WHERE id_pedido = 5;  -> 0
  ```
- `T7-A2` · Dentro de una transacción: vender 2 «Mouse inalámbrico» en el pedido 9 (insertar detalle con precio vigente y descontar stock). Confirmar con `COMMIT`. Luego repetir con un error a propósito y deshacer con `ROLLBACK`. Verificación: stock del producto 3 = 38 y el pedido 9 tiene la línea.

---

## Tema 8 · Consultas entre tablas (`JOIN`)

**Objetivo:** reunir información repartida en varias tablas, como la necesita una pantalla real.

**Contenido**
1. Por qué existe el JOIN: la normalización separó los datos; el JOIN los vuelve a juntar.
2. `INNER JOIN ... ON` (solo lo que coincide). Alias de tabla (`c`, `p`).
3. `LEFT JOIN` (todo lo de la izquierda aunque no tenga pareja) → «clientes sin pedidos». `RIGHT JOIN` solo como mención.
4. Diagrama de Venn **con datos reales**, no solo círculos.
5. Varios JOIN encadenados para recorrer la N:M: pedidos → detalle_pedido → productos → categorias.
6. Error típico: olvidar el `ON` → producto cartesiano (contar filas para verlo).

**Ejercicios** (validación `resultado`)
- `T8-B1` · Número de pedido, fecha y nombre del cliente de cada pedido.
  ```sql
  SELECT p.id_pedido, p.fecha, c.nombre
  FROM pedidos p INNER JOIN clientes c ON p.id_cliente = c.id_cliente;
  ```
- `T8-B2` · Nombre de cada producto con el nombre de su categoría.
  ```sql
  SELECT pr.nombre, ca.nombre AS categoria
  FROM productos pr JOIN categorias ca ON pr.id_categoria = ca.id_categoria;
  ```
- `T8-I1` · Productos (nombre, cantidad, precio_unitario) del pedido 4.
  ```sql
  SELECT pr.nombre, d.cantidad, d.precio_unitario
  FROM detalle_pedido d JOIN productos pr ON d.id_producto = pr.id_producto
  WHERE d.id_pedido = 4;
  ```
- `T8-I2` · Clientes que nunca han hecho un pedido.
  ```sql
  SELECT c.nombre FROM clientes c
  LEFT JOIN pedidos p ON c.id_cliente = p.id_cliente
  WHERE p.id_pedido IS NULL;
  ```
- `T8-A1` · Productos que nunca se han vendido.
  ```sql
  SELECT pr.nombre FROM productos pr
  LEFT JOIN detalle_pedido d ON pr.id_producto = d.id_producto
  WHERE d.id_pedido IS NULL;
  ```
- `T8-A2` · Para cada línea vendida: nombre del cliente, fecha del pedido, producto, categoría y subtotal (`cantidad * precio_unitario`) de los pedidos en estado 'enviado'.
  ```sql
  SELECT c.nombre AS cliente, p.fecha, pr.nombre AS producto, ca.nombre AS categoria,
         d.cantidad * d.precio_unitario AS subtotal
  FROM pedidos p
  JOIN clientes c       ON p.id_cliente = c.id_cliente
  JOIN detalle_pedido d ON p.id_pedido = d.id_pedido
  JOIN productos pr     ON d.id_producto = pr.id_producto
  JOIN categorias ca    ON pr.id_categoria = ca.id_categoria
  WHERE p.estado = 'enviado';
  ```

---

## Tema 9 · Resúmenes y reportes (`GROUP BY`)

**Objetivo:** construir los reportes y tableros que pide un negocio.

**Contenido**
1. Funciones de agregado: `COUNT(*)`, `COUNT(col)`, `SUM`, `AVG`, `MIN`, `MAX`.
2. `GROUP BY`: «una fila por cada…». Animación: filas que se agrupan en cajas.
3. `HAVING` vs. `WHERE` (filtrar grupos vs. filtrar filas).
4. Ordenar por un agregado y `LIMIT` → «top 3».
5. Subconsulta simple en `WHERE` (productos más caros que el promedio).
6. `CREATE VIEW` para guardar un reporte y usarlo desde la app como si fuera una tabla.

**Ejercicios** (validación `resultado`)
- `T9-B1` · ¿Cuántos clientes hay?
  ```sql
  SELECT COUNT(*) AS total_clientes FROM clientes;
  ```
- `T9-B2` · Precio mínimo, máximo y promedio de los productos.
  ```sql
  SELECT MIN(precio), MAX(precio), AVG(precio) FROM productos;
  ```
- `T9-B3` · Número de clientes por ciudad.
  ```sql
  SELECT ciudad, COUNT(*) AS clientes FROM clientes GROUP BY ciudad;
  ```
- `T9-I1` · Cantidad de pedidos por estado.
  ```sql
  SELECT estado, COUNT(*) AS pedidos FROM pedidos GROUP BY estado;
  ```
- `T9-I2` · Total de cada pedido (id_pedido, total).
  ```sql
  SELECT id_pedido, SUM(cantidad * precio_unitario) AS total
  FROM detalle_pedido GROUP BY id_pedido;
  ```
- `T9-I3` · Productos con precio mayor al promedio.
  ```sql
  SELECT nombre, precio FROM productos
  WHERE precio > (SELECT AVG(precio) FROM productos);
  ```
- `T9-A1` · Ventas totales por categoría, sin contar pedidos cancelados, de mayor a menor (orden importa).
  ```sql
  SELECT ca.nombre AS categoria, SUM(d.cantidad * d.precio_unitario) AS ventas
  FROM detalle_pedido d
  JOIN pedidos p     ON d.id_pedido = p.id_pedido
  JOIN productos pr  ON d.id_producto = pr.id_producto
  JOIN categorias ca ON pr.id_categoria = ca.id_categoria
  WHERE p.estado <> 'cancelado'
  GROUP BY ca.nombre
  ORDER BY ventas DESC;
  ```
- `T9-A2` · Clientes con más de un pedido (nombre, número de pedidos).
  ```sql
  SELECT c.nombre, COUNT(*) AS pedidos
  FROM clientes c JOIN pedidos p ON c.id_cliente = p.id_cliente
  GROUP BY c.id_cliente, c.nombre
  HAVING COUNT(*) > 1;
  ```
- `T9-A3` · Crear la vista `v_ventas_por_cliente` (cliente, número de pedidos, total comprado sin cancelados) y consultarla ordenada por total descendente. Validación `estructura` (existe la vista) + `resultado`.
  ```sql
  CREATE VIEW v_ventas_por_cliente AS
  SELECT c.nombre AS cliente, COUNT(DISTINCT p.id_pedido) AS pedidos,
         SUM(d.cantidad * d.precio_unitario) AS total
  FROM clientes c
  JOIN pedidos p        ON c.id_cliente = p.id_cliente
  JOIN detalle_pedido d ON p.id_pedido = d.id_pedido
  WHERE p.estado <> 'cancelado'
  GROUP BY c.id_cliente, c.nombre;
  SELECT * FROM v_ventas_por_cliente ORDER BY total DESC;
  ```

---

## Tema 10 · SQL desde la aplicación

**Objetivo:** entender cómo una aplicación ejecuta SQL de forma segura; puente al proyecto final.

**Contenido**
1. Arquitectura en 3 capas: Frontend (HTML/JS) → API (Node + Express) → SGBD (MySQL). El navegador **nunca** se conecta a la BD.
2. CRUD ↔ HTTP ↔ SQL: `POST` ↔ `INSERT`, `GET` ↔ `SELECT`, `PUT/PATCH` ↔ `UPDATE`, `DELETE` ↔ `DELETE`.
3. Conexión con `mysql2` y pool de conexiones; credenciales en variables de entorno (`.env`), nunca en el código.
4. **Inyección SQL**: demo en un laboratorio aislado de la app con un login vulnerable (`' OR '1'='1`) y luego la versión corregida.
5. **Consultas parametrizadas** (`?`): la única forma aceptada de pasar datos del usuario a SQL.
6. Usuario de BD con privilegios mínimos (`GRANT SELECT, INSERT, UPDATE, DELETE ON tecnotienda.*`), no `root`.
7. Transacciones desde código: crear un pedido con su detalle y descontar stock.
8. Manejo de errores del SGBD en la API → mensajes claros al usuario (1062 → «el documento ya existe», 1451 → «no se puede borrar: tiene pedidos»).

**Ejercicios**
- `T10-B1` (manual, selección) · Relacionar cada acción de la pantalla (crear, listar, editar, borrar producto) con su método HTTP y su instrucción SQL.
- `T10-I1` (laboratorio) · En el laboratorio de inyección, entrar sin contraseña al login vulnerable; luego explicar qué texto SQL se formó.
- `T10-I2` (manual/código) · Reescribir una consulta concatenada como consulta parametrizada.
- `T10-A1` (proyecto) · Arranque del proyecto final (ver `proyecto-final-crud.md`).
