// cafetec-backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const adminController = require('../controllers/adminController'); 

// Rutas específicas para administradores
router.get('/pedidos', auth, isAdmin, adminController.getPedidosAdmin);

// Obtener detalles completos de un pedido específico
router.get('/pedidos/:id', auth, isAdmin, adminController.getPedidoDetalles);

// Ruta para obtener estadísticas del dashboard
router.get('/dashboard/stats', auth, isAdmin, adminController.getDashboardStats);

module.exports = router;