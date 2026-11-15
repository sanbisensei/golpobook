# GOLPOBOOK: COMPREHENSIVE SYSTEM ARCHITECTURE & DATA SPECIFICATION
**Document ID:** `03-SYSTEM-ARCHITECTURE`  
**Course:** CSE 495 – IT Project Management  
**Project:** GolpoBook – Personalized Subscription-Based Audiobook & Podcast Platform  
**Target Platform:** Next.js (App Router, JS), Supabase (PostgreSQL, pgvector, Auth, Storage), SSLCommerz  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT

---

## 1. End-to-End System Architecture

GolpoBook is structured as a modern, decoupled cloud application leveraging Next.js App Router for frontend presentation and edge orchestration, paired with Supabase as a fully managed PostgreSQL backend, storage engine, and vector store.

```
+----------------------------------------------------------------------------------------------------+
|                                      CLIENT BROWSER (PWA-READY)                                    |
|  - Next.js React 19 Client Tree (UI Primitives, Tactile Visualizer, Audio Context)                 |
|  - Native HTML5 <audio> Streaming Engine (Background Playback, MediaSession API, Speed Controls)    |
|  - Service Worker / IndexedDB (Offline Metadata & Preview Cache)                                   |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                             HTTPS / JSON / Audio Stream Requests
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                    NEXT.JS EDGE & SERVER RUNTIME                                   |
|  +-----------------------------+-------------------------------+--------------------------------+  |
|  | Route Handlers & Server Act | RAG Orchestrator & Normalizer | SSLCommerz IPN & Webhook Valve |  |
|  | - Auth session verification | - Banglish/Bangla translation | - Hash validation (val_id)     |  |
|  | - Signed URL generation     | - Gemini 2.0 Flash re-write   | - Idempotency lock & ledger    |  |
|  | - Atomic quota enforcement  | - Vector embedding conversion | - Subscription activation job  |  |
|  +-----------------------------+-------------------------------+--------------------------------+  |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                    PostgreSQL Pool / pgvector RPC / Private Storage S3 API
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                  SUPABASE BACKEND CLOUD INFRASTRUCTURE                             |
|  +-----------------------------+-------------------------------+--------------------------------+  |
|  | PostgreSQL 15+ & pgvector   | Supabase Storage (Private)    | Supabase Auth & Security Engine|  |
|  | - 20 Normalized Relational  | - 'audio-vault' (Private)     | - Row Level Security (RLS)     |  |
|  |   Tables with Foreign Keys  | - Time-limited Signed URLs    | - JWT Verification             |  |
|  | - HNSW Index on Embeddings  | - 'public-assets' (Covers)    | - Service Role Bypass for APIs |  |
|  | - Atomic RPC Functions      | - 50MB chapter chunking       | - Role-based authorization     |  |
|  +-----------------------------+-------------------------------+--------------------------------+  |
+-------------------+---------------------------------------------+----------------------------------+
                    |                                             |
                    v                                             v
+---------------------------------------+     +------------------------------------------------------+
|     EXTERNAL AI INGESTION ENGINE      |     |             SSLCOMMERZ SANDBOX GATEWAY               |
|  - Gemini 2.0 Flash / text-embedding  |     |  - Payment Session Generation (POST /gwprocess/v4)   |
|  - Cosine Distance Search (<=>)       |     |  - Server-to-Server Validation (validator/api)       |
|  - Strict Zero-Hallucination Retrieval|     |  - Multi-channel sandbox (bKash, Nagad, Cards)       |
+---------------------------------------+     +------------------------------------------------------+
```

---

## 2. Recommended Next.js Scalable Directory Structure

To maintain clean separation of concerns in a JavaScript (non-TypeScript) codebase, the application structure is organized into domain-specific modules:

