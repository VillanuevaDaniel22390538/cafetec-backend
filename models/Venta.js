const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Venta = sequelize.define('ventas', {
  id_venta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_metodo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  monto_pagado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  fecha_pago: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  referencia_pago: {
    type: DataTypes.STRING(100)
  },
  estado_pago: {
    type: DataTypes.STRING(20),
    defaultValue: 'completado',
    validate: {
      isIn: [['pendiente', 'completado', 'fallido', 'reembolsado']]
    }
  },
  notas: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'ventas',
  timestamps: false
});

module.exports = Venta;