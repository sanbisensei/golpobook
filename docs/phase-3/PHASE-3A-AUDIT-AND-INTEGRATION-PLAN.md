# GolpoBook: Phase 3A Pre-Implementation Audit & Integration Plan
**Real Data Integration, Content Architecture & RAG Readiness Blueprint**

**Document ID:** `DOC-P3-01`  
**Phase:** Sprint 1, Phase 3A — Pre-Implementation Audit & Integration Planning  
**Date:** November 15, 2026  
**Status:** AUDIT COMPLETE — AWAITING ARCHITECTURAL APPROVAL  
**Authors:** Senior Full-Stack Engineer, Supabase Architect, RAG Engineer & Technical Lead  
**Scope:** Comprehensive Audit of Frontend, Database Schema, Supabase Storage, Vector Search & Content Ingestion Pipeline  

---

## 1. Executive Summary

### 1.1 Mission & Context
GolpoBook is a personalized subscription-based audiobook and podcast streaming platform tailored for Bengali literature, regional narratives, and global audiobooks. 

Phases 1 and 2 established the core infrastructure:
- **Phase 1 (UI Foundation):** Audiora Neo-Editorial design system, typography tokens (Space Grotesk, Courier Prime, Anek Bangla), tactile physical card and button interaction physics, and desktop navigation shells.
- **Phase 2A & 2B (Database Foundation & Validation):** First 5 core relational tables (`subscription_plans`, `tier_limits`, `categories`, `profiles`, `user_subscriptions`) deployed and validated in Supabase.
- **Phase 2C (Authentication):** Supabase SSR cookie-based authentication, registration trigger (`handle_new_user`), login, session refresh, and protected route redirection.
- **Phase 2D (Personalized Onboarding):** Full 6-step scroll-less taste calibration wizard, `user_preferences` table with strict RLS, live category taxonomy retrieval, and non-recursive `is_admin()` helper function.

### 1.2 Core Audit Finding
The platform currently presents an **editorial illusion of a complete catalog**:
1. **Frontend Disconnect:** 100% of the browse feed (`/`), category filters, featured spotlight, and persistent audio player (`InspectorPlayer`) are powered by static mock data from `src/lib/data/mock-catalog.js` (8 hardcoded audiobooks).
2. **Database Gap:** The Supabase database contains exactly **6 tables** (`subscription_plans`, `tier_limits`, `categories`, `profiles`, `user_subscriptions`, `user_preferences`). The entire content hierarchy—`authors`, `podcasters`, `audiobooks`, `chapters`, `podcasts`, and `podcast_episodes`—**does not exist in the database**.
3. **Storage Gap:** Supabase Storage contains **0 buckets**. There is no storage bucket for cover images (`platform-covers`) and no private vault for audio chapter streams (`audio-vault`).
4. **Player Gap:** The `InspectorPlayer` component is purely visual. The Play/Pause button toggles state and pulses CSS equalizer bars, but no audio is loaded or streamed.
5. **RAG / Vector Gap:** The `pgvector` extension has not been enabled, no embedding column exists on any table, and the vector retrieval RPC function `match_audiobooks` is not deployed.
6. **Route Gaps:** Links from the navigation rail and browse banners (`/audiobooks`, `/audiobooks/[slug]`, `/story-finder`, `/library`, `/account`) point to routes that do not yet exist in `src/app/`.

### 1.3 Audit Verdict & Golden Rule
> [!IMPORTANT]
> **THIS IS AN AUDIT-ONLY PHASE. NO CODE HAS BEEN IMPLEMENTED OR MODIFIED.**  
> GolpoBook has a rock-solid, production-grade authentication and onboarding foundation. However, before real audio streaming or AI story discovery can function, we must deploy the content schema, provision storage buckets, ingest seed catalog data, and build the RAG embedding pipeline in a structured sequence of subphases (3B through 3G).

---

## 2. Actual Project Architecture Findings

### 2.1 Technology Stack Inventory
| Layer | Installed Version | Architectural Role | Status |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js 16.4.6 (App Router) | Server Components, Streaming SSR, API Route Handlers | Active & Verified |
| **Runtime** | React 19.3.0 / Node.js 22.16 | Core UI Rendering Engine | Active & Verified |
| **Styling** | Tailwind CSS 4.3.3 (`@tailwindcss/turbopack`) | Audiora Neo-Editorial Design Tokens | Active & Verified |
| **Database** | Supabase PostgreSQL 15+ | Relational Data & Identity Storage | Connected (6 tables active) |
| **Auth** | `@supabase/ssr` 0.12.7 & `@supabase/supabase-js` 2.119.0 | Cookie-based PKCE Authentication | Active & Verified |
| **UI Primitives**| `@base-ui/react` 1.9.0 & Lucide React 1.72.0 | Unstyled Accessible Controls & Icons | Active & Verified |
| **Motion** | `motion` 14.13.0 (`motion/react`) | Tactile Neo-Brutalist Spring Physics | Active & Verified |
| **Audio** | `wavesurfer.js` 8.1.0 | Visual Waveform & Audio Playback | Installed, not yet connected |
| **AI / RAG** | *None installed* | Gemini API SDK not yet installed | Pending Phase 3F |

