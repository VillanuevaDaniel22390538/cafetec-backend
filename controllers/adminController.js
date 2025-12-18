// cafetec-backend/controllers/adminController.js
const db = require('../config/db'); // Esto es la instancia de Sequelize
const { QueryTypes } = require('sequelize');

// Obtener todos los pedidos para admin
exports.getPedidosAdmin = async (req, res) => {
  try {
    console.log('🔍 Obteniendo pedidos para admin...');
    
    const query = `
      SELECT 
        p.id_pedido,
        p.fecha_pedido,
        p.total,
        p.id_estado,
        p.id_horario,
        u.nombre as cliente_nombre,
        u.email as cliente_email,
        h.hora_inicio,
        h.hora_fin,
        ep.nombre_estado,
        ep.color_hex
      FROM pedidos p
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      LEFT JOIN horarios_disponibles h ON p.id_horario = h.id_horario
      LEFT JOIN estados_pedido ep ON p.id_estado = ep.id_estado
      ORDER BY p.fecha_pedido DESC
    `;
    
    // Usando Sequelize para consultas SQL crudas
    const pedidos = await db.query(query, {
      type: QueryTypes.SELECT
    });

    console.log(`📊 Se encontraron ${pedidos.length} pedidos`);

    const pedidosFormateados = pedidos.map(pedido => ({
      id_pedido: pedido.id_pedido,
      fecha_pedido: pedido.fecha_pedido,
      total: parseFloat(pedido.total),
      id_estado: pedido.id_estado,
      id_horario: pedido.id_horario,
      usuario: {
        nombre: pedido.cliente_nombre || 'Cliente',
        email: pedido.cliente_email
      },
      horario: {
        id_horario: pedido.id_horario,
        hora_inicio: pedido.hora_inicio || 'No disponible',
        hora_fin: pedido.hora_fin || ''
      },
      estado: {
        id_estado: pedido.id_estado,
        nombre_estado: pedido.nombre_estado || 'Desconocido',
        color_hex: pedido.color_hex || '#6c757d'
      }
    }));

    res.json(pedidosFormateados);
  } catch (err) {
    console.error('💥 Error en getPedidosAdmin:', err.message);
    console.error('💥 Stack completo:', err.stack);
    res.status(500).json({ msg: 'Error al cargar pedidos para admin' });
  }
};

