const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

const DEFAULT_FOLDERS = [
  { name: 'General',    icon: '💬', color: '#6366f1', is_general: true,  order_index: 0 },
  { name: 'Finanzas',   icon: '💰', color: '#10b981', is_general: false, order_index: 1 },
  { name: 'Relaciones', icon: '❤️', color: '#f43f5e', is_general: false, order_index: 2 },
  { name: 'Estudio',    icon: '📚', color: '#3b82f6', is_general: false, order_index: 3 },
  { name: 'Salud',      icon: '🏃', color: '#22c55e', is_general: false, order_index: 4 },
  { name: 'Proyectos',  icon: '🚀', color: '#f59e0b', is_general: false, order_index: 5 },
  { name: 'Emociones',  icon: '🧠', color: '#a855f7', is_general: false, order_index: 6 },
];

/**
 * POST /api/auth/setup
 * Se llama despues del primer login para:
 * 1. Crear el usuario en public.users (si no existe)
 * 2. Crear las carpetas por defecto (si no existen)
 * 3. Crear la user_global_memory (si no existe)
 *
 * Es idempotente: llamarlo multiples veces es seguro.
 */
router.post('/setup', async (req, res) => {
  const userId = req.userId;
  const userEmail = req.userEmail || req.body?.email || null;
  const userName = req.body?.name || userEmail?.split('@')[0] || 'Usuario';

  if (!userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    // 1. Upsert en public.users
    const { error: userErr } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          name: userName,
          email: userEmail,
          auth_id: userId,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );

    if (userErr) {
      console.error('Setup - upsert user error:', userErr.message);
      // Intentar solo con id si falla el upsert con auth_id (columna puede no existir)
      const { error: userErr2 } = await supabase
        .from('users')
        .upsert(
          { id: userId, name: userName, email: userEmail },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      if (userErr2) console.error('Setup - upsert user fallback error:', userErr2.message);
    }

    // 2. Verificar si ya tiene carpetas
    const { data: existingFolders } = await supabase
      .from('folders')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!existingFolders || existingFolders.length === 0) {
      // Crear carpetas por defecto
      const foldersToInsert = DEFAULT_FOLDERS.map((f) => ({
        ...f,
        user_id: userId,
      }));
      const { error: foldersErr } = await supabase.from('folders').insert(foldersToInsert);
      if (foldersErr) console.error('Setup - insert folders error:', foldersErr.message);
    }

    // 3. Crear user_global_memory si no existe
    const { error: memErr } = await supabase
      .from('user_global_memory')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });

    if (memErr) console.error('Setup - upsert memory error:', memErr.message);

    res.json({ ok: true, userId });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ error: 'Error en setup de usuario' });
  }
});

module.exports = router;
