-- ==============================================================================
-- Migration: 20261113220002_create_categories.sql
-- Module: Content Taxonomy & Discovery
-- Purpose: Defines public content categories for audiobooks and podcasts
-- Author: Senior Backend Architect & Database Lead
-- Date: November 2026
-- ==============================================================================

-- 1. Create Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon_name TEXT,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for category listing and slug lookups
CREATE INDEX IF NOT EXISTS categories_slug_idx ON public.categories (slug);
CREATE INDEX IF NOT EXISTS categories_active_order_idx ON public.categories (is_active, display_order);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. Seed Standard Bengali & Global Audio Categories (matching Phase 1 mock catalog)
INSERT INTO public.categories (name, slug, icon_name, description, display_order, is_active)
VALUES
  ('Adventure & Thriller', 'adventure-thriller', 'Compass', 'High-stakes expeditions, survival journeys, and adrenaline-fueled chases.', 1, true),
  ('Classic Literature', 'classic-literature', 'BookOpen', 'Timeless Bengali and international literary masterpieces and heritage works.', 2, true),
  ('Mystery & Detective', 'mystery-detective', 'Search', 'Intellectual whodunits, sleuth adventures, and thrilling forensic mysteries.', 3, true),
  ('Supernatural & Horror', 'supernatural-horror', 'Ghost', 'Spine-chilling ghost stories, folklore horrors, and psychological thrillers.', 4, true),
  ('Magical Realism', 'magical-realism', 'Sparkles', 'Surreal worlds blending mythical fantasy with everyday realism.', 5, true),
  ('Dystopian Sci-Fi', 'dystopian-sci-fi', 'Cpu', 'Futuristic sagas, technological dystopias, and deep space exploration.', 6, true),
  ('Podcasts', 'podcasts', 'Radio', 'Engaging conversational shows, investigative journalism, and weekly cultural talks.', 7, true),
  ('E-Learning', 'e-learning', 'GraduationCap', 'Self-improvement, history documentaries, business management, and educational lectures.', 8, true),
  ('Historical & Liberation War', 'historical-liberation-war', 'Flag', 'Accounts of the 1971 Bangladesh Liberation War and poignant historical chronicles.', 9, true),
  ('Romance & Drama', 'romance-drama', 'Heart', 'Emotional literary dramas, romantic tragedies, and family sagas.', 10, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon_name = EXCLUDED.icon_name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;
