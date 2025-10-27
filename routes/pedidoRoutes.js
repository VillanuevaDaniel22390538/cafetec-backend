const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { crearPedido, getPedidosUsuario, actualizarEstadoPedido, getHorariosDisponibles } = require('../controllers/pedidoController');

router.post('/', auth, crearPedido);
router.get('/', auth, getPedidosUsuario);
router.put('/:id/estado', auth, actualizarEstadoPedido); 
router.get('/horarios/disponibles', getHorariosDisponibles); 

module.exports = router;