const { Venta, Pedido, MetodoPago } = require('../models');

// Obtener todos los métodos de pago activos
exports.getMetodosPago = async (req, res) => {
  try {
    const metodos = await MetodoPago.findAll({
      where: { activo: true },
      attributes: ['id_metodo', 'nombre_metodo', 'descripcion']
    });
    res.json(metodos);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Registrar una venta (pago de un pedido)
exports.registrarVenta = async (req, res) => {
  const { id_pedido, id_metodo, referencia_pago, notas } = req.body;
  const id_admin = req.user.id; // asumimos que el admin está autenticado

  try {
    // Validar que el pedido exista
    const pedido = await Pedido.findByPk(id_pedido);
    if (!pedido) {
      return res.status(404).json({ msg: 'Pedido no encontrado.' });
    }

    // Validar método de pago
    const metodo = await MetodoPago.findByPk(id_metodo);
    if (!metodo || !metodo.activo) {
      return res.status(400).json({ msg: 'Método de pago no válido.' });
    }

    // Verificar que no se haya pagado ya (opcional, según reglas de negocio)
    const ventaExistente = await Venta.findOne({ where: { id_pedido } });
    if (ventaExistente) {
      return res.status(400).json({ msg: 'Este pedido ya ha sido pagado.' });
    }

    // Crear la venta
    const venta = await Venta.create({
      id_pedido,
      id_metodo,
      monto_pagado: pedido.total,
      referencia_pago: referencia_pago || null,
      notas: notas || null,
      estado_pago: 'completado'
    });

    // Opcional: actualizar estado del pedido a "Pagado" o "Entregado"
    // Aquí podrías hacer: await pedido.update({ id_estado: 4 }); // Entregado

    res.status(201).json({
      msg: 'Venta registrada exitosamente.',
      id_venta: venta.id_venta
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error al registrar la venta.' });
  }
};

// Obtener ventas por pedido (para el panel admin)
exports.getVentasPorPedido = async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      where: { id_pedido: req.params.id_pedido },
      include: [
        { model: MetodoPago, attributes: ['nombre_metodo'] }
      ]
    });
    res.json(ventas);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};


exports.getTodasVentas = async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      include: [
        { model: Pedido, attributes: ['id_pedido', 'total'] },
        { model: MetodoPago, attributes: ['nombre_metodo'] }
      ],
      order: [['fecha_pago', 'DESC']]
    });
    res.json(ventas);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error al obtener ventas.' });
  }
};




