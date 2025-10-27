const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
require('dotenv').config();

// Registro
exports.register = async (req, res) => {
  const { nombre, email, contrasena, telefono } = req.body;

  try {
    let usuario = await Usuario.findOne({ where: { email } });
    if (usuario) {
      return res.status(400).json({ msg: 'El usuario ya existe.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    usuario = await Usuario.create({
      nombre,
      email,
      contrasena: hashedPassword,
      telefono
    });
    
    const payload = { user: { id: usuario.id_usuario } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Login
exports.login = async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(400).json({ msg: 'Credenciales incorrectas.' });
    }

    const isMatch = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales incorrectas.' });
    }
    
    const payload = { user: { id: usuario.id_usuario } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor'); 
  }
};

exports.getProfile = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.user.id, {
      attributes: ['id_usuario', 'nombre', 'email', 'telefono', 'fecha_registro']
    });
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado.' });
    res.json(usuario);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

