-- =====================================================================
-- TecnoTienda · Datos de prueba (ejecutar después de tecnotienda-schema.sql)
-- Precios en pesos colombianos (COP). Datos ficticios.
-- Diseñados para que los ejercicios tengan casos interesantes:
--   * un cliente SIN pedidos (Diego Castro, id 8)  -> LEFT JOIN, NOT EXISTS
--   * productos SIN ventas (Tablet 10" id 12, Webcam HD id 11) -> LEFT JOIN
--   * un producto con stock 0 (Monitor 27", id 6)   -> filtros WHERE
--   * un producto inactivo (Webcam HD, id 11)       -> BOOLEAN
--   * pedidos en todos los estados                  -> GROUP BY estado
--   * clientes repetidos por ciudad                 -> GROUP BY ciudad
-- =====================================================================
USE tecnotienda;

INSERT INTO categorias (nombre, descripcion) VALUES
('Portátiles',   'Computadores portátiles para estudio y trabajo'),
('Periféricos',  'Teclados, mouse, cámaras y accesorios'),
('Monitores',    'Pantallas para escritorio'),
('Almacenamiento','Discos sólidos, memorias USB y discos externos'),
('Redes',        'Routers, switches y adaptadores');

INSERT INTO productos (nombre, precio, stock, activo, id_categoria) VALUES
('Portátil Lenovo IdeaPad 15"', 2499000.00, 8,  TRUE, 1),   -- 1
('Portátil HP 14" Ryzen 5',     2199000.00, 5,  TRUE, 1),   -- 2
('Mouse inalámbrico',             59900.00, 40, TRUE, 2),   -- 3
('Teclado mecánico RGB',         189900.00, 15, TRUE, 2),   -- 4
('Monitor 24" Full HD',          599000.00, 10, TRUE, 3),   -- 5
('Monitor 27" 2K',              1149000.00, 0,  TRUE, 3),   -- 6
('SSD 500 GB NVMe',              229900.00, 25, TRUE, 4),   -- 7
('Memoria USB 64 GB',             39900.00, 60, TRUE, 4),   -- 8
('Disco externo 1 TB',           259900.00, 12, TRUE, 4),   -- 9
('Router WiFi 6',                319900.00, 7,  TRUE, 5),   -- 10
('Webcam HD',                     99900.00, 3,  FALSE, 2),  -- 11
('Tablet 10"',                   899000.00, 6,  TRUE, 1);   -- 12

INSERT INTO clientes (documento, nombre, correo, telefono, ciudad, fecha_registro) VALUES
('1012345678', 'Laura Gómez',    'laura.gomez@correo.com',   '3001234567', 'Bogotá',       '2026-01-15'), -- 1
('1023456789', 'Andrés Ruiz',    'andres.ruiz@correo.com',   '3109876543', 'Medellín',     '2026-02-03'), -- 2
('1034567890', 'Camila Torres',  'camila.torres@correo.com', '3205551234', 'Cali',         '2026-02-20'), -- 3
('1045678901', 'Julián Herrera', 'julian.herrera@correo.com','3014442211', 'Bogotá',       '2026-03-05'), -- 4
('1056789012', 'Valentina Ríos', 'vale.rios@correo.com',     '3157773344', 'Barranquilla', '2026-03-18'), -- 5
('1067890123', 'Santiago Mejía', 'santi.mejia@correo.com',   '3186665500', 'Medellín',     '2026-04-02'), -- 6
('1078901234', 'Natalia Pardo',  NULL,                       '3112229988', 'Bogotá',       '2026-04-25'), -- 7
('1089012345', 'Diego Castro',   'diego.castro@correo.com',  NULL,         'Bucaramanga',  '2026-05-10'); -- 8 (sin pedidos)

INSERT INTO pedidos (id_cliente, fecha, estado) VALUES
(1, '2026-03-01 10:15:00', 'enviado'),    -- 1
(2, '2026-03-04 16:40:00', 'enviado'),    -- 2
(1, '2026-03-20 09:05:00', 'pagado'),     -- 3
(3, '2026-04-02 11:30:00', 'enviado'),    -- 4
(4, '2026-04-15 18:20:00', 'cancelado'),  -- 5
(5, '2026-05-03 14:00:00', 'pagado'),     -- 6
(2, '2026-05-21 08:45:00', 'pendiente'),  -- 7
(6, '2026-06-07 19:10:00', 'enviado'),    -- 8
(7, '2026-06-30 12:00:00', 'pendiente'),  -- 9
(1, '2026-07-12 17:25:00', 'pagado');     -- 10

INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES
(1, 1, 1, 2499000.00),
(1, 3, 1,   59900.00),
(2, 4, 1,  189900.00),
(2, 3, 2,   59900.00),
(3, 7, 2,  229900.00),
(4, 2, 1, 2199000.00),
(4, 5, 2,  599000.00),
(4, 8, 3,   39900.00),
(5, 6, 1, 1149000.00),
(6, 10, 1, 319900.00),
(6, 9, 1,  259900.00),
(7, 1, 1, 2499000.00),
(7, 4, 1,  189900.00),
(8, 5, 1,  599000.00),
(8, 3, 1,   59900.00),
(8, 7, 1,  229900.00),
(9, 8, 5,   39900.00),
(10, 9, 2, 259900.00),
(10, 10, 1, 319900.00);
