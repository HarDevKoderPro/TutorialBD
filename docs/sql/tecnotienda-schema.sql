-- =====================================================================
-- TecnoTienda · Esquema de referencia (MySQL 8 / MariaDB 10.6+)
-- Resultado final esperado del Tema 4 (después de DER + normalización).
-- Es la "solución" del caso base: la app la usa para validar ejercicios
-- y para precargar datos en temas posteriores al 4.
-- =====================================================================

DROP DATABASE IF EXISTS tecnotienda;
CREATE DATABASE tecnotienda CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tecnotienda;

-- Catálogo de categorías de productos
CREATE TABLE categorias (
  id_categoria  INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(50)  NOT NULL UNIQUE,
  descripcion   VARCHAR(150)
);

-- Productos que vende la tienda (1 categoría -> N productos)
CREATE TABLE productos (
  id_producto   INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(80)    NOT NULL,
  precio        DECIMAL(10,2)  NOT NULL,
  stock         INT            NOT NULL DEFAULT 0,
  activo        BOOLEAN        NOT NULL DEFAULT TRUE,
  id_categoria  INT            NOT NULL,
  CONSTRAINT chk_productos_precio CHECK (precio > 0),
  CONSTRAINT chk_productos_stock  CHECK (stock >= 0),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (id_categoria)
    REFERENCES categorias (id_categoria)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Clientes registrados
CREATE TABLE clientes (
  id_cliente      INT AUTO_INCREMENT PRIMARY KEY,
  documento       VARCHAR(15)  NOT NULL UNIQUE,
  nombre          VARCHAR(60)  NOT NULL,
  correo          VARCHAR(80)  UNIQUE,
  telefono        VARCHAR(15),
  ciudad          VARCHAR(40),
  fecha_registro  DATE         NOT NULL
);

-- Encabezado del pedido (1 cliente -> N pedidos)
CREATE TABLE pedidos (
  id_pedido   INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente  INT       NOT NULL,
  fecha       DATETIME  NOT NULL,
  estado      ENUM('pendiente','pagado','enviado','cancelado') NOT NULL DEFAULT 'pendiente',
  CONSTRAINT fk_pedidos_cliente FOREIGN KEY (id_cliente)
    REFERENCES clientes (id_cliente)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Tabla intermedia de la relación N:M pedidos <-> productos
CREATE TABLE detalle_pedido (
  id_pedido        INT            NOT NULL,
  id_producto      INT            NOT NULL,
  cantidad         INT            NOT NULL,
  precio_unitario  DECIMAL(10,2)  NOT NULL,  -- precio "congelado" al momento de la venta
  PRIMARY KEY (id_pedido, id_producto),
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT fk_detalle_pedido FOREIGN KEY (id_pedido)
    REFERENCES pedidos (id_pedido)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto)
    REFERENCES productos (id_producto)
    ON UPDATE CASCADE ON DELETE RESTRICT
);
