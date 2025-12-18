// cafetec-backend/models/index.js - VERSIÓN SIMPLIFICADA
const Usuario = require('./Usuario');
const Rol = require('./Rol');
const Categoria = require('./Categoria');
const Producto = require('./Producto');
const HorarioDisponible = require('./HorarioDisponible');
const EstadoPedido = require('./EstadoPedido');
const Pedido = require('./Pedido'); // ✅ Asegúrate que el archivo existe
const DetallePedido = require('./DetallePedido');
const HistorialEstado = require('./HistorialEstado');
const MetodoPago = require('./MetodoPago');
const Venta = require('./Venta');

// Verifica que Pedido sea una función/objeto válido
console.log('🔍 Verificando modelo Pedido:', typeof Pedido);

// ✅ Primero define todos los modelos
const models = {
  Usuario,
  Rol,
  Categoria,
  Producto,
  HorarioDisponible,
  EstadoPedido,
  Pedido,
  DetallePedido,
  HistorialEstado,
  MetodoPago,
  Venta
};

// ✅ Solo si Pedido es válido, establecer relaciones
if (typeof Pedido === 'function' || typeof Pedido === 'object') {
  // Relaciones Usuario-Rol
  Usuario.belongsToMany(Rol, { 
    through: 'usuarios_roles', 
    foreignKey: 'id_usuario', 
    otherKey: 'id_rol' 
  });
  Rol.belongsToMany(Usuario, { 
    through: 'usuarios_roles', 
    foreignKey: 'id_rol', 
    otherKey: 'id_usuario' 
  });

  // Relaciones Categoria-Producto
  Producto.belongsTo(Categoria, { 
    foreignKey: 'id_categoria' 
  });
  Categoria.hasMany(Producto, { 
    foreignKey: 'id_categoria' 
  });

  // Relaciones Pedido
  Pedido.belongsTo(Usuario, { 
    foreignKey: 'id_usuario' 
  });
  Usuario.hasMany(Pedido, { 
    foreignKey: 'id_usuario' 
  });

  Pedido.belongsTo(HorarioDisponible, { 
    foreignKey: 'id_horario' 
  });
  HorarioDisponible.hasMany(Pedido, { 
    foreignKey: 'id_horario' 
  });

  Pedido.belongsTo(EstadoPedido, { 
    foreignKey: 'id_estado' 
  });
  EstadoPedido.hasMany(Pedido, { 
    foreignKey: 'id_estado' 
  });

  // Relaciones DetallePedido
  Pedido.belongsToMany(Producto, { 
    through: DetallePedido,
    foreignKey: 'id_pedido',
    otherKey: 'id_producto'
  });
  Producto.belongsToMany(Pedido, { 
    through: DetallePedido,
    foreignKey: 'id_producto',
    otherKey: 'id_pedido'
  });

  DetallePedido.belongsTo(Pedido, { 
    foreignKey: 'id_pedido' 
  });
  DetallePedido.belongsTo(Producto, { 
    foreignKey: 'id_producto' 
  });

  Pedido.hasMany(DetallePedido, { 
    foreignKey: 'id_pedido' 
  });
  Producto.hasMany(DetallePedido, { 
    foreignKey: 'id_producto' 
  });

  // Relaciones HistorialEstado
  HistorialEstado.belongsTo(Pedido, { 
    foreignKey: 'id_pedido' 
  });
  Pedido.hasMany(HistorialEstado, { 
    foreignKey: 'id_pedido' 
  });

  // Relaciones Venta
  Venta.belongsTo(Pedido, { 
    foreignKey: 'id_pedido' 
  });
  Venta.belongsTo(MetodoPago, { 
    foreignKey: 'id_metodo' 
  });
  Venta.belongsTo(Usuario, { 
    foreignKey: 'id_usuario' 
  });

  Pedido.hasOne(Venta, { 
    foreignKey: 'id_pedido' 
  });
  MetodoPago.hasMany(Venta, { 
    foreignKey: 'id_metodo' 
  });
  Usuario.hasMany(Venta, { 
    foreignKey: 'id_usuario' 
  });
} else {
  console.error('❌ ERROR: Pedido no es un modelo válido');
}

module.exports = models;