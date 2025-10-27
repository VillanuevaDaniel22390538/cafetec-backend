const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController'); 
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const auth = require('../middleware/auth'); 

router.post(
  '/register',
  [
    body('nombre', 'Nombre es requerido').not().isEmpty(),
    body('email', 'Email válido es requerido').isEmail(),
    body('contrasena', 'Contraseña debe tener al menos 6 caracteres').isLength({ min: 6 })
  ],
  handleValidationErrors,
  register
);

router.post(
  '/login',
  [
    body('email', 'Email válido es requerido').isEmail(),
    body('contrasena', 'Contraseña es requerida').exists()
  ],
  handleValidationErrors,
  login
);

router.get('/profile', auth, getProfile); // Ruta protegida para obtener perfil
module.exports = router;