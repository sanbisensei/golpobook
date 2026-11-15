# GOLPOBOOK: SIX-SPRINT AGILE IMPLEMENTATION ROADMAP
**Document ID:** `04-SIX-SPRINT-ROADMAP`  
**Course:** CSE 495 – IT Project Management  
**Project:** GolpoBook – Personalized Subscription-Based Audiobook & Podcast Platform  
**Methodology:** Agile Scrum (6 Sprints: 2-Week Nominal Cadence / Mapped 7-Week Accelerated Plan)  
**Team Roster (5 Members):**
- **Nabil Azmal Sajid** (`2023-3-60-194`) — Project Manager / Scrum Master
- **Zahin Shariar** (`2023-3-60-213`) — Frontend & UI/UX Developer
- **Lamia Bari** (`2023-3-60-230`) — Backend & Database Developer
- **Farhan Junaed** (`2023-3-60-307`) — Payment & Integration Developer
- **Nazeefa Alam** (`2023-3-60-183`) — Audio Player & QA Lead

---

## 1. Roadmap Framework & Dual Cadence Mapping

To balance academic reporting requirements with the reality of university semester schedules (where midterms, reviews, and faculty deadlines compress actual execution into 7 to 8 weeks), this roadmap provides both the formal 12-week schedule (six 2-week sprints) and the **Accelerated 7-Week Milestone Schedule**:

```
+----------------------------------------------------------------------------------------------------+
| 12-WEEK NOMINAL SPRINT SCHEDULE (2 WEEKS / SPRINT)                                                 |
| [ Sprint 1: Weeks 1-2 ] [ Sprint 2: Weeks 3-4 ] [ Sprint 3: Weeks 5-6 ]                            |
| [ Sprint 4: Weeks 7-8 ] [ Sprint 5: Weeks 9-10] [ Sprint 6: Weeks 11-12]                           |
+----------------------------------------------------------------------------------------------------+
| ACCELERATED 7-WEEK CRUNCH SCHEDULE                                                                 |
| [ Sprint 1: Week 1 ]  -> Foundations, Schema, Auth, Neo-Editorial Shell                            |
| [ Sprint 2: Week 2 ]  -> Content Catalog, Admin Chapter Vault, Supabase Storage                    |
| [ Sprint 3: Week 3 ]  -> Global Audio Player, Chapter Streaming, Tier Speed/Seek Gating             |
| [ Sprint 4: Week 4 ]  -> SSLCommerz Sandbox, IPN, Subscription State Machine                       |
| [ Sprint 5: Week 5 ]  -> Taste Onboarding, RAG Story Finder (Banglish Normalization)               |
| [ Sprint 6: Weeks 6-7]-> System Integration, RLS Hardening, Seed Catalog, Final Demo Rehearsal     |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Sprint-by-Sprint Execution Plan

---

### SPRINT 1: Foundation, Design Tokens, Auth, DB Schema & Tier Limits Baseline
**Nominal Duration:** Weeks 1–2 | **Accelerated:** Week 1  
**Sprint Goal:** Establish the Audiora Neo-Editorial design system in Tailwind v4, deploy Supabase core tables and Auth, configure tier limits, and deliver working authentication.

#### User Stories
- *As a Listener*, I want to register and log in via email/password so I can access my personalized library.
- *As a Developer*, I want a unified UI component library and database schema so development is standardized.

#### Granular Task Breakdown by Team Member
- **Nabil Azmal Sajid (PM / Scrum Master)**:
  - Setup Jira/Trello board with prioritized Sprint 1 backlog and user stories.
  - Coordinate Sprint 1 planning meeting; establish daily async standup format.
  - Maintain project risk register; verify team local environment setup.
- **Zahin Shariar (Frontend & UI/UX)**:
  - Configure `src/app/globals.css` with Audiora Neo-Editorial color tokens (Paper `#F4EBD9`, Terracotta `#EE6744`, Canary `#F6D04D`, Ink `#1A1A1A`) and hard offset shadows.
  - Import Space Grotesk and Courier Prime fonts in `layout.js`.
  - Fix `src/lib/utils.js` to properly use `clsx` and `tailwind-merge`.
  - Build responsive application layout shell: 72px left navigation rail and top header with canary search bar.
  - Create login and registration forms using customized shadcn/Base-UI primitives.