```
golpobook/
├── .env.local                          # Environment keys (Supabase, SSLCommerz, Gemini)
├── components.json                     # shadcn / Base UI configuration
├── next.config.mjs                     # Next.js 16 configuration
├── package.json                        # Locked dependencies
├── public/                             # Static public branding and fallback SVGs
│   ├── covers/                         # Default placeholder covers
│   └── icons/                          # PWA and browser favicons
├── src/
│   ├── app/                            # Next.js App Router root
│   │   ├── (auth)/                     # Auth Route Group (centered layout)
│   │   │   ├── login/page.jsx
│   │   │   ├── register/page.jsx
│   │   │   └── forgot-password/page.jsx
│   │   ├── (listener)/                 # Main Listener Experience (3-tier layout)
│   │   │   ├── layout.jsx              # Hosts Left Nav Rail & Persistent Inspector Player
│   │   │   ├── page.jsx                # "For You" personalized dashboard
│   │   │   ├── audiobooks/
│   │   │   │   ├── page.jsx            # Catalog browse & genre filters
│   │   │   │   └── [slug]/page.jsx     # Audiobook detail & chapter list
│   │   │   ├── podcasts/
│   │   │   │   ├── page.jsx            # Podcasts directory
│   │   │   │   └── [slug]/page.jsx     # Podcast episode list
│   │   │   ├── story-finder/page.jsx   # Dedicated RAG natural-language search UI
│   │   │   ├── library/page.jsx        # Continue listening, bookmarks, history
│   │   │   ├── onboarding/page.jsx     # Taste onboarding questionnaire
│   │   │   └── pricing/page.jsx        # Tier selection & upgrade checkout
│   │   ├── (admin)/                    # Admin Backoffice (protected by role)
│   │   │   ├── layout.jsx              # Backoffice sidebar
│   │   │   ├── admin/
│   │   │   │   ├── upload/page.jsx     # Chapter-by-chapter upload form
│   │   │   │   ├── audiobooks/page.jsx # Content manager & embedding generator
│   │   │   │   └── subscriptions/page.jsx
│   │   ├── api/                        # Server Route Handlers
│   │   │   ├── audio/
│   │   │   │   └── stream-url/route.js # Signed URL generator & tier verifier
│   │   │   ├── ai/
│   │   │   │   ├── story-finder/route.js # RAG search & Banglish normalizer
│   │   │   │   └── summary/route.js    # AI chapter summarizer
│   │   │   └── payment/
│   │   │       ├── initiate/route.js   # SSLCommerz session creator
│   │   │       ├── success/route.js    # SSLCommerz success return URL
│   │   │       ├── fail/route.js       # SSLCommerz failure return URL
│   │   │       ├── cancel/route.js     # SSLCommerz cancel return URL
│   │   │       └── ipn/route.js        # SSLCommerz Instant Payment Notification
│   │   ├── globals.css                 # Audiora Neo-Editorial tokens & Tailwind imports
│   │   └── layout.js                   # Root HTML shell, fonts, ThemeProvider
│   ├── components/
│   │   ├── audio/                      # Audio Player Subsystem
│   │   │   ├── global-player.jsx       # Inspector audio player widget
│   │   │   ├── waveform-bars.jsx       # Hardware-inspired animated equalizer
│   │   │   ├── chapter-list.jsx        # Track progression & preview indicators
│   │   │   ├── speed-selector.jsx      # Tier-gated speed popover (1.0x-2.0x)
│   │   │   └── sleep-timer-modal.jsx   # Sleep timer dialog
│   │   ├── cards/                      # Reusable Content Cards
│   │   │   ├── audiobook-card.jsx      # 2:3 aspect ratio card with hard shadow
│   │   │   └── podcast-card.jsx        # 1:1 aspect ratio card
│   │   ├── layout/                     # Structural Navigation
│   │   │   ├── navigation-rail.jsx     # Desktop 72px left rail
│   │   │   ├── top-header.jsx          # Header with canary search bar
│   │   │   └── bottom-nav.jsx          # Mobile bottom navigation bar
│   │   ├── story-finder/               # AI Search Components
│   │   │   ├── prompt-box.jsx          # Banglish-enabled input container
│   │   │   └── quota-counter.jsx       # Daily remaining badge
│   │   └── ui/                         # Base UI / shadcn customized primitives
│   ├── context/
│   │   ├── audio-context.jsx           # Global audio state & HTML5 audio engine
│   │   └── auth-context.jsx            # Supabase user & subscription state
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.js               # Browser Supabase client (anon key)
│   │   │   ├── server.js               # Server Supabase client (cookies)
│   │   │   └── admin.js                # Service Role client (private, backend only)
│   │   ├── ai/
│   │   │   ├── gemini.js               # Gemini 2.0 Flash client & prompt templates
│   │   │   └── embeddings.js           # Vector embedding helper
│   │   ├── payment/
│   │   │   └── sslcommerz.js           # SSLCommerz sandbox API wrapper
│   │   ├── constants/
│   │   │   └── tiers.js                # Tier limits & feature constants
│   │   └── utils.js                    # Merged clsx + twMerge utility function
│   └── hooks/
│       ├── use-audio.js                # Player state consumer hook
│       ├── use-user-tier.js            # User subscription & tier capabilities
│       └── use-media-session.js        # OS lockscreen media controls hook
```

