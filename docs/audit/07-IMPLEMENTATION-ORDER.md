# GOLPOBOOK: TECHNICAL IMPLEMENTATION SEQUENCE & INTEGRATION GATES
**Document ID:** `07-IMPLEMENTATION-ORDER`  
**Course:** CSE 495 – IT Project Management  
**Project:** GolpoBook – Personalized Subscription-Based Audiobook & Podcast Platform  
**Purpose:** Precise Dependency Chain, Parallel Workstreams & Integration Milestones  
**Status:** IMPLEMENTATION DIRECTIVE (For Sprints 1 to 6)

---

## 1. Ground Zero: Mandatory Pre-Sprint Technical Fixes

Before a single application feature is built, the development team must execute three mandatory foundation fixes to eliminate latent bugs and dependency conflicts identified during the audit:

```
+----------------------------------------------------------------------------------------------------+
|                               GROUND ZERO: MANDATORY FOUNDATION PASS                               |
|                                                                                                    |
|  1. UTILITY FIX: Correct src/lib/utils.js to merge clsx & tailwind-merge                           |
|     - Replace: export { cn } from "cn";                                                            |
|     - With:    export function cn(...inputs) { return twMerge(clsx(inputs)); }                     |
|                                                                                                    |
|  2. THEME INJECTION: Overwrite src/app/globals.css with Audiora Neo-Editorial tokens               |
|     - Inject: --color-terracotta (#EE6744), --color-canary (#F6D04D), --color-paper (#F4EBD9)     |
|     - Define: Hard offset shadows (shadow-hard-sm, shadow-hard-md) and 1.5px ink borders          |
|                                                                                                    |
|  3. ICON STANDARDIZATION: Lock iconography to Lucide React or Hugeicons                            |
|     - Remove conflicting third-party icon paradigms; ensure single icon import path                |
|                                                                                                    |
|  4. ENVIRONMENT SETUP: Populate .env.local with Supabase, SSLCommerz, and AI keys                  |
|     - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY           |
|     - SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWD, GEMINI_API_KEY                                 |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Chronological Implementation Sequence & Dependency Flow

The system must be assembled in **five sequential phases**, ensuring that foundational data models and security gates exist before dependent features are constructed.

```
+----------------------------------------------------------------------------------------------------+
|                                  CHRONOLOGICAL DEPENDENCY FLOW                                     |
|                                                                                                    |
|  PHASE 1: Core Foundation, Schema & Identity                                                       |
|  [ Supabase Client & DB Schema ] ----> [ Supabase Auth SSR ] ----> [ Neo-Editorial App Shell ]    |
|                 |                                                                                  |
|                 v                                                                                  |
|  PHASE 2: Content Catalog & Private Storage Vault                                                  |
|  [ Private 'audio-vault' Bucket ] ---> [ Admin Upload Portal ] ---> [ Public Catalog & Detail ]   |
|                 |                                                                                  |
|                 v                                                                                  |
|  PHASE 3: Audio Streaming & Tier Access Control                                                    |
|  [ Signed URL API (/stream-url) ] ---> [ Global HTML5 Player ] ---> [ Playback Limits (Speed/Seek) ]
|                 |                                                                                  |
|                 v                                                                                  |
|  PHASE 4: Monetization Engine & Subscriptions                                                      |
|  [ SSLCommerz Session Handler ] ---> [ IPN Webhook & Validator ] -> [ Subscription State Machine ] |
|                 |                                                                                  |
|                 v                                                                                  |
|  PHASE 5: Personalization & AI Discovery (RAG)                                                     |
|  [ Taste Onboarding Wizard ] ------> [ Banglish Normalizer ] ------> [ pgvector Story Finder ]     |
|                                                                                                    |
|  PHASE 6: Hardening, Integration & Faculty Demo Rehearsal                                          |
|  [ Row Level Security Audit ] -----> [ Seed Catalog (8 Books) ] ---> [ Final Demo Verification ]   |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Phase Breakdown

### Phase 1: Core Foundation & Identity (Sprint 1)
1. **Database Schema Baseline (Lamia)**:
   - Apply SQL migrations for `profiles`, `categories`, `authors`, `subscription_plans`, and `tier_limits`.
   - Create `handle_new_user()` trigger on `auth.users` to provision listener profiles.
2. **Supabase Client Infrastructure (Lamia)**:
   - Create `src/lib/supabase/client.js` (browser client).
   - Create `src/lib/supabase/server.js` (SSR cookie client).
   - Create `src/lib/supabase/admin.js` (service-role private client).
3. **Application Shell & Auth UI (Zahin)**:
   - Build 72px left navigation rail and header with canary search bar.
   - Build `/login` and `/register` pages hooked into Supabase Auth.
