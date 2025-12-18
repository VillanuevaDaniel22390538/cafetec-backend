// cafetec-backend/controllers/pedidoController.js
const { 
  Pedido, 
  DetallePedido, 
  HorarioDisponible, 
  Usuario, 
  Producto, 
  HistorialEstado, 
  EstadoPedido, 
  Rol 
} = require('../models');

// ============================================
// FUNCIÓN AUXILIAR: Verificar si es administrador
// ============================================
const esUsuarioAdmin = async (idUsuario) => {
  try {
    const usuario = await Usuario.findByPk(idUsuario, {
      include: [{
        model: Rol,
        through: { attributes: [] },
        where: { nombre_rol: 'administrador' }
      }]
    });
    return !!usuario;
  } catch (err) {
    console.error('❌ Error en esUsuarioAdmin:', err);
    return false;
  }
};

// ============================================
// CLIENTE: Crear un nuevo pedido
// POST /api/pedidos
// ============================================
exports.crearPedido = async (req, res) => {
  const { id_horario, productos, notas } = req.body;
  const id_usuario = req.user.id;

  console.log(`🛒 Creando pedido para usuario #${id_usuario}`, { id_horario, productos });

  try {
    // 1. Verificar horario
    const horario = await HorarioDisponible.findByPk(id_horario);
    if (!horario || !horario.activo) {
      return res.status(400).json({ 
        success: false,
        msg: 'Horario no válido o inactivo.' 
      });
    }

    // 2. Verificar capacidad del horario
    const pedidosEnHorario = await Pedido.count({
      where: { 
        id_horario,
        id_estado: [1, 2, 3] // Solo pedidos activos (pendiente, preparación, listo)
      }
    });
    
    if (pedidosEnHorario >= horario.capacidad_maxima) {
      return res.status(400).json({ 
        success: false,
        msg: 'Horario lleno. Por favor, elige otro horario disponible.' 
      });
    }

    // 3. Calcular total y verificar productos
    let total = 0;
    const detalles = [];
    
    for (const item of productos) {
      const producto = await Producto.findByPk(item.id_producto);
      if (!producto || !producto.activo) {
        return res.status(400).json({ 
          success: false,
          msg: `Producto no disponible: ${item.id_producto}` 
        });
      }
      
      if (producto.stock !== null && producto.stock < item.cantidad) {
        return res.status(400).json({ 
          success: false,
          msg: `Stock insuficiente para: ${producto.nombre_producto}. Disponible: ${producto.stock}` 
        });
      }
      
      const subtotal = parseFloat(producto.precio) * item.cantidad;
      total += subtotal;
      detalles.push({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: parseFloat(producto.precio),
        subtotal
      });
    }

    // 4. Crear pedido
    const pedido = await Pedido.create({
      id_usuario,
      id_horario,
      id_estado: 1, // Estado inicial: Pendiente
      fecha_pedido: new Date(),
      hora_programada: new Date(), // TODO: ajustar según horario seleccionado
      total: parseFloat(total.toFixed(2)),
      notas: notas || null,
      pagado: false,
      metodo_pago: null,
      updatedat: new Date()
    });

    // 5. Crear detalles del pedido
    for (const detalle of detalles) {
      await DetallePedido.create({
        id_pedido: pedido.id_pedido,
        ...detalle
      });
      
      // Actualizar stock si es necesario
      if (detalle.cantidad > 0) {
        const producto = await Producto.findByPk(detalle.id_producto);
        if (producto.stock !== null) {
          await producto.update({
            stock: producto.stock - detalle.cantidad
          });
        }
      }
    }

    console.log(`✅ Pedido #${pedido.id_pedido} creado exitosamente. Total: $${total}`);
    
    res.status(201).json({ 
      success: true,
      msg: 'Pedido creado exitosamente.',
      data: {
        id_pedido: pedido.id_pedido,
        total: pedido.total,
        fecha_pedido: pedido.fecha_pedido
      }
    });
  } catch (err) {
    console.error('❌ Error crearPedido:', err);
    res.status(500).json({ 
      success: false,
      msg: 'Error en el servidor al crear pedido',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ============================================
// CLIENTE: Obtener MIS pedidos
// GET /api/pedidos (para clientes) o /api/pedidos/mis-pedidos
// ============================================
exports.getMisPedidosCliente = async (req, res) => {
  try {
    console.log(`📋 Obteniendo pedidos del cliente #${req.user.id}`);
    
    const pedidos = await Pedido.findAll({
      where: { id_usuario: req.user.id },
      order: [['fecha_pedido', 'DESC']],
      include: [
        { 
          model: Usuario, 
          attributes: ['id_usuario', 'nombre', 'email', 'telefono'] 
        },
        { 
          model: HorarioDisponible, 
          attributes: ['id_horario', 'hora_inicio', 'hora_fin', 'capacidad_maxima'] 
        },
        { 
          model: EstadoPedido, 
          attributes: ['id_estado', 'nombre_estado', 'color_hex', 'descripcion'] 
        }
      ]
    });

    // Enriquecer con detalles de productos
    const pedidosConDetalles = await Promise.all(
      pedidos.map(async (pedido) => {
        const detalles = await DetallePedido.findAll({
          where: { id_pedido: pedido.id_pedido },
          include: [{ 
            model: Producto, 
            attributes: ['id_producto', 'nombre_producto', 'descripcion', 'imagen_url', 'precio'] 
          }]
        });

        return {
          id_pedido: pedido.id_pedido,
          id_usuario: pedido.id_usuario,
          id_horario: pedido.id_horario,
          id_estado: pedido.id_estado,
          total: parseFloat(pedido.total),
          notas: pedido.notas,
          pagado: pedido.pagado,
          metodo_pago: pedido.metodo_pago,
          fecha_pedido: pedido.fecha_pedido,
          hora_programada: pedido.hora_programada,
          updatedat: pedido.updatedat,
          usuario: pedido.Usuario,
          horario: pedido.HorarioDisponible,
          estado: pedido.EstadoPedido,
          productos: detalles.map(det => ({
            id_producto: det.Producto.id_producto,
            nombre: det.Producto.nombre_producto,
            descripcion: det.Producto.descripcion,
            imagen_url: det.Producto.imagen_url,
            cantidad: det.cantidad,
            precio_unitario: det.precio_unitario,
            subtotal: det.subtotal,
            precio_actual: det.Producto.precio
          }))
        };
      })
    );

    console.log(`✅ Encontrados ${pedidosConDetalles.length} pedidos para cliente #${req.user.id}`);
    
    res.json({ 
      success: true, 
      count: pedidosConDetalles.length,
      data: pedidosConDetalles 
    });
  } catch (error) {
    console.error('❌ Error getMisPedidosCliente:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error al cargar tus pedidos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ADMIN: Obtener TODOS los pedidos
// GET /api/pedidos (para admins) o /api/pedidos/admin/todos
// ============================================
exports.getPedidosAdmin = async (req, res) => {
  try {
    console.log(`👑 Admin #${req.user?.id || 'unknown'} solicitando todos los pedidos`);
    
    const pedidos = await Pedido.findAll({
      order: [['fecha_pedido', 'DESC']],
      include: [
        { 
          model: Usuario, 
          attributes: ['id_usuario', 'nombre', 'email', 'telefono'] 
        },
        { 
          model: HorarioDisponible, 
          attributes: ['id_horario', 'hora_inicio', 'hora_fin'] 
        },
        { 
          model: EstadoPedido, 
          attributes: ['id_estado', 'nombre_estado', 'color_hex'] 
        }
      ]
    });

    const pedidosConDetalles = await Promise.all(
      pedidos.map(async (pedido) => {
        const detalles = await DetallePedido.findAll({
          where: { id_pedido: pedido.id_pedido },
          include: [{ 
            model: Producto, 
            attributes: ['id_producto', 'nombre_producto'] 
          }]
        });
        
        return {
          id_pedido: pedido.id_pedido,
          id_usuario: pedido.id_usuario,
          id_estado: pedido.id_estado,
          total: parseFloat(pedido.total),
          pagado: pedido.pagado,
          metodo_pago: pedido.metodo_pago,
          fecha_pedido: pedido.fecha_pedido,
          hora_programada: pedido.hora_programada,
          updatedat: pedido.updatedat,
          usuario: {
            id_usuario: pedido.Usuario?.id_usuario,
            nombre: pedido.Usuario?.nombre,
            email: pedido.Usuario?.email
          },
          horario: pedido.HorarioDisponible,
          estado: pedido.EstadoPedido,
          productos: detalles.map(d => ({
            id_producto: d.Producto?.id_producto,
            nombre: d.Producto?.nombre_producto,
            cantidad: d.cantidad
          })),
          productos_resumen: detalles.map(d => `${d.cantidad}x ${d.Producto?.nombre_producto}`).join(', ')
        };
      })
    );

    console.log(`✅ Admin: Encontrados ${pedidosConDetalles.length} pedidos totales`);
    
    res.json({ 
      success: true, 
      count: pedidosConDetalles.length,
      data: pedidosConDetalles 
    });
  } catch (error) {
    console.error('❌ Error getPedidosAdmin:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error al cargar todos los pedidos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// CLIENTE y ADMIN: Obtener detalles de UN pedido
// GET /api/pedidos/:id
// ============================================
exports.getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const esAdmin = await esUsuarioAdmin(userId);

    console.log(`🔍 Buscando pedido #${id} (Usuario: ${userId}, Admin: ${esAdmin})`);

    const whereCondition = esAdmin 
      ? { id_pedido: id } 
      : { id_pedido: id, id_usuario: userId };

    const pedido = await Pedido.findOne({
      where: whereCondition,
      include: [
        { 
          model: Usuario, 
          attributes: ['id_usuario', 'nombre', 'email', 'telefono'] 
        },
        { 
          model: HorarioDisponible, 
          attributes: ['id_horario', 'hora_inicio', 'hora_fin', 'capacidad_maxima'] 
        },
        { 
          model: EstadoPedido, 
          attributes: ['id_estado', 'nombre_estado', 'color_hex', 'descripcion'] 
        }
      ]
    });

    if (!pedido) {
      return res.status(404).json({ 
        success: false, 
        msg: 'Pedido no encontrado o no tienes permisos para verlo.' 
      });
    }

    const detalles = await DetallePedido.findAll({
      where: { id_pedido: pedido.id_pedido },
      include: [{ 
        model: Producto, 
        attributes: ['id_producto', 'nombre_producto', 'descripcion', 'imagen_url', 'precio'] 
      }]
    });

    // Historial de estados (solo para admin)
    let historial = [];
    if (esAdmin) {
      historial = await HistorialEstado.findAll({
        where: { id_pedido: pedido.id_pedido },
        include: [{ 
          model: Usuario, 
          as: 'CambiadoPor', 
          attributes: ['id_usuario', 'nombre', 'email'] 
        }],
        order: [['fecha_cambio', 'DESC']]
      });
    }

    const response = {
      success: true,
      data: {
        id_pedido: pedido.id_pedido,
        id_usuario: pedido.id_usuario,
        id_horario: pedido.id_horario,
        id_estado: pedido.id_estado,
        total: parseFloat(pedido.total),
        notas: pedido.notas,
        pagado: pedido.pagado,
        metodo_pago: pedido.metodo_pago,
        fecha_pedido: pedido.fecha_pedido,
        hora_programada: pedido.hora_programada,
        updatedat: pedido.updatedat,
        usuario: pedido.Usuario,
        horario: pedido.HorarioDisponible,
        estado: pedido.EstadoPedido,
        productos: detalles.map(det => ({
          id_producto: det.Producto.id_producto,
          nombre: det.Producto.nombre_producto,
          descripcion: det.Producto.descripcion,
          imagen_url: det.Producto.imagen_url,
          cantidad: det.cantidad,
          precio_unitario: det.precio_unitario,
          subtotal: det.subtotal,
          precio_actual: det.Producto.precio
        })),
        historial: historial.map(h => ({
          id_historial: h.id_historial,
          id_estado_anterior: h.id_estado_anterior,
          id_estado_nuevo: h.id_estado_nuevo,
          fecha_cambio: h.fecha_cambio,
          cambiado_por: h.CambiadoPor ? {
            id_usuario: h.CambiadoPor.id_usuario,
            nombre: h.CambiadoPor.nombre
          } : { nombre: 'Sistema' },
          nota_cambio: h.nota_cambio
        })),
        permisos: {
          puede_editar: esAdmin,
          puede_cambiar_estado: esAdmin,
          puede_ver_historial: esAdmin
        }
      }
    };

    console.log(`✅ Pedido #${id} cargado exitosamente`);
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error getPedidoById:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error al cargar el pedido',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// CLIENTE: Obtener SOLO el estado (para polling)
// GET /api/pedidos/:id/estado
// ============================================
exports.getPedidoEstado = async (req, res) => {
  try {
    const pedido = await Pedido.findOne({
      where: { 
        id_pedido: req.params.id, 
        id_usuario: req.user.id 
      },
      include: [{ 
        model: EstadoPedido, 
        attributes: ['nombre_estado', 'color_hex'] 
      }],
      attributes: ['id_pedido', 'id_estado', 'pagado', 'updatedat', 'metodo_pago', 'fecha_pedido', 'total']
    });
    
    if (!pedido) {
      return res.status(404).json({ 
        success: false, 
        msg: 'Pedido no encontrado' 
      });
    }
    
    res.json({
      success: true,
      data: {
        id_pedido: pedido.id_pedido,
        id_estado: pedido.id_estado,
        estado: pedido.EstadoPedido?.nombre_estado || 'Pendiente',
        color_hex: pedido.EstadoPedido?.color_hex || '#6c757d',
        pagado: pedido.pagado,
        total: parseFloat(pedido.total),
        metodo_pago: pedido.metodo_pago,
        fecha_pedido: pedido.fecha_pedido,
        updatedat: pedido.updatedat,
        ultima_actualizacion: pedido.updatedat
      }
    });
  } catch (error) {
    console.error('❌ Error getPedidoEstado:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error al obtener estado del pedido' 
    });
  }
};

// ============================================
// CLIENTE: Registrar pago
// POST /api/pedidos/:id/pagar
// ============================================
exports.registrarPago = async (req, res) => {
  try {
    const { metodo_pago, referencia_pago } = req.body;
    const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
    
    // Validar método de pago
    if (!metodosValidos.includes(metodo_pago)) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Método de pago no válido. Opciones: efectivo, tarjeta, transferencia.' 
      });
    }
    
    // Buscar pedido
    const pedido = await Pedido.findOne({
      where: { 
        id_pedido: req.params.id, 
        id_usuario: req.user.id 
      }
    });
    
    if (!pedido) {
      return res.status(404).json({ 
        success: false, 
        msg: 'Pedido no encontrado' 
      });
    }
    
    // Validar si ya está pagado
    if (pedido.pagado) {
      return res.status(400).json({ 
        success: false, 
        msg: 'El pedido ya ha sido pagado anteriormente.' 
      });
    }
    
    // Validar estado del pedido
    if (pedido.id_estado === 4) { // Cancelado
      return res.status(400).json({ 
        success: false, 
        msg: 'No se puede pagar un pedido cancelado.' 
      });
    }
    
    // Actualizar pedido
    const nuevoEstado = metodo_pago !== 'efectivo' ? 2 : 1; // 2=Confirmado, 1=Pendiente (efectivo)
    await pedido.update({
      pagado: true,
      metodo_pago,
      id_estado: nuevoEstado,
      updatedat: new Date()
    });
    
    // Registrar en historial si es admin quien cambia (aunque normalmente es el cliente)
    if (req.user.id !== pedido.id_usuario) {
      await HistorialEstado.create({
        id_pedido: pedido.id_pedido,
        id_estado_anterior: pedido.id_estado,
        id_estado_nuevo: nuevoEstado,
        cambiado_por: req.user.id,
        nota_cambio: `Pago registrado via ${metodo_pago}`
      });
    }
    
    console.log(`💰 Pago registrado para pedido #${pedido.id_pedido} via ${metodo_pago}`);
    
    res.json({ 
      success: true, 
      msg: 'Pago registrado exitosamente', 
      data: { 
        id_pedido: pedido.id_pedido, 
        pagado: true,
        metodo_pago,
        nuevo_estado: nuevoEstado,
        fecha_pago: new Date()
      } 
    });
  } catch (error) {
    console.error('❌ Error registrarPago:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error al registrar el pago',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ADMIN: Actualizar estado de pedido
// PUT /api/pedidos/:id/estado
// ============================================
exports.actualizarEstadoPedido = async (req, res) => {
  const { id_estado, nota_cambio } = req.body;
  const { id } = req.params;
  const id_admin = req.user.id;

  try {
    console.log(`🔄 Admin #${id_admin} actualizando estado del pedido #${id} a ${id_estado}`);
    
    // Validar que el estado exista
    const estadoValido = await EstadoPedido.findByPk(id_estado);
    if (!estadoValido) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Estado de pedido no válido.' 
      });
    }
    
    // Buscar pedido
    const pedido = await Pedido.findByPk(id);
    if (!pedido) {
      return res.status(404).json({ 
        success: false, 
        msg: 'Pedido no encontrado.' 
      });
    }
    
    // Verificar si el estado es diferente
    if (pedido.id_estado === parseInt(id_estado)) {
      return res.status(400).json({ 
        success: false, 
        msg: 'El pedido ya se encuentra en este estado.' 
      });
    }
    
    const estadoAnterior = pedido.id_estado;
    
    // Actualizar pedido
    await pedido.update({ 
      id_estado, 
      updatedat: new Date() 
    });
    
    // Registrar en historial
    await HistorialEstado.create({
      id_pedido: id,
      id_estado_anterior: estadoAnterior,
      id_estado_nuevo: id_estado,
      fecha_cambio: new Date(),
      cambiado_por: id_admin,
      nota_cambio: nota_cambio || `Estado cambiado de ${estadoAnterior} a ${id_estado}`
    });
    
    console.log(`✅ Estado del pedido #${id} actualizado: ${estadoAnterior} → ${id_estado}`);
    
    res.json({ 
      success: true, 
      msg: 'Estado actualizado correctamente.',
      data: {
        id_pedido: pedido.id_pedido,
        estado_anterior: estadoAnterior,
        estado_nuevo: id_estado,
        nombre_estado: estadoValido.nombre_estado,
        fecha_actualizacion: new Date()
      }
    });
  } catch (err) {
    console.error('❌ Error actualizarEstadoPedido:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Error al actualizar el estado del pedido',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ============================================
// PÚBLICO: Obtener horarios disponibles
// GET /api/pedidos/horarios/disponibles
// ============================================
exports.getHorariosDisponibles = async (req, res) => {
  try {
    console.log('🕐 Obteniendo horarios disponibles...');
    
    const horarios = await HorarioDisponible.findAll({ 
      where: { activo: true },
      order: [['hora_inicio', 'ASC']]
    });
    
    const horariosConCapacidad = await Promise.all(
      horarios.map(async (h) => {
        const count = await Pedido.count({ 
          where: { 
            id_horario: h.id_horario, 
            id_estado: [1, 2, 3] // Estados activos
          }
        });
        
        const disponible = count < h.capacidad_maxima;
        const espacios = h.capacidad_maxima - count;
        
        return {
          id_horario: h.id_horario,
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          capacidad_maxima: h.capacidad_maxima,
          activo: h.activo,
          pedidos_actuales: count,
          espacios_disponibles: espacios > 0 ? espacios : 0,
          disponible: disponible,
          porcentaje_ocupacion: Math.round((count / h.capacidad_maxima) * 100),
          recomendacion: espacios > 2 ? 'Disponible' : 
                       espacios > 0 ? 'Últimos lugares' : 
                       'Completo'
        };
      })
    );
    
    const horariosDisponibles = horariosConCapacidad.filter(h => h.disponible);
    
    console.log(`✅ ${horariosDisponibles.length}/${horarios.length} horarios disponibles`);
    
    res.json({ 
      success: true, 
      count: horariosDisponibles.length,
      total: horarios.length,
      data: horariosDisponibles,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error getHorariosDisponibles:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Error al obtener horarios disponibles',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ============================================
// EXPORTAR FUNCIÓN AUXILIAR (IMPORTANTE)
// ============================================
exports.esUsuarioAdmin = esUsuarioAdmin;