---

## 3. Normalized Relational Database Schema (Supabase PostgreSQL)

The platform requires **20 relational tables** organized with strict foreign key constraints, default timestamps, and appropriate indexing to guarantee data integrity, fast vector similarity retrieval, and tier enforcement.

```
+--------------------------------------------------------------------------------------------------+
|                                    RELATIONAL SCHEMA MAP                                         |
|                                                                                                  |
|   auth.users (Supabase)                                                                          |
|       |                                                                                          |
|       +---> profiles (id = auth.users.id)                                                        |
|       |        |                                                                                 |
|       |        +---> user_preferences                                                            |
|       |        +---> user_subscriptions ---> subscription_plans                                  |
|       |        +---> payment_transactions                                                        |
|       |        +---> ai_usage                                                                    |
|       |        +---> listening_history                                                           |
|       |        +---> bookmarks                                                                   |
|       |        +---> user_follows                                                                |
|       |                                                                                          |
|   categories <---+                                                                               |
|                  |                                                                               |
|   authors <------+---> audiobooks <---+---> chapters (1:N)                                       |
|                  |          |         |        |                                                 |
|                  |          |         |        +---> bookmarks                                   |
|   podcasters <---+          |         |        +---> listening_history                           |
|         |                   |         |                                                          |
|         +---> podcasts <----+         +---> reviews                                              |
|                   |                                                                              |
|                   +---> podcast_episodes (1:N)                                                   |
+--------------------------------------------------------------------------------------------------+
```

### 3.1 Table Specifications

#### 1. `profiles`
- **Purpose**: Stores public listener identity, display name, and role.
- **Columns**: `id` (UUID, PK, FK -> `auth.users.id` ON DELETE CASCADE), `full_name` (TEXT), `avatar_url` (TEXT), `role` (TEXT DEFAULT 'listener' CHECK in ('listener', 'admin')), `created_at` (TIMESTAMPTZ DEFAULT now()).
- **Indexes**: `profiles_pkey` on `id`.

#### 2. `user_preferences`
- **Purpose**: Captures taste onboarding choices for algorithmic recommendations.
- **Columns**: `user_id` (UUID, PK, FK -> `profiles.id`), `preferred_genres` (TEXT[]), `preferred_languages` (TEXT[] DEFAULT '{"bangla"}'), `onboarding_completed` (BOOLEAN DEFAULT false), `updated_at` (TIMESTAMPTZ DEFAULT now()).

#### 3. `authors`
- **Purpose**: Directory of literary authors and audiobook creators.
- **Columns**: `id` (UUID, PK DEFAULT gen_random_uuid()), `name` (TEXT NOT NULL), `bio` (TEXT), `photo_url` (TEXT), `created_at` (TIMESTAMPTZ).
- **Indexes**: `authors_name_idx` on `name`.

#### 4. `podcasters`
- **Purpose**: Profiles of podcast hosts and creators.
- **Columns**: `id` (UUID, PK DEFAULT gen_random_uuid()), `name` (TEXT NOT NULL), `bio` (TEXT), `avatar_url` (TEXT), `created_at` (TIMESTAMPTZ).

#### 5. `categories`
- **Purpose**: Content categorization (e.g., Horror, Thriller, Historical, Self-Help).
- **Columns**: `id` (UUID, PK DEFAULT gen_random_uuid()), `name` (TEXT UNIQUE NOT NULL), `slug` (TEXT UNIQUE NOT NULL), `icon_name` (TEXT), `display_order` (INT DEFAULT 0).