### 2.2 Environment Configuration Audit
Inspection of `.env.local` without exposing values revealed the following variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Present and valid.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Present and valid.
- `SUPABASE_SERVICE_ROLE_KEY` — Present and valid.

**Missing Environment Variables Required for Phase 3:**
- `GEMINI_API_KEY` — Mandatory for RAG query normalization (Gemini 2.0 Flash) and vector generation (`text-embedding-004`).
- `NEXT_PUBLIC_APP_URL` — Required for canonical absolute URL generation during signed URL callbacks.

### 2.3 Documentation vs. Code Discrepancies
Our code inspection identified four critical discrepancies between earlier project documentation and the live codebase:
1. **Directory Structure:** `docs/audit/03-SYSTEM-ARCHITECTURE.md` documented a route group `src/app/(listener)/` hosting `audiobooks/`, `podcasts/`, `library/`, and `story-finder/`. In the actual codebase, `src/app/page.js` lives directly at the root, and route groups `(listener)` have not been created.
2. **Onboarding Scheduling:** `docs/database/05-REMAINING-SCHEMA-ROADMAP.md` originally scheduled `user_preferences` and onboarding for Sprint 5. In reality, `user_preferences` was successfully implemented in Sprint 1 Phase 2D.
3. **Search & AI Buttons:** The Canary search bar in `TopHeader` contains an `<input>` with no `onChange` or submit handler, and the "Story Finder" button links to `/story-finder` which currently throws a 404.
4. **Mock Catalog Fields vs. DB Types:** `mock-catalog.js` uses human-formatted strings (`duration: "6h 15m"`, `category: "Adventure & Thriller"`), whereas the database requires normalized integer seconds (`total_duration_seconds: 22500`) and UUID foreign keys (`category_id: uuid`).

---

## 3. Existing Database Inventory

A live read-only programmatic inspection against the Supabase instance confirmed the exact state of the database:

```
+----------------------------------------------------------------------------------------------------+
|                                    LIVE SUPABASE DATABASE INVENTORY                                |
+------------------------+-------------+------------------------------------+------------------------+
| Table Name             | Live Status | Row Count                          | Primary Function       |
+------------------------+-------------+------------------------------------+------------------------+
| subscription_plans     | EXISTS      | 3 rows ('free', 'plus', 'premium') | Commercial Tiers       |
| tier_limits            | EXISTS      | 33 rows (Feature limits per tier)  | Platform Governance    |
| categories             | EXISTS      | 10 rows (Seeded standard genres)   | Content Taxonomy       |
| profiles               | EXISTS      | 3 rows (Admin & test listeners)    | User Identity & Roles  |
| user_subscriptions     | EXISTS      | 3 rows (Active listener tier links)| Subscription Ledger    |
| user_preferences       | EXISTS      | 2 rows (Onboarding taste records)  | Personalization Matrix |
+------------------------+-------------+------------------------------------+------------------------+
```

### Verified Active Database Functions & Triggers:
1. `public.handle_new_user()` — Trigger function on `auth.users` provisioning listener profiles and initial Free subscription upon registration.
2. `public.set_updated_at()` — Trigger function automatically updating `updated_at` timestamps on row mutation.
3. `public.is_admin()` — `SECURITY DEFINER` function that safely evaluates admin roles without triggering self-referential RLS recursion on `public.profiles`.

---

## 4. Missing Schema and Relationship Analysis (20-Table Audit)

Below is the exhaustive audit of all 20 tables planned for the complete GolpoBook platform:

| # | Table Name | Status | Sufficient? | Missing Fields / Gaps | Relationships & FKs | Indexing Required | RLS Policy Strategy | Target Sprint |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `subscription_plans` | **EXISTS** | YES | None | Referenced by `tier_limits`, `user_subscriptions` | Indexed on `id` (PK) | Public read; Admin write | Sprint 1 (Done) |
| 2 | `tier_limits` | **EXISTS** | YES | None | `tier` -> `subscription_plans.id` | UNIQUE(`tier`, `feature`) | Public read; Admin write | Sprint 1 (Done) |
| 3 | `categories` | **EXISTS** | YES | None | Referenced by `audiobooks`, `podcasts` | Indexed on `slug`, `(is_active, display_order)` | Public read; Admin write | Sprint 1 (Done) |
| 4 | `profiles` | **EXISTS** | YES | None | `id` -> `auth.users.id` (1:1) | Primary key index | User reads own; Admin reads all via `is_admin()` | Sprint 1 (Done) |
| 5 | `user_subscriptions` | **EXISTS** | YES | None | `user_id` -> `profiles.id`, `plan_id` -> `subscription_plans.id` | UNIQUE(`user_id`, `plan_id`, `status`) | User reads own; Webhook/Admin write | Sprint 1 (Done) |
| 6 | `user_preferences` | **EXISTS** | YES | None | `user_id` -> `profiles.id` (1:1) | B-tree on `user_id`, `onboarding_completed` | User read/write own; Admin read | Sprint 1 (Done) |
| 7 | `authors` | **MISSING** | NO (Must create) | Needs `born_year`, `died_year`, `era` for public-domain Bengali literature | Referenced by `audiobooks.author_id` | B-tree on `name`, `slug` | Public read; Admin write | **Phase 3B** |
| 8 | `podcasters` | **MISSING** | NO (Must create) | Needs `verified_badge`, `social_links` | Referenced by `podcasts.podcaster_id` | B-tree on `name` | Public read; Admin write | Phase 3B / Sprint 2 |
| 9 | `audiobooks` | **MISSING** | NO (Must create) | Core entity: needs `title_bengali`, `narrator_name`, `language`, `tier_requirement`, `is_published`, `embedding` | `author_id` -> `authors.id`, `category_id` -> `categories.id`, `tier` -> `plans.id` | B-tree on `slug`, `author_id`, `category_id`; HNSW on `embedding` | Public read published; Admin full access | **Phase 3B** |
| 10| `chapters` | **MISSING** | NO (Must create) | Sequential tracks: `audio_storage_path`, `duration_seconds`, `is_preview` | `audiobook_id` -> `audiobooks.id` ON DELETE CASCADE | UNIQUE(`audiobook_id`, `chapter_number`), B-tree on `audiobook_id` | Public read metadata; Audio path protected | **Phase 3B** |
| 11| `podcasts` | **MISSING** | NO (Must create) | `title`, `slug`, `podcaster_id`, `category_id`, `cover_image_url` | `podcaster_id` -> `podcasters.id`, `category_id` -> `categories.id` | B-tree on `slug`, `category_id` | Public read; Admin write | Phase 3B / Sprint 2 |
| 12| `podcast_episodes` | **MISSING** | NO (Must create) | `episode_number`, `audio_storage_path`, `duration_seconds`, `is_free` | `podcast_id` -> `podcasts.id` ON DELETE CASCADE | UNIQUE(`podcast_id`, `episode_number`) | Public read; Admin write | Phase 3B / Sprint 2 |
| 13| `ai_usage` | **MISSING** | NO (Must create) | Quota engine: `user_id`, `feature`, `period_start`, `used_count` | `user_id` -> `profiles.id` ON DELETE CASCADE | PK(`user_id`, `feature`, `period_start`) | User reads own; RPC mutates atomically | **Phase 3B** (For RAG) |
| 14| `listening_history`| **MISSING** | Later | Track playback resume: `user_id`, `audiobook_id`, `chapter_id`, `progress_seconds` | `user_id` -> `profiles.id`, `chapter_id` -> `chapters.id` | UNIQUE(`user_id`, `chapter_id`), B-tree on `last_listened_at` | User read/write own | Sprint 3 |
| 15| `bookmarks` | **MISSING** | Later | Listener saved marks: `timestamp_seconds`, `note` | `user_id` -> `profiles.id`, `chapter_id` -> `chapters.id` | B-tree on `user_id`, `chapter_id` | User read/write own | Sprint 3 |
| 16| `payment_transactions`| **MISSING** | Later | SSLCommerz ledger: `tran_id`, `val_id`, `amount`, `status`, `bank_tran_id` | `user_id` -> `profiles.id`, `plan_id` -> `subscription_plans.id` | UNIQUE on `tran_id`, B-tree on `user_id` | User reads own; Server webhook write | Sprint 4 |
| 17| `user_follows` | **MISSING** | Later | Follow author/podcaster: `user_id`, `target_id`, `follow_type` | `user_id` -> `profiles.id` | UNIQUE(`user_id`, `follow_type`, `target_id`) | User read/write own | Sprint 5 |
| 18| `playlists` | **MISSING** | Later | User custom lists: `title`, `is_public` | `user_id` -> `profiles.id` | B-tree on `user_id` | User read/write own; Public read if public | Sprint 5 |
| 19| `playlist_items` | **MISSING** | Later | Items in custom list: `position`, `chapter_id` | `playlist_id` -> `playlists.id`, `chapter_id` -> `chapters.id` | B-tree on `playlist_id` | Inherited from `playlists` | Sprint 5 |
| 20| `reviews` | **MISSING** | Later | Book ratings & critiques: `rating` (1-5), `review_text` | `user_id` -> `profiles.id`, `audiobook_id` -> `audiobooks.id` | UNIQUE(`user_id`, `audiobook_id`), B-tree on `audiobook_id` | Public read; User write own | Sprint 6 |

