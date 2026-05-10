const { analyzeMessage } = require('./aiService');

/**
 * Genera tags automaticos para un mensaje
 */
async function generateTags(content) {
  const analysis = await analyzeMessage(content);
  return {
    tags: analysis.tags || [],
    importancia: analysis.importancia || 0,
  };
}

module.exports = { generateTags };
