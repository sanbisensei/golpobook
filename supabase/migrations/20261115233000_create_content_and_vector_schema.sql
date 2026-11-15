-- ==============================================================================
-- Migration: 20261115233000_create_content_and_vector_schema.sql
-- Module: Content Hierarchy, Vector Store (pgvector), Storage & AI Quota Engine
-- Purpose: Deploys authors, audiobooks, chapters, audiobook_embeddings, ai_usage,
--          hardened match_audiobooks() RPC, check_and_consume_ai_quota() RPC,
--          and provisions Supabase Storage buckets (platform-covers, audio-vault).
-- Author: Senior Full-Stack Engineer, Supabase Security Architect & Technical Lead
-- Date: November 15, 2026
-- Phase: Sprint 1, Phase 3B
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Enable Vector Extension (pgvector)
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;

-- ------------------------------------------------------------------------------
-- 2. Create Authors Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  photo_url TEXT,
  born_year INTEGER,
  died_year INTEGER,
  era TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS authors_name_idx ON public.authors (name);
CREATE INDEX IF NOT EXISTS authors_slug_idx ON public.authors (slug);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trigger_authors_updated_at ON public.authors;
CREATE TRIGGER trigger_authors_updated_at
  BEFORE UPDATE ON public.authors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS for Authors: Public can view, Admin can manage
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authors_select_public" ON public.authors;
CREATE POLICY "authors_select_public"
  ON public.authors
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "authors_modify_admin" ON public.authors;
CREATE POLICY "authors_modify_admin"
  ON public.authors
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. Create Audiobooks Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audiobooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_bengali TEXT,
  slug TEXT NOT NULL UNIQUE,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  narrator_name TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT NOT NULL,
  cover_image_url TEXT,
  language TEXT NOT NULL DEFAULT 'bangla' CHECK (language IN ('bangla', 'english')),
  tier_requirement TEXT NOT NULL DEFAULT 'free' CHECK (tier_requirement IN ('free', 'plus', 'premium')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false, -- MANDATORY DEFAULT FALSE for draft safety
  total_duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (total_duration_seconds >= 0),
  rating_average NUMERIC(3,2) DEFAULT 0.00 CHECK (rating_average >= 0.00 AND rating_average <= 5.00),
  ratings_count INTEGER NOT NULL DEFAULT 0 CHECK (ratings_count >= 0),
  publication_year INTEGER,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS audiobooks_author_id_idx ON public.audiobooks (author_id);
CREATE INDEX IF NOT EXISTS audiobooks_category_id_idx ON public.audiobooks (category_id);
CREATE INDEX IF NOT EXISTS audiobooks_published_featured_idx ON public.audiobooks (is_published, is_featured);
CREATE INDEX IF NOT EXISTS audiobooks_published_ratings_idx ON public.audiobooks (is_published, ratings_count DESC);
CREATE INDEX IF NOT EXISTS audiobooks_tags_gin_idx ON public.audiobooks USING gin (tags);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trigger_audiobooks_updated_at ON public.audiobooks;
CREATE TRIGGER trigger_audiobooks_updated_at
  BEFORE UPDATE ON public.audiobooks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS for Audiobooks:
-- Public can view only published audiobooks; Admins have full access
ALTER TABLE public.audiobooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audiobooks_select_published" ON public.audiobooks;
CREATE POLICY "audiobooks_select_published"
  ON public.audiobooks
  FOR SELECT
  TO public
  USING (is_published = true);

DROP POLICY IF EXISTS "audiobooks_select_admin" ON public.audiobooks;
CREATE POLICY "audiobooks_select_admin"
  ON public.audiobooks
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "audiobooks_modify_admin" ON public.audiobooks;
CREATE POLICY "audiobooks_modify_admin"
  ON public.audiobooks
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. Create Chapters Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id UUID NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL CHECK (chapter_number > 0),
  title TEXT NOT NULL,
  audio_storage_path TEXT, -- Storage path in private audio-vault (e.g. 'slug/chapter-01.mp3')
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  is_preview BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chapters_audiobook_chapter_unique UNIQUE (audiobook_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS chapters_audiobook_id_idx ON public.chapters (audiobook_id);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trigger_chapters_updated_at ON public.chapters;
CREATE TRIGGER trigger_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS for Chapters:
-- Public can view chapters ONLY for published audiobooks; Admins have full access
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapters_select_published" ON public.chapters;
CREATE POLICY "chapters_select_published"
  ON public.chapters
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.audiobooks a
      WHERE a.id = chapters.audiobook_id AND a.is_published = true
    )
  );