#### 6. `audiobooks`
- **Purpose**: Master catalog of audiobooks.
- **Columns**: 
  - `id` (UUID, PK DEFAULT gen_random_uuid())
  - `title` (TEXT NOT NULL)
  - `slug` (TEXT UNIQUE NOT NULL)
  - `author_id` (UUID NOT NULL, FK -> `authors.id`)
  - `category_id` (UUID NOT NULL, FK -> `categories.id`)
  - `narrator_name` (TEXT NOT NULL)
  - `description` (TEXT NOT NULL)
  - `cover_image_url` (TEXT NOT NULL)
  - `tier_requirement` (TEXT DEFAULT 'free' CHECK in ('free', 'plus', 'premium'))
  - `is_exclusive` (BOOLEAN DEFAULT false)
  - `total_duration_seconds` (INT DEFAULT 0)
  - `language` (TEXT DEFAULT 'bangla')
  - `embedding` (`vector(768)`) — Vector representation for RAG Story Finder.
  - `created_at` (TIMESTAMPTZ DEFAULT now())
- **Indexes**: 
  - `audiobooks_slug_idx` on `slug`.
  - `audiobooks_embedding_hnsw_idx` USING `hnsw (embedding vector_cosine_ops)`.

#### 7. `chapters`
- **Purpose**: Stores individual chapter audio chunks for chapter-based streaming.
- **Columns**: 
  - `id` (UUID, PK DEFAULT gen_random_uuid())
  - `audiobook_id` (UUID NOT NULL, FK -> `audiobooks.id` ON DELETE CASCADE)
  - `chapter_number` (INT NOT NULL)
  - `title` (TEXT NOT NULL)
  - `duration_seconds` (INT NOT NULL)
  - `audio_storage_path` (TEXT NOT NULL) — Path inside private Supabase storage.
  - `is_preview` (BOOLEAN DEFAULT false) — Allows Free users to listen to sample chapters.
  - `created_at` (TIMESTAMPTZ DEFAULT now())
- **Indexes**: `chapters_audiobook_id_order_idx` on `(audiobook_id, chapter_number)`.

#### 8. `podcasts`
- **Purpose**: Directory of audio podcast shows.
- **Columns**: `id` (UUID, PK), `title` (TEXT), `slug` (TEXT UNIQUE), `podcaster_id` (UUID, FK -> `podcasters.id`), `category_id` (UUID, FK -> `categories.id`), `description` (TEXT), `cover_image_url` (TEXT), `tier_requirement` (TEXT DEFAULT 'free'), `created_at` (TIMESTAMPTZ).

#### 9. `podcast_episodes`
- **Purpose**: Individual episodes belonging to a podcast show.
- **Columns**: `id` (UUID, PK), `podcast_id` (UUID, FK -> `podcasts.id`), `episode_number` (INT), `title` (TEXT), `duration_seconds` (INT), `audio_storage_path` (TEXT), `is_free` (BOOLEAN DEFAULT true), `published_at` (TIMESTAMPTZ).

#### 10. `user_follows`
- **Purpose**: Following relationships for podcasters and authors.
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK -> `profiles.id`), `follow_type` (TEXT CHECK in ('author', 'podcaster')), `target_id` (UUID NOT NULL), `created_at` (TIMESTAMPTZ).
- **Constraints**: UNIQUE(`user_id`, `follow_type`, `target_id`).

#### 11. `listening_history`
- **Purpose**: Records playback progress per user, book, and chapter.
- **Columns**: 
  - `id` (UUID, PK)
  - `user_id` (UUID NOT NULL, FK -> `profiles.id`)
  - `audiobook_id` (UUID, FK -> `audiobooks.id`)
  - `chapter_id` (UUID NOT NULL, FK -> `chapters.id`)
  - `progress_seconds` (INT DEFAULT 0)
  - `is_completed` (BOOLEAN DEFAULT false)
  - `last_listened_at` (TIMESTAMPTZ DEFAULT now())
- **Constraints**: UNIQUE(`user_id`, `chapter_id`).
- **Indexes**: `listening_history_user_audiobook_idx` on `(user_id, audiobook_id)`.

#### 12. `bookmarks`
- **Purpose**: Specific timestamps bookmarked by the listener inside a chapter.
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK -> `profiles.id`), `chapter_id` (UUID, FK -> `chapters.id`), `timestamp_seconds` (INT NOT NULL), `note` (TEXT), `created_at` (TIMESTAMPTZ).

#### 13. `playlists`
- **Purpose**: Custom user playlists (curated collections of chapters/episodes).
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK -> `profiles.id`), `title` (TEXT NOT NULL), `is_public` (BOOLEAN DEFAULT false), `created_at` (TIMESTAMPTZ).

