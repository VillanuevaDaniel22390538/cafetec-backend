-- ==========================================================
-- CaféTec - Script SQL completo para PostgreSQL
-- Base de datos: cafeproject
-- Fecha: Octubre 2025
-- ==========================================================

-- 1. Tabla: roles
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

-- 2. Tabla: usuarios
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    fecha_registro TIMESTAMP DEFAULT NOW(),
    activo BOOLEAN DEFAULT TRUE
);

-- 3. Tabla: usuarios_roles (relación muchos a muchos)
CREATE TABLE usuarios_roles (
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_rol INT NOT NULL REFERENCES roles(id_rol) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id_usuario, id_rol)
);

-- 4. Tabla: categorias
CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- 5. Tabla: productos
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    id_categoria INT NOT NULL REFERENCES categorias(id_categoria) ON DELETE SET NULL,
    imagen_url VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    stock INT DEFAULT 999
);

-- 6. Tabla: horarios_disponibles
CREATE TABLE horarios_disponibles (
    id_horario SERIAL PRIMARY KEY,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL CHECK (hora_fin > hora_inicio),
    capacidad_maxima INT DEFAULT 10 CHECK (capacidad_maxima > 0),
    activo BOOLEAN DEFAULT TRUE
);

-- 7. Tabla: estados_pedido
CREATE TABLE estados_pedido (
    id_estado SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    color_hex VARCHAR(7)
);

-- 8. Tabla: pedidos
CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_horario INT NOT NULL REFERENCES horarios_disponibles(id_horario) ON DELETE RESTRICT,
    id_estado INT NOT NULL REFERENCES estados_pedido(id_estado) ON DELETE RESTRICT,
    fecha_pedido TIMESTAMP DEFAULT NOW(),
    hora_programada TIMESTAMP NOT NULL,
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    notas TEXT
);

-- 9. Tabla: detalle_pedido
CREATE TABLE detalle_pedido (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto INT NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0)
);

-- 10. Tabla: historial_estados_pedido
CREATE TABLE historial_estados_pedido (
    id_historial SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_estado_anterior INT REFERENCES estados_pedido(id_estado),
    id_estado_nuevo INT NOT NULL REFERENCES estados_pedido(id_estado),
    fecha_cambio TIMESTAMP DEFAULT NOW(),
    cambiado_por INT REFERENCES usuarios(id_usuario),
    nota_cambio TEXT
);

-- 11. Tabla: metodos_pago
CREATE TABLE metodos_pago (
    id_metodo SERIAL PRIMARY KEY,
    nombre_metodo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- 12. Tabla: ventas
CREATE TABLE ventas (
    id_venta SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_metodo INT NOT NULL REFERENCES metodos_pago(id_metodo) ON DELETE RESTRICT,
    monto_pagado DECIMAL(10,2) NOT NULL CHECK (monto_pagado >= 0),
    fecha_pago TIMESTAMP DEFAULT NOW(),
    referencia_pago VARCHAR(100) NULL,
    estado_pago VARCHAR(20) DEFAULT 'completado' CHECK (estado_pago IN ('pendiente', 'completado', 'fallido', 'reembolsado')),
    notas TEXT
);

-- ==========================================================
-- DATOS INICIALES (Semillas / Seeds)
-- ==========================================================

-- Roles
INSERT INTO roles (nombre_rol, descripcion) VALUES
('estudiante', 'Usuario regular que hace pedidos'),
('administrador', 'Gestiona pedidos, productos y pagos');

-- Estados de pedido
INSERT INTO estados_pedido (nombre_estado, descripcion, color_hex) VALUES
('Pendiente', 'Pedido recibido, pendiente de preparación', '#6c757d'),
('Preparando', 'Pedido en proceso de preparación', '#007bff'),
('Listo', 'Pedido listo para recoger', '#28a745'),
('Entregado', 'Pedido entregado al cliente', '#155724'),
('Cancelado', 'Pedido cancelado', '#dc3545');

-- Categorías
INSERT INTO categorias (nombre_categoria, descripcion) VALUES
('Bebidas', 'Cafés, jugos, refrescos'),
('Snacks', 'Botanas, pasteles, sandwiches'),
('Combos', 'Ofertas con descuento'),
('Promociones', 'Productos en oferta temporal');

-- Horarios disponibles
INSERT INTO horarios_disponibles (hora_inicio, hora_fin, capacidad_maxima) VALUES
('11:00:00', '12:00:00', 10),
('12:00:00', '13:00:00', 15),
('13:00:00', '14:00:00', 15),
('14:00:00', '15:00:00', 8);

-- Métodos de pago
INSERT INTO metodos_pago (nombre_metodo, descripcion) VALUES
('Efectivo', 'Pago en efectivo al recoger'),
('Tarjeta Débito', 'Pago con tarjeta de débito'),
('Tarjeta Crédito', 'Pago con tarjeta de crédito'),
('Transferencia', 'Pago por transferencia bancaria');

-- ==========================================================
-- ¡Base de datos CaféTec lista para usar!
-- ==========================================================