const { groq } = require('../config/groq');

/**
 * Enviar mensaje al modelo Groq (Llama 3.3 70B) con contexto completo
 */
async function getChatCompletion(systemPrompt, messages) {
  const modelName = process.env.CHAT_MODEL || 'llama-3.3-70b-versatile';

  const result = await groq.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return result.choices[0].message.content;
}

/**
 * Generar resumen de un conjunto de mensajes
 */
async function generateSummary(messages) {
  const modelName = process.env.SUMMARY_MODEL || 'llama-3.3-70b-versatile';

  const messagesText = messages
    .map((m) => `${m.origen === 'usuario' ? 'Usuario' : 'Ozone'}: ${m.content}`)
    .join('\n');

  const result = await groq.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: 'Genera un resumen conciso y util de la siguiente conversacion. Incluye puntos clave, decisiones, emociones detectadas, y temas principales. Maximo 200 palabras.' },
      { role: 'user', content: messagesText }
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  return result.choices[0].message.content;
}

/**
 * Analizar mensaje para extraer tags e importancia
 */
async function analyzeMessage(content) {
  const modelName = process.env.SUMMARY_MODEL || 'llama-3.3-70b-versatile';

  const result = await groq.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: `Analiza el siguiente mensaje y responde SOLO con JSON valido:
{
  "tags": ["tag1", "tag2"],
  "importancia": 0,
  "categoria_nota": null
}
tags: maximo 5 tags relevantes
importancia: 0-5 donde 5 es muy importante (decisiones grandes, metas, crisis)
categoria_nota: si amerita nota usa uno de estos valores: "ideas"|"metas"|"decisiones"|"finanzas"|"relaciones"|"proyectos"|"aprendizajes"|"reflexiones" - si no amerita nota usa null` },
      { role: 'user', content }
    ],
    temperature: 0.2,
    max_tokens: 200,
    response_format: { type: 'json_object' },
  });

  try {
    return JSON.parse(result.choices[0].message.content);
  } catch {
    return { tags: [], importancia: 0, categoria_nota: null };
  }
}

/**
 * Actualizar la memoria global del usuario basandose en la conversacion reciente
 */
async function analyzeForGlobalMemory(recentMessages, currentGlobalMemory) {
  const modelName = process.env.SUMMARY_MODEL || 'llama-3.3-70b-versatile';

  const messagesText = recentMessages
    .map((m) => `${m.origen === 'usuario' ? 'Usuario' : 'Ozone'}: ${m.content}`)
    .join('\n');

  const result = await groq.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: `Eres un analista de perfil personal. Basandote en la conversacion reciente y el perfil actual del usuario, actualiza su perfil global. Responde SOLO con JSON valido con esta estructura exacta:
{
  "temas_repetidos": ["tema1", "tema2"],
  "metas": ["meta1", "meta2"],
  "emociones_frecuentes": ["emocion1"],
  "decisiones_importantes": ["decision1"],
  "problemas_activos": ["problema1"],
  "avances": ["avance1"]
}
Solo incluye items que se evidencien claramente. Mantiene los existentes si siguen siendo relevantes.

PERFIL ACTUAL:
${JSON.stringify(currentGlobalMemory || {}, null, 2)}` },
      { role: 'user', content: `CONVERSACION RECIENTE:\n${messagesText}` }
    ],
    temperature: 0.3,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });

  try {
    return JSON.parse(result.choices[0].message.content);
  } catch {
    return null;
  }
}

module.exports = {
  getChatCompletion,
  generateSummary,
  analyzeMessage,
  analyzeForGlobalMemory,
};