#### 14. `playlist_items`
- **Purpose**: Junction table mapping playlist to chapters/episodes.
- **Columns**: `id` (UUID, PK), `playlist_id` (UUID, FK -> `playlists.id` ON DELETE CASCADE), `chapter_id` (UUID, FK -> `chapters.id`), `position` (INT NOT NULL).

#### 15. `reviews`
- **Purpose**: User ratings and reviews on audiobooks and podcasts.
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK -> `profiles.id`), `audiobook_id` (UUID, FK -> `audiobooks.id`), `rating` (INT CHECK (rating BETWEEN 1 AND 5)), `review_text` (TEXT), `created_at` (TIMESTAMPTZ).
- **Constraints**: UNIQUE(`user_id`, `audiobook_id`).

#### 16. `subscription_plans`
- **Purpose**: Defines system tiers and pricing.
- **Columns**: `id` (TEXT, PK — 'free', 'plus', 'premium'), `name` (TEXT NOT NULL), `price_monthly` (NUMERIC NOT NULL), `price_yearly` (NUMERIC NOT NULL), `is_active` (BOOLEAN DEFAULT true).

#### 17. `user_subscriptions`
- **Purpose**: Tracks active and historical user subscriptions.
- **Columns**: 
  - `id` (UUID, PK DEFAULT gen_random_uuid())
  - `user_id` (UUID NOT NULL, FK -> `profiles.id`)
  - `plan_id` (TEXT NOT NULL, FK -> `subscription_plans.id`)
  - `billing_cycle` (TEXT CHECK in ('monthly', 'yearly'))
  - `status` (TEXT DEFAULT 'active' CHECK in ('active', 'expired', 'cancelled'))
  - `starts_at` (TIMESTAMPTZ NOT NULL)
  - `expires_at` (TIMESTAMPTZ NOT NULL)
  - `created_at` (TIMESTAMPTZ DEFAULT now())
- **Indexes**: `user_subscriptions_user_status_idx` on `(user_id, status, expires_at)`.

#### 18. `payment_transactions`
- **Purpose**: Complete audit log of SSLCommerz transactions.
- **Columns**: 
  - `id` (UUID, PK DEFAULT gen_random_uuid())
  - `tran_id` (TEXT UNIQUE NOT NULL) — Merchant transaction ID sent to SSLCommerz.
  - `val_id` (TEXT) — SSLCommerz validation ID received on IPN/callback.
  - `user_id` (UUID NOT NULL, FK -> `profiles.id`)
  - `plan_id` (TEXT NOT NULL, FK -> `subscription_plans.id`)
  - `amount` (NUMERIC NOT NULL)
  - `currency` (TEXT DEFAULT 'BDT')
  - `status` (TEXT DEFAULT 'pending' CHECK in ('pending', 'valid', 'failed', 'cancelled'))
  - `bank_tran_id` (TEXT)
  - `card_type` (TEXT)
  - `raw_gateway_response` (JSONB)
  - `created_at` (TIMESTAMPTZ DEFAULT now())
- **Indexes**: `payment_transactions_tran_id_idx` on `tran_id`.

#### 19. `tier_limits`
- **Purpose**: Dynamic single-source-of-truth configuration for tier capabilities.
- **Columns**: 
  - `tier` (TEXT NOT NULL, FK -> `subscription_plans.id`)
  - `feature` (TEXT NOT NULL) — e.g. `'playback_speed_max'`, `'story_finder_daily'`, `'ai_summary_monthly'`
  - `limit_value` (NUMERIC) — NULL indicates unlimited.
  - `period` (TEXT) — `'day'`, `'month'`, or `'lifetime'`
- **Constraints**: PRIMARY KEY (`tier`, `feature`).

#### 20. `ai_usage`
- **Purpose**: Atomic tracking of user AI consumption across calendar days and months.
- **Columns**: 
  - `user_id` (UUID NOT NULL, FK -> `profiles.id`)
  - `feature` (TEXT NOT NULL CHECK in ('story_finder', 'ai_summary'))
  - `period_start` (DATE NOT NULL) — Date in `Asia/Dhaka` timezone.
  - `used_count` (INT NOT NULL DEFAULT 0)
- **Constraints**: PRIMARY KEY (`user_id`, `feature`, `period_start`).

---

