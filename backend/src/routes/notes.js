const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/notes - Listar notas (filtro por categoria)
router.get('/', async (req, res, next) => {
  try {
    const { categoria } = req.query;

    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/:id - Obtener nota especifica
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: { message: 'Nota no encontrada' } });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/notes/:id - Editar nota
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, contenido, categoria, importancia } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (titulo !== undefined) updateData.titulo = titulo;
    if (contenido !== undefined) updateData.contenido = contenido;
    if (categoria !== undefined) updateData.categoria = categoria;
    if (importancia !== undefined) updateData.importancia = importancia;

    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id - Eliminar nota
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ message: 'Nota eliminada' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
