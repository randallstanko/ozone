-- ============================================
-- OZONE MVP - Schema de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Habilitar extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TABLA: users (simplificada para MVP)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Usuario Demo',
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar usuario demo
INSERT INTO users (id, name, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'Usuario Demo', 'demo@ozone.app');

-- ============================================
-- TABLA: folders (carpetas/categorias)
-- ============================================
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  order_index INTEGER DEFAULT 0,
  is_general BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carpetas por defecto
INSERT INTO folders (user_id, name, icon, color, is_general, order_index) VALUES
('00000000-0000-0000-0000-000000000001', 'General', '💬', '#6366f1', TRUE, 0),
('00000000-0000-0000-0000-000000000001', 'Finanzas', '💰', '#10b981', FALSE, 1),
('00000000-0000-0000-0000-000000000001', 'Relaciones', '❤️', '#f43f5e', FALSE, 2),
('00000000-0000-0000-0000-000000000001', 'Estudio', '📚', '#3b82f6', FALSE, 3),
('00000000-0000-0000-0000-000000000001', 'Salud', '🏃', '#22c55e', FALSE, 4),
('00000000-0000-0000-0000-000000000001', 'Proyectos', '🚀', '#f59e0b', FALSE, 5),
('00000000-0000-0000-0000-000000000001', 'Emociones', '🧠', '#a855f7', FALSE, 6);

-- ============================================
-- TABLA: messages (mensajes del chat)
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  origen TEXT NOT NULL CHECK (origen IN ('usuario', 'ia')),
  tags TEXT[] DEFAULT '{}',
  importancia INTEGER DEFAULT 0 CHECK (importancia BETWEEN 0 AND 5),
  embedding VECTOR(1536),
  resumen TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para rendimiento
CREATE INDEX idx_messages_user_folder ON messages(user_id, folder_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_importancia ON messages(importancia DESC);
CREATE INDEX idx_messages_tags ON messages USING GIN(tags);

-- Indice para busqueda por similitud (coseno)
CREATE INDEX idx_messages_embedding ON messages
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================
-- TABLA: memory_summaries (resumenes acumulados)
-- ============================================
CREATE TABLE memory_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('conversacion', 'semanal', 'global')),
  contenido TEXT NOT NULL,
  periodo_inicio TIMESTAMPTZ,
  periodo_fin TIMESTAMPTZ,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: user_global_memory (memoria global del usuario)
-- ============================================
CREATE TABLE user_global_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  temas_repetidos JSONB DEFAULT '[]',
  metas JSONB DEFAULT '[]',
  emociones_frecuentes JSONB DEFAULT '[]',
  decisiones_importantes JSONB DEFAULT '[]',
  problemas_activos JSONB DEFAULT '[]',
  avances JSONB DEFAULT '[]',
  personalidad_detectada JSONB DEFAULT '{}',
  ultima_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar memoria global demo
INSERT INTO user_global_memory (user_id)
VALUES ('00000000-0000-0000-0000-000000000001');

-- ============================================
-- TABLA: notes (segundo cerebro)
-- ============================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL CHECK (categoria IN (
    'ideas', 'metas', 'decisiones', 'resumenes',
    'finanzas', 'relaciones', 'proyectos',
    'aprendizajes', 'reflexiones'
  )),
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  auto_generated BOOLEAN DEFAULT TRUE,
  importancia INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_user_categoria ON notes(user_id, categoria);

-- ============================================
-- FUNCION: busqueda semantica por similitud
-- ============================================
CREATE OR REPLACE FUNCTION match_messages(
  query_embedding VECTOR(1536),
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
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
