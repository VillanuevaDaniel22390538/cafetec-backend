const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { getMetodosPago, registrarVenta, getVentasPorPedido, getTodasVentas } = require('../controllers/ventaController');

// Métodos de pago (público)
router.get('/metodos', getMetodosPago);

// Rutas protegidas (solo admin)
router.post('/', auth, isAdmin, registrarVenta);
router.get('/', auth, isAdmin, getTodasVentas);
router.get('/pedido/:id_pedido', auth, isAdmin, getVentasPorPedido);

module.exports = router;