## 4. Database Triggers & Stored Functions (RPC)

### 4.1 Automatic Profile Creation Trigger
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Listener'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    'listener'
  );
  -- Seed free subscription tier
  INSERT INTO public.user_subscriptions (user_id, plan_id, billing_cycle, status, starts_at, expires_at)
  VALUES (new.id, 'free', 'monthly', 'active', now(), now() + interval '100 years');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4.2 User Effective Tier Resolution Function
```sql
CREATE OR REPLACE FUNCTION public.get_user_effective_tier(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_tier text;
BEGIN
  SELECT plan_id INTO v_tier
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND expires_at > now()
  ORDER BY 
    CASE plan_id 
      WHEN 'premium' THEN 1 
      WHEN 'plus' THEN 2 
      ELSE 3 
    END ASC
  LIMIT 1;

  RETURN COALESCE(v_tier, 'free');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### 4.3 Atomic AI Quota Consumption Function
```sql
CREATE OR REPLACE FUNCTION public.consume_ai_quota(
  p_user_id uuid,
  p_feature text
)
RETURNS jsonb AS $$
DECLARE
  v_tier text;
  v_limit numeric;
  v_today date;
  v_current_usage int;
BEGIN
  -- Determine user's active tier
  v_tier := public.get_user_effective_tier(p_user_id);
  
  -- Look up feature limit in tier_limits
  SELECT limit_value INTO v_limit
  FROM public.tier_limits
  WHERE tier = v_tier AND feature = p_feature;

  -- Unlimited tier handling (NULL limit)
  IF v_limit IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', 9999, 'tier', v_tier);
  END IF;

  -- Current date in Dhaka timezone (UTC+6)
  v_today := (timezone('Asia/Dhaka', now()))::date;

  -- Lock and fetch current usage
  SELECT used_count INTO v_current_usage
  FROM public.ai_usage
  WHERE user_id = p_user_id AND feature = p_feature AND period_start = v_today
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.ai_usage (user_id, feature, period_start, used_count)
    VALUES (p_user_id, p_feature, v_today, 1);
    RETURN jsonb_build_object('allowed', true, 'remaining', v_limit - 1, 'tier', v_tier);
  ELSIF v_current_usage < v_limit THEN
    UPDATE public.ai_usage
    SET used_count = used_count + 1
    WHERE user_id = p_user_id AND feature = p_feature AND period_start = v_today;
    RETURN jsonb_build_object('allowed', true, 'remaining', v_limit - (v_current_usage + 1), 'tier', v_tier);
  ELSE
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'tier', v_tier);
  END IF;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
```

### 4.4 Vector Cosine Match Function (`match_audiobooks`)
```sql
CREATE OR REPLACE FUNCTION public.match_audiobooks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.35,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  author_name text,
  narrator_name text,
  description text,
  cover_image_url text,
  tier_requirement text,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT 
    a.id,
    a.title,
    a.slug,
    auth.name as author_name,
    a.narrator_name,
    a.description,
    a.cover_image_url,
    a.tier_requirement,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM public.audiobooks a
  JOIN public.authors auth ON a.author_id = auth.id
  WHERE a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 5. Security & Content Protection Architecture

Audio content is the core commercial asset of GolpoBook. A naive setup that places audio files in public storage buckets or relies solely on client-side player locks represents an existential security failure.

### 5.1 Storage Architecture & Private Buckets
1. **Public Bucket (`platform-covers`)**: Public read access for book cover images, author photos, and podcast artwork.
2. **Private Bucket (`audio-vault`)**: Strict private access. Direct public read via CDN or URL is **completely disabled**. No anonymous or public policy exists.

### 5.2 Server-Side Signed Streaming Workflow (`/api/audio/stream-url`)

```
Listener Clicks Play Chapter
            |
            v
POST /api/audio/stream-url { chapterId }
            |
            v
[Next.js Server Session Verification]
- Reads auth cookie via Supabase SSR
- Validates user identity; returns 401 if unauthenticated
            |
            v
[Chapter & Tier Access Verification]
- Fetches chapter row: is_preview, audio_storage_path, audiobook.tier_requirement
- Calls get_user_effective_tier(user_id)
- Evaluates:
    IF (chapter.is_preview = true) --> ALLOW
    IF (user_tier IN ('plus', 'premium')) --> ALLOW
    ELSE --> REJECT (403 Forbidden: "Preview ended. Upgrade to Plus/Premium")
            |
            v
[Time-Limited Signed URL Generation]
- Server calls Supabase Storage API:
  supabase.storage.from('audio-vault').createSignedUrl(path, 900) -- Valid for 15 minutes
            |
            v
Returns JSON { signedUrl, maxSpeed, allowSeeking }
            |
            v
Client Audio Engine streams directly from authenticated signed URL
```