---

## 5. Real Audiobook Content & Seed Data Planning

### 5.1 Mandatory vs. Optional Audiobook Schema Fields
To balance rich UI display with university project feasibility, we categorize audiobook attributes into strict database columns vs. searchable embedding metadata:

```
+----------------------------------------------------------------------------------------------------+
|                                    AUDIOBOOK DATA SPECIFICATION                                    |
+--------------------------+-------------+---------------+-------------------------------------------+
| Field Name               | Type        | Requirement   | Purpose & Rationale                       |
+--------------------------+-------------+---------------+-------------------------------------------+
| id                       | UUID        | Mandatory     | Primary Key (DEFAULT gen_random_uuid())   |
| title                    | TEXT        | Mandatory     | Primary display title in English/Bangla   |
| title_bengali            | TEXT        | Optional      | Native script (e.g. চাঁদের পাহাড়)           |
| slug                     | TEXT        | Mandatory     | URL-safe identifier (UNIQUE NOT NULL)     |
| author_id                | UUID        | Mandatory     | Foreign key to public.authors(id)         |
| category_id              | UUID        | Mandatory     | Foreign key to public.categories(id)      |
| narrator_name            | TEXT        | Mandatory     | Name of the voice artist / performer      |
| description              | TEXT        | Mandatory     | Full editorial synopsis for detail view   |
| short_description        | TEXT        | Mandatory     | 1-2 sentence summary for card previews    |
| cover_image_url          | TEXT        | Mandatory     | Public CDN URL from platform-covers bucket|
| language                 | TEXT        | Mandatory     | 'bangla' or 'english' (DEFAULT 'bangla')  |
| tier_requirement         | TEXT        | Mandatory     | 'free', 'plus', or 'premium'              |
| is_featured              | BOOLEAN     | Mandatory     | Spotlight banner flag (DEFAULT false)     |
| is_published             | BOOLEAN     | Mandatory     | Content gate flag (DEFAULT true)          |
| total_duration_seconds   | INTEGER     | Mandatory     | Sum of chapter audio durations in seconds |
| rating_average           | NUMERIC(3,2)| Optional      | Seeded rating (e.g. 4.90)                 |
| ratings_count            | INTEGER     | Optional      | Seeded review count (e.g. 1420)           |
| publication_year         | INTEGER     | Optional      | Original literary publication year        |
| tags                     | TEXT[]      | Mandatory     | Keyword array for filtering and discovery |
| embedding                | vector(768) | Mandatory     | 768-dim float vector for RAG pgvector     |
| created_at, updated_at   | TIMESTAMPTZ | Mandatory     | System auditing timestamps                |
+--------------------------+-------------+---------------+-------------------------------------------+
```

### 5.2 Seed Data Strategy Comparison

| Strategy | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- |
| **1. Manual Supabase Table Editor** | No code required for 1 record | High risk of human error; tedious UUID linking; no version control; cannot be replicated across team | **REJECTED** |
| **2. Pure SQL Seed File (`seed.sql`)** | Direct execution in SQL Editor | Vector embeddings (768 floats) are unreadable in SQL; multi-line string escaping is fragile; rigid | **REJECTED** |
| **3. Admin CMS Interface** | User-friendly UI | Huge upfront engineering time (auth, file upload, form validation); distracts from core project | **DEFERRED (Sprint 2)** |
| **4. JSON Catalog + Repeatable Import Script** | Clean version-controlled JSON; handles UUID lookups automatically; generates embeddings via script; idempotent | Requires running `node scripts/seed-catalog.js` | **SELECTED (RECOMMENDED)** |

### 5.3 Idempotency and Incremental Growth Strategy
The recommended seed engine uses `src/data/seed-catalog.json` combined with `scripts/seed-catalog.js`:
1. **Idempotency Guarantee:** The script uses PostgreSQL `upsert` with `onConflict: 'slug'`. If a book already exists, it updates metadata without generating duplicate rows.
2. **Dynamic Foreign Key Resolution:** Rather than hardcoding raw UUIDs in JSON, the catalog defines:
   ```json
   {
     "title": "Chander Pahar",
     "slug": "chander-pahar",
     "authorName": "Bibhutibhushan Bandyopadhyay",
     "categorySlug": "adventure-thriller",
     "tierRequirement": "plus"
   }
   ```
   The ingestion script looks up `authors` by name (creating the author if missing) and `categories` by `slug`, resolving UUIDs automatically.
3. **Incremental Ingestion:** You can add 2 new books to `seed-catalog.json` next week and rerun the script. Existing books are safely updated without duplication.

---

## 6. RAG Architecture Readiness Assessment

GolpoBook's **AI Story Finder** allows listeners to discover stories using conversational prompts in Bengali, English, or Banglish (e.g. *"amar voyer golpo shunte mon chacche"*).

