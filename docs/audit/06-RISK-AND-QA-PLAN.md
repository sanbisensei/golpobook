# GOLPOBOOK: COMPREHENSIVE RISK REGISTER & QUALITY ASSURANCE PLAN
**Document ID:** `06-RISK-AND-QA-PLAN`  
**Course:** CSE 495 – IT Project Management  
**Project:** GolpoBook – Personalized Subscription-Based Audiobook & Podcast Platform  
**Lead:** Nazeefa Alam (Audio Player & QA Lead) & Nabil Azmal Sajid (PM / Scrum Master)  
**Status:** QA PLAN & RISK MITIGATION MATRIX ACTIVE

---

## 1. Project Risk Register & Management Plan

This risk register evaluates the critical technical, operational, and commercial risks facing the five-person team during the development of GolpoBook. Risks are scored using a standard $5 \times 5$ Risk Severity Matrix ($Score = Probability \times Impact$).

```
RISK SEVERITY MATRIX:
Probability (1-5) x Impact (1-5)
Score 1-6: Low | Score 7-14: Medium | Score 15-25: High (Critical)
```

| ID | Risk Description | Prob (1-5) | Imp (1-5) | Score (1-25) | Early Warning Indicator | Prevention & Mitigation Strategy | Contingency Plan | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | **Supabase Free Tier 7-Day Inactivity Pause**: Supabase pauses free projects after 7 days of zero database queries. | 4 | 5 | **20 (HIGH)** | Supabase dashboard banner; API requests suddenly return 503 during rehearsal. | Set up a scheduled GitHub Action or cron ping that executes a lightweight `SELECT 1;` query every 3 days. Verify project status 24 hours prior to every sprint demo. | If paused before demo, log into Supabase dashboard and click "Restore Project" (takes ~2 minutes). Nabil keeps dashboard credentials handy. | **Nabil** |
| **RSK-02** | **Supabase Free Tier 50MB Per-File Upload Limit**: Supabase enforces a strict 50MB per-file upload cap on free plans. | 4 | 4 | **16 (HIGH)** | Admin file upload fails with HTTP 413 Payload Too Large when uploading a 45-minute chapter. | Encode all audiobook MP3 files at **64kbps to 96kbps Mono** (speech-optimized). A 45-minute mono chapter at 64kbps is only ~21MB, well below the 50MB limit. Split excessively long chapters into Part 1 / Part 2. | Transcode audio files using Audacity/FFmpeg before uploading; reject files over 45MB in client upload form. | **Lamia** |
| **RSK-03** | **Supabase 1GB Total Storage Quota**: Free tier provides only 1GB of total file storage across all buckets. | 3 | 4 | **12 (MED)** | Storage usage exceeds 700MB in Supabase dashboard. | Seed catalog with a focused, curated set of 8–10 high-quality audiobooks (averaging 5 chapters each) and 3 podcast shows rather than bulk uploading dozens of titles. | Clean test audio files regularly; compress cover images to WebP format (<100KB each). | **Lamia** |
| **RSK-04** | **Banglish RAG Retrieval Degradation**: Query "amar voyer golpo shunte mon chacche" yields unrelated romance or history titles. | 4 | 4 | **16 (HIGH)** | Benchmark test query precision@5 falls below 60%. | Insert a **Pre-Embedding Normalization Step** using Gemini 2.0 Flash to translate romanized Banglish into standardized Bengali script and English genre keywords before embedding. | Provide clickable suggested mood chips ("ভৌতিক গল্প", "রোমাঞ্চকর উপন্যাস") that feed pre-normalized queries. | **Farhan** |
| **RSK-05** | **AI Denial-of-Wallet & Cost Overrun**: Rapid automated queries exhaust team's Gemini/OpenAI API quota or incur unexpected costs. | 3 | 4 | **12 (MED)** | Rapid API credit burn rate on AI dashboard. | Enforce server-side daily quotas via atomic database RPC (`consume_ai_quota`) BEFORE initiating any external API calls. Enforce a 50 query/day fair-use cap on Premium tier. | Cache query embeddings for identical requests in a `query_cache` table; fall back to SQL ILIKE search if AI quota runs out. | **Farhan** |
| **RSK-06** | **Premium Audio URL Scraping (Piracy)**: Free users inspect network requests in DevTools to extract direct MP3 streaming links. | 4 | 4 | **16 (HIGH)** | Public audio URLs shared among students without authentication. | Place all audio files in **Private Supabase Storage Buckets**. Stream audio solely through short-lived signed URLs (15-minute expiry) issued by a server endpoint that validates user tier. | Disable public bucket policies; invalidate compromised URLs; ban accounts exhibiting abnormal request patterns. | **Lamia** |
| **RSK-07** | **Web Audio Memory Crashes with Wavesurfer**: Attempting to decode 40-minute audio files on mobile browsers freezes or crashes Safari/Chrome. | 4 | 4 | **16 (HIGH)** | Mobile browser crashes with "Web Audio Out of Memory" during chapter load. | Do **NOT** use `wavesurfer.js` to decode full audio files in real time. Use native HTML5 `<audio>` for streaming, and render simulated or pre-computed waveform bars. | Restrict Wavesurfer strictly to short 30-second previews, or replace with lightweight CSS/canvas visualizer. | **Nazeefa** |
| **RSK-08** | **SSLCommerz Sandbox Callback / IPN Failures**: SSLCommerz cannot deliver IPN POST webhooks to developer `localhost`. | 4 | 3 | **12 (MED)** | Transactions remain in "pending" status indefinitely in sandbox. | Use a persistent tunneling solution (e.g. `ngrok` or Vercel preview deployment) to provide a publicly accessible HTTPS endpoint for the IPN callback. | Implement a fallback "Verify Payment" button on the UI that triggers client-directed server-side validation using `val_id`. | **Farhan** |
| **RSK-09** | **Lack of Recurring Auto-Debit in Sandbox**: SSLCommerz sandbox does not support automatic subscription renewals. | 5 | 2 | **10 (MED)** | Faculty questions why subscriptions do not renew automatically every month. | Implement an explicit **Expiry-and-Downgrade Lifecycle**: calculate `expires_at = now() + interval '30 days'`. Show renewal reminder banner 3 days prior. Automatically downgrade expired accounts to Free. | Document this as an intentional sandbox constraint in the final project report. | **Farhan** |
| **RSK-10** | **Academic Exam Clashes & Team Burnout**: Midterms and CSE assignments reduce team development hours in Weeks 4 and 8. | 4 | 4 | **16 (HIGH)** | Tasks stagnate on Kanban board; commit velocity drops. | Front-load database schema and auth in Sprints 1–2; build buffer days into Sprint 6; enforce strict component ownership. | Pair programming on critical path blockers; PM reassigns non-critical tasks to Sprint 6 buffer. | **Nabil** |
| **RSK-11** | **Copyright & Content Sourcing Liability**: Uploading commercial copyrighted audiobooks (e.g. Harry Potter, Audible rips) creates legal risk. | 3 | 4 | **12 (MED)** | External copyright inquiry or faculty challenge. | Use exclusively **Public Domain Bengali Literature** (Rabindranath Tagore, Sukumar Ray, Sarat Chandra) or self-recorded team audio. | Immediately take down disputed files via Admin Backoffice; replace with royalty-free public domain tracks. | **Nabil** |
| **RSK-12** | **Mobile Audio Interruption & Background Throttling**: Mobile browsers pause audio when screen locks or user switches apps. | 3 | 3 | **9 (MED)** | Audio cuts out after 30 seconds when listener locks phone. | Integrate the browser `navigator.mediaSession` API to keep audio thread alive; avoid unmounting `<audio>` element during App Router route changes. | Provide user instructions for mobile background permissions; maintain single global audio player instance. | **Nazeefa** |