### 5.3 Enforcing Free Tier Seeking Restrictions
The proposal requires that Free users have "limited seeking":
- When `/api/audio/stream-url` returns `{ allowSeeking: false, maxForwardSeek: 15 }`, the frontend audio controller binds the slider:
  - Users can seek backward (rewind) freely.
  - Forward seeking is restricted to a maximum of 15 seconds ahead of current playback position (`currentTime + 15`).
  - Jumping straight to the end of the chapter is blocked in the UI layer.

---

## 6. AI Story Finder (RAG) Architecture

The AI Story Finder allows listeners to search using natural descriptions in **Bangla, Banglish, or English** (e.g. *"amar voyer golpo shunte mon chacche"*).

```
+----------------------------------------------------------------------------------------------------+
|                                    RAG RETRIEVAL PIPELINE                                          |
|                                                                                                    |
|  1. USER QUERY: "amar voyer golpo shunte mon chacche"                                              |
|            |                                                                                       |
|            v                                                                                       |
|  2. QUOTA CHECK: Server executes consume_ai_quota(user_id, 'story_finder')                         |
|     - Free: 1/day | Plus: 10/day | Premium: Fair-use cap (50/day)                                  |
|     - If quota exhausted, returns HTTP 429 with reset countdown & upgrade modal                    |
|            |                                                                                       |
|            v                                                                                       |
|  3. QUERY NORMALIZATION (Gemini 2.0 Flash - Fast & Cheap):                                         |
|     - System Prompt: "You are a literary query parser. Extract core mood, genre, and themes from  |
|       this user query (which may be in Banglish, Bangla, or English). Output normalized keywords:  |
|       Bangla and English."                                                                         |
|     - Input: "amar voyer golpo shunte mon chacche"                                                 |
|     - Normalized Output: "ভৌতিক গল্প horror supernatural mystery suspense"                       |
|            |                                                                                       |
|            v                                                                                       |
|  4. VECTOR EMBEDDING:                                                                              |
|     - Call Gemini text-embedding-004 (768 dimensions) with normalized query                        |
|            |                                                                                       |
|            v                                                                                       |
|  5. PGVECTOR COSINE SEARCH:                                                                        |
|     - Supabase RPC: match_audiobooks(query_embedding, 0.35, 5)                                     |
|     - Performs HNSW vector index search against pre-embedded audiobook catalog                     |
|            |                                                                                       |
|            v                                                                                       |
|  6. STRICT ZERO-HALLUCINATION RETRIEVAL:                                                           |
|     - Exactly 5 matching database rows returned (IDs, Titles, Authors, Covers)                     |
|     - The LLM NEVER generates titles. Only verified catalog books are displayed.                   |
|            |                                                                                       |
|            v                                                                                       |
|  7. OPTIONAL EDITORIAL INTRO GENERATION:                                                           |
|     - Gemini 2.0 Flash writes a 1-sentence warm Bangla recommendation note mentioning only the     |
|       retrieved titles: "আপনার জন্য কিছু গা ছমছমে রহস্য ও ভৌতিক বই খুঁজে পাওয়া গেছে:"                |
+----------------------------------------------------------------------------------------------------+
```

### 6.1 Model Selection & Cost Matrix

| Provider & Model | Dimensions | Cost per 1M Tokens | Multilingual Quality | Selection Status |
| :--- | :--- | :--- | :--- | :--- |
| **Gemini `text-embedding-004`** | **768** | **Free tier / $0.00002** | **Exceptional (native Indic)** | **SELECTED (Primary)** |
| OpenAI `text-embedding-3-small` | 1536 (or 512) | $0.020 | High (struggles with Banglish) | Backup Alternative |
| Gemini 2.0 Flash (Normalizer) | N/A | Free tier / $0.075 | Instantaneous latency (<400ms)| **SELECTED (Normalizer)** |

---

## 7. Subscription & Payment Architecture (SSLCommerz)

