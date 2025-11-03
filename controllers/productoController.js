// controllers/productoController.js
const path = require('path');
const fs = require('fs');
const { Producto, Categoria } = require('../models');

// ========================
// Obtener productos (público)
// ========================
exports.getProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      where: { activo: true },
      include: [{ model: Categoria, attributes: ['nombre_categoria'] }]
    });
    res.json(productos);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// ========================
// Obtener producto por ID
// ========================
exports.getProductoById = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ model: Categoria, attributes: ['nombre_categoria'] }]
    });

    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado.' });
    }

    res.json(producto);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// ========================
// Crear producto (admin)
// ========================
exports.crearProducto = async (req, res) => {
  try {
    const { nombre_producto, descripcion, precio, id_categoria, imagen_url, stock } = req.body;

    const categoria = await Categoria.findByPk(id_categoria);
    if (!categoria) {
      return res.status(400).json({ msg: 'Categoría no válida.' });
    }

    const nuevoProducto = await Producto.create({
      nombre_producto,
      descripcion: descripcion || null,
      precio: parseFloat(precio),
      id_categoria: parseInt(id_categoria),
      imagen_url: imagen_url || null,
      stock: stock ? parseInt(stock) : 999,
    });

    res.status(201).json(nuevoProducto);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error al crear el producto.' });
  }
};

// ========================
// Actualizar producto (admin)
// ========================
exports.actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre_producto, descripcion, precio, id_categoria, imagen_url, stock } = req.body;

  try {
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado.' });
    }

    if (id_categoria) {
      const categoria = await Categoria.findByPk(id_categoria);
      if (!categoria) {
        return res.status(400).json({ msg: 'Categoría no válida.' });
      }
    }

    await producto.update({
      nombre_producto,
      descripcion: descripcion || null,
      precio: parseFloat(precio),
      id_categoria: id_categoria ? parseInt(id_categoria) : producto.id_categoria,
      imagen_url: imagen_url || producto.imagen_url,
      stock: stock ? parseInt(stock) : producto.stock,
    });

    res.json({ msg: 'Producto actualizado exitosamente.', producto });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error al actualizar el producto.' });
  }
};

// ========================
// Activar/Desactivar producto (admin)
// ========================
exports.toggleActivo = async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado.' });
    }

    const nuevoEstado = !producto.activo;
    await producto.update({ activo: nuevoEstado });

    res.json({
      msg: `Producto ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`,
      activo: nuevoEstado
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error al cambiar el estado del producto.' });
  }
};

// ========================
// Obtener todos los productos (admin)
// ========================
exports.getProductosAdmin = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      include: [{
        model: Categoria,
        attributes: ['nombre_categoria'],
        required: false
      }]
    });
    res.json(productos);
  } catch (err) {
    console.error('Error en getProductosAdmin:', err);
    res.status(500).json({ msg: 'Error al cargar productos.' });
  }
};

// ========================
// Subir imágenes de productos
// ========================
exports.subirImagen = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }

    // Construimos la URL pública de la imagen
    const imageUrl = `/uploads/productos/${req.file.filename}`;

    return res.status(200).json({
      message: 'Imagen subida correctamente',
      imageUrl,
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return res.status(500).json({ error: 'Error al subir imagen' });
  }
};
