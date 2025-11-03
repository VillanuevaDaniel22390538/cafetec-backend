// backend/routes/upload.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Carpeta donde se guardarán las imágenes
const uploadDir = path.join(__dirname, '..', 'uploads', 'productos');

// Crear carpeta si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

// Ruta: POST /api/upload
router.post('/', upload.single('imagen'), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No se subió ningún archivo' });

  // Generar URL accesible públicamente
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/productos/${req.file.filename}`;
  res.json({ url: imageUrl });
});

module.exports = router;
