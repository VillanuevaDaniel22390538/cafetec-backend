const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MetodoPago = sequelize.define('metodos_pago', {
  id_metodo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_metodo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'metodos_pago',
  timestamps: false
});

module.exports = MetodoPago;