const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const sequelize = require('./config/db');
require('dotenv').config();

// Rutas
const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/ventas', ventaRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ mensaje: 'Bienvenido a CaféTec API' });
});

// Conectar a la base de datos y levantar servidor
sequelize.authenticate()
  .then(() => {
    console.log('Conexión a PostgreSQL establecida.');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar con la base de datos:', err);
  });

  // Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Algo salió mal en el servidor.' });
});

  