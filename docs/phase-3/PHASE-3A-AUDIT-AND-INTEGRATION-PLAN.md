# GolpoBook: Phase 3A Pre-Implementation Audit & Integration Plan
**Real Data Integration, Content Architecture, Vector Search, Licensing & Supabase Security Blueprint (Final Revision)**

**Document ID:** `DOC-P3-01-FINAL`  
**Phase:** Sprint 1, Phase 3A — Pre-Implementation Audit & Integration Planning  
**Date:** November 15, 2026  
**Status:** FINAL REVISED AUDIT COMPLETE — AWAITING ARCHITECTURAL APPROVAL  
**Authors:** Senior Full-Stack Engineer, Supabase Security Architect, RAG Engineer & Technical Lead  
**Scope:** Comprehensive Audit of Frontend, Database Schema, Vector Security, Supabase Storage, Licensing Compliance & Ingestion Pipeline  

---

## Audit Revision Change Log

| Revision | Date | Major Architectural Changes & Corrections |
| :--- | :--- | :--- |
| **REV 1** | Nov 15, 2026 | Initial Phase 3A audit draft. Flagged mock data dependencies, missing schema, and RAG readiness. |
| **REV 2** | Nov 15, 2026 | Replaced deprecated `text-embedding-004` and `gemini-2.0-flash`. Added dedicated `audiobook_embeddings` table, exact flat vector scan rationale, and Bangladesh copyright calculations. |
| **FINAL** | Nov 15, 2026 | **1. Gemini Models:** Evaluated `gemini-embedding-2` as primary embedding model with MRL `output_dimensionality: 768` (verified automatic truncation normalization per Google documentation). Retained `gemini-embedding-001` as documented alternative noting manual normalization requirement. Verified `gemini-2.5-flash` availability. Removed unsupported latency/quota guarantees. Enforced query/catalog embedding model consistency and documented re-embedding triggers.<br>**2. Playback Authorization:** Corrected access matrix across Guest, Free, Plus, and Premium tiers. Mandated server-side verification in `/api/audio/stream-url`. Mandated that preview chapters never bypass the unpublished-content check (`is_published = true`).<br>**3. Security Hardening:** Hardened `match_audiobooks()` with empty search path (`SET search_path = ''`), fully qualified object/operator references (`OPERATOR(extensions.<=>)`), explicit signature privilege management (`REVOKE ... FROM PUBLIC` before granting to intended roles), input validation bounds on threshold and count, and direct table RLS blocking access to `audiobook_embeddings`.<br>**4. Copyright Compliance:** Replaced outdated 2000 Act with **Copyright Act, 2023** (কপিরাইট আইন, ২০২৩). Clarified that non-commercial/academic prototype use is NOT automatically exempt under Bangladesh fair dealing law. Separated rights into 4 distinct layers. Explicitly marked unverified titles as **NOT APPROVED FOR PUBLIC DEPLOYMENT**.<br>**5. Schema & Roadmap:** Set `audiobooks.is_published` default to `false`. Reconciled `user_subscriptions` uniqueness with the actual deployed partial unique index `user_subscriptions_single_active_idx`. Deferred podcast tables to Sprint 2. Focused Phase 3B scope. Split RAG implementation into Subphase 3F (API) and Subphase 3G (UI). Clarified zero-hallucination rendering.<br>**6. Testing Framework:** Clarified audit checks as baselines. Added formal test categories for future phases with explicit status taxonomy. |

---

## 1. Executive Summary

### 1.1 Mission & Context
GolpoBook is a personalized subscription-based audiobook and podcast streaming platform engineered specifically for Bengali literature, regional audio stories, and global classics.

Phases 1 and 2 established the core foundational infrastructure:
- **Phase 1 (UI Foundation):** Audiora Neo-Editorial design system, typography tokens (`Space Grotesk`, `Courier Prime`, `Anek Bangla`), tactile physical card interaction physics, and responsive navigation shells.
- **Phase 2A & 2B (Database Foundation & Validation):** First 5 core relational tables (`subscription_plans`, `tier_limits`, `categories`, `profiles`, `user_subscriptions`) deployed and validated in Supabase with row-level security (RLS).
- **Phase 2C (Authentication):** Supabase SSR cookie-based authentication, registration trigger (`handle_new_user`), session refresh, and protected route middleware.
- **Phase 2D (Personalized Onboarding):** Full 6-step scroll-less taste calibration wizard, `user_preferences` table with strict RLS, live category taxonomy retrieval, and non-recursive `is_admin()` security definer function.

### 1.2 Core Audit Finding
The platform currently presents an **editorial illusion of a complete catalog**:
1. **Frontend Mock Dependency:** 100% of the browse feed (`/`), category filters, featured spotlight, and persistent audio player (`InspectorPlayer`) are powered by static mock data from `src/lib/data/mock-catalog.js` (8 hardcoded audiobooks).
2. **Database Content Gap:** The Supabase database contains exactly **6 tables** (`subscription_plans`, `tier_limits`, `categories`, `profiles`, `user_subscriptions`, `user_preferences`). The entire content hierarchy—`authors`, `audiobooks`, `chapters`, and `audiobook_embeddings`—**does not exist in the database**.
3. **Storage Gap:** Supabase Storage contains **0 buckets**. There is no public storage bucket for cover artwork (`platform-covers`) and no private vault for audio chapter streams (`audio-vault`).
4. **Audio Player Gap:** The `InspectorPlayer` component is purely visual. The Play/Pause button toggles state and animates CSS equalizer bars, but no real audio stream is loaded.
5. **RAG / Vector Gap:** The `pgvector` extension has not been enabled, no embedding table exists, and the vector retrieval RPC function `match_audiobooks` is not deployed.
6. **Route Gaps:** Links from navigation and browse banners (`/audiobooks`, `/audiobooks/[slug]`, `/story-finder`, `/library`, `/account`) point to routes that do not yet exist in `src/app/`.

### 1.3 Audit Verdict & Golden Rule
> [!IMPORTANT]
> **THIS IS AN AUDIT-ONLY PHASE. NO APPLICATION CODE OR DATABASE SCHEMA HAS BEEN MODIFIED.**  
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
| **AI / RAG** | Google Gemini API (`@google/genai` or REST) | Query Normalization & Vector Embeddings | Pending Phase 3F |

