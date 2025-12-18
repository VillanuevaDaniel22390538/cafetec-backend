// cafetec-backend/models/Pedido.js - VERSIÓN FINAL
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Pedido = sequelize.define('Pedido', {
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
    allowNull: false,
    defaultValue: 1
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
    allowNull: false
  },
  notas: {
    type: DataTypes.TEXT
  },
  pagado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metodo_pago: {
    type: DataTypes.STRING(50)
  },
  updatedat: { // ✅ EXACTAMENTE como está en la BD (minúsculas)
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updatedat' // Esto es redundante pero explícito
  }
}, {
  tableName: 'pedidos',
  timestamps: false,
  // ✅ IMPORTANTE: Configuración para PostgreSQL
  underscored: true, // Convierte camelCase a snake_case
  createdAt: false, // No usar created_at automático
  updatedAt: 'updatedat' // Mapear updatedAt a updatedat
});

module.exports = Pedido;