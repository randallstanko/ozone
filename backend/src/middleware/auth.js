const { supabase } = require('../config/supabase');

const DEMO_USER_ID = process.env.DEMO_USER_ID || '00000000-0000-0000-0000-000000000001';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Sin token: modo demo (desarrollo local)
    req.userId = DEMO_USER_ID;
    req.userEmail = null;
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.error('Auth: token invalido -', error?.message);
      return res.status(401).json({ error: 'Token invalido o expirado' });
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email;
    req.supabaseUser = data.user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Error de autenticacion' });
  }
};

module.exports = { authMiddleware };
