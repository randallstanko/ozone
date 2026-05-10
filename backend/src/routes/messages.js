const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/messages/:folderId - Obtener mensajes de una carpeta (paginado)
router.get('/:folderId', async (req, res, next) => {
  try {
    const { folderId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId)
      .eq('folder_id', folderId)
      .order('created_at', { ascending: true })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;
    res.json({ messages: data, total: count });
  } catch (err) {
    next(err);
  }
});

// POST /api/messages - Guardar mensaje manual
router.post('/', async (req, res, next) => {
  try {
    const { folder_id, content, origen = 'usuario' } = req.body;

    if (!folder_id || !content) {
      return res.status(400).json({ error: { message: 'folder_id y content son requeridos' } });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        user_id: req.userId,
        folder_id,
        content,
        origen,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/messages/:id - Eliminar mensaje
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ message: 'Mensaje eliminado' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