- **Lamia Bari (Backend & Database)**:
  - Initialize Supabase project; configure `.env.local` keys (`SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`).
  - Write and apply SQL migrations for initial tables: `profiles`, `categories`, `authors`, `podcasters`, `subscription_plans`.
  - Configure `auth.users` trigger (`handle_new_user`) to automatically provision listener profiles on registration.
  - Write Supabase client helpers: `src/lib/supabase/client.js`, `server.js`, and `admin.js`.
- **Farhan Junaed (Payment & Integration)**:
  - Create and populate `tier_limits` table with baseline limits for Free, Plus, and Premium.
  - Write `get_user_effective_tier` Supabase RPC function.
  - Define tier capability constants in `src/lib/constants/tiers.js`.
- **Nazeefa Alam (Audio Player & QA Lead)**:
  - Draft Master Test Plan document covering Authentication, Navigation, and RLS.
  - Create manual and automated test cases for user registration and role enforcement.
  - Set up QA test matrix across Chrome, Firefox, and mobile viewport simulations.

#### Dependencies & Blockers
- Zahin's auth UI depends on Lamia's Supabase client initialization.
- Farhan's tier lookup function depends on Lamia's `profiles` and `subscription_plans` schema.

#### Deliverables & Definition of Done (DoD)
- Working email/password registration and login persisting user session in browser cookies.
- Verified database schema deployed with `handle_new_user` trigger active.
- Neo-Editorial theme tokens rendering correctly on desktop and mobile.
- Zero console errors; all Sprint 1 code reviewed and merged to `main`.

#### Sprint Review Demonstration
Show live registration of a new listener, verify user profile creation in Supabase Table Editor, and demonstrate page layout shell with responsive rail and typography.

---

### SPRINT 2: Content Catalog, Admin Vault & Supabase Storage
**Nominal Duration:** Weeks 3–4 | **Accelerated:** Week 2  
**Sprint Goal:** Implement the backoffice admin interface for uploading chapter-by-chapter audiobooks and podcast episodes, configure private storage buckets, and build catalog browse pages.

#### User Stories
- *As an Admin*, I want to upload audiobooks with sequential chapters and cover artwork so content is available for listeners.
- *As a Listener*, I want to browse audiobooks by category and view book details and chapter tracklists.

#### Granular Task Breakdown by Team Member
- **Nabil Azmal Sajid (PM / Scrum Master)**:
  - Track Sprint 2 burndown; monitor Supabase free tier storage usage.
  - Review audio content licensing (ensure all test audiobooks are public domain, e.g. Rabindranath Tagore, Sukumar Ray).
- **Zahin Shariar (Frontend & UI/UX)**:
  - Build catalog browse page (`/audiobooks`) with category pill filters.
  - Create reusable `AudiobookCard` (2:3 aspect ratio, hard borders, hover elevation).
  - Build audiobook detail page (`/audiobooks/[slug]`) displaying cover plate, synopsis, narrator specs, and chapter tracklist.
  - Design Admin Upload UI (`/admin/upload`) with drag-and-drop file upload.
- **Lamia Bari (Backend & Database)**:
  - Deploy SQL migrations for `audiobooks`, `chapters`, `podcasts`, and `podcast_episodes`.
  - Create Supabase storage buckets: `platform-covers` (public) and `audio-vault` (private).
  - Configure Supabase Storage RLS: ensure `audio-vault` has NO public read policies.
  - Build API route `/api/admin/chapters` supporting chunked chapter uploads.
- **Farhan Junaed (Payment & Integration)**:
  - Implement preview chapter flag logic (`is_preview = true` for Chapter 1).
  - Write server helper to validate audiobook metadata during admin upload.
  - Set up notification trigger schema for new book releases.
- **Nazeefa Alam (Audio Player & QA Lead)**:
  - Execute storage security audit: verify that direct unauthenticated HTTP requests to files in `audio-vault` return 400/403.
  - Test chapter upload limits (verify handling of files under 50MB per Supabase limits).
  - Validate catalog responsive rendering on iOS Safari and Android Chrome viewports.

#### Deliverables & Definition of Done (DoD)
- Admin upload form successfully uploading chapter audio files to private Supabase Storage and recording durations in `chapters`.
- Public catalog browsing working with active category filtering.
- Private bucket confirmed inaccessible via raw URLs.

