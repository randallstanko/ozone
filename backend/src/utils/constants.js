module.exports = {
  CATEGORIAS_NOTAS: [
    'ideas', 'metas', 'decisiones', 'resumenes',
    'finanzas', 'relaciones', 'proyectos',
    'aprendizajes', 'reflexiones'
  ],
  ORIGENES_MENSAJE: ['usuario', 'ia'],
  TIPOS_RESUMEN: ['conversacion', 'semanal', 'global'],
  MAX_SHORT_MEMORY: parseInt(process.env.MAX_SHORT_MEMORY_MESSAGES) || 50,
  SEMANTIC_THRESHOLD: parseFloat(process.env.SEMANTIC_SEARCH_THRESHOLD) || 0.5,
  SEMANTIC_LIMIT: parseInt(process.env.SEMANTIC_SEARCH_LIMIT) || 10,
};
