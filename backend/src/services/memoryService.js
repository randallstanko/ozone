const { supabase } = require('../config/supabase');
const { generateEmbedding } = require('./embeddingService');
const { MAX_SHORT_MEMORY, SEMANTIC_THRESHOLD, SEMANTIC_LIMIT } = require('../utils/constants');

/**
 * Capa 1: Memoria corta - ultimos mensajes de la conversacion actual + mensajes recientes globales
 */
async function getShortTermMemory(userId, folderId) {
  // Mensajes recientes de esta carpeta (los mas importantes)
  const { data: folderMessages, error: e1 } = await supabase
    .from('messages')
    .select('content, origen, created_at')
    .eq('user_id', userId)
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false })
    .limit(MAX_SHORT_MEMORY);

  if (e1) throw e1;

  // Tambien traer los ultimos 10 mensajes globales (de cualquier carpeta) para contexto cruzado
  const { data: globalMessages, error: e2 } = await supabase
    .from('messages')
    .select('content, origen, created_at, folder_id')
    .eq('user_id', userId)
    .neq('folder_id', folderId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (e2) throw e2;

  // Combinar: primero los globales (como contexto), luego los de la carpeta actual
  const allMessages = [...(globalMessages || []), ...(folderMessages || [])];
  
  // Ordenar por fecha y limitar
  allMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  return allMessages.slice(-MAX_SHORT_MEMORY);
}

/**
 * Capa 2: Memoria larga - resumenes acumulados (globales, de todas las carpetas)
 */
async function getLongTermMemory(userId, folderId) {
  const { data, error } = await supabase
    .from('memory_summaries')
    .select('contenido, tipo, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}

/**
 * Capa 3: Memoria semantica - busqueda por embeddings (similitud coseno)
 */
async function getSemanticMemory(userId, queryText) {
  const embedding = await generateEmbedding(queryText);

  const { data, error } = await supabase.rpc('match_messages', {
    query_embedding: embedding,
    match_threshold: SEMANTIC_THRESHOLD,
    match_count: SEMANTIC_LIMIT,
    p_user_id: userId,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Capa 4: Memoria global - vision general del usuario
 */
async function getGlobalMemory(userId) {
  const { data, error } = await supabase
    .from('user_global_memory')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Actualizar memoria global del usuario
 */
async function updateGlobalMemory(userId, updates) {
  const { error } = await supabase
    .from('user_global_memory')
    .update({
      ...updates,
      ultima_actualizacion: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Guardar resumen de conversacion
 */
async function saveSummary(userId, folderId, contenido, tipo = 'conversacion') {
  const embedding = await generateEmbedding(contenido);

  const { error } = await supabase
    .from('memory_summaries')
    .insert({
      user_id: userId,
      folder_id: folderId,
      tipo,
      contenido,
      embedding,
      periodo_fin: new Date().toISOString(),
    });

  if (error) throw error;
}

module.exports = {
  getShortTermMemory,
  getLongTermMemory,
  getSemanticMemory,
  getGlobalMemory,
  updateGlobalMemory,
  saveSummary,
};
