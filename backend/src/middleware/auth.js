/**
 * Auth middleware simple para MVP.
 * Inyecta user_id demo en todas las requests.
 */
const authMiddleware = (req, res, next) => {
  // En MVP usamos un user_id fijo demo
  // En produccion esto vendria de Supabase Auth / JWT
  req.userId = process.env.DEMO_USER_ID || '00000000-0000-0000-0000-000000000001';
  next();
};

module.exports = { authMiddleware };
