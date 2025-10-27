const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EstadoPedido = sequelize.define('estados_pedido', {
  id_estado: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_estado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  color_hex: {
    type: DataTypes.STRING(7)
  }
}, {
  tableName: 'estados_pedido',
  timestamps: false
});

module.exports = EstadoPedido;