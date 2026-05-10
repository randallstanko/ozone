const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { generateEmbedding } = require('../services/embeddingService');
const memoryService = require('../services/memoryService');
const aiService = require('../services/aiService');
const { buildSystemPrompt, buildChatMessages } = require('../utils/contextBuilder');

/**
 * POST /api/chat - Pipeline completo de mensaje
 * 
 * 1. Guardar mensaje del usuario en DB
 * 2. Generar embedding del mensaje
 * 3. Buscar mensajes similares (memoria semantica)
 * 4. Traer ultimos mensajes recientes (memoria corta)
 * 5. Traer resumenes (memoria larga)
 * 6. Traer memoria global del usuario
 * 7. Armar contexto completo
 * 8. Enviar a Gemini
 * 9. Guardar respuesta
 * 10. Analizar y actualizar memorias (async)
 */
router.post('/', async (req, res, next) => {
  try {
    const { folder_id, content } = req.body;
    const userId = req.userId;

    if (!folder_id || !content) {
      return res.status(400).json({ error: { message: 'folder_id y content son requeridos' } });
    }

    // PASO 1: Guardar mensaje del usuario
    const { data: userMessage, error: saveError } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        folder_id,
        content,
        origen: 'usuario',
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // PASO 2: Generar embedding (en paralelo con busquedas)
    const embeddingPromise = generateEmbedding(content);

    // PASO 3-6: Obtener las 4 capas de memoria en paralelo
    const [shortTermMemory, longTermMemory, semanticMemory, globalMemory, embedding] =
      await Promise.all([
        memoryService.getShortTermMemory(userId, folder_id),
        memoryService.getLongTermMemory(userId, folder_id),
        memoryService.getSemanticMemory(userId, content).catch(() => []),
        memoryService.getGlobalMemory(userId),
        embeddingPromise,
      ]);

    // Actualizar el embedding del mensaje guardado
    await supabase
      .from('messages')
      .update({ embedding })
      .eq('id', userMessage.id);

    // Obtener nombre de la carpeta para el prompt especializado
    const { data: folderData } = await supabase
      .from('folders')
      .select('name')
      .eq('id', folder_id)
      .single();
    const folderName = folderData?.name || 'General';

    // PASO 7: Armar contexto completo (con prompt por nicho)
    const systemPrompt = buildSystemPrompt(globalMemory, longTermMemory, semanticMemory, folderName);
    const chatMessages = buildChatMessages(shortTermMemory, content);

    // PASO 8: Enviar a Gemini
    const aiResponse = await aiService.getChatCompletion(systemPrompt, chatMessages);

    // PASO 9: Guardar respuesta de la IA
    const { data: aiMessage, error: aiSaveError } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        folder_id,
        content: aiResponse,
        origen: 'ia',
      })
      .select()
      .single();

    if (aiSaveError) throw aiSaveError;

    // Responder al cliente inmediatamente
    res.json({ userMessage, aiMessage });

    // PASO 10: Procesos asincrono post-respuesta (no bloquean la respuesta)
    processPostResponse(userId, folder_id, content, aiResponse, shortTermMemory, globalMemory).catch(
      (err) => console.error('Error en post-processing:', err)
    );
  } catch (err) {
    next(err);
  }
});

/**
 * Procesos post-respuesta asincrono:
 * - Analizar mensaje para tags/importancia
 * - Generar notas automaticas si aplica
 * - Actualizar memoria global cada N mensajes
 * - Generar resumen si hay muchos mensajes
 */
async function processPostResponse(userId, folderId, userContent, aiContent, recentMessages, globalMemory) {
  // Analizar el mensaje del usuario
  const analysis = await aiService.analyzeMessage(userContent);

  // Actualizar tags e importancia del mensaje más reciente con ese contenido
  if (analysis.tags.length > 0 || analysis.importancia > 0) {
    // Primero buscar el ID del mensaje más reciente con ese contenido
    const { data: latest } = await supabase
      .from('messages')
      .select('id')
      .eq('user_id', userId)
      .eq('folder_id', folderId)
      .eq('content', userContent)
      .eq('origen', 'usuario')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latest) {
      await supabase
        .from('messages')
        .update({ tags: analysis.tags, importancia: analysis.importancia })
        .eq('id', latest.id);
    }
  }

  // Generar nota automatica si aplica
  if (analysis.categoria_nota) {
    await supabase
      .from('notes')
      .insert({
        user_id: userId,
        categoria: analysis.categoria_nota,
        titulo: userContent.slice(0, 100),
        contenido: `${userContent}\n\n---\nRespuesta de Ozone: ${aiContent.slice(0, 500)}`,
        auto_generated: true,
        importancia: analysis.importancia,
      });
  }

  // Actualizar memoria global cada 10 mensajes
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('folder_id', folderId);

  if (count && count % 10 === 0) {
    const updatedProfile = await aiService.analyzeForGlobalMemory(
      recentMessages.slice(-10),
      globalMemory
    );
    if (updatedProfile) {
      await memoryService.updateGlobalMemory(userId, updatedProfile);
    }
  }

  // Generar resumen cada 30 mensajes
  if (count && count % 30 === 0) {
    const { data: lastMessages } = await supabase
      .from('messages')
      .select('content, origen')
      .eq('user_id', userId)
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (lastMessages) {
      const summary = await aiService.generateSummary(lastMessages.reverse());
      await memoryService.saveSummary(userId, folderId, summary);
    }
  }
}

module.exports = router;
