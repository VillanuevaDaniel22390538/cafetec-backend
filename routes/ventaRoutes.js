// cafetec-backend/routes/ventaRoutes.js
const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Rutas públicas
router.get('/metodos', ventaController.getMetodosPago);

// Rutas protegidas (solo admin para reportes)
router.get('/', auth, isAdmin, ventaController.getTodasVentas);
router.post('/', auth, isAdmin, ventaController.registrarVenta);
router.get('/pedido/:id_pedido', auth, isAdmin, ventaController.getVentasPorPedido);

// NUEVAS RUTAS PARA REPORTES
router.get('/reports/sales-summary', auth, isAdmin, ventaController.getSalesSummary);
router.get('/reports/sales-by-period', auth, isAdmin, ventaController.getSalesByPeriod);
router.get('/reports/top-products', auth, isAdmin, ventaController.getTopProducts);
router.get('/reports/payment-methods-stats', auth, isAdmin, ventaController.getPaymentMethodsStats);
router.get('/reports/filtered', auth, isAdmin, ventaController.getVentasFiltradas);

module.exports = router;