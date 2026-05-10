const { supabase } = require('../config/supabase');
const { generateSummary } = require('./aiService');
const { generateEmbedding } = require('./embeddingService');

/**
 * Genera resumen de una carpeta y lo guarda
 */
async function generateFolderSummary(userId, folderId) {
  // Obtener ultimos 30 mensajes sin resumen
  const { data: messages, error } = await supabase
    .from('messages')
    .select('content, origen, created_at')
    .eq('user_id', userId)
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error || !messages || messages.length < 5) return null;

  const summary = await generateSummary(messages.reverse());
  const embedding = await generateEmbedding(summary);

  const { data, error: insertError } = await supabase
    .from('memory_summaries')
    .insert({
      user_id: userId,
      folder_id: folderId,
      tipo: 'conversacion',
      contenido: summary,
      embedding,
      periodo_inicio: messages[0].created_at,
      periodo_fin: messages[messages.length - 1].created_at,
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return data;
}

module.exports = { generateFolderSummary };
