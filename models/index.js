const Usuario = require('./Usuario');
const Rol = require('./Rol');
const Categoria = require('./Categoria');
const Producto = require('./Producto');
const HorarioDisponible = require('./HorarioDisponible');
const EstadoPedido = require('./EstadoPedido');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');
const HistorialEstado = require('./HistorialEstado');
const MetodoPago = require('./MetodoPago');
const Venta = require('./Venta');

Usuario.belongsToMany(Rol, { through: 'usuarios_roles', foreignKey: 'id_usuario' });
Rol.belongsToMany(Usuario, { through: 'usuarios_roles', foreignKey: 'id_rol' });

Producto.belongsTo(Categoria, { foreignKey: 'id_categoria' });
Categoria.hasMany(Producto, { foreignKey: 'id_categoria' });

Pedido.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Pedido.belongsTo(HorarioDisponible, { foreignKey: 'id_horario' });
Pedido.belongsTo(EstadoPedido, { foreignKey: 'id_estado' });

DetallePedido.belongsTo(Pedido, { foreignKey: 'id_pedido' });
DetallePedido.belongsTo(Producto, { foreignKey: 'id_producto' });

HistorialEstado.belongsTo(Pedido, { foreignKey: 'id_pedido' });

Venta.belongsTo(Pedido, { foreignKey: 'id_pedido' });
Venta.belongsTo(MetodoPago, { foreignKey: 'id_metodo' });

module.exports = {
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