### 6.1 Information Required for Semantic Embeddings
To enable high-precision recommendations, we must not embed only the title and description. We must generate a rich **Semantic Embedding Document** during ingestion:

```
+----------------------------------------------------------------------------------------------------+
|                                SYNTHESIZED EMBEDDING DOCUMENT STRUCTURE                            |
+----------------------------------------------------------------------------------------------------+
| Title: Chander Pahar (চাঁদের পাহাড়)                                                                |
| Author: Bibhutibhushan Bandyopadhyay                                                               |
| Narrator: Sabyasachi Chakrabarty                                                                   |
| Category: Adventure & Thriller, Classic Bengali Literature                                         |
| Language: Bengali (বাংলা)                                                                          |
| Setting & Atmosphere: African wilderness, Richtersveld mountains, dangerous diamond mines, dark    |
| Themes & Mood: Survival expedition, mythical beast Bunyip, courage, adrenaline, exploration, risk |
| Synopsis: Young Bengali adventurer Shankar Roy Choudhury travels to the wild jungles and          |
|   mountains of Africa in search of the elusive diamond mines guarded by the mythical Bunyip.       |
| Tags: adventure, thriller, jungle, exploration, classic bengali, shankar, africa, survival         |
+----------------------------------------------------------------------------------------------------+
```

### 6.2 Vector Database & Retrieval Inspection
Our direct inspection of the Supabase PostgreSQL database revealed:
- `pgvector` extension: **NOT ENABLED**. (Requires `CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;`).
- `embedding` column: **DOES NOT EXIST**.
- `HNSW` vector index: **DOES NOT EXIST**.
- `match_audiobooks` RPC function: **DOES NOT EXIST** (`PGRST202` error confirmed).

### 6.3 Critical Security Findings in Planned RAG Function
Reviewing the preliminary RPC function specified in `03-SYSTEM-ARCHITECTURE.md` revealed two dangerous security oversights:
1. **Unpublished Content Leak:** The planned query lacked an `is_published = true` check. If an admin creates a draft or unpublished audiobook, the vector search would leak it to public listeners.
2. **Missing Tier Awareness:** The search returned matches without informing the caller whether the listener has permission to play the book.

#### Corrected, Production-Ready `match_audiobooks` RPC Design:
```sql
CREATE OR REPLACE FUNCTION public.match_audiobooks(
  query_embedding extensions.vector(768),
  match_threshold float DEFAULT 0.30,
  match_count int DEFAULT 5,
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
  total_duration_seconds int,
  similarity float
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
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
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM public.audiobooks a
  JOIN public.authors auth ON a.author_id = auth.id
  JOIN public.categories cat ON a.category_id = cat.id
  WHERE a.is_published = true -- SECURITY INVARIANT: NEVER LEAK UNPUBLISHED TITLES
    AND a.embedding IS NOT NULL
    AND (p_language IS NULL OR a.language = p_language)
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;
```

---

## 7. Multilingual RAG Considerations (Bangla, Banglish & English)

### 7.1 The Banglish Dilemma
Listeners in Bangladesh frequently type queries in phonetic Latin characters (Banglish):
- *"amar voyer golpo shunte mon chacche"*
- *"bhoot er golpo ache?"*
- *"ektu thriller ba mystery dhoroner boi dao"*

**Why Direct Embedding Fails:**  
Models like `text-embedding-004` are trained on formal Bengali script (`বাংলা`) and English prose. They have limited exposure to arbitrary phonetic Banglish spelling variations (*voyer* vs *bhooyer* vs *bhuter*). Embedding a raw Banglish string produces low cosine similarity against formal Bengali catalog embeddings.

### 7.2 The Two-Stage Query Normalization Solution

```
                               THE RAG RETRIEVAL PIPELINE
                               
  Listener Query: "amar voyer golpo shunte mon chacche"
        |
        v
  [STAGE 1: Normalizer via Gemini 2.0 Flash (<300ms)]
  - Extracts mood, literary genres, and key themes
  - Outputs normalized bilingual query keywords:
    "ভৌতিক গল্প রহস্য horror supernatural thriller suspense ghost stories"
        |
        v
  [STAGE 2: Dense Embedding via text-embedding-004]
  - Generates 768-dimensional float vector from normalized text
        |
        v
  [STAGE 3: Supabase pgvector Cosine Search via match_audiobooks()]
  - HNSW index matches against pre-computed audiobook embeddings
  - Enforces is_published = true and returns top 3 to 5 matching catalog rows
        |
        v
  [STAGE 4: Strict Zero-Hallucination Recommendation Generation]
  - Gemini 2.0 Flash writes a warm, conversational recommendation in Bangla:
    "আপনার জন্য কিছু গা ছমছমে রহস্য ও ভৌতিক অডিওবুক খুঁজে পাওয়া গেছে:"
  - Mentions ONLY the retrieved books. NEVER invents titles outside the catalog.
```

