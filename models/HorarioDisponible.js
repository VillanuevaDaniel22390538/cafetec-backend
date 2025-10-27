const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const HorarioDisponible = sequelize.define('horarios_disponibles', {
  id_horario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false
  },
  hora_fin: {
    type: DataTypes.TIME,
    allowNull: false
  },
  capacidad_maxima: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    validate: {
      min: 1
    }
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'horarios_disponibles',
  timestamps: false
});

module.exports = HorarioDisponible;