### 7.1 Sandbox Payment Workflow & State Machine

```
[ Listener selects Plan: Plus Monthly (BDT 99) ]
                       |
                       v
[ POST /api/payment/initiate ]
- Generates unique tran_id: "GB-" || nanoid()
- Inserts pending row into payment_transactions
- Sends POST request to SSLCommerz Sandbox:
  URL: https://sandbox.sslcommerz.com/gwprocess/v4/api.php
  Payload: store_id, store_passwd, total_amount, currency, tran_id,
           success_url, fail_url, cancel_url, ipn_url, cus_name, cus_email
- SSLCommerz replies with GatewayPageURL
- Server returns { redirectUrl: GatewayPageURL }
                       |
                       v
[ Client redirected to SSLCommerz Sandbox Hosted Gateway ]
- Listener simulates payment via bKash / Nagad / Visa Test Credentials
                       |
        +--------------+--------------+
        |                             |
        v                             v
[ Success Callback ]           [ Fail / Cancel Callback ]
POST /api/payment/success      POST /api/payment/fail
- Receives tran_id, val_id     - Updates payment_transactions to 'failed'
- Redirects user to            - Redirects user to /pricing?status=failed
  /pricing/verification        
        |
        v
[ Server-Side Validation via IPN (Instant Payment Notification) ]
POST /api/payment/ipn
- Server calls SSLCommerz validation API:
  URL: https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=...&store_id=...
- Validates:
  1. Status is "VALID" or "VALIDATED"
  2. Transaction amount matches expected plan cost exactly
  3. Currency is "BDT"
- IDEMPOTENCY CHECK:
  If payment_transactions.status == 'valid', skip (prevents double activation).
- ATOMIC DATABASE ACTIVATION:
  1. UPDATE payment_transactions SET status = 'valid', val_id = ...
  2. INSERT INTO user_subscriptions (user_id, plan_id, billing_cycle, status, starts_at, expires_at)
     VALUES (user_id, plan_id, cycle, 'active', now(), now() + interval '30 days')
     ON CONFLICT (user_id) DO UPDATE ...
  3. INSERT INTO notifications (user_id, title, message)
```

---

## 8. Complete API Design Catalog

| Method | Endpoint | Auth | Purpose | Input Payload | Output Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/audio/stream-url` | Listener | Validates tier & returns signed audio URL | `{ chapterId: string }` | `{ signedUrl: string, maxSpeed: number, allowSeeking: boolean }` |
| **POST** | `/api/audio/progress` | Listener | Debounced playback progress synchronization | `{ chapterId: string, positionSeconds: number }` | `{ success: boolean }` |
| **POST** | `/api/ai/story-finder` | Listener | RAG vector search with daily quota deduction | `{ query: string }` | `{ introMessage: string, books: Array<BookCard>, remainingQuota: number }` |
| **POST** | `/api/ai/summary` | Plus/Prem | Generates short chapter AI synopsis | `{ chapterId: string }` | `{ summaryText: string, remainingQuota: number }` |
| **POST** | `/api/payment/initiate` | Listener | Creates pending transaction & gateway session | `{ planId: string, cycle: 'monthly'\|'yearly' }` | `{ gatewayUrl: string, tranId: string }` |
| **POST** | `/api/payment/ipn` | Public | SSLCommerz Instant Payment Notification webhook | Form URL-encoded SSLCommerz payload | `{ status: 'VALIDATED' }` (HTTP 200) |
| **POST** | `/api/admin/audiobooks` | Admin | Creates audiobook record & triggers vector embedding | `{ title, authorId, categoryId, narrator, description, coverUrl, tier }` | `{ success: boolean, audiobookId: string }` |
| **POST** | `/api/admin/chapters` | Admin | Registers chapter audio file in vault | `{ audiobookId, chapterNumber, title, durationSeconds, storagePath, isPreview }` | `{ success: boolean, chapterId: string }` |
| **POST** | `/api/onboarding` | Listener | Saves taste preferences & finishes onboarding | `{ genres: string[], languages: string[] }` | `{ success: boolean }` |

**Architecture Summary**: This architectural specification delivers a robust, secure, and commercially viable blueprint. It enforces content protection on the server, guarantees zero AI hallucinations, handles resilient sandbox payments, and isolates audio streaming from client memory constraints.