DROP POLICY IF EXISTS "chapters_select_admin" ON public.chapters;
CREATE POLICY "chapters_select_admin"
  ON public.chapters
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "chapters_modify_admin" ON public.chapters;
CREATE POLICY "chapters_modify_admin"
  ON public.chapters
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. Create Dedicated Audiobook Embeddings Table
-- Keeps public.audiobooks lean, prevents 3KB+ row bloat on browse queries,
-- and tracks model version, dimensions, content hash, and staleness status.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audiobook_embeddings (
  audiobook_id UUID PRIMARY KEY REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  embedding extensions.vector(768) NOT NULL,
  embedding_model TEXT NOT NULL DEFAULT 'models/gemini-embedding-2',
  dimensions INTEGER NOT NULL DEFAULT 768,
  content_hash TEXT NOT NULL, -- SHA-256 hash of semantic document to detect staleness
  is_stale BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trigger_audiobook_embeddings_updated_at ON public.audiobook_embeddings;
CREATE TRIGGER trigger_audiobook_embeddings_updated_at
  BEFORE UPDATE ON public.audiobook_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS for Audiobook Embeddings:
-- Internal vector store: Block direct table access for anon and regular authenticated users.
-- Standard listeners query exclusively through the hardened match_audiobooks() RPC.
ALTER TABLE public.audiobook_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audiobook_embeddings_service_access" ON public.audiobook_embeddings;
CREATE POLICY "audiobook_embeddings_service_access"
  ON public.audiobook_embeddings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "audiobook_embeddings_admin_all" ON public.audiobook_embeddings;
CREATE POLICY "audiobook_embeddings_admin_all"
  ON public.audiobook_embeddings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. Create AI Usage Quota Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL DEFAULT 'story_finder_daily',
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, feature, period_start)
);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trigger_ai_usage_updated_at ON public.ai_usage;
CREATE TRIGGER trigger_ai_usage_updated_at
  BEFORE UPDATE ON public.ai_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS for AI Usage: Users view their own quota, Admins view all
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage_select_own" ON public.ai_usage;
CREATE POLICY "ai_usage_select_own"
  ON public.ai_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_usage_select_admin" ON public.ai_usage;