#### Sprint Review Demonstration
Admin uploads a multi-chapter Bengali audiobook (e.g. "Chander Pahar"); book immediately appears on catalog page with formatted chapter durations.

---

### SPRINT 3: Global Audiobook Player & Tier-Based Playback Controls
**Nominal Duration:** Weeks 5–6 | **Accelerated:** Week 3  
**Sprint Goal:** Deliver the persistent global audio player with chapter progression, time-limited signed URL streaming, tier-gated playback speed, and seek restrictions.

#### User Stories
- *As a Listener*, I want to play audiobooks chapter-by-chapter with continuous playback and resume where I left off.
- *As a Free Listener*, I should hear preview chapters, but be restricted from changing speed or jumping forward without upgrading.

#### Granular Task Breakdown by Team Member
- **Nabil Azmal Sajid (PM / Scrum Master)**:
  - Coordinate critical integration between Zahin (UI), Lamia (API/Storage), and Nazeefa (Audio Engine).
  - Track QA bug reports on audio buffering and chapter transition delays.
- **Zahin Shariar (Frontend & UI/UX)**:
  - Build Desktop Inspector Player Panel (right 380px pane) as shown in `REF/code.html`.
  - Create mobile collapsible sticky mini-player bar and swipeable full-height `Sheet` drawer.
  - Implement hardware-inspired 6-bar animated CSS equalizer (`WaveformBars`).
  - Create custom rectangular scrub bar with square bordered thumb (`Slider`).
- **Lamia Bari (Backend & Database)**:
  - Deploy SQL migration for `listening_history` and `bookmarks`.
  - Implement secure signed URL endpoint `/api/audio/stream-url`:
    - Checks user tier via `get_user_effective_tier(user_id)`.
    - If user is Free and `chapter.is_preview == false`, returns 403 Forbidden.
    - Generates 15-minute signed URL via `createSignedUrl`.
  - Build debounced progress sync endpoint `/api/audio/progress`.
- **Farhan Junaed (Payment & Integration)**:
  - Embed tier limits into stream response (`maxSpeed: 1.0` for Free, `1.5` for Plus, `2.0` for Premium).
  - Implement sleep timer logic (15m, 30m, end of chapter) locked to Plus and Premium tiers.
- **Nazeefa Alam (Audio Player & QA Lead)**:
  - Build core `AudioContext` and HTML5 audio controller engine:
    - Auto-advance to next chapter upon audio `ended` event.
    - Save playback position every 10 seconds to `listening_history`.
    - Hook into browser `navigator.mediaSession` for lockscreen play/pause/track metadata.
  - Implement seeking lock: restrict forward seeking to `currentTime + 15s` when `allowSeeking == false`.
  - Test cross-device resume: listen on desktop, open on mobile, verify position resumes accurately.

#### Deliverables & Definition of Done (DoD)
- Continuous chapter-by-chapter playback operating smoothly across page navigation.
- Free users strictly blocked from playing non-preview chapters.
- Speed controls enforce 1.0x for Free, up to 1.5x for Plus, up to 2.0x for Premium.
- Lockscreen media controls operational on mobile browsers.

#### Sprint Review Demonstration
Demonstrate playing Chapter 1 as a Free user; verify Chapter 2 triggers an upgrade modal. Upgrade account in DB to Plus; verify Chapter 2 plays instantly and 1.5x speed is unlocked.

---

### SPRINT 4: SSLCommerz Payment Gateway & Subscription State Machine
**Nominal Duration:** Weeks 7–8 | **Accelerated:** Week 4  
**Sprint Goal:** Integrate the SSLCommerz sandbox payment workflow, handle return callbacks and IPN webhooks, activate subscriptions atomically, and build the plan downgrade job.

#### User Stories
- *As a Free Listener*, I want to select a Plus or Premium plan and pay via SSLCommerz sandbox so I can immediately access full audiobooks.
- *As a Listener*, I want to view my active subscription status, renewal date, and transaction receipts.

#### Granular Task Breakdown by Team Member
- **Nabil Azmal Sajid (PM / Scrum Master)**:
  - Secure SSLCommerz sandbox credentials (`STORE_ID`, `STORE_PASSWD`).
  - Set up ngrok / local tunnel to allow SSLCommerz sandbox to deliver IPN POST webhooks to the development environment.
