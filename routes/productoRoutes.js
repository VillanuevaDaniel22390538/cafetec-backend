const express = require('express');
const router = express.Router();
const { getProductos, getProductoById } = require('../controllers/productoController');

router.get('/', getProductos);
router.get('/:id', getProductoById);

module.exports = router;