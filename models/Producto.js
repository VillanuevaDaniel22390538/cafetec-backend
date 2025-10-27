const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define('productos', {
  id_producto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_producto: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false
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
    defaultValue: 999
  }
}, {
  tableName: 'productos',
  timestamps: false
});

module.exports = Producto;