- **Zahin Shariar (Frontend & UI/UX)**:
  - Build `/pricing` page featuring Free, Plus, and Premium tiers with monthly/yearly toggle.
  - Create pricing cards with terracotta call-to-actions and feature comparison matrix.
  - Build payment verification loading screen and success/failure receipt modals.
  - Build Account Settings `/account` page showing active plan, expiry date, and upgrade buttons.
- **Lamia Bari (Backend & Database)**:
  - Deploy SQL migrations for `user_subscriptions` and `payment_transactions`.
  - Write atomic subscription update database function (`activate_user_subscription`).
  - Configure Supabase RLS so users can only view their own payment transactions.
- **Farhan Junaed (Payment & Integration)**:
  - Build payment session initiator `/api/payment/initiate`:
    - Generates unique `tran_id` and pending ledger record.
    - Sends payload to SSLCommerz `gwprocess/v4/api.php` and returns `GatewayPageURL`.
  - Build return callback handlers: `/api/payment/success`, `/fail`, `/cancel`.
  - Build Instant Payment Notification (IPN) webhook `/api/payment/ipn`:
    - Server-side validation against SSLCommerz `validator/api/validationserverAPI.php`.
    - Idempotency guard: verify `tran_id` has not already been credited.
    - Atomic activation of subscription (30-day or 365-day expiry).
  - Write subscription expiry check routine to downgrade expired accounts to Free.
- **Nazeefa Alam (Audio Player & QA Lead)**:
  - Test full end-to-end sandbox payment flows: bKash test wallet, Nagad, Visa sandbox card.
  - Test duplicate IPN delivery: fire multiple identical IPN webhooks; verify user subscription is not extended twice.
  - Test payment cancellation and failure handling; verify database records accurate statuses.

#### Deliverables & Definition of Done (DoD)
- End-to-end purchase flow functional: selecting plan -> redirect to SSLCommerz -> test payment -> redirect back -> instant upgrade.
- Verified server-side validation against SSLCommerz sandbox API.
- Idempotent transaction handling verified via automated tests.

#### Sprint Review Demonstration
Live purchase of a Plus subscription using a simulated bKash sandbox transaction. Show account status transition from Free to Plus, followed immediately by playing a locked Chapter 2 audiobook without page reload.

---

### SPRINT 5: Taste Onboarding & RAG AI Story Finder
**Nominal Duration:** Weeks 9–10 | **Accelerated:** Week 5  
**Sprint Goal:** Implement the onboarding questionnaire, personalized "For You" feed, and RAG Story Finder with Banglish query normalization and daily quota limits.

#### User Stories
- *As a New Listener*, I want to select my favorite genres and authors during onboarding so my feed recommends content I like.
- *As a Listener*, I want to describe my mood in Banglish (e.g. "amar voyer golpo shunte mon chacche") and get accurate audiobook recommendations.

#### Granular Task Breakdown by Team Member
- **Nabil Azmal Sajid (PM / Scrum Master)**:
  - Review AI API quota costs and monitor rate limits on Gemini API keys.
  - Compile the Banglish/Bangla benchmark evaluation dataset (25 real test queries).
- **Zahin Shariar (Frontend & UI/UX)**:
  - Build Taste Onboarding wizard (`/onboarding`) with interactive category tags.
  - Build Personalized "For You" Home Feed (`/`) displaying recommended shelves, recent listens, and followed creator updates.
  - Build AI Story Finder interface (`/story-finder` and header Canary search bar):
    - Input box with typewriter monospace styling.
    - Live daily quota remaining counter badge (`[ 8/10 REMAINING ]`).
    - Recommendation result cards with warm AI introductory message.
- **Lamia Bari (Backend & Database)**:
  - Enable `pgvector` extension in Supabase.
  - Add `embedding vector(768)` column to `audiobooks` table.
  - Create HNSW index: `USING hnsw (embedding vector_cosine_ops)`.
  - Create vector similarity RPC function `match_audiobooks`.
  - Create embedding generation pipeline for uploaded audiobooks using Gemini `text-embedding-004`.