// Obtener detalles completos de un pedido específico
exports.getPedidoDetalles = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Obteniendo detalles del pedido #${id}...`);

    // CONSULTA PRINCIPAL - CORREGIDA para Sequelize
    const query = `
      SELECT 
        -- Información del pedido principal
        p.id_pedido,
        p.fecha_pedido,
        p.total,
        p.id_estado,
        p.id_horario,
        p.notas,
        p.hora_programada,
        
        -- Información del cliente
        u.id_usuario,
        u.nombre as cliente_nombre,
        u.email as cliente_email,
        u.telefono as cliente_telefono,
        u.fecha_registro as cliente_fecha_registro,
        
        -- Información del horario
        h.hora_inicio,
        h.hora_fin,
        h.capacidad_maxima,
        
        -- Información del estado actual
        ep.nombre_estado,
        ep.color_hex,
        ep.descripcion as estado_descripcion,
        
        -- Detalles de productos del pedido
        dp.id_detalle,
        dp.cantidad,
        dp.precio_unitario,
        dp.subtotal,
        
        -- Información de productos
        prod.id_producto,
        prod.nombre_producto,
        prod.descripcion as producto_descripcion,
        prod.imagen_url,
        prod.activo as producto_activo,
        
        -- Categoría del producto
        cat.nombre_categoria
        
      FROM pedidos p
      
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      LEFT JOIN horarios_disponibles h ON p.id_horario = h.id_horario
      LEFT JOIN estados_pedido ep ON p.id_estado = ep.id_estado
      LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
      LEFT JOIN productos prod ON dp.id_producto = prod.id_producto
      LEFT JOIN categorias cat ON prod.id_categoria = cat.id_categoria
      
      WHERE p.id_pedido = ?
      ORDER BY dp.id_detalle ASC
    `;
    
    // Ejecutar query con Sequelize
    const resultados = await db.query(query, {
      type: QueryTypes.SELECT,
      replacements: [id]
    });
    
    if (resultados.length === 0) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }

    // CONSULTA DE HISTORIAL
    const historialQuery = `
      SELECT 
        hep.fecha_cambio,
        hep.nota_cambio,
        hep.id_estado_anterior,
        hep.id_estado_nuevo,
        estado_ant.nombre_estado as estado_anterior_nombre,
        estado_nue.nombre_estado as estado_nuevo_nombre,
        admin_cambio.nombre as admin_cambio_nombre
      FROM historial_estados_pedido hep
      LEFT JOIN estados_pedido estado_ant ON hep.id_estado_anterior = estado_ant.id_estado
      LEFT JOIN estados_pedido estado_nue ON hep.id_estado_nuevo = estado_nue.id_estado
      LEFT JOIN usuarios admin_cambio ON hep.cambiado_por = admin_cambio.id_usuario
      WHERE hep.id_pedido = ?
      ORDER BY hep.fecha_cambio DESC
    `;
    
    const historialResult = await db.query(historialQuery, {
      type: QueryTypes.SELECT,
      replacements: [id]
    });

    // Estructurar los datos
    const primeraFila = resultados[0];
    const pedido = {
      id_pedido: primeraFila.id_pedido,
      fecha_pedido: primeraFila.fecha_pedido,
      total: parseFloat(primeraFila.total),
      id_estado: primeraFila.id_estado,
      id_horario: primeraFila.id_horario,
      notas: primeraFila.notas,
      hora_programada: primeraFila.hora_programada,
      
      usuario: {
        id_usuario: primeraFila.id_usuario,
        nombre: primeraFila.cliente_nombre,
        email: primeraFila.cliente_email,
        telefono: primeraFila.cliente_telefono,
        fecha_registro: primeraFila.cliente_fecha_registro
      },
      
      horario: {
        id_horario: primeraFila.id_horario,
        hora_inicio: primeraFila.hora_inicio,
        hora_fin: primeraFila.hora_fin,
        capacidad_maxima: primeraFila.capacidad_maxima
      },
      
      estado: {
        id_estado: primeraFila.id_estado,
        nombre_estado: primeraFila.nombre_estado,
        color_hex: primeraFila.color_hex,
        descripcion: primeraFila.estado_descripcion
      },
      
      productos: [],
      historial_estados: []
    };

    // Procesar productos (evitar duplicados)
    const productosMap = new Map();
    resultados.forEach(row => {
      if (row.id_detalle && !productosMap.has(row.id_detalle)) {
        productosMap.set(row.id_detalle, {
          id_detalle: row.id_detalle,
          id_producto: row.id_producto,
          nombre_producto: row.nombre_producto,
          descripcion: row.producto_descripcion,
          imagen_url: row.imagen_url,
          categoria: row.nombre_categoria,
          cantidad: row.cantidad,
          precio_unitario: parseFloat(row.precio_unitario),
          subtotal: parseFloat(row.subtotal),
          activo: row.producto_activo
        });
      }
    });
    pedido.productos = Array.from(productosMap.values());

    // Procesar historial
    pedido.historial_estados = historialResult.map(row => ({
      fecha_cambio: row.fecha_cambio,
      id_estado_anterior: row.id_estado_anterior,
      id_estado_nuevo: row.id_estado_nuevo,
      estado_anterior: row.estado_anterior_nombre,
      estado_nuevo: row.estado_nuevo_nombre,
      admin_cambio: row.admin_cambio_nombre,
      nota_cambio: row.nota_cambio
    }));

    console.log(`✅ Detalles del pedido #${id} cargados:`, {
      productos: pedido.productos.length,
      historial: pedido.historial_estados.length
    });

    res.json(pedido);
  } catch (err) {
    console.error('💥 Error en getPedidoDetalles:', err.message);
    console.error('💥 Stack detallado:', err.stack);
    res.status(500).json({ 
      msg: 'Error al cargar detalles del pedido',
      error: err.message 
    });
  }
};

