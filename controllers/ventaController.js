// cafetec-backend/controllers/ventaController.js
const db = require('../config/db');
const { QueryTypes } = require('sequelize');

// 1. Obtener todos los métodos de pago activos
exports.getMetodosPago = async (req, res) => {
  try {
    console.log('💰 Obteniendo métodos de pago...');
    
    const query = `
      SELECT * FROM metodos_pago 
      WHERE activo = true 
      ORDER BY nombre_metodo
    `;
    
    const metodos = await db.query(query, {
      type: QueryTypes.SELECT
    });

    console.log(`✅ Se encontraron ${metodos.length} métodos de pago activos`);
    
    res.json(metodos);
  } catch (err) {
    console.error('💥 Error en getMetodosPago:', err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// 2. Obtener todas las ventas (para admin)
exports.getTodasVentas = async (req, res) => {
  try {
    console.log('📊 Obteniendo todas las ventas...');
    
    const query = `
      SELECT 
        v.*,
        p.id_pedido,
        p.total as pedido_total,
        p.fecha_pedido,
        p.id_estado,
        mp.nombre_metodo,
        u.nombre as cliente_nombre,
        u.email as cliente_email
      FROM ventas v
      LEFT JOIN pedidos p ON v.id_pedido = p.id_pedido
      LEFT JOIN metodos_pago mp ON v.id_metodo = mp.id_metodo
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      ORDER BY v.fecha_pago DESC
    `;
    
    const ventas = await db.query(query, {
      type: QueryTypes.SELECT
    });

    console.log(`✅ Se encontraron ${ventas.length} ventas`);
    
    const ventasFormateadas = ventas.map(venta => ({
      id_venta: venta.id_venta,
      id_pedido: venta.id_pedido,
      id_metodo: venta.id_metodo,
      monto_pagado: parseFloat(venta.monto_pagado),
      fecha_pago: venta.fecha_pago,
      referencia_pago: venta.referencia_pago,
      estado_pago: venta.estado_pago || 'completado',
      notas: venta.notas,
      pedido_total: parseFloat(venta.pedido_total),
      fecha_pedido: venta.fecha_pedido,
      id_estado: venta.id_estado,
      nombre_metodo: venta.nombre_metodo,
      cliente_nombre: venta.cliente_nombre,
      cliente_email: venta.cliente_email
    }));

    res.json(ventasFormateadas);
  } catch (err) {
    console.error('💥 Error en getTodasVentas:', err.message);
    res.status(500).json({ msg: 'Error al obtener ventas' });
  }
};

// 3. Registrar una venta (pago de un pedido)
exports.registrarVenta = async (req, res) => {
  const { id_pedido, id_metodo, referencia_pago, notas } = req.body;
  const id_admin = req.user.id;

  try {
    console.log(`💰 Registrando venta para pedido #${id_pedido}...`);
    
    // Validar que el pedido exista
    const pedidoQuery = 'SELECT * FROM pedidos WHERE id_pedido = ?';
    const [pedido] = await db.query(pedidoQuery, {
      type: QueryTypes.SELECT,
      replacements: [id_pedido]
    });

    if (!pedido) {
      return res.status(404).json({ msg: 'Pedido no encontrado.' });
    }

    // Validar método de pago
    const metodoQuery = 'SELECT * FROM metodos_pago WHERE id_metodo = ? AND activo = true';
    const [metodo] = await db.query(metodoQuery, {
      type: QueryTypes.SELECT,
      replacements: [id_metodo]
    });

    if (!metodo) {
      return res.status(400).json({ msg: 'Método de pago no válido.' });
    }

    // Verificar que no se haya pagado ya
    const ventaExistenteQuery = 'SELECT * FROM ventas WHERE id_pedido = ?';
    const [ventaExistente] = await db.query(ventaExistenteQuery, {
      type: QueryTypes.SELECT,
      replacements: [id_pedido]
    });

    if (ventaExistente) {
      return res.status(400).json({ msg: 'Este pedido ya ha sido pagado.' });
    }

    // Crear la venta
    const insertQuery = `
      INSERT INTO ventas 
      (id_pedido, id_metodo, monto_pagado, referencia_pago, notas, estado_pago)
      VALUES (?, ?, ?, ?, ?, 'completado')
      RETURNING *
    `;
    
    const [nuevaVenta] = await db.query(insertQuery, {
      type: QueryTypes.INSERT,
      replacements: [id_pedido, id_metodo, pedido.total, referencia_pago || null, notas || null]
    });

    // Actualizar estado del pedido a "Entregado" (id_estado = 4)
    const updatePedidoQuery = 'UPDATE pedidos SET id_estado = 4 WHERE id_pedido = ?';
    await db.query(updatePedidoQuery, {
      type: QueryTypes.UPDATE,
      replacements: [id_pedido]
    });

    console.log(`✅ Venta registrada exitosamente para pedido #${id_pedido}`);
    
    res.status(201).json({
      msg: 'Venta registrada exitosamente.',
      id_venta: nuevaVenta.id_venta
    });
  } catch (err) {
    console.error('💥 Error en registrarVenta:', err.message);
    res.status(500).json({ msg: 'Error al registrar la venta.' });
  }
};

// 4. Obtener ventas por pedido
exports.getVentasPorPedido = async (req, res) => {
  try {
    const { id_pedido } = req.params;
    console.log(`🔍 Obteniendo ventas para pedido #${id_pedido}...`);
    
    const query = `
      SELECT 
        v.*,
        mp.nombre_metodo,
        p.total as pedido_total
      FROM ventas v
      LEFT JOIN metodos_pago mp ON v.id_metodo = mp.id_metodo
      LEFT JOIN pedidos p ON v.id_pedido = p.id_pedido
      WHERE v.id_pedido = ?
      ORDER BY v.fecha_pago DESC
    `;
    
    const ventas = await db.query(query, {
      type: QueryTypes.SELECT,
      replacements: [id_pedido]
    });

    console.log(`✅ Se encontraron ${ventas.length} ventas para el pedido #${id_pedido}`);
    
    res.json(ventas);
  } catch (err) {
    console.error('💥 Error en getVentasPorPedido:', err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// 5. NUEVO: Resumen general de ventas (para dashboard/reports)
exports.getSalesSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('📈 Obteniendo resumen de ventas...');

    let whereClause = '';
    const replacements = [];
    
    if (startDate && endDate) {
      whereClause = 'WHERE DATE(v.fecha_pago) BETWEEN ? AND ?';
      replacements.push(startDate, endDate);
    }

    const query = `
      SELECT 
        -- Totales generales
        COUNT(*) as total_ventas,
        COALESCE(SUM(v.monto_pagado), 0) as monto_total,
        COALESCE(AVG(v.monto_pagado), 0) as promedio_venta,
        
        -- Método más popular
        (SELECT mp.nombre_metodo 
         FROM ventas v2 
         LEFT JOIN metodos_pago mp ON v2.id_metodo = mp.id_metodo
         ${whereClause.replace('v.', 'v2.')}
         GROUP BY mp.nombre_metodo 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as metodo_popular,
        
        -- Día con más ventas
        (SELECT DATE(v2.fecha_pago) 
         FROM ventas v2
         ${whereClause.replace('v.', 'v2.')}
         GROUP BY DATE(v2.fecha_pago) 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as dia_pico
        
      FROM ventas v
      ${whereClause}
    `;
    
    const [summary] = await db.query(query, {
      type: QueryTypes.SELECT,
      replacements: replacements.length > 0 ? replacements : undefined
    });

    // Ventas por día de la semana
    const ventasPorDiaSemanaQuery = `
      SELECT 
        CASE EXTRACT(DOW FROM v.fecha_pago)
          WHEN 0 THEN 'Domingo'
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
        END as dia_semana,
        COUNT(*) as ventas,
        COALESCE(SUM(v.monto_pagado), 0) as monto
      FROM ventas v
      ${whereClause}
      GROUP BY EXTRACT(DOW FROM v.fecha_pago)
      ORDER BY EXTRACT(DOW FROM v.fecha_pago)
    `;
    
    const ventasPorDiaSemana = await db.query(ventasPorDiaSemanaQuery, {
      type: QueryTypes.SELECT,
      replacements: replacements.length > 0 ? replacements : undefined
    });

    const resultado = {
      totales: {
        ventas: parseInt(summary.total_ventas) || 0,
        monto: parseFloat(summary.monto_total) || 0,
        promedio: parseFloat(summary.promedio_venta) || 0
      },
      analisis: {
        metodo_popular: summary.metodo_popular || 'No hay datos',
        dia_pico: summary.dia_pico || 'No hay datos'
      },
      por_dia_semana: ventasPorDiaSemana.map(row => ({
        dia: row.dia_semana,
        ventas: parseInt(row.ventas),
        monto: parseFloat(row.monto)
      }))
    };

    console.log(`✅ Resumen generado: ${resultado.totales.ventas} ventas, $${resultado.totales.monto.toFixed(2)} total`);
    
    res.json(resultado);
  } catch (err) {
    console.error('💥 Error en getSalesSummary:', err.message);
    res.status(500).json({ msg: 'Error al generar resumen de ventas' });
  }
};

// 6. NUEVO: Ventas agrupadas por periodo
exports.getSalesByPeriod = async (req, res) => {
  try {
    const { period = 'day', startDate, endDate } = req.query;
    console.log(`📅 Obteniendo ventas por periodo: ${period}...`);

    let groupBy = '';
    let dateFormat = '';
    
    switch (period) {
      case 'day':
        groupBy = 'DATE(v.fecha_pago)';
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        groupBy = 'DATE_TRUNC(\'week\', v.fecha_pago)';
        dateFormat = 'YYYY-"W"IW';
        break;
      case 'month':
        groupBy = 'DATE_TRUNC(\'month\', v.fecha_pago)';
        dateFormat = 'YYYY-MM';
        break;
      default:
        groupBy = 'DATE(v.fecha_pago)';
        dateFormat = 'YYYY-MM-DD';
    }

    let whereClause = '';
    const replacements = [];
    
    if (startDate && endDate) {
      whereClause = 'WHERE DATE(v.fecha_pago) BETWEEN ? AND ?';
      replacements.push(startDate, endDate);
    }

    const query = `
      SELECT 
        ${groupBy} as periodo,
        TO_CHAR(${groupBy}, '${dateFormat}') as periodo_formateado,
        COUNT(*) as ventas,
        COALESCE(SUM(v.monto_pagado), 0) as monto_total,
        COALESCE(AVG(v.monto_pagado), 0) as promedio_venta
      FROM ventas v
      ${whereClause}
      GROUP BY ${groupBy}
      ORDER BY ${groupBy} DESC
      LIMIT 30
    `;
    
    const ventasPorPeriodo = await db.query(query, {
      type: QueryTypes.SELECT,
      replacements: replacements.length > 0 ? replacements : undefined
    });

    const resultado = ventasPorPeriodo.map(row => ({
      periodo: row.periodo_formateado,
      ventas: parseInt(row.ventas),
      monto_total: parseFloat(row.monto_total),
      promedio_venta: parseFloat(row.promedio_venta)
    }));

    console.log(`✅ Ventas por periodo: ${resultado.length} periodos analizados`);
    
    res.json(resultado);
  } catch (err) {
    console.error('💥 Error en getSalesByPeriod:', err.message);
    res.status(500).json({ msg: 'Error al obtener ventas por periodo' });
  }
};

// 7. NUEVO: Productos más vendidos
exports.getTopProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    console.log('🏆 Obteniendo productos más vendidos...');

    let whereClause = '';
    const replacements = [];
    
    if (startDate && endDate) {
      whereClause = 'AND DATE(v.fecha_pago) BETWEEN ? AND ?';
      replacements.push(startDate, endDate);
    }

    const query = `
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.precio,
        p.imagen_url,
        cat.nombre_categoria,
        SUM(dp.cantidad) as total_vendido,
        SUM(dp.subtotal) as ingresos_totales,
        COUNT(DISTINCT dp.id_pedido) as pedidos_con_producto
      FROM ventas v
      LEFT JOIN pedidos ped ON v.id_pedido = ped.id_pedido
      LEFT JOIN detalle_pedido dp ON ped.id_pedido = dp.id_pedido
      LEFT JOIN productos p ON dp.id_producto = p.id_producto
      LEFT JOIN categorias cat ON p.id_categoria = cat.id_categoria
      WHERE p.id_producto IS NOT NULL ${whereClause}
      GROUP BY p.id_producto, p.nombre_producto, p.precio, p.imagen_url, cat.nombre_categoria
      HAVING SUM(dp.cantidad) > 0
      ORDER BY total_vendido DESC
      LIMIT ?
    `;
    
    replacements.push(parseInt(limit));

    const topProducts = await db.query(query, {
      type: QueryTypes.SELECT,
      replacements: replacements.length > 0 ? replacements : [limit]
    });

    const resultado = topProducts.map(row => ({
      id_producto: row.id_producto,
      nombre_producto: row.nombre_producto,
      precio: parseFloat(row.precio),
      imagen_url: row.imagen_url,
      categoria: row.nombre_categoria,
      total_vendido: parseInt(row.total_vendido),
      ingresos_totales: parseFloat(row.ingresos_totales),
      pedidos_con_producto: parseInt(row.pedidos_con_producto),
      promedio_por_pedido: parseInt(row.total_vendido) / parseInt(row.pedidos_con_producto) || 0
    }));

    console.log(`✅ Top productos: ${resultado.length} productos encontrados`);
    
    res.json(resultado);
  } catch (err) {
    console.error('💥 Error en getTopProducts:', err.message);
    res.status(500).json({ msg: 'Error al obtener productos más vendidos' });
  }
};

// 8. NUEVO: Estadísticas de métodos de pago
exports.getPaymentMethodsStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('💳 Obteniendo estadísticas de métodos de pago...');

    let whereClause = '';
    const replacements = [];
    
    if (startDate && endDate) {
      whereClause = 'WHERE DATE(v.fecha_pago) BETWEEN ? AND ?';
      replacements.push(startDate, endDate);
    }

    const query = `
      SELECT 
        mp.id_metodo,
        mp.nombre_metodo,
        mp.descripcion,
        COUNT(v.id_venta) as total_ventas,
        COALESCE(SUM(v.monto_pagado), 0) as monto_total,
        COALESCE(AVG(v.monto_pagado), 0) as promedio_venta,
        MIN(v.fecha_pago) as primera_venta,
        MAX(v.fecha_pago) as ultima_venta
      FROM ventas v
      RIGHT JOIN metodos_pago mp ON v.id_metodo = mp.id_metodo
      ${whereClause}
      GROUP BY mp.id_metodo, mp.nombre_metodo, mp.descripcion
      ORDER BY monto_total DESC
    `;
    
    const stats = await db.query(query, {
      type: QueryTypes.SELECT,
      replacements: replacements.length > 0 ? replacements : undefined
    });

    // Calcular total general para porcentajes
    const totalVentas = stats.reduce((sum, row) => sum + parseInt(row.total_ventas), 0);
    const totalMonto = stats.reduce((sum, row) => sum + parseFloat(row.monto_total), 0);

    const resultado = stats.map(row => ({
      id_metodo: row.id_metodo,
      nombre_metodo: row.nombre_metodo,
      descripcion: row.descripcion,
      total_ventas: parseInt(row.total_ventas),
      monto_total: parseFloat(row.monto_total),
      promedio_venta: parseFloat(row.promedio_venta),
      porcentaje_ventas: totalVentas > 0 ? (parseInt(row.total_ventas) / totalVentas * 100).toFixed(1) : 0,
      porcentaje_monto: totalMonto > 0 ? (parseFloat(row.monto_total) / totalMonto * 100).toFixed(1) : 0,
      primera_venta: row.primera_venta,
      ultima_venta: row.ultima_venta
    }));

    console.log(`✅ Estadísticas de métodos: ${resultado.length} métodos analizados`);
    
    res.json({
      totales: {
        ventas: totalVentas,
        monto: totalMonto
      },
      metodos: resultado
    });
  } catch (err) {
    console.error('💥 Error en getPaymentMethodsStats:', err.message);
    res.status(500).json({ msg: 'Error al obtener estadísticas de métodos de pago' });
  }
};