4. **Tier Engine Baseline (Farhan)**:
   - Populate `tier_limits` table with limits for Free, Plus, and Premium.
   - Write `get_user_effective_tier(user_id)` database function.

### Phase 2: Content Management & Storage Vault (Sprint 2)
1. **Storage Bucket Provisioning (Lamia)**:
   - Provision `platform-covers` (public read).
   - Provision `audio-vault` (strict private access, zero public read policies).
2. **Audiobook & Chapter Migrations (Lamia)**:
   - Deploy `audiobooks`, `chapters`, `podcasts`, and `podcast_episodes` tables.
3. **Admin Upload Workflow (Lamia & Zahin)**:
   - Build `/admin/upload` form supporting sequential chapter file uploads.
   - Implement chapter metadata handler calculating durations.
4. **Public Catalog UI (Zahin)**:
   - Build `/audiobooks` catalog with category pill filtering and `AudiobookCard` components.
   - Build `/audiobooks/[slug]` detail page with chapter list.

### Phase 3: Listening Subsystem & Access Control (Sprint 3)
1. **Server-Side Signed Streaming API (Lamia & Farhan)**:
   - Build `/api/audio/stream-url`: verifies user tier, enforces preview limits on Free tier, and returns 15-minute signed Supabase URL.
2. **Global Audio Player Engine (Nazeefa)**:
   - Implement `AudioContext` hosting native HTML5 `<audio>` element.
   - Build chapter auto-advancement (`onEnded` -> fetch next chapter URL).
   - Implement MediaSession API for mobile lockscreen playback controls.
3. **Desktop Inspector Player UI (Zahin)**:
   - Build right 380px inspector panel with retro hardware controls, square thumb scrub bar, and animated equalizer bars.
   - Build mobile collapsible mini-player bar and swipeable drawer sheet.
4. **Progress & Restriction Enforcement (Nazeefa & Farhan)**:
   - Build debounced progress saving to `listening_history` (every 10 seconds).
   - Enforce seeking limits on Free tier (`maxForwardSeek = currentTime + 15s`).
   - Enforce playback speed limits (1.0x for Free, up to 1.5x for Plus, up to 2.0x for Premium).

### Phase 4: Monetization Engine (Sprint 4)
1. **Payment Initiation Endpoint (Farhan)**:
   - Build `/api/payment/initiate`: creates pending ledger in `payment_transactions` and calls SSLCommerz sandbox API `gwprocess/v4`.
2. **Pricing & Checkout UI (Zahin)**:
   - Build `/pricing` page with monthly/yearly billing toggle and tier feature comparison.
3. **IPN Webhook & Server Validation (Farhan)**:
   - Build `/api/payment/ipn`: validates `val_id` with SSLCommerz sandbox validator API.
   - Implement idempotency check to prevent duplicate activation.
   - Update `user_subscriptions` and `payment_transactions` atomically.
4. **Plan Expiry & Downgrade Logic (Farhan)**:
   - Implement subscription expiration check function to downgrade expired users to Free.

### Phase 5: Personalization & AI Discovery (Sprint 5)
1. **Taste Onboarding Flow (Zahin & Lamia)**:
   - Build `/onboarding` wizard saving preferences to `user_preferences`.
   - Build personalized "For You" feed querying books by preferred genres.
2. **Supabase pgvector Setup (Lamia)**:
   - Enable `vector` extension; add `embedding vector(768)` to `audiobooks`.
   - Create HNSW index on `audiobooks.embedding`.
   - Write `match_audiobooks` cosine similarity RPC function.
3. **Embedding Ingestion Pipeline (Lamia & Farhan)**:
   - Call Gemini `text-embedding-004` to compute embeddings for all uploaded titles.
4. **AI Story Finder Route & Normalizer (Farhan & Zahin)**:
   - Deploy `ai_usage` table and `consume_ai_quota` atomic function.
   - Build `/api/ai/story-finder`:
     - Normalizes Banglish/Bangla queries via Gemini 2.0 Flash.
     - Embeds query and calls `match_audiobooks`.
     - Returns top 5 real database books with warm introductory note.
   - Build Canary Search Bar UI with live daily quota remaining counter badge.

### Phase 6: System Integration, Security Hardening & Demo Polish (Sprint 6)
1. **Security & RLS Lockdown (Lamia & Farhan)**:
   - Verify RLS policies on all 20 tables.
   - Penetration test signed URLs and direct API calls.
2. **Catalog Seeding (Nabil & Lamia)**:
   - Seed 8–10 complete public domain Bengali audiobooks with multiple chapters and high-res cover art.
3. **Cross-Browser & Mobile QA (Nazeefa)**:
   - Execute full test matrix on iOS Safari and Android Chrome.
   - Conduct User Acceptance Testing with 5 student testers.
