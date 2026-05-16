-- ============================================================
-- OZONE Auth Setup SQL
-- Ejecutar en Supabase SQL Editor ANTES de habilitar auth real
-- ============================================================

-- 1. Agregar columna auth_id a public.users (referencia a auth.users)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Crear indice para busquedas por auth_id
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- ============================================================
-- OPCION A: Trigger automatico (crea user en public.users al registrarse)
-- Esto hace que no necesites llamar /api/auth/setup para crear el user,
-- pero igual debes llamarlo para carpetas y memoria.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, auth_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.id
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Crear trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- OPCION B: RPC para setup manual (alternativa al trigger)
-- Llamar desde el backend: supabase.rpc('setup_new_user', { p_user_id, p_name, p_email })
-- ============================================================
CREATE OR REPLACE FUNCTION public.setup_new_user(
  p_user_id UUID,
  p_name TEXT DEFAULT 'Usuario',
  p_email TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Upsert en public.users
  INSERT INTO public.users (id, name, email, auth_id)
  VALUES (p_user_id, p_name, p_email, p_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- Crear carpetas por defecto si no existen
  IF NOT EXISTS (SELECT 1 FROM public.folders WHERE user_id = p_user_id LIMIT 1) THEN
    INSERT INTO public.folders (user_id, name, icon, color, is_general, order_index)
    VALUES
      (p_user_id, 'General',    '💬', '#6366f1', TRUE,  0),
      (p_user_id, 'Finanzas',   '💰', '#10b981', FALSE, 1),
      (p_user_id, 'Relaciones', '❤️', '#f43f5e', FALSE, 2),
      (p_user_id, 'Estudio',    '📚', '#3b82f6', FALSE, 3),
      (p_user_id, 'Salud',      '🏃', '#22c55e', FALSE, 4),
      (p_user_id, 'Proyectos',  '🚀', '#f59e0b', FALSE, 5),
      (p_user_id, 'Emociones',  '🧠', '#a855f7', FALSE, 6);
  END IF;

  -- Crear memoria global si no existe
  INSERT INTO public.user_global_memory (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- ============================================================
-- Row Level Security (RLS) - Asegurar que cada usuario
-- solo vea sus propios datos
-- ============================================================

-- Habilitar RLS (si no esta habilitado ya)
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_global_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_summaries  ENABLE ROW LEVEL SECURITY;

-- Politicas para users
DROP POLICY IF EXISTS "users_own_row" ON public.users;
CREATE POLICY "users_own_row" ON public.users
  FOR ALL USING (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Politicas para folders
DROP POLICY IF EXISTS "folders_own_rows" ON public.folders;
CREATE POLICY "folders_own_rows" ON public.folders
  FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Politicas para messages
DROP POLICY IF EXISTS "messages_own_rows" ON public.messages;
CREATE POLICY "messages_own_rows" ON public.messages
  FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Politicas para notes
DROP POLICY IF EXISTS "notes_own_rows" ON public.notes;
CREATE POLICY "notes_own_rows" ON public.notes
  FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Politicas para user_global_memory
DROP POLICY IF EXISTS "memory_own_row" ON public.user_global_memory;
CREATE POLICY "memory_own_row" ON public.user_global_memory
  FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Politicas para memory_summaries
DROP POLICY IF EXISTS "summaries_own_rows" ON public.memory_summaries;
CREATE POLICY "summaries_own_rows" ON public.memory_summaries
  FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- ============================================================
-- NOTA: El backend usa service_role_key lo que bypasea RLS.
-- Las politicas de arriba son para el cliente de Supabase
-- que usa la anon key (si se consulta directamente desde frontend).
-- ============================================================

-- ============================================================
-- CONFIGURACION SUPABASE AUTH
-- En el Supabase Dashboard > Authentication > Settings:
-- 1. Desactivar "Confirm email" para MVP (Email > Confirm email: OFF)
-- 2. Habilitar "Email" provider (ya viene por defecto)
-- ============================================================
