-- ============================================================
-- OZONE - Migración de OpenAI (1536 dims) a Gemini (768 dims)
-- Ejecutar en Supabase SQL Editor
-- ADVERTENCIA: Esta migracion borra los embeddings existentes.
--              Son incompatibles entre modelos, igual hay que
--              regenerarlos al usar el nuevo modelo.
-- ============================================================

-- PASO 1: Eliminar indices que dependen de las columnas embedding
DROP INDEX IF EXISTS idx_messages_embedding;

-- PASO 2: Migrar columna embedding en messages (1536 -> 768)
ALTER TABLE messages DROP COLUMN IF EXISTS embedding;
ALTER TABLE messages ADD COLUMN embedding VECTOR(768);

-- PASO 3: Migrar columna embedding en memory_summaries (1536 -> 768)
ALTER TABLE memory_summaries DROP COLUMN IF EXISTS embedding;
ALTER TABLE memory_summaries ADD COLUMN embedding VECTOR(768);

-- PASO 4: Recrear indice ivfflat para messages con nuevo tamano
CREATE INDEX idx_messages_embedding ON messages
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- PASO 5: Actualizar la funcion match_messages para VECTOR(768)
CREATE OR REPLACE FUNCTION match_messages(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  folder_id UUID,
  importancia INTEGER,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.folder_id,
    m.importancia,
    1 - (m.embedding <=> query_embedding) AS similarity,
    m.created_at
  FROM messages m
  WHERE
    (p_user_id IS NULL OR m.user_id = p_user_id)
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- Migracion completa.
-- Los embeddings existentes fueron eliminados (incompatibles).
-- Se regeneraran automaticamente con text-embedding-004 (768 dims)
-- a medida que los usuarios envien nuevos mensajes.
-- ============================================================
