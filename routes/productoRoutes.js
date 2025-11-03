// routes/productoRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const {
  getProductos,
  getProductoById,
  crearProducto,
  actualizarProducto,
  toggleActivo,
  getProductosAdmin,
  subirImagen
} = require('../controllers/productoController');

// Configuración de Multer para guardar imágenes en /uploads/productos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'productos'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `producto-${uniqueSuffix}${extension}`);
  },
});

// Validación del tipo de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpg, png, jpeg, webp, gif).'));
  }
};

const upload = multer({ storage, fileFilter });

//  Ruta para subir imágenes (Admin)
router.post('/upload', auth, isAdmin, upload.single('imagen'), subirImagen);

//  Rutas protegidas (solo administrador)
router.get('/admin', auth, isAdmin, getProductosAdmin);
router.post('/', auth, isAdmin, upload.single('imagen'), crearProducto);
router.put('/:id', auth, isAdmin, upload.single('imagen'), actualizarProducto);
router.patch('/:id/activo', auth, isAdmin, toggleActivo);

//  Rutas públicas (clientes)
router.get('/', getProductos);
router.get('/:id', getProductoById);

module.exports = router;
