// models/Rol.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Rol = sequelize.define('roles', {
  id_rol: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_rol: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'roles',
  timestamps: false
});

Rol.belongsToMany(require('./Usuario'), { through: 'usuarios_roles', foreignKey: 'id_rol' });

module.exports = Rol;