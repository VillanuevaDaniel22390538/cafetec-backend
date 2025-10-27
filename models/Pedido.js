const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Pedido = sequelize.define('pedidos', {
  id_pedido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_horario: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_estado: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_pedido: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  hora_programada: {
    type: DataTypes.DATE,
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  notas: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'pedidos',
  timestamps: false
});

module.exports = Pedido;