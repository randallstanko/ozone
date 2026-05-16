const { supabase } = require('../config/supabase');

const DEMO_USER_ID = process.env.DEMO_USER_ID || '00000000-0000-0000-0000-000000000001';

/**
 * Auth middleware.
 * Si viene un token JWT de Supabase en el header Authorization,
 * verifica el token y extrae el user_id.
 * Si no hay token, usa DEMO_USER_ID como fallback (desarrollo).
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Sin token: modo demo
    req.userId = DEMO_USER_ID;
    req.userEmail = null;
    return next();
  }

  const token = authHeader.slice(7); // quitar "Bearer "

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      // Token invalido: fallback a demo en dev, error en prod
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Token invalido o expirado' });
      }
      req.userId = DEMO_USER_ID;
      req.userEmail = null;
      return next();
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email;
    req.supabaseUser = data.user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Error de autenticacion' });
    }
    req.userId = DEMO_USER_ID;
    req.userEmail = null;
    next();
  }
};

module.exports = { authMiddleware };
