const { Pedido, DetallePedido, HorarioDisponible, Usuario, Producto, HistorialEstado } = require('../models');

exports.crearPedido = async (req, res) => {
  const { id_horario, productos, notas } = req.body;
  const id_usuario = req.user.id;

  try {
    // Validar horario
    const horario = await HorarioDisponible.findByPk(id_horario);
    if (!horario || !horario.activo) {
      return res.status(400).json({ msg: 'Horario no válido.' });
    }

    //  Validar capacidad del horario
    const pedidosEnHorario = await Pedido.count({
      where: { id_horario: id_horario }
    });
    if (pedidosEnHorario >= horario.capacidad_maxima) {
      return res.status(400).json({ msg: 'Horario lleno. Elige otro.' });
    }

    // Calcular total y verificar productos
    let total = 0;
    const detalles = [];
    for (const item of productos) {
      const producto = await Producto.findByPk(item.id_producto);
      if (!producto || !producto.activo) {
        return res.status(400).json({ msg: `Producto no disponible: ${item.id_producto}` });
      }
      const subtotal = producto.precio * item.cantidad;
      total += subtotal;
      detalles.push({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: producto.precio,
        subtotal
      });
    }

    // Crear pedido (estado inicial: Pendiente = id 1)
    const pedido = await Pedido.create({
      id_usuario,
      id_horario,
      id_estado: 1,
      hora_programada: new Date(),
      total,
      notas
    });

    // Crear detalles
    for (const detalle of detalles) {
      await DetallePedido.create({
        id_pedido: pedido.id_pedido,
        ...detalle
      });
    }

    res.json({ msg: 'Pedido creado exitosamente.', id_pedido: pedido.id_pedido });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

exports.getPedidosUsuario = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      where: { id_usuario: req.user.id },
      order: [['fecha_pedido', 'DESC']],
      include: [
        { model: HorarioDisponible, attributes: ['hora_inicio', 'hora_fin'] },
        { model: DetallePedido, include: [{ model: Producto, attributes: ['nombre_producto'] }] }
      ]
    });
    res.json(pedidos);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

exports.actualizarEstadoPedido = async (req, res) => {
  const { id_estado } = req.body;
  const { id } = req.params;
  const id_admin = req.user.id;

  try {
    const pedido = await Pedido.findByPk(id);
    if (!pedido) return res.status(404).json({ msg: 'Pedido no encontrado.' });

    const estadoAnterior = pedido.id_estado;
    await pedido.update({ id_estado });

    // Registrar en historial
    await HistorialEstado.create({
      id_pedido: id,
      id_estado_anterior: estadoAnterior,
      id_estado_nuevo: id_estado,
      cambiado_por: id_admin
    });

    res.json({ msg: 'Estado actualizado correctamente.', pedido });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error al actualizar el estado.' });
  }
};

// Obtener horarios con capacidad
exports.getHorariosDisponibles = async (req, res) => {
  try {
    const horarios = await HorarioDisponible.findAll({
      where: { activo: true }
    });

    const horariosConCapacidad = [];
    for (const h of horarios) {
      const count = await Pedido.count({ where: { id_horario: h.id_horario } });
      if (count < h.capacidad_maxima) {
        horariosConCapacidad.push({
          ...h.toJSON(),
          espacios_disponibles: h.capacidad_maxima - count
        });
      }
    }

    res.json(horariosConCapacidad);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error al obtener horarios.' });
  }
};