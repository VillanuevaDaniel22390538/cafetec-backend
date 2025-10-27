const { Usuario, Rol } = require('../models');

const isAdmin = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.user.id, {
      include: [{ model: Rol, attributes: ['nombre_rol'] }]
    });

    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado.' });

    const roles = usuario.roles.map(r => r.nombre_rol);
    if (!roles.includes('administrador')) {
      return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de administrador.' });
    }

    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

module.exports = isAdmin;