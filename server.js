// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const sequelize = require('./config/db');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

//  Verificar o crear carpetas para subir imágenes
const uploadPath = path.join(__dirname, 'uploads', 'productos');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log('📁 Carpeta creada:', uploadPath);
}

// Middlewares base
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/adminRoutes'); // ✅ NUEVA RUTA AGREGADA

//  Asignar rutas base
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes); // ✅ NUEVA RUTA AGREGADA

//  Ruta raíz
app.get('/', (req, res) => {
  res.json({ mensaje: 'Bienvenido a CaféTec API' });
});

//  Conexión a la base de datos y servidor
sequelize.authenticate()
  .then(() => {
    console.log(' Conexión a PostgreSQL establecida.');
    app.listen(PORT, () => {
      console.log(` Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error(' Error al conectar con la base de datos:', err);
  });

//  Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).json({ msg: 'Algo salió mal en el servidor.' });
});