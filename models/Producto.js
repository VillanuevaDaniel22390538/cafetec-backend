// cafetec-backend/models/Producto.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define('Producto', {
  id_producto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: { // ✅ Esto en el código
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'nombre_producto' // ✅ Pero en la BD es nombre_producto
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  id_categoria: {
    type: DataTypes.INTEGER
  },
  imagen_url: {
    type: DataTypes.STRING(255)
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'productos',
  timestamps: false,
  underscored: true
});

module.exports = Producto;