4. **Faculty Demonstration Dry Runs (Whole Team)**:
   - Rehearse live demonstration script covering full listener journey.

---

## 4. Critical Integration Milestones

```
+----------------------------------------------------------------------------------------------------+
|                                    CRITICAL INTEGRATION MILESTONES                                 |
|                                                                                                    |
|  MILESTONE 1: The Connected Shell (End of Sprint 1)                                                |
|  - Criteria: A user can register, log in, view the Neo-Editorial 3-tier layout, and log out.      |
|  - Validates: Supabase Auth + SSR Cookies + Tailwind v4 Theme Tokens.                              |
|                                                                                                    |
|  MILESTONE 2: The Vaulted Catalog (End of Sprint 2)                                                |
|  - Criteria: Admin can upload a multi-chapter audiobook to private storage; public catalog browses |
|              and displays the book with formatted chapter tracklists.                              |
|  - Validates: Private Supabase Storage + Admin Upload API + Detail View.                          |
|                                                                                                    |
|  MILESTONE 3: The Restricted Streamer (End of Sprint 3)                                            |
|  - Criteria: Chapter 1 streams smoothly via signed URL; Chapter 2 blocks Free users; speed is     |
|              locked to 1.0x; lockscreen controls work on mobile.                                   |
|  - Validates: Signed URL Gating + Global HTML5 Audio Engine + MediaSession API.                    |
|                                                                                                    |
|  MILESTONE 4: The Commercial Loop (End of Sprint 4)                                                |
|  - Criteria: Free user upgrades to Plus via SSLCommerz sandbox; account transitions immediately;   |
|              locked Chapter 2 becomes playable; 1.5x speed unlocks.                                |
|  - Validates: SSLCommerz Sandbox + IPN Webhook + Subscription State Machine.                       |
|                                                                                                    |
|  MILESTONE 5: The Intelligent Discovery Engine (End of Sprint 5)                                   |
|  - Criteria: Query "amar voyer golpo shunte mon chacche" returns real horror catalog books; daily  |
|              quota decrements; second query as Free user blocks with HTTP 429.                     |
|  - Validates: Banglish Normalization + pgvector HNSW Search + Atomic Quota Counter.                |
+----------------------------------------------------------------------------------------------------+
```

---

## 5. Parallel Workstreams vs Serialized Critical Path

To avoid bottlenecks where developers wait for others, work is divided into parallel and serialized streams:

### Parallel Workstreams (Independent Execution)
- **Zahin (Frontend UI)** can build the `/pricing` UI, `/onboarding` wizard, and audio player layout using mock state while **Lamia and Farhan** build the backend endpoints.
- **Farhan (Payment)** can build the SSLCommerz sandbox API wrapper and signature validator independently while **Lamia** finishes the catalog and storage schema.
- **Nazeefa (QA)** can draft test specifications and curate public domain audio files in Audacity while features are in development.

### Serialized Critical Path (Strict Pre-Requisites)
1. `Supabase Client & Auth SSR` **MUST** exist before any protected page or Route Handler can be created.
2. `audiobooks` and `chapters` schema **MUST** exist before Admin Upload or Audio Player can be built.
3. `Private Storage Bucket & RLS` **MUST** be deployed before `/api/audio/stream-url` can be written.
4. `tier_limits` and `user_subscriptions` **MUST** be functional before the Audio Player can enforce speed/seeking limits.
5. Catalog audiobooks **MUST** be seeded and embedded before the RAG Story Finder can return results.

---

## 6. Failure Modes & Emergency Fallbacks

During the live faculty presentation, external services may fail. The team must prepare these pre-configured emergency fallbacks:

| Failure Mode | Impact | Immediate Fallback Strategy |
| :--- | :--- | :--- |
| **SSLCommerz Sandbox Unreachable / Down** | Payment gateway times out or fails to redirect. | Activate pre-configured admin bypass button (`/pricing?demo_bypass=secret`) that calls `activate_user_subscription` directly, allowing demonstration of post-payment upgrade features. |
| **Gemini AI API Outage / Rate Limit Exceeded** | Story Finder returns 500 error or hangs. | Story Finder automatically catches API error and falls back to **Database Keyword Search (SQL ILIKE)** across book titles and descriptions, returning catalog cards without the AI introductory note. |
| **Supabase Free Tier Project Paused** | All database queries fail with connection refused. | Nabil keeps Supabase web console open on a secondary device; clicks "Restore Project" immediately (takes 120 seconds). Maintain a pre-recorded backup demo video on flash drive. |
| **Local Network / Tunnel Disconnects IPN** | Payment succeeds at gateway, but IPN webhook is not delivered to localhost. | Click the "Manual Verification" button on the payment return screen, which triggers a direct server-to-server validation check using the stored `val_id`. |
