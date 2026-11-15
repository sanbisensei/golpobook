# GolpoBook: Remaining Schema Roadmap & Future Migration Plan
**Document ID:** `05-REMAINING-SCHEMA-ROADMAP`  
**Phase:** Sprint 1 Phase 2A — Database Foundation & Security Design  
**Author:** Senior Backend Architect & Database Lead  
**Scope:** Chronological Migration Plan for Remaining 15 Database Tables (Sprints 2–6)  
**Status:** ARCHITECTURAL SPECIFICATION APPROVED

---

## 1. Schema Phasing Overview

In Sprint 1 Phase 2A, we prioritized and created the first **5 foundational tables**:
1. `public.subscription_plans`
2. `public.tier_limits`
3. `public.categories`
4. `public.profiles`
5. `public.user_subscriptions`

The remaining **15 tables** required for full platform operation are scheduled across Sprints 2 through 6 in alignment with the team roadmap (`docs/audit/04-SIX-SPRINT-ROADMAP.md`).

```
+----------------------------------------------------------------------------------------------------+
|                                    DATABASE MIGRATION ROADMAP                                      |
|                                                                                                    |
|  [ SPRINT 1 (CURRENT) - Core Identity & Tiers ]                                                    |
|  - subscription_plans, tier_limits, categories, profiles, user_subscriptions                        |
|                                                                                                    |
|  [ SPRINT 2 - Content Catalog & Chapter Vault ]                                                    |
|  - authors, podcasters, audiobooks, chapters, podcasts, podcast_episodes                           |
|  - Storage Buckets: 'platform-covers' (Public), 'audio-vault' (Private)                            |
|                                                                                                    |
|  [ SPRINT 3 - Playback Persistence & Bookmarks ]                                                   |
|  - listening_history, bookmarks                                                                    |
|  - Secure Signed URL RPC helper                                                                    |
|                                                                                                    |
|  [ SPRINT 4 - Monetization & Payment Ledger ]                                                      |
|  - payment_transactions (SSLCommerz audit log)                                                     |
|  - Subscription transition & downgrade workers                                                     |
|                                                                                                    |
|  [ SPRINT 5 - AI Vector Search & Discovery ]                                                       |
|  - pgvector extension, audiobooks.embedding vector(768), HNSW index                                |
|  - user_preferences, ai_usage, user_follows, playlists, playlist_items                             |
|  - match_audiobooks() and consume_ai_quota() RPC functions                                         |
|                                                                                                    |
|  [ SPRINT 6 - Community & Reviews ]                                                                |
|  - reviews, notifications                                                                          |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Sprint 2: Content Catalog & Chapter Vault (6 Tables)

**Objective:** Enable the backoffice admin portal to upload audiobooks chapter-by-chapter and podcast episodes into private storage, and enable listeners to browse the content directory.

### Tables to be Created

#### 1. `public.authors`
- **Columns:** `id` (UUID PK DEFAULT gen_random_uuid()), `name` (TEXT NOT NULL), `bio` (TEXT), `photo_url` (TEXT), `created_at` (TIMESTAMPTZ DEFAULT now()).
- **Indexes:** `authors_name_idx` on `name`.
- **RLS:** Public `SELECT`; `ALL` restricted to `role = 'admin'`.

#### 2. `public.podcasters`
- **Columns:** `id` (UUID PK DEFAULT gen_random_uuid()), `name` (TEXT NOT NULL), `bio` (TEXT), `avatar_url` (TEXT), `created_at` (TIMESTAMPTZ DEFAULT now()).
- **RLS:** Public `SELECT`; `ALL` restricted to `role = 'admin'`.

#### 3. `public.audiobooks`
- **Columns:**
  - `id` (UUID PK DEFAULT gen_random_uuid())
  - `title` (TEXT NOT NULL)
  - `slug` (TEXT UNIQUE NOT NULL)
  - `author_id` (UUID NOT NULL REFERENCES public.authors(id))
  - `category_id` (UUID NOT NULL REFERENCES public.categories(id))
  - `narrator_name` (TEXT NOT NULL)
  - `description` (TEXT NOT NULL)
  - `cover_image_url` (TEXT NOT NULL)
  - `tier_requirement` (TEXT NOT NULL DEFAULT 'free' REFERENCES public.subscription_plans(id))
  - `is_exclusive` (BOOLEAN NOT NULL DEFAULT false)
  - `total_duration_seconds` (INT NOT NULL DEFAULT 0)
  - `language` (TEXT NOT NULL DEFAULT 'bangla')
  - `created_at` (TIMESTAMPTZ DEFAULT now())
- **Indexes:** `audiobooks_slug_idx`, `audiobooks_category_idx`, `audiobooks_tier_idx`.
- **RLS:** Public `SELECT`; `ALL` restricted to `role = 'admin'`.

#### 4. `public.chapters`
- **Columns:**
  - `id` (UUID PK DEFAULT gen_random_uuid())
  - `audiobook_id` (UUID NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE)
  - `chapter_number` (INT NOT NULL)
  - `title` (TEXT NOT NULL)
  - `duration_seconds` (INT NOT NULL)
  - `audio_storage_path` (TEXT NOT NULL) -- Pointer to file in private 'audio-vault' bucket
  - `is_preview` (BOOLEAN NOT NULL DEFAULT false) -- Allows Free users to listen
  - `created_at` (TIMESTAMPTZ DEFAULT now())
- **Constraints:** UNIQUE(`audiobook_id`, `chapter_number`).
- **Indexes:** `chapters_audiobook_order_idx` on `(audiobook_id, chapter_number)`.
- **RLS:** Public `SELECT` (hiding raw storage path from public API queries via server endpoints).

#### 5. `public.podcasts`
- **Columns:** `id` (UUID PK), `title` (TEXT NOT NULL), `slug` (TEXT UNIQUE NOT NULL), `podcaster_id` (UUID REFERENCES public.podcasters(id)), `category_id` (UUID REFERENCES public.categories(id)), `description` (TEXT), `cover_image_url` (TEXT), `tier_requirement` (TEXT DEFAULT 'free'), `created_at` (TIMESTAMPTZ).
- **RLS:** Public `SELECT`; `ALL` restricted to `role = 'admin'`.

#### 6. `public.podcast_episodes`
- **Columns:** `id` (UUID PK), `podcast_id` (UUID REFERENCES public.podcasts(id) ON DELETE CASCADE), `episode_number` (INT NOT NULL), `title` (TEXT NOT NULL), `duration_seconds` (INT NOT NULL), `audio_storage_path` (TEXT NOT NULL), `is_free` (BOOLEAN DEFAULT true), `published_at` (TIMESTAMPTZ DEFAULT now()).
- **RLS:** Public `SELECT`; `ALL` restricted to `role = 'admin'`.

---

## 3. Sprint 3: Playback Persistence & Bookmarks (2 Tables)

**Objective:** Save listening progress per chapter and whole book, restore playback positions upon page reload, and enable bookmark creation.

### Tables to be Created

#### 7. `public.listening_history`
- **Columns:**
  - `id` (UUID PK DEFAULT gen_random_uuid())
  - `user_id` (UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE)
  - `audiobook_id` (UUID REFERENCES public.audiobooks(id) ON DELETE CASCADE)
  - `chapter_id` (UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE)
  - `progress_seconds` (INT NOT NULL DEFAULT 0)
  - `is_completed` (BOOLEAN NOT NULL DEFAULT false)
  - `last_listened_at` (TIMESTAMPTZ NOT NULL DEFAULT now())
- **Constraints:** UNIQUE(`user_id`, `chapter_id`).
- **Indexes:** `listening_history_user_book_idx` on `(user_id, audiobook_id, last_listened_at DESC)`.
- **RLS:** `SELECT`, `INSERT`, `UPDATE` allowed strictly for `auth.uid() = user_id`.

#### 8. `public.bookmarks`
- **Columns:** `id` (UUID PK), `user_id` (UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE), `chapter_id` (UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE), `timestamp_seconds` (INT NOT NULL), `note` (TEXT), `created_at` (TIMESTAMPTZ DEFAULT now()).
- **RLS:** `SELECT`, `INSERT`, `DELETE` allowed strictly for `auth.uid() = user_id`.

---

## 4. Sprint 4: Monetization & Payment Ledger (1 Table)

**Objective:** Store immutable audit records of all SSLCommerz transactions, handle IPN callbacks, and update user subscriptions.

### Table to be Created

#### 9. `public.payment_transactions`
- **Columns:**
  - `id` (UUID PK DEFAULT gen_random_uuid())
  - `tran_id` (TEXT UNIQUE NOT NULL) -- Merchant transaction ID sent to SSLCommerz (e.g. GB-1731532000-XYZ)
  - `val_id` (TEXT) -- SSLCommerz validation ID
  - `user_id` (UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE)
  - `plan_id` (TEXT NOT NULL REFERENCES public.subscription_plans(id))
  - `amount` (NUMERIC(10,2) NOT NULL)
  - `currency` (TEXT NOT NULL DEFAULT 'BDT')
  - `status` (TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'valid', 'failed', 'cancelled')))
  - `bank_tran_id` (TEXT)
  - `card_type` (TEXT)
  - `raw_gateway_response` (JSONB)
  - `created_at` (TIMESTAMPTZ NOT NULL DEFAULT now())
- **Indexes:** `payment_transactions_tran_id_idx` on `tran_id`, `payment_transactions_user_idx` on `user_id`.
- **RLS:** `SELECT` allowed strictly for `auth.uid() = user_id`; direct client writes **denied** (managed exclusively by server-side webhook with `service_role`).

---

## 5. Sprint 5: AI Vector Search, Personalization & Social (5 Tables)

**Objective:** Implement taste onboarding, personalized recommendations, RAG AI Story Finder with pgvector, and atomic daily/monthly quota tracking.

### Tables & Extensions to be Created

#### Vector Search Setup on `audiobooks`
1. Enable `pgvector` extension: `CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;`
2. Add embedding column: `ALTER TABLE public.audiobooks ADD COLUMN embedding vector(768);`
3. Create HNSW Cosine Index:
   ```sql
   CREATE INDEX audiobooks_embedding_hnsw_idx 
     ON public.audiobooks 
     USING hnsw (embedding vector_cosine_ops);
   ```
4. Deploy `match_audiobooks(query_embedding vector, match_count int)` RPC function.

#### 10. `public.user_preferences`
- **Columns:** `user_id` (UUID PK REFERENCES public.profiles(id) ON DELETE CASCADE), `preferred_genres` (TEXT[] NOT NULL DEFAULT '{}'), `preferred_languages` (TEXT[] NOT NULL DEFAULT '{"bangla"}'), `onboarding_completed` (BOOLEAN NOT NULL DEFAULT false), `updated_at` (TIMESTAMPTZ DEFAULT now()).
- **RLS:** `SELECT`, `INSERT`, `UPDATE` allowed strictly for `auth.uid() = user_id`.

#### 11. `public.ai_usage`
- **Columns:**
  - `user_id` (UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE)
  - `feature` (TEXT NOT NULL CHECK (feature IN ('story_finder', 'ai_summary')))
  - `period_start` (DATE NOT NULL) -- Date in `Asia/Dhaka` timezone
  - `used_count` (INT NOT NULL DEFAULT 0)
- **Constraints:** PRIMARY KEY (`user_id`, `feature`, `period_start`).
- **RLS:** `SELECT` allowed for `auth.uid() = user_id`; increments executed via `consume_ai_quota()` RPC.

#### 12. `public.user_follows`
- **Columns:** `id` (UUID PK), `user_id` (UUID REFERENCES public.profiles(id) ON DELETE CASCADE), `follow_type` (TEXT CHECK (follow_type IN ('author', 'podcaster'))), `target_id` (UUID NOT NULL), `created_at` (TIMESTAMPTZ DEFAULT now()).
- **Constraints:** UNIQUE(`user_id`, `follow_type`, `target_id`).
- **RLS:** `SELECT`, `INSERT`, `DELETE` allowed strictly for `auth.uid() = user_id`.

#### 13. `public.playlists`
- **Columns:** `id` (UUID PK), `user_id` (UUID REFERENCES public.profiles(id) ON DELETE CASCADE), `title` (TEXT NOT NULL), `is_public` (BOOLEAN DEFAULT false), `created_at` (TIMESTAMPTZ DEFAULT now()).
- **RLS:** `SELECT` allowed if `is_public = true` OR `auth.uid() = user_id`; writes allowed for `auth.uid() = user_id`.

#### 14. `public.playlist_items`
- **Columns:** `id` (UUID PK), `playlist_id` (UUID REFERENCES public.playlists(id) ON DELETE CASCADE), `chapter_id` (UUID REFERENCES public.chapters(id) ON DELETE CASCADE), `position` (INT NOT NULL).
- **RLS:** Inherits write permission from `playlists.user_id = auth.uid()`.

---

## 6. Sprint 6: Community & Notifications (1 Table)

**Objective:** Enable ratings and reviews, and send notifications for followed authors and subscription renewals.

### Table to be Created

#### 15. `public.reviews`
- **Columns:**
  - `id` (UUID PK DEFAULT gen_random_uuid())
  - `user_id` (UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE)
  - `audiobook_id` (UUID NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE)
  - `rating` (INT NOT NULL CHECK (rating BETWEEN 1 AND 5))
  - `review_text` (TEXT)
  - `created_at` (TIMESTAMPTZ NOT NULL DEFAULT now())
- **Constraints:** UNIQUE(`user_id`, `audiobook_id`).
- **Indexes:** `reviews_audiobook_idx` on `audiobook_id`.
- **RLS:** Public `SELECT`; `INSERT`, `UPDATE`, `DELETE` allowed strictly for `auth.uid() = user_id`.

---

## 7. Migration Sequence Checklist

| Migration Sequence | Target Sprint | Tables Introduced | Module |
| :--- | :--- | :--- | :--- |
| **01–05 (Current)** | **Sprint 1 Phase 2A** | `subscription_plans`, `tier_limits`, `categories`, `profiles`, `user_subscriptions` | **Identity & Tier Engine** |
| **06–07** | **Sprint 2** | `authors`, `podcasters`, `audiobooks`, `chapters`, `podcasts`, `podcast_episodes` | **Catalog & Storage** |
| **08** | **Sprint 3** | `listening_history`, `bookmarks` | **Audio Persistence** |
| **09** | **Sprint 4** | `payment_transactions` | **SSLCommerz Ledger** |
| **10–12** | **Sprint 5** | `user_preferences`, `ai_usage`, `user_follows`, `playlists`, `playlist_items`, `pgvector` | **AI Discovery & Personalization** |
| **13** | **Sprint 6** | `reviews` | **Community** |

This phased roadmap ensures database migrations remain modular, easy to review, thoroughly tested, and decoupled from breaking changes throughout the 6-sprint development cycle.