// Obtener estadísticas para el dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas para dashboard...');

    // Consultas simultáneas para mejor rendimiento
    const [
      totalPedidosResult,
      pedidosHoyResult,
      ventasHoyResult,
      productosActivosResult,
      pedidosPendientesResult,
      ventasMensualesResult,
      topProductosResult
    ] = await Promise.all([
      // 1. Total de pedidos
      db.query('SELECT COUNT(*) as total FROM pedidos', { type: QueryTypes.SELECT }),
      
      // 2. Pedidos de hoy
      db.query(`
        SELECT COUNT(*) as total 
        FROM pedidos 
        WHERE DATE(fecha_pedido) = CURRENT_DATE
      `, { type: QueryTypes.SELECT }),
      
      // 3. Ventas de hoy
      db.query(`
        SELECT COALESCE(SUM(total), 0) as total 
        FROM pedidos 
        WHERE DATE(fecha_pedido) = CURRENT_DATE
      `, { type: QueryTypes.SELECT }),
      
      // 4. Productos activos
      db.query('SELECT COUNT(*) as total FROM productos WHERE activo = true', { type: QueryTypes.SELECT }),
      
      // 5. Pedidos pendientes (estado 1)
      db.query('SELECT COUNT(*) as total FROM pedidos WHERE id_estado = 1', { type: QueryTypes.SELECT }),
      
      // 6. Ventas de los últimos 7 días para gráfico
      db.query(`
        SELECT 
          DATE(fecha_pedido) as fecha,
          COUNT(*) as cantidad_pedidos,
          COALESCE(SUM(total), 0) as total_ventas
        FROM pedidos
        WHERE fecha_pedido >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(fecha_pedido)
        ORDER BY fecha ASC
      `, { type: QueryTypes.SELECT }),
      
      // 7. Productos más vendidos (top 5)
      db.query(`
        SELECT 
          p.id_producto,
          p.nombre_producto,
          p.precio,
          SUM(dp.cantidad) as total_vendido,
          SUM(dp.subtotal) as ingresos_totales
        FROM detalle_pedido dp
        JOIN productos p ON dp.id_producto = p.id_producto
        JOIN pedidos ped ON dp.id_pedido = ped.id_pedido
        WHERE ped.fecha_pedido >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY p.id_producto, p.nombre_producto, p.precio
        ORDER BY total_vendido DESC
        LIMIT 5
      `, { type: QueryTypes.SELECT })
    ]);

    // Procesar resultados
    const stats = {
      totalPedidos: parseInt(totalPedidosResult[0].total) || 0,
      pedidosHoy: parseInt(pedidosHoyResult[0].total) || 0,
      ventasHoy: parseFloat(ventasHoyResult[0].total) || 0,
      productosActivos: parseInt(productosActivosResult[0].total) || 0,
      pedidosPendientes: parseInt(pedidosPendientesResult[0].total) || 0,
      ventasUltimaSemana: ventasMensualesResult.map(row => ({
        fecha: row.fecha,
        cantidad_pedidos: parseInt(row.cantidad_pedidos) || 0,
        total_ventas: parseFloat(row.total_ventas) || 0
      })),
      productosMasVendidos: topProductosResult.map(row => ({
        id_producto: row.id_producto,
        nombre_producto: row.nombre_producto,
        precio: parseFloat(row.precio) || 0,
        total_vendido: parseInt(row.total_vendido) || 0,
        ingresos_totales: parseFloat(row.ingresos_totales) || 0
      }))
    };

    console.log('✅ Estadísticas cargadas:', {
      totalPedidos: stats.totalPedidos,
      pedidosHoy: stats.pedidosHoy,
      ventasHoy: stats.ventasHoy,
      productosActivos: stats.productosActivos,
      pedidosPendientes: stats.pedidosPendientes
    });

    res.json(stats);
  } catch (err) {
    console.error('💥 Error en getDashboardStats:', err.message);
    res.status(500).json({ msg: 'Error al cargar estadísticas del dashboard' });
  }
};