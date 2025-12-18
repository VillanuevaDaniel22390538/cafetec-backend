// cafetec-backend/routes/pedidoRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  crearPedido,
  getMisPedidosCliente,
  getPedidosAdmin,
  getPedidoById,
  getPedidoEstado,
  registrarPago,
  actualizarEstadoPedido,
  getHorariosDisponibles,
  esUsuarioAdmin
} = require('../controllers/pedidoController');

// ============================================
// RUTA PÚBLICA (sin autenticación)
// ============================================
router.get('/horarios/disponibles', getHorariosDisponibles);

// ============================================
// RUTA RAÍZ INTELIGENTE
// GET /api/pedidos - Decide según rol del usuario
// ============================================
router.get('/', auth, async (req, res) => {
  try {
    const admin = await esUsuarioAdmin(req.user.id);
    
    if (admin) {
      console.log(`📋 Admin #${req.user.id} viendo TODOS los pedidos`);
      return await getPedidosAdmin(req, res);
    } else {
      console.log(`🛒 Cliente #${req.user.id} viendo SUS pedidos`);
      return await getMisPedidosCliente(req, res);
    }
  } catch (error) {
    console.error('❌ Error en GET /api/pedidos:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error interno al cargar pedidos' 
    });
  }
});

// ============================================
// RUTAS PROTEGIDAS PARA CLIENTES
// ============================================

// Crear un nuevo pedido
// POST /api/pedidos
router.post('/', auth, crearPedido);

// Obtener mis pedidos (ruta explícita)
// GET /api/pedidos/mis-pedidos
router.get('/mis-pedidos', auth, getMisPedidosCliente);

// Obtener un pedido específico por ID
// GET /api/pedidos/:id
router.get('/:id', auth, getPedidoById);

// Obtener solo el estado de un pedido (para polling)
// GET /api/pedidos/:id/estado
router.get('/:id/estado', auth, getPedidoEstado);

// Registrar pago de un pedido
// POST /api/pedidos/:id/pagar
router.post('/:id/pagar', auth, registrarPago);

// ============================================
// RUTAS PROTEGIDAS PARA ADMINISTRADORES
// ============================================

// Obtener TODOS los pedidos (ruta explícita para admin)
// GET /api/pedidos/admin/todos
router.get('/admin/todos', auth, async (req, res) => {
  try {
    const admin = await esUsuarioAdmin(req.user.id);
    if (!admin) {
      return res.status(403).json({ 
        success: false, 
        msg: 'No autorizado. Solo administradores.' 
      });
    }
    return await getPedidosAdmin(req, res);
  } catch (error) {
    console.error('❌ Error en GET /api/pedidos/admin/todos:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error interno al cargar pedidos de admin' 
    });
  }
});

// Actualizar estado de un pedido (admin)
// PUT /api/pedidos/:id/estado
router.put('/:id/estado', auth, async (req, res) => {
  try {
    const admin = await esUsuarioAdmin(req.user.id);
    if (!admin) {
      return res.status(403).json({ 
        success: false, 
        msg: 'No autorizado. Solo administradores pueden cambiar estados.' 
      });
    }
    return await actualizarEstadoPedido(req, res);
  } catch (error) {
    console.error('❌ Error en PUT /api/pedidos/:id/estado:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error interno al actualizar estado' 
    });
  }
});

// ============================================
// RUTA DE VERIFICACIÓN (opcional, para debugging)
// ============================================
router.get('/check/rutas', auth, (req, res) => {
  res.json({
    success: true,
    rutas_disponibles: [
      'GET    /api/pedidos',
      'GET    /api/pedidos/horarios/disponibles',
      'POST   /api/pedidos',
      'GET    /api/pedidos/mis-pedidos',
      'GET    /api/pedidos/:id',
      'GET    /api/pedidos/:id/estado',
      'POST   /api/pedidos/:id/pagar',
      'GET    /api/pedidos/admin/todos',
      'PUT    /api/pedidos/:id/estado'
    ],
    usuario: {
      id: req.user.id,
      email: req.user.email,
      esAdmin: 'Verificar con esUsuarioAdmin()'
    }
  });
});

module.exports = router;