---

## 8. Cover Image & Audio Asset Architecture

### 8.1 Supabase Storage Setup Audit
Our live inspection revealed that **0 storage buckets exist** in Supabase.

### 8.2 Recommended Bucket Topology

```
+----------------------------------------------------------------------------------------------------+
|                                    SUPABASE STORAGE ARCHITECTURE                                   |
+--------------------+---------+------------------------+--------------------------------------------+
| Bucket ID          | Access  | Max File Size / MIME   | Stored Assets & Directory Structure        |
+--------------------+---------+------------------------+--------------------------------------------+
| platform-covers    | PUBLIC  | 5MB (image/webp, jpeg) | {audiobook-slug}/cover.webp                |
|                    |         |                        | authors/{author-slug}/photo.webp           |
+--------------------+---------+------------------------+--------------------------------------------+
| audio-vault        | PRIVATE | 100MB (audio/mpeg, m4a)| {audiobook-slug}/chapter-01.mp3            |
|                    |         |                        | {audiobook-slug}/chapter-02.mp3            |
+--------------------+---------+------------------------+--------------------------------------------+
```

### 8.3 Signed URL Streaming Workflow
Audio files in `audio-vault` are strictly private. Direct public access is rejected by Supabase Storage.
1. When a listener clicks Play on Chapter 2, the client issues `POST /api/audio/stream-url { chapterId }`.
2. The server verifies user session and subscription tier:
   - If chapter is marked `is_preview = true` -> **ALLOWED for all**.
   - If user is on `plus` or `premium` -> **ALLOWED**.
   - If user is on `free` and chapter is not preview -> **REJECTED (403 Forbidden)**.
3. The server calls Supabase Storage API using the service role:
   ```javascript
   const { data } = await supabase.storage
     .from('audio-vault')
     .createSignedUrl(chapter.audio_storage_path, 900); // 15-minute token
   ```
4. The client's audio player receives the signed URL and streams the chapter securely.

---

## 9. Frontend Mock-Data Replacement Inventory

Below is the complete inventory of frontend components that must transition from mock data to live Supabase data in Phase 3:

| Component / Screen | Current Data Source | Required Supabase Table / Query | Fetching Approach | State Handling Needed |
| :--- | :--- | :--- | :--- | :--- |
| **Category Pill Strip** (`src/app/page.js`) | `CATEGORIES` array in `mock-catalog.js` | `public.categories` (`is_active = true`, order by `display_order`) | Server Component prefetch / Client prop | Horizontal scroll, active pill styling |
| **Featured Spotlight Banner** (`src/app/page.js`) | `PLACEHOLDER_AUDIOBOOKS[1]` | `public.audiobooks` (`is_featured = true`, join `authors`) | Server Component async query | Editorial Choice badge, cover art fallback |
| **Popular Audiobooks Grid** (`src/app/page.js`) | `filteredBooks.slice(0, 4)` | `public.audiobooks` (`is_published = true`, order by `ratings_count DESC`) | Server Component with Suspense | 4-column responsive grid, empty state |
| **Recommended Grid** (`src/app/page.js`) | `filteredBooks.slice(4, 8)` | `public.audiobooks` matched against `user_preferences` | Server Component personalized query | Fallback to latest additions if new user |
| **Audiobook Card** (`audiobook-card.jsx`) | Static props (`book.coverUrl`, `book.tier`) | Mapped Supabase record (`cover_image_url`, `tier_requirement`) | Client Component | Hover lift, tier badges (FREE/PLUS/PREMIUM) |
| **Inspector Player** (`inspector-player.jsx`) | Hardcoded chapter array & static duration | `public.chapters` filtered by `audiobook_id` | Client Component connected to Audio API | Real HTML5 `<audio>`, dynamic tracklist |
| **Catalog Browse** (`/audiobooks`) | *Route does not exist* | Paginated query on `public.audiobooks` with genre filters | Server Component page | Filter sidebar, sorting, pagination |
| **Book Detail Page** (`/audiobooks/[slug]`) | *Route does not exist* | Query `public.audiobooks` by `slug` with nested `chapters` | Server Component with dynamic params | Full synopsis, metadata, complete tracklist |
| **AI Story Finder UI** (`/story-finder`) | *Route does not exist* | Calls `/api/ai/story-finder` route handler | Client Component | Chat-style input, recommendation card list |

---

## 10. Recommended Phase 3 Implementation Breakdown

To ensure systematic development and avoid breaking existing functionality, we propose breaking Phase 3 into **6 subphases**:

```
+----------------------------------------------------------------------------------------------------+
|                                PHASE 3 IMPLEMENTATION ROADMAP                                      |
|                                                                                                    |
|  [ 3A: Audit & Integration Plan ] (CURRENT) -> Architecture, Schema Matrix, Asset Checklist        |
|            |                                                                                       |
|            v                                                                                       |
|  [ 3B: Missing Schema & Storage Migration ] -> Migration 8 (authors, audiobooks, chapters,       |
|                                                ai_usage, pgvector, HNSW, Storage Buckets)          |
|            |                                                                                       |
|            v                                                                                       |
|  [ 3C: Catalog Seed Data & Ingestion Script ] -> seed-catalog.json (8-12 Bengali/World books)     |
|                                                  and scripts/seed-catalog.js with upsert           |
|            |                                                                                       |
|            v                                                                                       |
|  [ 3D: Live Supabase Browse Page ] -> src/app/page.js connected to live PostgreSQL queries        |
|                                        with real categories and dynamic carousels                  |
|            |                                                                                       |
|            v                                                                                       |
|  [ 3E: Book Details & Real Audio Playback ] -> /audiobooks/[slug] and InspectorPlayer wired        |
|                                                to real signed audio streaming                      |
|            |                                                                                       |
|            v                                                                                       |
|  [ 3F: RAG Pipeline & AI Story Finder ] -> Gemini 2.0 Flash normalizer, text-embedding-004,       |
|                                            match_audiobooks RPC, and /story-finder route           |
+----------------------------------------------------------------------------------------------------+
```

### Granular Subphase Specifications

#### Subphase 3B: Missing Schema & Storage Migration
- **Objective:** Deploy database tables and storage infrastructure required for content and RAG.
- **Deliverables:**
  - Migration file `20261115000001_create_content_and_vector_schema.sql` defining `authors`, `podcasters`, `audiobooks`, `chapters`, `podcasts`, `podcast_episodes`, `ai_usage`.
  - Enable `pgvector` extension and configure `audiobooks.embedding vector(768)` with HNSW index.
  - Deploy `match_audiobooks` and `consume_ai_quota` RPC functions.
  - Provision storage buckets: `platform-covers` (public) and `audio-vault` (private).
- **Definition of Done:** All tables and buckets verified in Supabase Table Editor; `is_admin()` policies verified.

#### Subphase 3C: Catalog Seed Data & Ingestion Script
- **Objective:** Establish a repeatable, idempotent content ingestion engine.
- **Deliverables:**
  - `src/data/seed-catalog.json` with 8–12 classic Bengali and global audiobooks (e.g., *Chander Pahar*, *Feluda*, *Nishithini*, *The Great Gatsby*, *1984*).
  - `scripts/seed-catalog.js` supporting `--generate-embeddings` and upsert idempotency.
- **Definition of Done:** Running `node scripts/seed-catalog.js` populates authors, categories, audiobooks, and chapters with zero duplicate records.

#### Subphase 3D: Live Supabase Browse Page
- **Objective:** Completely replace `mock-catalog.js` in `src/app/page.js` with live Supabase database queries.
- **Deliverables:**
  - Dynamic category pill strip queried from `public.categories`.
  - Spotlight banner displaying live featured audiobook.
  - "Popular in Bangladesh" and "Recommended For You" grids populated from `public.audiobooks`.
- **Definition of Done:** Zero imports of `mock-catalog.js` in `page.js`; real books displayed with responsive covers and tier badges.

#### Subphase 3E: Book Details & Real Audio Playback
- **Objective:** Build `/audiobooks/[slug]` and enable genuine chapter-wise audio streaming.
- **Deliverables:**
  - Dynamic route `src/app/audiobooks/[slug]/page.jsx` rendering synopsis, author bio, and tracklist.
  - API Route Handler `src/app/api/audio/stream-url/route.js` verifying tier access and returning 15-minute signed URLs.
  - `InspectorPlayer` connected to an HTML5 `<audio>` engine playing actual audio chapters.
- **Definition of Done:** Clicking Play streams audio from Supabase Storage; Free tier users are blocked from playing non-preview chapters.

#### Subphase 3F: RAG Pipeline & AI Story Finder
- **Objective:** Implement natural-language catalog recommendations with Banglish support.
- **Deliverables:**
  - Route handler `src/app/api/ai/story-finder/route.js` performing query normalization, embedding, and vector retrieval.
  - Frontend interface `src/app/story-finder/page.jsx` with conversation prompts and zero-hallucination recommendation cards.
  - Atomic AI quota enforcement (`consume_ai_quota`).
- **Definition of Done:** Query *"amar voyer golpo shunte mon chacche"* retrieves *Nishithini* or *Supernatural & Horror* titles with zero hallucinated books.

---

## 11. Risks, Dependencies and Technical Decisions

### 11.1 Technical Risks & Mitigations
1. **Audio Copyright & Licensing Risk:**
   - *Risk:* Commercial audiobooks (e.g. copyright-protected Audible recordings) cannot be legally hosted or redistributed.
   - *Mitigation:* Use public domain Bengali works (Rabindranath Tagore, Sukumar Ray, Sarat Chandra Chattopadhyay, Bibhutibhushan Bandyopadhyay) and LibriVox public domain audio recordings for demo chapters.
