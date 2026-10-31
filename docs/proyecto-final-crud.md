# Proyecto final · CRUD completo de TecnoTienda

El aprendiz construye una aplicación web pequeña pero completa que recorre **todo** lo visto: diseño → base de datos → API → frontend. Es la evidencia de producto del curso.

## 1. Alcance para el aprendiz
**«TecnoTienda Admin»**, panel interno de la tienda:

| Módulo | Obligatorio | Operaciones |
|---|---|---|
| Categorías | Sí | Crear, listar, editar, eliminar (con error claro si tiene productos). |
| Productos | Sí | Crear (con selector de categoría), listar con búsqueda por nombre y paginación, editar, desactivar (borrado lógico). |
| Clientes | Sí | Crear, listar con búsqueda, editar; validar documento y correo únicos. |
| Pedidos | Avanzado | Crear pedido con varias líneas en **una transacción** (descuenta stock), listar con total calculado, cambiar estado. |
| Reportes | Avanzado | Ventas por categoría y mejores clientes (consumiendo las vistas del Tema 9). |

Variante opcional (decisión del instructor): el aprendiz elige otro dominio (biblioteca, gimnasio, citas) y aplica las mismas etapas.

## 2. Stack del proyecto (pensado para aprendices técnicos)
- **Base de datos:** MySQL 8 (su sandbox en la app o un MySQL local).
- **Backend:** Node.js LTS + Express + `mysql2/promise` + `dotenv`. Sin ORM: el objetivo es ver el SQL.
- **Frontend:** HTML + CSS + JavaScript sin framework, con `fetch`. Así se ve claramente el enlace frontend ↔ API.
- **Pruebas de API:** cliente REST (Thunder Client, REST Client de VS Code o similar) o los archivos `.http` incluidos.

> La app de enseñanza usa React/TypeScript internamente, pero el proyecto del aprendiz es deliberadamente simple.

## 3. Etapas (cada una con entregable y verificación)
| # | Etapa | Entregable | Verificación |
|---|---|---|---|
| 1 | Análisis | Requisitos en lista (qué guarda, quién lo usa, qué pantallas) | Rúbrica |
| 2 | Diseño | DER en pata de gallo + justificación de 3FN | Comparación con referencia + rúbrica |
| 3 | Base de datos | `schema.sql` + `seed.sql` ejecutados en su sandbox | Automática (estructura y datos mínimos) |
| 4 | Consultas | `consultas.sql`: las consultas que usará cada pantalla | Automática (ejecutan sin error) |
| 5 | API | Endpoints REST con consultas parametrizadas y manejo de errores | Archivo `.http` / pruebas |
| 6 | Frontend | Pantallas de listado + formulario por módulo | Demostración |
| 7 | Integración | App funcionando de punta a punta; README con cómo ejecutarla | Sustentación |

## 4. API de referencia
| Método | Ruta | SQL (siempre parametrizado) |
|---|---|---|
| GET | `/api/categorias` | `SELECT id_categoria, nombre, descripcion FROM categorias ORDER BY nombre` |
| POST | `/api/categorias` | `INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)` |
| PUT | `/api/categorias/:id` | `UPDATE categorias SET nombre = ?, descripcion = ? WHERE id_categoria = ?` |
| DELETE | `/api/categorias/:id` | `DELETE FROM categorias WHERE id_categoria = ?` (1451 → 409 «tiene productos») |
| GET | `/api/productos?buscar=&pagina=` | `SELECT p.*, c.nombre AS categoria FROM productos p JOIN categorias c ON … WHERE p.activo = TRUE AND p.nombre LIKE ? ORDER BY p.nombre LIMIT ? OFFSET ?` + `COUNT(*)` para total |
| GET | `/api/productos/:id` | `SELECT … WHERE id_producto = ?` |
| POST | `/api/productos` | `INSERT INTO productos (nombre, precio, stock, id_categoria) VALUES (?, ?, ?, ?)` |
| PUT | `/api/productos/:id` | `UPDATE productos SET … WHERE id_producto = ?` |
| DELETE | `/api/productos/:id` | Borrado lógico: `UPDATE productos SET activo = FALSE WHERE id_producto = ?` |
| GET/POST/PUT | `/api/clientes…` | Igual patrón; 1062 → 409 «documento/correo ya registrado» |
| POST | `/api/pedidos` | Transacción: `INSERT pedidos` → por línea `INSERT detalle_pedido` con precio vigente y `UPDATE productos SET stock = stock - ? WHERE id_producto = ? AND stock >= ?` (si afecta 0 filas → `ROLLBACK`, 409 «stock insuficiente») → `COMMIT` |
| GET | `/api/pedidos` | JOIN con clientes + `SUM(cantidad*precio_unitario)` agrupado |
| PATCH | `/api/pedidos/:id/estado` | `UPDATE pedidos SET estado = ? WHERE id_pedido = ?` |
| GET | `/api/reportes/ventas-categoria` | Consulta T9-A1 / vista |

Respuestas JSON; códigos HTTP correctos (200, 201, 400, 404, 409, 500); traducción de errores MySQL a mensajes en español.

## 5. Estructura de carpetas (plantilla del aprendiz)
```
proyecto-final/plantilla/
├── bd/
│   ├── schema.sql
│   ├── seed.sql
│   └── consultas.sql
├── api/
│   ├── .env.example        # DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, PORT
│   ├── package.json
│   ├── src/
│   │   ├── db.js           # pool mysql2
│   │   ├── app.js          # express, cors, json, rutas, manejador de errores
│   │   ├── errores.js      # mapa código MySQL → HTTP + mensaje
│   │   └── rutas/
│   │       ├── categorias.js
│   │       ├── productos.js
│   │       ├── clientes.js
│   │       └── pedidos.js
│   └── pruebas.http
├── web/
│   ├── index.html          # menú
│   ├── categorias.html
│   ├── productos.html
│   ├── clientes.html
│   ├── css/estilos.css
│   └── js/
│       ├── api.js          # funciones fetch reutilizables
│       ├── categorias.js
│       ├── productos.js
│       └── clientes.js
└── README.md
```
- `proyecto-final/plantilla/`: mismo árbol con funciones a completar marcadas `// TODO (Etapa N)` y comentarios guía en español.
- `proyecto-final/referencia/`: implementación completa y funcional (solo visible para el instructor en la app).
- Código del proyecto con identificadores y comentarios **en español** (es material de aprendizaje).

## 6. Rúbrica sugerida (el instructor ajusta pesos)
| Criterio | Peso |
|---|---|
| DER correcto y en 3FN | 15 % |
| BD: tipos, PK, FK, restricciones, datos de prueba | 20 % |
| CRUD completo de los 3 módulos obligatorios | 25 % |
| Consultas parametrizadas y manejo de errores | 15 % |
| Frontend usable conectado a la API (listar, buscar, paginar, formularios con validación) | 15 % |
| README, orden del código y sustentación | 10 % |
| **Extra:** pedidos con transacción y reportes | +10 % |