- **Farhan Junaed (Payment & Integration)**:
  - Deploy `ai_usage` table and atomic RPC function `consume_ai_quota`.
  - Implement `/api/ai/story-finder` Route Handler:
    - Step 1: Quota check and atomic decrement.
    - Step 2: Query normalization via Gemini 2.0 Flash (normalizing Banglish to Bangla/English themes).
    - Step 3: Embed normalized text via `text-embedding-004`.
    - Step 4: RPC cosine similarity search in `audiobooks`.
    - Step 5: Optional warm Bangla introductory sentence generation.
  - Implement AI Summary endpoint `/api/ai/summary` with monthly tier quota.
- **Nazeefa Alam (Audio Player & QA Lead)**:
  - Execute RAG Accuracy Benchmark: run 25 Banglish, Bangla, and English queries and calculate precision@5.
  - Validate anti-hallucination guarantee: confirm that the LLM NEVER recommends books outside the database.
  - Test daily quota enforcement: verify Free tier blocks query #2 with HTTP 429; verify midnight Dhaka timezone reset.

#### Deliverables & Definition of Done (DoD)
- Working RAG Story Finder returning relevant catalog audiobooks for Banglish queries within 2.5 seconds.
- Quota strictly enforced: Free (1/day), Plus (10/day), Premium (fair-use cap).
- Zero hallucinated titles; all results link to real audiobooks.
- Taste onboarding populates personalized feed.

#### Sprint Review Demonstration
Input "amar voyer golpo shunte mon chacche" into Story Finder; demonstrate retrieval of top horror audiobooks with a tailored Bangla summary. Submit a second query as a Free user to demonstrate the quota limit modal.

---

### SPRINT 6: End-to-End System Integration, Security Hardening & Demo Polish
**Nominal Duration:** Weeks 11–12 | **Accelerated:** Weeks 6–7  
**Sprint Goal:** Complete comprehensive integration testing, apply strict RLS policies, audit mobile browser performance, seed final Bangla audio catalog, and conduct final demo dry runs.

#### User Stories
- *As a Faculty Evaluator*, I want to experience a seamless, secure, bug-free platform demonstrating all proposal deliverables.

#### Granular Task Breakdown by Team Member
- **Nabil Azmal Sajid (PM / Scrum Master)**:
  - Assemble final project documentation: Updated Proposal, Requirements Traceability Matrix, Risk Register, and User Manual.
  - Schedule and moderate mock faculty presentation rehearsals.
  - Verify project backup and prevent Supabase free-tier project pause.
- **Zahin Shariar (Frontend & UI/UX)**:
  - Complete Dark Mode polish across all pages ("Obsidian Library" theme).
  - Implement responsive empty states, 404 pages, and skeleton loaders.
  - Polish micro-interactions, active button depressions, and typography layout on mobile screens.
- **Lamia Bari (Backend & Database)**:
  - Audit and enable Row Level Security (RLS) on all 20 tables:
    - Profiles: viewable by all, editable only by owner.
    - Chapters: private audio storage paths hidden from public queries.
    - Payment transactions: strictly private to owner and admin.
  - Seed production-quality public-domain audiobooks with multi-chapter audio files and rich descriptions.
  - Re-generate vector embeddings for all seed content.
- **Farhan Junaed (Payment & Integration)**:
  - Run security verification on SSLCommerz IPN endpoint against forged POST requests.
  - Verify timezone handling: confirm Dhaka midnight reset runs reliably.
  - Optimize API route response times and caching.
- **Nazeefa Alam (Audio Player & QA Lead)**:
  - Execute end-to-end User Acceptance Testing (UAT) with 5 independent student testers.
  - Conduct mobile cross-device test suite on iOS Safari and Android Chrome.
  - Compile final QA and Test Execution Report with bug metrics and pass rates.

#### Deliverables & Definition of Done (DoD)
- Fully integrated, deployable web application running on Vercel/production host.
- 100% of Must-Have and Should-Have requirements verified and operational.
- Comprehensive security audit passed (RLS enabled, signed URLs verified).
- Final presentation deck and demonstration script finalized.

#### Sprint Review Demonstration
Complete end-to-end platform demonstration: new user registration -> taste onboarding -> personalized feed -> Banglish Story Finder query -> preview chapter playback -> subscription purchase via SSLCommerz sandbox -> full audiobook chapter streaming with 1.5x speed.
