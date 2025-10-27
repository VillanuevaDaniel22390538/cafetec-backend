const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Categoria = sequelize.define('categorias', {
  id_categoria: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_categoria: {
    type: DataTypes.STRING(100),
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
  tableName: 'categorias',
  timestamps: false
});

module.exports = Categoria;