2. **Supabase Free Tier Bandwidth & Storage Limits:**
   - *Risk:* Supabase free tier includes 1GB file storage and 2GB monthly egress. High-bitrate audio will exhaust bandwidth rapidly.
   - *Mitigation:* Encode demonstration chapters in 64kbps or 96kbps mono MP3 (approx. 1MB per 2-minute chapter). Limit test chapters to 2 to 3 chapters per book.
3. **Gemini API Free Tier Rate Limits:**
   - *Risk:* Free-tier Gemini API has a 15 requests-per-minute (RPM) quota. Batch-embedding 20 books at once could trigger HTTP 429.
   - *Mitigation:* Ingestion script includes a 2-second rate-limiting delay between sequential embedding calls.

---

## 12. Testing Baseline and Results

### 12.1 Non-Destructive Tests Executed During Audit
- **ESLint Check (`npm run lint`):**  
  *Result:* **PASSED (0 errors, 0 warnings)**.
- **Production Build Check (`npm run build`):**  
  *Result:* **PASSED (Exit code 0)**. All 7 App Router routes compiled cleanly with Partial Prerendering (`◐ /onboarding`).
- **Live Dev Server:**  
  *Result:* **PASSED (HTTP 200 OK)** responding on `http://localhost:3000/`.
- **Database Connection & RLS Audit:**  
  *Result:* **PASSED**. Successfully connected and queried all 6 active tables.

---

## 13. Manual Asset-Preparation Checklist for Developer

To prepare for Phase 3B and 3C, please prepare the following assets:

### 1. Cover Artwork (8 to 12 Images)
- **Format:** `.webp` or `.jpg` (WebP preferred).
- **Aspect Ratio:** `2:3` vertical book ratio (e.g., `800 x 1200 px` or `600 x 900 px`).
- **File Size:** Under `500 KB` per cover.
- **Recommended Titles:**
  1. `chander-pahar.webp` (Bibhutibhushan Bandyopadhyay)
  2. `badshahi-angti.webp` (Satyajit Ray — Feluda)
  3. `nishithini.webp` (Humayun Ahmed — Misir Ali)
  4. `srikanto.webp` (Sarat Chandra Chattopadhyay)
  5. `golpoguchho.webp` (Rabindranath Tagore)
  6. `byomkesh-satyanweshi.webp` (Sharadindu Bandyopadhyay)
  7. `great-gatsby.webp` (F. Scott Fitzgerald)
  8. `1984.webp` (George Orwell)

### 2. Audio Chapter Files (1 to 2 Chapters per Book)
- **Format:** `.mp3`
- **Encoding:** `64 kbps` or `96 kbps`, `44.1 kHz`, mono or stereo.
- **Duration:** 1 to 3 minutes per sample chapter (keeps file sizes under 2MB for rapid testing).
- **Naming Pattern:** `{slug}-chapter-01.mp3`, `{slug}-chapter-02.mp3`.

### 3. API Key Acquisition
- Acquire a free Google Gemini API Key from Google AI Studio (`aistudio.google.com`) for the embedding model (`text-embedding-004`) and query normalizer.

---

## 14. Final List of Decisions Requiring Your Approval

Before we proceed to Phase 3B implementation, please review and approve the following 5 strategic decisions:

1. **Seed Catalog Selection:** Do you approve using 8 to 10 classic Bengali & global audiobooks (using public domain audio/text) for the initial database seed?
2. **Audio File Duration:** Do you approve using 1 to 3 sample chapters (2–4 minutes each) per book to stay safely within Supabase free storage and bandwidth limits?
3. **Gemini for RAG:** Do you approve using Google Gemini (`text-embedding-004` for 768-dim embeddings and Gemini 2.0 Flash for Banglish query normalization)?
4. **Storage Architecture:** Do you approve the two-bucket strategy: public `platform-covers` for artwork and private `audio-vault` for audio streaming?
5. **Implementation Sequence:** Do you approve the proposed 6 subphases (3B Schema & Storage -> 3C Seed Data -> 3D Browse Feed -> 3E Details & Player -> 3F RAG Pipeline -> 3G Story Finder UI)?

---

## Final Recommendation

> [!NOTE]
> **Is GolpoBook ready to begin Phase 3 implementation?**  
> **YES.**  
> The foundational layers—Supabase Auth, SSR clients, cookie sessions, RLS security policies, and user onboarding—are in a pristine, fully verified state with zero lint or build errors.  
> 
> There are **no blocking foundational defects**. Once you review this audit and approve the decisions in Section 14, we are ready to proceed immediately to **Phase 3B: Content Schema and Storage Migration**.