CREATE POLICY "ai_usage_select_admin"
  ON public.ai_usage
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. Deploy Hardened match_audiobooks() RPC
-- Security Invariants:
-- - SET search_path = '' (immune to search_path injection)
-- - Fully schema-qualified objects and operators
-- - REVOKE from PUBLIC on explicit signature
-- - Validated and bounded match_count [1, 20] and match_threshold [0.0, 1.0]
-- - Returns presentation metadata only; NEVER exposes audio storage paths
-- - Strictly filters is_published = true AND is_stale = false
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_audiobooks(
  query_embedding extensions.vector(768),
  match_threshold double precision DEFAULT 0.30,
  match_count integer DEFAULT 5,
  p_language text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  title_bengali text,
  slug text,
  author_name text,
  narrator_name text,
  category_name text,
  short_description text,
  cover_image_url text,
  tier_requirement text,
  total_duration_seconds integer,
  similarity double precision
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_bound_count integer;
  v_bound_threshold double precision;
BEGIN
  -- Validate and bound match_count (1 to 20)
  v_bound_count := LEAST(GREATEST(COALESCE(match_count, 5), 1), 20);
  
  -- Validate and bound match_threshold (0.0 to 1.0)
  v_bound_threshold := LEAST(GREATEST(COALESCE(match_threshold, 0.30), 0.0), 1.0);

  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.title_bengali,
    a.slug,
    auth.name AS author_name,
    a.narrator_name,
    cat.name AS category_name,
    a.short_description,
    a.cover_image_url,
    a.tier_requirement,
    a.total_duration_seconds,
    ROUND((1 - (ae.embedding OPERATOR(extensions.<=>) query_embedding))::numeric, 4)::double precision AS similarity
  FROM public.audiobooks a
  JOIN public.audiobook_embeddings ae ON a.id = ae.audiobook_id
  JOIN public.authors auth ON a.author_id = auth.id
  JOIN public.categories cat ON a.category_id = cat.id
  WHERE a.is_published = true          -- SECURITY: Never leak unpublished or draft books
    AND ae.is_stale = false            -- SECURITY: Never return stale embeddings
    AND (p_language IS NULL OR a.language = p_language)
    AND (1 - (ae.embedding OPERATOR(extensions.<=>) query_embedding)) >= v_bound_threshold
  ORDER BY ae.embedding OPERATOR(extensions.<=>) query_embedding ASC
  LIMIT v_bound_count;
END;
$$;

-- Revoke execution from PUBLIC on the explicit signature
REVOKE EXECUTE ON FUNCTION public.match_audiobooks(extensions.vector, double precision, integer, text) FROM PUBLIC;

-- Grant execution explicitly to intended roles only
GRANT EXECUTE ON FUNCTION public.match_audiobooks(extensions.vector, double precision, integer, text) 
  TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 8. Deploy Atomic check_and_consume_ai_quota() RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_consume_ai_quota(
  p_feature text DEFAULT 'story_finder_daily'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_plan_id text;
  v_limit numeric;
  v_used integer;
  v_today date;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'UNAUTHENTICATED');
  END IF;

  -- Get user's active plan (defaults to 'free')
  SELECT plan_id INTO v_plan_id
  FROM public.user_subscriptions
  WHERE user_id = v_user_id AND status = 'active'
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    v_plan_id := 'free';
  END IF;

  -- Get limit for this tier and feature
  SELECT limit_value INTO v_limit
  FROM public.tier_limits
  WHERE tier = v_plan_id AND feature = p_feature
  LIMIT 1;

  -- If NULL, it means unlimited (e.g. Premium tier)
  IF v_limit IS NULL THEN
    v_today := CURRENT_DATE;
    INSERT INTO public.ai_usage (user_id, feature, period_start, used_count)
    VALUES (v_user_id, p_feature, v_today, 1)
    ON CONFLICT (user_id, feature, period_start)
    DO UPDATE SET used_count = public.ai_usage.used_count + 1, updated_at = now();

    RETURN jsonb_build_object('allowed', true, 'remaining', -1, 'limit', -1, 'plan', v_plan_id);
  END IF;

  -- Check current usage for today
  v_today := CURRENT_DATE;
  SELECT used_count INTO v_used
  FROM public.ai_usage
  WHERE user_id = v_user_id AND feature = p_feature AND period_start = v_today;

  IF v_used IS NULL THEN
    v_used := 0;
  END IF;

  IF v_used >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'QUOTA_EXCEEDED',
      'used', v_used,
      'limit', v_limit,
      'plan', v_plan_id
    );
  END IF;

  -- Increment usage atomically
  INSERT INTO public.ai_usage (user_id, feature, period_start, used_count)
  VALUES (v_user_id, p_feature, v_today, 1)
  ON CONFLICT (user_id, feature, period_start)
  DO UPDATE SET used_count = public.ai_usage.used_count + 1, updated_at = now();

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', (v_limit - v_used - 1),
    'limit', v_limit,
    'plan', v_plan_id
  );
END;
$$;

-- Revoke execution from PUBLIC on explicit signature
REVOKE EXECUTE ON FUNCTION public.check_and_consume_ai_quota(text) FROM PUBLIC;

-- Grant execution explicitly to intended roles only
GRANT EXECUTE ON FUNCTION public.check_and_consume_ai_quota(text) 
  TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 9. Provision Supabase Storage Buckets & Policies
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('platform-covers', 'platform-covers', true, 5242880, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]),
  ('audio-vault', 'audio-vault', false, 104857600, ARRAY['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for platform-covers (Public Read, Admin Write)
DROP POLICY IF EXISTS "platform_covers_public_read" ON storage.objects;
CREATE POLICY "platform_covers_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'platform-covers');

DROP POLICY IF EXISTS "platform_covers_admin_insert" ON storage.objects;
CREATE POLICY "platform_covers_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'platform-covers' AND public.is_admin());

DROP POLICY IF EXISTS "platform_covers_admin_update" ON storage.objects;
CREATE POLICY "platform_covers_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'platform-covers' AND public.is_admin())
  WITH CHECK (bucket_id = 'platform-covers' AND public.is_admin());

DROP POLICY IF EXISTS "platform_covers_admin_delete" ON storage.objects;
CREATE POLICY "platform_covers_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'platform-covers' AND public.is_admin());

-- Storage Policies for audio-vault (Private - Admin Write, Service Role / Signed URL Read)
DROP POLICY IF EXISTS "audio_vault_admin_insert" ON storage.objects;
CREATE POLICY "audio_vault_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio-vault' AND public.is_admin());

DROP POLICY IF EXISTS "audio_vault_admin_all" ON storage.objects;
CREATE POLICY "audio_vault_admin_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'audio-vault' AND public.is_admin())
  WITH CHECK (bucket_id = 'audio-vault' AND public.is_admin());