---

## 2. Quality Assurance & Testing Strategy

To guarantee that GolpoBook is robust, secure, and production-ready for faculty evaluation, the QA process is structured across four distinct verification tiers:

```
+----------------------------------------------------------------------------------------------------+
|                                    QUALITY ASSURANCE TIERS                                         |
|                                                                                                    |
|  [ TIER 1: UNIT & LOGIC TESTS ]                                                                    |
|  - Tier capability resolution (get_user_effective_tier)                                            |
|  - Atomic quota calculations (consume_ai_quota)                                                    |
|  - Banglish query text normalization regexes                                                       |
|                                                                                                    |
|  [ TIER 2: SECURITY & PERMISSION TESTS ]                                                           |
|  - Supabase Row Level Security (RLS) leak tests                                                    |
|  - Signed URL expiration and tier tampering tests                                                  |
|  - SSLCommerz fake IPN & duplicate payment penetration tests                                       |
|                                                                                                    |
|  [ TIER 3: RAG & AI ACCURACY BENCHMARKS ]                                                          |
|  - Precision@5 evaluation across 25 standardized Bengali/Banglish test queries                     |
|  - Anti-hallucination verification (confirming zero out-of-catalog recommendations)                  |
|                                                                                                    |
|  [ TIER 4: MANUAL SYSTEM & UAT ACCEPTANCE ]                                                        |
|  - Cross-device audio streaming (iOS Safari, Android Chrome, Windows Firefox)                      |
|  - Offline IndexedDB playback tests                                                                |
|  - End-to-end sandbox purchase verification                                                        |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. High-Priority Test Suites & Matrices

### 3.1 Security & Content Gating Test Matrix

| Test Case ID | Test Objective | Steps to Execute | Expected Result | Pass/Fail Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Direct Private Bucket Access | Send direct HTTP GET request to a chapter URL in `audio-vault` without Supabase auth. | Storage API returns HTTP 400 or 403 Forbidden. | **Pass**: File content is never returned. |
| **SEC-02** | Free Tier Non-Preview Access | As a Free listener, send POST to `/api/audio/stream-url` with `chapterId` where `is_preview = false`. | API returns HTTP 403 Forbidden with error `"Preview ended. Upgrade to Plus/Premium"`. | **Pass**: No signed URL is returned. |
| **SEC-03** | Signed URL Expiration | Generate signed URL for Chapter 1; wait 16 minutes (expiry = 15m); attempt HTTP GET on URL. | Storage CDN returns HTTP 403 AccessDenied or expired signature error. | **Pass**: Expired link fails to stream. |
| **SEC-04** | RLS Payment Transaction Leak | Authenticate as User A; attempt to query `payment_transactions` rows belonging to User B. | Supabase PostgreSQL returns 0 rows due to RLS filter `auth.uid() = user_id`. | **Pass**: Complete cross-user data isolation. |
| **SEC-05** | Forged SSLCommerz IPN | Send fake POST request to `/api/payment/ipn` with forged `val_id` not verified by sandbox API. | Endpoint rejects request; transaction status remains `pending`; no subscription created. | **Pass**: Forged webhook cannot upgrade account. |
| **SEC-06** | Duplicate IPN Idempotency | Send two identical valid IPN POST payloads simultaneously for transaction `GB-TEST-001`. | System validates first request; second request detects `status == 'valid'` and skips. | **Pass**: Subscription expiry extended only once. |

### 3.2 AI Story Finder RAG Benchmark Suite (25 Test Queries)
The RAG pipeline must be evaluated against this standardized benchmark set to guarantee retrieval relevance:

| Query # | Input Query (Banglish / Bangla / English) | Expected Dominant Genre | Acceptance Criteria (Precision@5) |
| :--- | :--- | :--- | :--- |
| **Q-01** | *"amar voyer golpo shunte mon chacche"* | Horror / Supernatural | Top 5 must contain at least 4 horror titles. |
| **Q-02** | *"kisu voyonkor raater kahini sunte chai"* | Horror / Thriller | Top 5 must contain horror titles. |
| **Q-03** | *"sherlock holmes er moto goenda golpo"* | Detective / Mystery | Top 5 must return Feluda, Byomkesh, or detective stories. |
| **Q-04** | *"valobashar misti kono kahini"* | Romance | Top 5 must return romantic literary classics. |
| **Q-05** | *"mukti juddher itihas niye boi"* | Historical / Liberation War | Top 5 must return historical Bengali audiobooks. |
| **Q-06** | *"chotoder mojar golpo shonaw"* | Children / Humor | Top 5 must return Sukumar Ray, Abol Tabol, or fairy tales. |
| **Q-07** | *"ghoom asche na valo ekta boi daw"* | Bedtime / Calm / Classic | Top 5 must return slow-paced narrative classics. |
| **Q-08** | *"science fiction space traveler story"* | Sci-Fi | Top 5 must return Bengali or translated science fiction. |
| **Q-09** | *"mon kharap kichu shunte chai"* | Emotional / Drama | Top 5 must return drama or melancholy literary works. |
| **Q-10** | *"business startup and self improvement"* | Self-Help / Motivation | Top 5 must return personal growth and business titles. |

*Quality Standard*: The RAG pipeline must achieve **$\ge 80\%$ Precision@5** across the 25 benchmark queries before Sprint 5 release.

### 3.3 Audio Player Stability Test Suite

| Test Case ID | Test Objective | Steps to Execute | Expected Result | Pass/Fail Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **AUD-01** | Chapter Auto-Advancement | Play Chapter 1 to final 3 seconds; allow audio to reach natural end. | Audio transitions smoothly to Chapter 2 without manual user click; progress saved. | **Pass**: Chapter 2 starts within 1.5s. |
| **AUD-02** | Playback Speed Enforcement | As a Free listener, attempt to set playback speed to 1.5x via browser console or UI. | UI shows locked icon; audio engine forces `playbackRate = 1.0`. | **Pass**: Audio remains at 1.0x. |
| **AUD-03** | Free Seeking Restriction | As a Free listener, attempt to drag seek slider from 01:00 to 15:00. | Scrubber snaps back to maximum allowed forward seek (`currentTime + 15s`). | **Pass**: Premature forward jumping blocked. |
| **AUD-04** | Cross-Page Persistence | Start playing Chapter 1; navigate between `/audiobooks`, `/pricing`, and `/library`. | Audio continues playing uninterrupted; inspector panel updates seamlessly. | **Pass**: Zero audio glitch or restart. |
| **AUD-05** | Mobile Lockscreen Controls | Start audio on mobile Chrome/Safari; lock device screen; press lockscreen pause button. | Audio pauses; lockscreen displays book cover artwork, title, and narrator credits. | **Pass**: MediaSession API functional. |

---

## 4. Sprint Quality Gates (Definition of Quality)

Before any sprint is marked complete and presented to the faculty supervisor, it must satisfy these four non-negotiable **Quality Gates**:

1. **Gate 1: Zero Security Leaks**: All newly created tables must have RLS enabled with explicit policies. No private storage URLs may be logged to the browser console.
2. **Gate 2: Cross-Browser Parity**: The delivered user stories must function without visual breaks or JavaScript errors across:
   - Google Chrome (Latest Desktop)
   - Mozilla Firefox (Latest Desktop)
   - Apple Safari (iOS 16+ Mobile Simulation)
   - Google Chrome (Android Mobile Simulation)
3. **Gate 3: Atomic Quota Protection**: Any feature governed by tier limits (`story_finder`, `ai_summary`, `playback_speed`) must enforce limits on the server before executing operations.
4. **Gate 4: Peer Code Review & Clean Build**: `npm run build` must complete with zero linting errors, zero hydration mismatches, and zero unhandled Promise rejections.
