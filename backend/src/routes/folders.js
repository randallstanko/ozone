const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/folders - Listar carpetas del usuario
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', req.userId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/folders - Crear nueva carpeta
router.post('/', async (req, res, next) => {
  try {
    const { name, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: { message: 'El nombre es requerido' } });
    }

    // Obtener el max order_index
    const { data: existing } = await supabase
      .from('folders')
      .select('order_index')
      .eq('user_id', req.userId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

    const { data, error } = await supabase
      .from('folders')
      .insert({
        user_id: req.userId,
        name,
        icon: icon || '📁',
        color: color || '#6366f1',
        order_index: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/folders/:id - Renombrar/editar carpeta
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;

    const { data, error } = await supabase
      .from('folders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: { message: 'Carpeta no encontrada' } });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/folders/:id - Eliminar carpeta
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // No permitir eliminar la carpeta General
    const { data: folder } = await supabase
      .from('folders')
      .select('is_general')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (folder && folder.is_general) {
      return res.status(400).json({ error: { message: 'No se puede eliminar la carpeta General' } });
    }

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ message: 'Carpeta eliminada' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