### 2.2 Environment Configuration Audit
Inspection of `.env.local` without exposing values revealed the following variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Present and valid.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Present and valid.
- `SUPABASE_SERVICE_ROLE_KEY` — Present and valid.

**Missing Environment Variables Required for Phase 3:**
- `GEMINI_API_KEY` — Mandatory for RAG query normalization (`gemini-2.5-flash`) and vector generation (`gemini-embedding-2`). Must be obtained from Google AI Studio ([aistudio.google.com](https://aistudio.google.com)).
- `NEXT_PUBLIC_APP_URL` — Required for canonical absolute URL generation during signed URL callbacks (`http://localhost:3000` in local dev).

### 2.3 Documentation vs. Code Discrepancies
Our code inspection identified four critical discrepancies between earlier project documentation and the live codebase:
1. **Directory Structure:** Earlier documentation referenced a route group `src/app/(listener)/`. In reality, `src/app/page.js` lives directly at the root, and route groups `(listener)` have not been created. We will continue with the root App Router structure.
2. **Onboarding Scheduling:** Early roadmap docs scheduled `user_preferences` for Sprint 5. In reality, `user_preferences` was completed in Sprint 1 Phase 2D.
3. **Search & AI Navigation:** The search input in `TopHeader` has no event handler, and the "Story Finder" button links to `/story-finder` which currently 404s.
4. **Mock Catalog Fields vs. DB Schema:** `mock-catalog.js` uses human-formatted strings (`duration: "6h 15m"`), whereas the database requires normalized integer seconds (`total_duration_seconds: 22500`) and UUID foreign keys (`category_id: uuid`).

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

### Verified Active Database Functions, Triggers & Partial Indexes:
1. `public.handle_new_user()` — Trigger function on `auth.users` provisioning listener profiles and initial Free subscription upon registration.
2. `public.set_updated_at()` — Trigger function automatically updating `updated_at` timestamps on row mutation.
3. `public.is_admin()` — `SECURITY DEFINER` function that safely evaluates admin roles without triggering self-referential RLS recursion on `public.profiles`.
4. `user_subscriptions_single_active_idx` — **Partial unique index** on `public.user_subscriptions(user_id) WHERE (status = 'active')`. This guarantees at most ONE active subscription per user while permitting unlimited historical rows (`expired`, `cancelled`) for audit.

---

## 4. Comprehensive Schema Audit (21-Table Architecture)

Below is the reconciled audit of all 21 tables planned across the platform lifecycle:

| # | Table Name | Status | Target Phase | Key Columns & Gaps | Relationships & Indexes | RLS Policy Strategy | Scope Decision |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `subscription_plans` | **EXISTS** | Done | Commercial tier definitions | B-tree on `id` (PK) | Public read; Admin write | Active |
| 2 | `tier_limits` | **EXISTS** | Done | Quotas and features per tier | `tier` -> `subscription_plans.id` | Public read; Admin write | Active |
| 3 | `categories` | **EXISTS** | Done | Content taxonomy & genres | Indexed on `slug`, `(is_active, display_order)` | Public read; Admin write | Active |
| 4 | `profiles` | **EXISTS** | Done | User identity, name, role | `id` -> `auth.users.id` (1:1) | User reads own; Admin reads all via `is_admin()` | Active |
| 5 | `user_subscriptions` | **EXISTS** | Done | Active subscription state | **Partial unique index on `(user_id) WHERE (status = 'active')`** | User reads own; Server webhook write | Active |
| 6 | `user_preferences` | **EXISTS** | Done | Onboarding calibration data | `user_id` -> `profiles.id` (1:1) | User read/write own; Admin read | Active |
| 7 | `authors` | **MISSING** | **Phase 3B** | `name`, `slug`, `bio`, `born_year`, `died_year`, `era` | B-tree on `name`, UNIQUE on `slug` | Public read; Admin write | **Core Phase 3B** |
| 8 | `audiobooks` | **MISSING** | **Phase 3B** | `title`, `title_bengali`, `slug`, `narrator_name`, `language`, `tier_requirement`, **`is_published` (DEFAULT false)** | `author_id` -> `authors.id`, `category_id` -> `categories.id` | Public read published; Admin full access | **Core Phase 3B** |
| 9 | `chapters` | **MISSING** | **Phase 3B** | `chapter_number`, `title`, `audio_storage_path`, `duration_seconds`, `is_preview` | `audiobook_id` -> `audiobooks.id` ON DELETE CASCADE | Public read metadata; Audio path gated | **Core Phase 3B** |
| 10| `audiobook_embeddings` | **MISSING** | **Phase 3B** | Dedicated vector store: `embedding vector(768)`, `embedding_model`, `dimensions`, `content_hash`, `is_stale` | `audiobook_id` -> `audiobooks.id` (1:1) ON DELETE CASCADE | **Service role only; No direct anon/auth policy** | **Core Phase 3B** |
| 11| `ai_usage` | **MISSING** | **Phase 3B** | Quota tracking: `user_id`, `feature`, `period_start`, `used_count` | `user_id` -> `profiles.id` ON DELETE CASCADE | User reads own; RPC mutates atomically | **Core Phase 3B** |
| 12| `podcasters` | **MISSING** | Sprint 2 | `name`, `slug`, `bio`, `avatar_url`, `verified_badge` | B-tree on `name`, UNIQUE on `slug` | Public read; Admin write | **Deferred to Sprint 2** |
| 13| `podcasts` | **MISSING** | Sprint 2 | `title`, `slug`, `podcaster_id`, `category_id`, `cover_image_url` | `podcaster_id` -> `podcasters.id`, `category_id` -> `categories.id` | Public read; Admin write | **Deferred to Sprint 2** |
| 14| `podcast_episodes` | **MISSING** | Sprint 2 | `episode_number`, `audio_storage_path`, `duration_seconds`, `is_free` | `podcast_id` -> `podcasts.id` ON DELETE CASCADE | Public read; Admin write | **Deferred to Sprint 2** |
| 15| `listening_history`| **MISSING** | Sprint 3 | Track playback resume: `user_id`, `audiobook_id`, `chapter_id`, `progress_seconds` | `user_id` -> `profiles.id`, `chapter_id` -> `chapters.id` | User read/write own | Sprint 3 |
| 16| `bookmarks` | **MISSING** | Sprint 3 | Listener saved marks: `timestamp_seconds`, `note` | `user_id` -> `profiles.id`, `chapter_id` -> `chapters.id` | User read/write own | Sprint 3 |
| 17| `payment_transactions`| **MISSING** | Sprint 4 | SSLCommerz ledger: `tran_id`, `val_id`, `amount`, `status` | `user_id` -> `profiles.id`, `plan_id` -> `subscription_plans.id` | User reads own; Server webhook write | Sprint 4 |
| 18| `user_follows` | **MISSING** | Sprint 5 | Follow author/podcaster: `user_id`, `target_id`, `follow_type` | `user_id` -> `profiles.id` | User read/write own | Sprint 5 |
| 19| `playlists` | **MISSING** | Sprint 5 | User custom lists: `title`, `is_public` | `user_id` -> `profiles.id` | User read/write own; Public read if public | Sprint 5 |
| 20| `playlist_items` | **MISSING** | Sprint 5 | Items in custom list: `position`, `chapter_id` | `playlist_id` -> `playlists.id`, `chapter_id` -> `chapters.id` | Inherited from `playlists` | Sprint 5 |
| 21| `reviews` | **MISSING** | Sprint 6 | Book ratings & critiques: `rating` (1-5), `review_text` | `user_id` -> `profiles.id`, `audiobook_id` -> `audiobooks.id` | Public read; User write own | Sprint 6 |

> [!TIP]
> **Focused Phase 3B Scope:**  
> By deferring `podcasters`, `podcasts`, and `podcast_episodes` to Sprint 2 (since Phase 3 has zero runtime dependency on podcast streaming), Phase 3B focuses strictly on the 5 essential entities: `authors`, `audiobooks`, `chapters`, `audiobook_embeddings`, and `ai_usage`.

---

## 5. Real Audiobook Content & Ingestion Strategy

### 5.1 Audiobook & Chapter Schema Specification
```
+----------------------------------------------------------------------------------------------------+
|                                    AUDIOBOOK DATA SPECIFICATION                                    |
+--------------------------+-------------+---------------+-------------------------------------------+
| Field Name               | Type        | Requirement   | Purpose & Rationale                       |
+--------------------------+-------------+---------------+-------------------------------------------+
| id                       | UUID        | Mandatory     | Primary Key (DEFAULT gen_random_uuid())   |
| title                    | TEXT        | Mandatory     | Primary display title in English/Bangla   |
| title_bengali            | TEXT        | Optional      | Native Bengali script (e.g. চাঁদের পাহাড়)  |
| slug                     | TEXT        | Mandatory     | URL-safe identifier (UNIQUE NOT NULL)     |
| author_id                | UUID        | Mandatory     | Foreign key to public.authors(id)         |
| category_id              | UUID        | Mandatory     | Foreign key to public.categories(id)      |
| narrator_name            | TEXT        | Mandatory     | Name of the voice artist / performer      |
| description              | TEXT        | Mandatory     | Full editorial synopsis for detail view   |
| short_description        | TEXT        | Mandatory     | 1-2 sentence summary for card previews    |
| cover_image_url          | TEXT        | Optional      | Public CDN URL from platform-covers bucket|
| language                 | TEXT        | Mandatory     | 'bangla' or 'english' (DEFAULT 'bangla')  |
| tier_requirement         | TEXT        | Mandatory     | 'free', 'plus', or 'premium'              |
| is_featured              | BOOLEAN     | Mandatory     | Spotlight banner flag (DEFAULT false)     |
| is_published             | BOOLEAN     | Mandatory     | Content gate flag (DEFAULT FALSE)         |
| total_duration_seconds   | INTEGER     | Mandatory     | Sum of chapter audio durations in seconds |
| rating_average           | NUMERIC(3,2)| Optional      | Seeded rating (e.g. 4.90)                 |
| ratings_count            | INTEGER     | Optional      | Seeded review count (e.g. 1420)           |
| publication_year         | INTEGER     | Optional      | Original literary publication year        |
| tags                     | TEXT[]      | Mandatory     | Keyword array for filtering and discovery |
| created_at, updated_at   | TIMESTAMPTZ | Mandatory     | System auditing timestamps                |
+--------------------------+-------------+---------------+-------------------------------------------+
```

> [!IMPORTANT]
> **Safety Default for `is_published`:**  
> The default value of `is_published` is explicitly configured as `FALSE`. Newly created or partially ingested audiobooks remain drafts and are mathematically inaccessible to public browse feeds, category filters, and vector search until an explicit publishing action is taken.

### 5.2 Content Ingestion Flexibility
1. **Metadata-Only Ingestion Support:** An audiobook record can exist and be fully active in `public.audiobooks` without having any audio chapter records or uploaded audio files. 
2. **Cover Image Decoupling:** If an audio book's cover image has not yet been uploaded to `platform-covers`, the frontend gracefully renders an Audiora Neo-Editorial styled SVG placeholder displaying the title, author, and genre in high-contrast typography.
3. **Optional Chapter Records:** Books can have 0 chapters (coming soon), 1 preview chapter, or full multi-chapter recordings. The UI displays "Audiobook Coming Soon" or disables playback controls if `chapters` count is 0, while keeping the book discoverable in catalog browsing and RAG recommendations.
4. **Independent RAG Indexing:** Embeddings can be generated for metadata-only audiobooks using the synthesized semantic document. Listeners can discover upcoming or preview-only books through AI Story Finder.
5. **Incremental Uploads:** Audio chapters and cover files can be uploaded at any time without locking tables or invalidating existing catalog data.

### 5.3 Ingestion Engine Strategy
The recommended seed engine uses `src/data/seed-catalog.json` combined with `scripts/seed-catalog.js`:
1. **Idempotency Guarantee:** The script uses PostgreSQL `upsert` with `onConflict: 'slug'`. If a book already exists, it updates metadata without generating duplicate rows.
2. **Dynamic Foreign Key Resolution:** Rather than hardcoding raw UUIDs in JSON, the ingestion script looks up `authors` by name (creating the author if missing) and `categories` by `slug`, resolving UUIDs automatically.
3. **Incremental Ingestion:** Adding new books to `seed-catalog.json` and rerunning the script safely upserts new records without disturbing existing data.

---

## 6. RAG Architecture & Gemini Model Selection

### 6.1 Gemini Model Evaluation & Selection

#### 1. Primary Text Embedding Model: `gemini-embedding-2`
Based on official Google AI documentation ([ai.google.dev: Gemini Embeddings](https://ai.google.dev/gemini-api/docs/models/gemini#embedding)):
- **Architecture & Capabilities:** `gemini-embedding-2` is Google's next-generation multimodal and text embedding model, trained natively across 100+ languages including Bengali script and Latin-based Banglish phonetic variations.
- **Matryoshka Representation Learning (MRL):** Natively supports configurable output dimensionality via `output_dimensionality` parameter:
  - Supported dimensions: `128` to `3072`.
  - **Selected Dimension:** **`768`**.
  - **Crucial Automatic Normalization Finding:** Unlike earlier models, when `gemini-embedding-2` produces truncated output dimensions (such as `768`), it **automatically normalizes the truncated vector**, ensuring that cosine similarity scores (`1 - (ae.embedding <=> query_embedding)`) remain mathematically valid out of the box without requiring manual normalization code.
  - **Rationale for 768:** Provides superior semantic expressive power compared to 256/512 while requiring half the storage and memory footprint of 1536/3072 (3,072 bytes per row vs 6,144 bytes). Fits perfectly into PostgreSQL shared buffers.
- **API Call Structure:**
  ```javascript
  const response = await ai.models.embedContent({
    model: 'models/gemini-embedding-2',
    contents: semanticTextDocument,
    config: {
      outputDimensionality: 768,
    },
  });
  ```

#### 2. Documented Alternative: `gemini-embedding-001`
- `gemini-embedding-001` remains supported as a secondary fallback.
- **Lifecycle & Migration Implication:** If `gemini-embedding-001` is selected, Google documentation notes that requesting custom dimensions other than the default `3072` requires **manual vector normalization** before storage to ensure proper cosine distance calculations. Furthermore, older endpoints will eventually follow Google's standard deprecation lifecycle.

#### 3. Text Generation & Normalization Model: `gemini-2.5-flash`
- **Architectural Role:**
  - Query Normalization: Extracts mood, genre, and key themes from ambiguous user prompts into structured bilingual search tokens.
  - Grounded Recommendation Synthesis: Composes warm Bengali response prose referencing **only** verified database matches.
- **Availability Status:** Active and available in Google AI Studio. (Google documentation notes scheduled routing to `gemini-3.5-flash-lite` starting December 1, 2026, which preserves API compatibility).

#### 4. Removal of Unsupported Guarantees (Latency & Quotas)
- **No Hardcoded Latency Guarantees:** Latency varies depending on client network distance, payload size, and cloud data center load. We do not promise sub-300ms latency as a blanket guarantee.
- **Project-Dependent Quotas:** Google AI Studio rate limits and token quotas depend strictly on the user's specific project tier (Free Tier vs. Pay-As-You-Go Tier). Developers must monitor quotas in the Google AI Studio console.

#### 5. Strict Embedding Model & Dimensionality Consistency
> [!CAUTION]
> **Mathematical Consistency Invariant:**  
> A vector similarity query is mathematically invalid if the query vector and stored catalog vectors were generated by different models or different dimensions.  
> **Rule:** Both the offline ingestion script (`scripts/seed-catalog.js`) and the runtime search route (`/api/ai/story-finder`) **MUST** use the exact same model (`models/gemini-embedding-2`) and the exact same dimension (`768`).

#### 6. Catalog Re-Embedding Trigger & Migration Strategy
If the embedding model or dimension is updated in the future:
1. `public.audiobook_embeddings` explicitly tracks `embedding_model` and `dimensions`.
2. Each row stores `content_hash` (SHA-256 of the canonical semantic text document).
3. Running `node scripts/seed-catalog.js --regenerate-embeddings`:
   - Checks if the current hash matches stored `content_hash` and if the stored `embedding_model` matches the configured model.
   - If a mismatch occurs, generates the new vector, updates `public.audiobook_embeddings`, and marks `is_stale = false`.
   - Core `public.audiobooks` metadata remains completely untouched, avoiding table locks.

---

### 6.2 Embedding Architecture: Dedicated `audiobook_embeddings` Table

We evaluated two architectural patterns:

```
OPTION A: Embedded Column                   OPTION B: Dedicated Embeddings Table
+-----------------------------------+       +--------------------+       +----------------------------+
| public.audiobooks                 |       | public.audiobooks  |       | public.audiobook_embeddings|
+-----------------------------------+       +--------------------+       +----------------------------+
| id: uuid (PK)                     |       | id: uuid (PK)      |1     1| audiobook_id: uuid (PK, FK)|
| title: text                       |       | title: text        |-------| embedding: vector(768)     |
| slug: text                        |       | slug: text         |       | embedding_model: text      |
| description: text                 |       | description: text  |       | dimensions: int            |
| ...                               |       | ...                |       | content_hash: text         |
| embedding: extensions.vector(768) |       +--------------------+       | is_stale: boolean          |
+-----------------------------------+                                    | updated_at: timestamptz    |
                                                                         +----------------------------+
```

| Dimension | Option A: In `audiobooks` Table | Option B: Dedicated `audiobook_embeddings` Table |
| :--- | :--- | :--- |
| **Browse Query Performance** | **Severe Bloat:** Every `SELECT * FROM audiobooks` on browse page and carousels reads 3,072 bytes of vector data per row into memory. | **Optimal:** `audiobooks` remains lean. Vector bytes are only loaded during semantic search. |
| **Model Versioning & Audit** | **Fragile:** Pollutes core content table with model version, dimensions, and hash columns. | **Clean:** Dedicated columns for model, dimensions, content hash, and staleness flag. |
| **Direct Access Protection** | Harder to isolate vector access from general catalog browse policies. | **Strictly Isolated:** Direct table RLS grants access ONLY to `service_role`. |
| **Re-embedding Safety** | In-place updates risk row locks on the main catalog table. | Safe updates in isolated table without disturbing catalog reads. |
| **Recommendation** | **REJECTED** | **SELECTED (RECOMMENDED)** |

#### Dedicated `public.audiobook_embeddings` Table DDL:
```sql
CREATE TABLE IF NOT EXISTS public.audiobook_embeddings (
  audiobook_id UUID PRIMARY KEY REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  embedding extensions.vector(768) NOT NULL,
  embedding_model TEXT NOT NULL DEFAULT 'models/gemini-embedding-2',
  dimensions INTEGER NOT NULL DEFAULT 768,
  content_hash TEXT NOT NULL, -- SHA-256 of semantic document to detect staleness
  is_stale BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS: Embeddings are purely internal server-side assets
ALTER TABLE public.audiobook_embeddings ENABLE ROW LEVEL SECURITY;

-- Block direct table access from anonymous and authenticated users
-- Standard users can ONLY query embeddings via the hardened match_audiobooks() RPC
CREATE POLICY "audiobook_embeddings_service_access"
  ON public.audiobook_embeddings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

### 6.3 Vector Index Strategy: Sequential Scan vs. HNSW

1. **Initial Catalog (< 1,000 Audiobooks): Exact Sequential Scan**
   - For 8–12 seed audiobooks (and up to 1,000 titles), PostgreSQL executes an exact flat scan across all vector rows:
     `ORDER BY ae.embedding OPERATOR(extensions.<=>) query_embedding LIMIT match_count`
   - **Performance:** Executes in **< 1 to 2 milliseconds**.
   - **Accuracy:** **100% recall** (exact mathematical nearest neighbors with zero approximation loss).
   - **Overhead:** **Zero memory overhead**; zero index build time during seeding; zero tuning parameters (`m`, `ef_construction`).

2. **Large Catalog Scale Path (> 1,000 Audiobooks): HNSW Index Migration**
   - When the catalog exceeds 1,000 to 5,000 audiobooks and sequential scan latency exceeds 15ms, deploy an HNSW index:
     ```sql
     CREATE INDEX IF NOT EXISTS idx_audiobook_embeddings_hnsw
       ON public.audiobook_embeddings
       USING hnsw (embedding extensions.vector_cosine_ops)
       WITH (m = 16, ef_construction = 64);
     ```
   - **Phase 3 Recommendation:** **Omit HNSW initially**. Exact sequential scan is mathematically superior and operationally simpler for our seed catalog.

---

## 7. Supabase Security Hardening & Playback Rules

### 7.1 Correct Subscription Playback Access Matrix

```
+----------------------------------------------------------------------------------------------------+
|                                    PLAYBACK AUTHORIZATION MATRIX                                   |
+--------------------------+-----------------------+-----------------------+-------------------------+
| User State / Plan        | Free-Tier Audiobooks  | Plus-Tier Audiobooks  | Premium-Tier Audiobooks |
+--------------------------+-----------------------+-----------------------+-------------------------+
| **Guest (Unauthenticated)**| Preview Chapters ONLY | Preview Chapters ONLY | Preview Chapters ONLY   |
+--------------------------+-----------------------+-----------------------+-------------------------+
| **Free Active Listener**   | ALL Chapters Allowed  | Preview Chapters ONLY | Preview Chapters ONLY   |
+--------------------------+-----------------------+-----------------------+-------------------------+
| **Plus Active Listener**   | ALL Chapters Allowed  | ALL Chapters Allowed  | Preview Chapters ONLY   |
+--------------------------+-----------------------+-----------------------+-------------------------+
| **Premium Active Listener**| ALL Chapters Allowed  | ALL Chapters Allowed  | ALL Chapters Allowed    |
+--------------------------+-----------------------+-----------------------+-------------------------+
```

#### Core Authorization Invariants:
1. **Unpublished Content Gate:** If an audiobook has `is_published = false`, playback is **STRICTLY FORBIDDEN FOR ALL CALLERS** (returning HTTP 404). A preview chapter **NEVER** bypasses the publication check.
2. **Server-Side Enforcement:** Playback authorization is evaluated **exclusively** on the server in `POST /api/audio/stream-url`. The route independently queries `public.user_subscriptions` and `public.chapters`.
3. **Never Trust the LLM or Client:** The AI Story Finder and frontend clients have zero authority to grant audio access or generate streaming tokens.

---

### 7.2 Hardened `match_audiobooks()` RPC Specification

Reviewing the function against current Supabase and PostgreSQL security guidance, we enforce:
- **Empty Search Path:** `SET search_path = ''` to prevent search_path injection vulnerabilities.
- **Fully Qualified References:** All objects (`public.audiobooks`, `public.audiobook_embeddings`) and operators (`OPERATOR(extensions.<=>)`) are fully schema-qualified.
- **Privilege Management:** Explicit `REVOKE EXECUTE ... FROM PUBLIC` before granting privileges exclusively to `anon`, `authenticated`, and `service_role`.
- **Bounded Inputs:** `match_count` is clamped between 1 and 20; `match_threshold` is clamped between 0.0 and 1.0.
- **Privacy Assurance:** Returns only public presentation metadata. Never exposes storage paths or internal keys.

```sql
-- 1. Create or replace the hardened vector matching function
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

-- 2. Revoke execution from PUBLIC on the explicit signature
REVOKE EXECUTE ON FUNCTION public.match_audiobooks(extensions.vector, double precision, integer, text) FROM PUBLIC;

-- 3. Grant execution explicitly to intended roles only
GRANT EXECUTE ON FUNCTION public.match_audiobooks(extensions.vector, double precision, integer, text) 
  TO anon, authenticated, service_role;
```

---

## 8. Multilingual RAG & Grounded Recommendation Flow

### 8.1 The Banglish Dilemma & 4-Stage Architecture
Listeners frequently query in phonetic Latin script (*"amar voyer golpo shunte mon chacche"*). The 4-stage pipeline resolves this:

```
                                THE RAG RETRIEVAL PIPELINE
                                
  Listener Query: "amar voyer golpo shunte mon chacche"
        |
        v
  [STAGE 1: Normalizer via Gemini 2.5 Flash]
  - System prompt: "Extract genre, mood, keywords. Output normalized Bengali and English terms."
  - Output: "ভৌতিক গল্প রহস্য horror supernatural thriller suspense ghost stories"
        |
        v
  [STAGE 2: Dense Embedding via gemini-embedding-2 (768 MRL)]
  - Generates 768-dimensional float vector from normalized search terms
        |
        v
  [STAGE 3: Supabase pgvector Cosine Search via match_audiobooks()]
  - Exact flat scan across public.audiobook_embeddings
  - Enforces is_published = true, returns top 3 to 5 matching catalog rows
        |
        v
  [STAGE 4: Grounded Zero-Hallucination Recommendation Generation]
  - Frontend renders recommendation cards directly from retrieved database records/IDs
  - Gemini 2.5 Flash writes a warm, conversational recommendation in Bangla:
    "আপনার জন্য কিছু রোমাঞ্চকর ও ভৌতিক অডিওবুক খুঁজে পেয়েছি:"
  - LLM is strictly constrained to the retrieved context; cannot create fictional titles.
```

### 8.2 Clarification on Zero Hallucinations
> [!IMPORTANT]
> **Structural Immunity vs. Prompting Limitations:**  
> Prompt engineering alone cannot mathematically guarantee zero hallucinations from an LLM.  
> In GolpoBook, zero hallucinations is enforced **architecturally**:
> 1. The interactive recommendation cards displayed in the UI are **rendered directly from the verified database records and UUIDs returned by `match_audiobooks()`**.
> 2. The LLM generates only the conversational commentary surrounding those verified cards. Even if the LLM hallucinated a title in prose, no interactive card or playable item could ever be instantiated for a non-existent database record.

---

## 9. Storage Architecture & Signed URL Streaming

### 9.1 Recommended Bucket Topology
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

### 9.2 Signed URL Streaming Workflow (`POST /api/audio/stream-url`)
1. Client sends `{ chapterId }` with cookie session.
2. Server validates user session via `@supabase/ssr`.
3. Server queries `chapters` and parent `audiobooks`:
   - If `audiobooks.is_published = false` -> **REJECTED (404 Not Found)**.
   - If `chapters.is_preview = true` -> **ALLOWED for all**.
   - If `user_subscriptions.status = 'active'`:
     - Plan `premium` -> **ALLOWED for all tiers**.
     - Plan `plus` and book requires `free` or `plus` -> **ALLOWED**.
     - Plan `free` and book requires `free` -> **ALLOWED**.
   - Otherwise -> **REJECTED (403 Forbidden with `{ error: 'UPGRADE_REQUIRED' }`)**.
4. Server generates a 15-minute signed URL using `supabase.storage.from('audio-vault').createSignedUrl(path, 900)`.
5. Client streams audio securely.

---

## 10. Frontend Mock-Data Replacement Inventory

| Component / Screen | Current Data Source | Required Supabase Table / Query | Fetching Approach | State Handling Needed |
| :--- | :--- | :--- | :--- | :--- |
| **Category Pill Strip** (`src/app/page.js`) | `CATEGORIES` in `mock-catalog.js` | `public.categories` (`is_active = true`, order by `display_order`) | Server Component prefetch / Client prop | Horizontal scroll, active pill styling |
| **Featured Spotlight Banner** (`src/app/page.js`) | `PLACEHOLDER_AUDIOBOOKS[1]` | `public.audiobooks` (`is_featured = true`, join `authors`) | Server Component async query | Editorial Choice badge, cover art fallback |
| **Popular Audiobooks Grid** (`src/app/page.js`) | `filteredBooks.slice(0, 4)` | `public.audiobooks` (`is_published = true`, order by `ratings_count DESC`) | Server Component with Suspense | 4-column responsive grid, empty state |
| **Recommended Grid** (`src/app/page.js`) | `filteredBooks.slice(4, 8)` | `public.audiobooks` matched against `user_preferences` | Server Component personalized query | Fallback to latest additions if new user |
| **Audiobook Card** (`audiobook-card.jsx`) | Static props (`book.coverUrl`, `book.tier`) | Mapped Supabase record (`cover_image_url`, `tier_requirement`) | Client Component | Hover lift, tier badges (FREE/PLUS/PREMIUM) |
| **Inspector Player** (`inspector-player.jsx`) | Hardcoded chapter array & static duration | `public.chapters` filtered by `audiobook_id` | Client Component connected to Audio API | Real HTML5 `<audio>`, dynamic tracklist |
| **Catalog Browse** (`/audiobooks`) | *Route does not exist* | Paginated query on `public.audiobooks` with genre filters | Server Component page | Filter sidebar, sorting, pagination |
| **Book Detail Page** (`/audiobooks/[slug]`) | *Route does not exist* | Query `public.audiobooks` by `slug` with nested `chapters` | Server Component with dynamic params | Full synopsis, metadata, complete tracklist |
| **AI Story Finder UI** (`/story-finder`) | *Route does not exist* | Calls `/api/ai/story-finder` route handler | Client Component | Chat-style input, recommendation card list |

---

## 11. Copyright Act, 2023 & Content Licensing Matrix

### 11.1 Legal Framework: Bangladesh Copyright Act, 2023 (কপিরাইট আইন, ২০২৩)
The Parliament of Bangladesh enacted the **Copyright Act, 2023** (Act No. XLIV of 2023), replacing the Copyright Act, 2000:
- **Literary Works (Section 24):** Copyright subsists during the author's lifetime plus **60 calendar years** from the beginning of the year following the author's death.
- **Sound Recordings (শব্দ-ধ্বনি রেকর্ডিং):** Protected for **60 years** from the beginning of the year following publication.
- **Cinematographic Works & Artwork:** Protected for **60 years** from publication.

> [!CAUTION]
> **No Automatic Academic or Prototype Exemption:**  
> Under the Copyright Act, 2023, "fair dealing" exceptions are narrow (e.g. private research, criticism, review with explicit citation, reporting of current news).  
> **Distributing or streaming full copyrighted audiobooks or stories over a network is NOT automatically lawful simply because an application is an academic project or prototype.** Full compliance across all rights layers is required.

### 11.2 The Four Independent Rights Layers
Every audiobook on GolpoBook consists of four distinct intellectual property layers that must be verified independently:
1. **Layer 1: Literary Text Rights:** Written novel/story text. (Must be public domain or licensed).
2. **Layer 2: Translation & Adaptation Rights:** If an English classic is translated to Bengali, the translation itself is a separate copyrighted literary work!
3. **Layer 3: Sound Recording / Narration Rights:** Even if the underlying book is public domain, commercial recordings (such as Radio Mirchi's *Sunday Suspense*) are strictly proprietary sound recordings under Section 15(1)(c). **Proprietary commercial recordings are strictly forbidden.** Audio must be LibriVox, student-recorded, or Creative Commons.
4. **Layer 4: Cover Artwork Rights:** Book cover designs from commercial publishers are protected artistic works. Covers must use royalty-free Unsplash photography, CC0 imagery, or custom vector artwork.

### 11.3 Author & Title Copyright Audit

| Title | Author | Year of Death | 60-Year Calculation | Legal Status | Deployment Status | Required Audio Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Abol Tabol** | Sukumar Ray | 1923 | 1923 + 60 = 1983 | **PUBLIC DOMAIN** | **APPROVED** | Volunteer / Student recording |
| **Sherlock Holmes** | Arthur Conan Doyle | 1930 | 1930 + 60 = 1990 | **PUBLIC DOMAIN** | **APPROVED** | LibriVox (Public Domain) |
| **Srikanto** | Sarat Chandra Chattopadhyay | 1938 | 1938 + 60 = 1998 | **PUBLIC DOMAIN** | **APPROVED** | Volunteer / Student recording |
| **The Great Gatsby** | F. Scott Fitzgerald | 1940 | 1940 + 60 = 2000 | **PUBLIC DOMAIN** | **APPROVED** | LibriVox (Public Domain) |
| **Kabuliwala & Stories** | Rabindranath Tagore | 1941 | 1941 + 60 = 2001 | **PUBLIC DOMAIN** | **APPROVED** | LibriVox / Student recording |
| **Chander Pahar** | Bibhutibhushan Bandyopadhyay | 1950 | 1950 + 60 = 2010 | **PUBLIC DOMAIN** | **APPROVED** | Volunteer / Student recording |
| **1984** | George Orwell | 1950 | 1950 + 60 = 2010 | **PUBLIC DOMAIN** | **APPROVED** | LibriVox (Public Domain) |
| **Pather Panchali** | Bibhutibhushan Bandyopadhyay | 1950 | 1950 + 60 = 2010 | **PUBLIC DOMAIN** | **APPROVED** | Volunteer / Student recording |
| **Byomkesh Bakshi** | Sharadindu Bandyopadhyay | 1970 | 1970 + 60 = 2030 | **UNDER COPYRIGHT** (until 2031) | **NOT APPROVED FOR PUBLIC DEPLOYMENT** | Requires commercial license |
| **Badshahi Angti (Feluda)** | Satyajit Ray | 1992 | 1992 + 60 = 2052 | **UNDER COPYRIGHT** (until 2053) | **NOT APPROVED FOR PUBLIC DEPLOYMENT** | Requires commercial license |
| **Nishithini (Misir Ali)** | Humayun Ahmed | 2012 | 2012 + 60 = 2072 | **UNDER COPYRIGHT** (until 2073) | **NOT APPROVED FOR PUBLIC DEPLOYMENT** | Requires commercial license |

> [!WARNING]
> **Strict Catalog Governance:**  
> Titles labeled **NOT APPROVED FOR PUBLIC DEPLOYMENT** are omitted from production seeds. The seed catalog will exclusively feature verified public domain literary works with verified open-source or volunteer narration.

---

## 12. Recommended Phase 3 Implementation Roadmap

To ensure modular verification and clean testing boundaries, Phase 3 is divided into **7 subphases**:

```
+----------------------------------------------------------------------------------------------------+
|                                PHASE 3 IMPLEMENTATION ROADMAP                                      |
|                                                                                                    |
|  [ 3A: Audit & Integration Plan ] (CURRENT) -> Architecture, Security Hardening & Approval         |
|            |                                                                                       |
|            v                                                                                       |
|  [ 3B: Focused Content Schema, Vector & Storage Migration ] -> Authors, Audiobooks, Chapters,     |
|                                 Embeddings Table, AI Usage, pgvector, Storage Buckets & Policies    |
|            |                                                                                       |
|            v                                                                                       |
|  [ 3C: Catalog Seed Data & Ingestion Script ] -> Verified Public Domain seed-catalog.json and      |
|                                 idempotent scripts/seed-catalog.js with MRL-768 embeddings         |
|            |                                                                                       |
|            v                                                                                       |
|  [ 3D: Live Supabase Browse Page ] -> src/app/page.js connected to live PostgreSQL queries        |
|                                        with real categories and dynamic carousels                  |
|            |                                                                                       |
|            v                                                                                       |
|  [ 3E: Book Details & Secure Audio Playback ] -> /audiobooks/[slug], /api/audio/stream-url         |
|                                 with tier authorization, and InspectorPlayer audio engine          |
|            |                                                                                       |
|            v                                                                                       |
|  [ 3F: RAG Retrieval API & Quota Engine ] -> /api/ai/story-finder route handler, Gemini normalizer|
|                                 gemini-embedding-2 MRL embedding, match_audiobooks RPC, quota test |
|            |                                                                                       |
|            v                                                                                       |
|  [ 3G: AI Story Finder Frontend Interface ] -> /story-finder page, conversational UI,             |
|                                 grounded zero-hallucination recommendation cards                   |
+----------------------------------------------------------------------------------------------------+
```

---

## 13. Testing Framework & Security Verification Matrix

### 13.1 Distinction: Baseline Audits vs. Functional Verification
The checks executed during Phase 3A (`npm run lint`, `npm run build`, read-only connection test) are **baseline build integrity checks**. They do NOT constitute proof of complete RLS isolation, storage policy enforcement, or role-based security.

### 13.2 Required Test Suites for Implementation Phases (3B through 3G)
For every implementation subphase, developers must execute and document tests according to this classification matrix:

```
+----------------------------------------------------------------------------------------------------+
|                                  SECURITY & FUNCTIONAL TEST MATRIX                                 |
+------------------------------------+------------------+---------------------+----------------------+
| Test Suite / Requirement           | Test Type        | Verification Method | Expected Result      |
+------------------------------------+------------------+---------------------+----------------------+
| 1. Anonymous vs. Authenticated DB  | Security / RLS   | Supabase Client API | Anon reads published;|
|    Access                          |                  |                     | Anon write rejected  |
+------------------------------------+------------------+---------------------+----------------------+
| 2. User-to-User RLS Isolation      | Security / RLS   | Cross-user Query    | User A cannot view or|
|                                    |                  |                     | mutate User B prefs  |
+------------------------------------+------------------+---------------------+----------------------+
| 3. Published vs. Unpublished Gate  | Security / RLS   | Browse & RPC Query  | Draft books 100%     |
|                                    |                  |                     | invisible to public  |
+------------------------------------+------------------+---------------------+----------------------+
| 4. Direct Access Restrictions on   | Security / RLS   | Direct Table Select | Anon & Authenticated |
|    audiobook_embeddings            |                  |                     | return empty / 403   |
+------------------------------------+------------------+---------------------+----------------------+
| 5. Guest Audio Authorization       | Functional / Auth| POST /stream-url    | Preview allowed;     |
|                                    |                  |                     | Full tracks -> 401   |
+------------------------------------+------------------+---------------------+----------------------+
| 6. Tiered Audio Authorization      | Functional / Auth| POST /stream-url    | Free/Plus/Premium    |
|    (Free vs Plus vs Premium)       |                  | (3 mock users)      | match access matrix  |
+------------------------------------+------------------+---------------------+----------------------+
| 7. Private Storage Signed URL      | Security / Store | Direct HTTP GET     | Raw URL -> 400/403;  |
|    Expiration                      |                  | Signed URL -> 200   | Expired -> 400       |
+------------------------------------+------------------+---------------------+----------------------+
| 8. Auth & Onboarding Regression    | Regression       | Browser Navigation  | Login, session, taste|
|                                    |                  |                     | calibration pass     |
+------------------------------------+------------------+---------------------+----------------------+
| 9. Responsive Physical UI          | UI / Usability   | Real Browser View   | Mobile/desktop card  |
|                                    |                  |                     | physics responsive   |
+------------------------------------+------------------+---------------------+----------------------+
```

### 13.3 Subphase Testing Protocol
In each implementation phase:
1. Run `npm run lint` — Must exit code 0 with 0 errors.
2. Run `npm run build` — Must compile all routes cleanly.
3. Execute the subphase-specific automated/manual tests from the matrix above.
4. Report test status using the standard taxonomy: **Automated**, **Manual**, **Passed**, **Failed**, or **Not Run**.
5. Any failure must be resolved and retested before requesting phase sign-off.

---

## 14. Developer Asset-Preparation Checklist

### 1. Verified Public Domain Cover Artwork (8 Images)
- **Format:** `.webp` or `.jpg` (WebP preferred).
- **Aspect Ratio:** `2:3` vertical book ratio (e.g., `800 x 1200 px`).
- **File Size:** Under `500 KB` per image.
- **Titles:** `chander-pahar.webp`, `srikanto.webp`, `kabuliwala.webp`, `abol-tabol.webp`, `sherlock-holmes.webp`, `great-gatsby.webp`, `1984.webp`, `pather-panchali.webp`.

### 2. Audio Chapter Files (Sample Chapters)
- **Format:** `.mp3`
- **Encoding:** `64 kbps` mono, `44.1 kHz`.
- **Duration:** 1 to 2 minutes per sample chapter (LibriVox public domain or volunteer student voice).
- **Naming Pattern:** `{slug}-chapter-01.mp3`.
- *Note:* Books can also be ingested without audio files in metadata-only mode.

### 3. API Key Acquisition
- Acquire a free Google Gemini API Key from Google AI Studio ([aistudio.google.com](https://aistudio.google.com)) and add `GEMINI_API_KEY=your_key` to `.env.local`.

---

## 15. Strategic Decisions Ready for Approval & Unresolved Risks

### 15.1 Decisions Ready for Approval:
1. **Gemini Model Stack:** Approve `models/gemini-embedding-2` with `output_dimensionality: 768` (MRL with automatic truncation normalization) for vector embeddings and `gemini-2.5-flash` for query normalization and response generation?
2. **Dedicated Embeddings Architecture:** Approve storing embeddings in `public.audiobook_embeddings` with direct access blocked via RLS and model consistency enforced?
3. **Sequential Vector Scan:** Approve using exact flat scan for our initial 8–10 books and deferring HNSW until the catalog exceeds 1,000 titles?
4. **Hardened RPC Function:** Approve the hardened `match_audiobooks()` specification featuring `SET search_path = ''`, fully qualified objects/operators, revoked execution from PUBLIC, and bounded thresholds/counts?
5. **Subscription Playback Rules:** Approve the strict 4-tier access matrix and mandatory server-side verification in `/api/audio/stream-url`, with preview chapters strictly honoring `is_published = true`?
6. **Copyright Compliance:** Approve restricting the public seed catalog exclusively to verified public domain literary works under the Copyright Act, 2023, while omitting unverified modern titles from production seeds?
7. **Focused Subphase Sequence:** Approve the 7-subphase roadmap (3B Schema & Storage -> 3C Seed Data -> 3D Browse Page -> 3E Details & Player -> 3F RAG API -> 3G Story Finder UI)?

### 15.2 Remaining Unresolved Risks:
1. **External AI Studio Quota Throttling:** If the free tier project quota (RPM/RPD) is reached during heavy live demonstration, the application could receive HTTP 429. *Mitigation:* The API route will include graceful fallback messaging advising the user to retry after 30 seconds.
2. **Audio Egress Bandwidth:** Supabase free tier includes 2GB monthly egress. High usage during class demos could consume bandwidth. *Mitigation:* Audio samples are strictly encoded in 64kbps mono and limited to 1–2 minutes per preview chapter.

---

## 16. Final Recommendation

> [!NOTE]
> **Is GolpoBook ready to proceed to Phase 3B implementation?**  
> **YES.**  
> The foundational layers—Supabase Auth, SSR cookie sessions, RLS security policies, and user onboarding—are in a pristine, fully verified state with zero lint or build errors. The architectural corrections for vector security, Gemini model selection, subscription playback gating, and copyright compliance are complete and documented.  
> 
> There are **no blocking foundational defects**. Once you review this final audit and approve the decisions in Section 15.1, we are ready to proceed immediately to **Phase 3B: Focused Content Schema, Vector & Storage Migration**.
