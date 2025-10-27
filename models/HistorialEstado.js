const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const HistorialEstado = sequelize.define('historial_estados_pedido', {
  id_historial: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_estado_anterior: {
    type: DataTypes.INTEGER
  },
  id_estado_nuevo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_cambio: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  cambiado_por: {
    type: DataTypes.INTEGER
  },
  nota_cambio: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'historial_estados_pedido',
  timestamps: false
});

module.exports = HistorialEstado;