// función getVentasFiltradas 
exports.getVentasFiltradas = async (req, res) => {
  try {
    const { startDate, endDate, method, minAmount, maxAmount } = req.query;
    console.log('🔍 Obteniendo ventas filtradas para reportes...');

    let whereConditions = [];
    const replacements = [];
    
    // Filtro por fechas
    if (startDate && endDate) {
      whereConditions.push('DATE(v.fecha_pago) BETWEEN ? AND ?');
      replacements.push(startDate, endDate);
    } else if (startDate) {
      whereConditions.push('DATE(v.fecha_pago) >= ?');
      replacements.push(startDate);
    } else if (endDate) {
      whereConditions.push('DATE(v.fecha_pago) <= ?');
      replacements.push(endDate);
    }
    
    // Filtro por método de pago - SOLO si tiene valor y no es 'todos'
    if (method && method !== 'todos' && method !== 'undefined') {
      whereConditions.push('v.id_metodo = ?');
      replacements.push(method);
    }
    
    // Filtro por monto - SOLO si tiene valor
    if (minAmount && minAmount !== '') {
      whereConditions.push('v.monto_pagado >= ?');
      replacements.push(minAmount);
    }
    
    if (maxAmount && maxAmount !== '') {
      whereConditions.push('v.monto_pagado <= ?');
      replacements.push(maxAmount);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const query = `
      SELECT 
        v.*,
        p.id_pedido,
        p.total as pedido_total,
        p.fecha_pedido,
        mp.nombre_metodo,
        u.nombre as cliente_nombre
      FROM ventas v
      LEFT JOIN pedidos p ON v.id_pedido = p.id_pedido
      LEFT JOIN metodos_pago mp ON v.id_metodo = mp.id_metodo
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      ${whereClause}
      ORDER BY v.fecha_pago DESC
    `;
    
    const ventas = await db.query(query, {
      type: QueryTypes.SELECT,
      replacements: replacements.length > 0 ? replacements : undefined
    });

    const ventasFormateadas = ventas.map(venta => ({
      id_venta: venta.id_venta,
      id_pedido: venta.id_pedido,
      id_metodo: venta.id_metodo,
      monto_pagado: parseFloat(venta.monto_pagado),
      fecha_pago: venta.fecha_pago,
      referencia_pago: venta.referencia_pago,
      estado_pago: venta.estado_pago || 'completado',
      notas: venta.notas,
      pedido_total: parseFloat(venta.pedido_total),
      fecha_pedido: venta.fecha_pedido,
      nombre_metodo: venta.nombre_metodo,
      cliente_nombre: venta.cliente_nombre
    }));

    console.log(`✅ Ventas filtradas: ${ventasFormateadas.length} resultados`);
    
    res.json(ventasFormateadas);
  } catch (err) {
    console.error('💥 Error en getVentasFiltradas:', err.message);
    console.error('💥 Stack completo:', err.stack);
    res.status(500).json({ 
      msg: 'Error al filtrar ventas',
      error: err.message 
    });
  }
};