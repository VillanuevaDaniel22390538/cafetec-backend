// cafetec-backend/middleware/isAdmin.js (VERSIÓN CORREGIDA)
const { Usuario, Rol } = require('../models');

const isAdmin = async (req, res, next) => {
  try {
    console.log('=== VERIFICACIÓN isAdmin ===');
    console.log('🔍 Usuario en req.user:', req.user);
    console.log('🔍 User ID:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      console.log('❌ No hay usuario autenticado');
      return res.status(401).json({ 
        success: false,
        msg: 'No autorizado. Por favor, inicia sesión.' 
      });
    }
    
    // Buscar usuario con rol de administrador
    const usuario = await Usuario.findByPk(req.user.id, {
      include: [{
        model: Rol,
        through: { attributes: [] },
        where: { nombre_rol: 'administrador' }
      }]
    });
    
    const esAdministrador = !!usuario;
    
    console.log(`🔍 Usuario #${req.user.id} es administrador:`, esAdministrador);
    
    if (!esAdministrador) {
      console.log(`⛔ Usuario #${req.user.id} NO es administrador. Acceso DENEGADO.`);
      return res.status(403).json({ 
        success: false,
        msg: 'Acceso denegado. Solo administradores pueden acceder a esta función.' 
      });
    }
    
    console.log(`✅ Usuario #${req.user.id} es administrador. Acceso PERMITIDO.`);
    next();
    
  } catch (err) {
    console.error('💥 Error en middleware isAdmin:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Error en el servidor al verificar permisos.' 
    });
  }
};

module.exports = isAdmin;