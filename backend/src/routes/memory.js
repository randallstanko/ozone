const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { getSemanticMemory } = require('../services/memoryService');
const { generateFolderSummary } = require('../services/summaryService');

// GET /api/memory/global - Obtener memoria global del usuario
router.get('/global', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('user_global_memory')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/memory/search?q=texto - Busqueda semantica
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: { message: 'Query parameter "q" es requerido' } });
    }

    const results = await getSemanticMemory(req.userId, q);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// POST /api/memory/summarize - Forzar generacion de resumen
router.post('/summarize', async (req, res, next) => {
  try {
    const { folder_id } = req.body;
    if (!folder_id) {
      return res.status(400).json({ error: { message: 'folder_id es requerido' } });
    }

    const summary = await generateFolderSummary(req.userId, folder_id);
    if (!summary) {
      return res.json({ message: 'No hay suficientes mensajes para generar resumen' });
    }
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
