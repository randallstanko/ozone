const { genAI } = require('../config/gemini');

/**
 * Genera un embedding vector para un texto dado.
 * Usa gemini-embedding-001 de Google (768 dimensiones con outputDimensionality).
 */
async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 768
  });

  return result.embedding.values;
}

module.exports = { generateEmbedding };
