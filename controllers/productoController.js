const { Producto, Categoria } = require('../models');

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

exports.getProductoById = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ model: Categoria, attributes: ['nombre_categoria'] }]
    });
    if (!producto || !producto.activo) {
      return res.status(404).json({ msg: 'Producto no encontrado.' });
    }
    res.json(producto);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};