-- ==============================================================================
-- Migration: 20261127224500_create_listening_history_and_bookmarks.sql
-- Sprint 3: Global Audio Player Progress Sync & Saved Bookmarks
-- ==============================================================================

-- 1. Listening History Table (tracks per-user playback position per audiobook)
CREATE TABLE IF NOT EXISTS public.listening_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audiobook_id UUID NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  completed BOOLEAN NOT NULL DEFAULT false,
  last_played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, audiobook_id)
);

CREATE INDEX IF NOT EXISTS listening_history_user_last_played_idx
  ON public.listening_history (user_id, last_played_at DESC);

DROP TRIGGER IF EXISTS trigger_listening_history_updated_at ON public.listening_history;
CREATE TRIGGER trigger_listening_history_updated_at
  BEFORE UPDATE ON public.listening_history
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listening_history_own_all" ON public.listening_history;
CREATE POLICY "listening_history_own_all"
  ON public.listening_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Bookmarks Table (saved audiobooks shelf)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audiobook_id UUID NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, audiobook_id)
);

CREATE INDEX IF NOT EXISTS bookmarks_user_created_idx
  ON public.bookmarks (user_id, created_at DESC);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookmarks_own_all" ON public.bookmarks;
CREATE POLICY "bookmarks_own_all"
  ON public.bookmarks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
