# GOLPOBOOK: REQUIREMENTS TRACEABILITY MATRIX (RTM) & SCOPE BOUNDARY
**Document ID:** `05-REQUIREMENTS-TRACEABILITY`  
**Course:** CSE 495 – IT Project Management  
**Project:** GolpoBook – Personalized Subscription-Based Audiobook & Podcast Platform  
**Methodology:** MoSCoW Prioritization  
**Status:** COMPLETE TRACEABILITY BASELINE

---

## 1. Traceability Methodology & Priority Schema

This Requirements Traceability Matrix (RTM) maps every functional and non-functional requirement from Section 7 of the original project proposal (`REF/PROPOSAL.docx`) directly to implementation sprints, responsible developers, technical dependencies, and verification criteria.

No requirement from the original proposal has been silently removed or altered. Where a requirement presents technical contradictions or feasibility challenges in a browser environment, an architectural adaptation is explicitly recommended while preserving the original intent.

### MoSCoW Definitions
- **Must Have (M)**: Core mission-critical deliverables required for project passing and MVP functionality.
- **Should Have (S)**: High-value features that differentiate the platform; essential for high distinction.
- **Could Have (C)**: Desirable additions implemented if time permits.
- **Future Scope (F)**: Documented future research and expansion capabilities explicitly scoped out of the MVP.

---

## 2. Comprehensive Requirements Traceability Matrix

| Req ID | Module | Feature Description | Priority | Owner | Sprint | Technical Dependencies | Verification Method | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | User & Profile | User registration with email and password | **Must** | Lamia / Zahin | Sprint 1 | Supabase Auth, `profiles` table | Automated test + Manual QA | User enters email/password; receives auth cookie; `profiles` record created automatically. |
| **REQ-02** | User & Profile | User login, session persistence, and logout | **Must** | Lamia / Zahin | Sprint 1 | Supabase SSR cookie handler | Integration test | Session survives page refreshes; logout immediately clears cookies and redirects to `/login`. |
| **REQ-03** | User & Profile | Password reset via email token | **Must** | Lamia / Zahin | Sprint 1 | Supabase Auth SMTP service | Manual email test | Reset email triggers reset password form; new password updates credentials in Supabase Auth. |
| **REQ-04** | User & Profile | Profile management (display name, avatar) | **Should** | Zahin | Sprint 1 | `profiles` RLS policy | UI test | User can update full name and avatar URL; reflected immediately in header UI. |
| **REQ-05** | Content Library | Browse catalog with category and language filters | **Must** | Zahin / Lamia | Sprint 2 | `audiobooks`, `categories` tables | End-to-end browse test | Clicking category pill filters books by category; search bar queries titles in real time. |
| **REQ-06** | Content Library | Audiobook detail page with chapter tracklist | **Must** | Zahin | Sprint 2 | `audiobooks`, `chapters` tables | Component test | Displays cover art, author, narrator, synopsis, and sequential chapter list with durations. |
| **REQ-07** | Content Library | Podcast show and episode directory | **Must** | Lamia / Zahin | Sprint 2 | `podcasts`, `podcast_episodes` | UI test | Shows list of podcasts; clicking show opens episodes with host metadata. |
| **REQ-08** | Admin Backoffice | Chapter-by-chapter audiobook upload portal | **Must** | Lamia / Zahin | Sprint 2 | Supabase Storage (`audio-vault`) | Admin upload test | Admin can upload multiple MP3 files with chapter titles and durations; stored in private bucket. |
| **REQ-09** | Admin Backoffice | Category and content tier assignment | **Must** | Lamia | Sprint 2 | `audiobooks.tier_requirement` | Database query | Admin can set book to Free, Plus, or Premium; updates access requirement instantly. |
| **REQ-10** | Audio Player | Chapter-by-chapter sequential playback | **Must** | Nazeefa | Sprint 3 | HTML5 `<audio>`, signed URLs | Player lifecycle test | Player plays Chapter 1, saves progress, and auto-advances to Chapter 2 upon completion. |
| **REQ-11** | Audio Player | Resume from last played chapter position | **Must** | Nazeefa / Lamia | Sprint 3 | `listening_history` table | Cross-page test | Navigating away and returning restores exact playback position within ±1 second. |
| **REQ-12** | Audio Player | Tier-based playback speed control | **Must** | Nazeefa / Farhan | Sprint 3 | `tier_limits`, audio controller | Playback rate test | Free = 1.0x; Plus = up to 1.5x; Premium = up to 2.0x. Higher speeds locked with upgrade prompt. |
| **REQ-13** | Audio Player | Free tier seeking limitation | **Must** | Nazeefa / Farhan | Sprint 3 | Audio scrubber component | Slider scrub test | Free tier allows rewind, but restricts forward seeking to `currentTime + 15s`. |
| **REQ-14** | Audio Player | Sleep timer (Plus & Premium) | **Should** | Nazeefa / Farhan | Sprint 3 | Audio context timer | Timer countdown test | Sets timer for 15m/30m/end of chapter; audio pauses gently when timer expires; locked for Free. |
| **REQ-15** | Content Security | Server-enforced tier access & signed URLs | **Must** | Lamia / Farhan | Sprint 3 | `/api/audio/stream-url`, RLS | Security penetration test | Free user requesting non-preview chapter URL receives HTTP 403; private bucket unreadable. |
| **REQ-16** | Subscription | Subscription plan selection & checkout UI | **Must** | Zahin | Sprint 4 | `subscription_plans` table | UI flow test | User selects Plus/Premium (monthly/yearly); views pricing breakdown and checkout button. |
| **REQ-17** | Subscription | SSLCommerz sandbox payment initiation | **Must** | Farhan | Sprint 4 | SSLCommerz `gwprocess/v4` | Sandbox redirect test | Clicking pay initiates session and redirects to SSLCommerz test gateway with correct amount. |
| **REQ-18** | Subscription | IPN server-side validation & activation | **Must** | Farhan | Sprint 4 | `/api/payment/ipn`, validator | Webhook verification test | IPN validates `val_id` with gateway; updates `user_subscriptions` to active atomically. |
| **REQ-19** | Subscription | Duplicate IPN prevention (Idempotency) | **Must** | Farhan | Sprint 4 | Database transaction locks | Concurrency stress test | Sending duplicate IPNs for same `tran_id` processes once without double extension. |
| **REQ-20** | Subscription | Automatic plan expiry and downgrade | **Must** | Farhan | Sprint 4 | Expiry cron / check function | Scheduled job test | Upon reaching `expires_at`, user tier status downgrades to Free; locks premium chapters. |
| **REQ-21** | Personalization | Taste onboarding questionnaire | **Must** | Zahin / Lamia | Sprint 5 | `user_preferences` table | Onboarding flow test | New users select genres/authors; sets `onboarding_completed = true`; redirects to feed. |
| **REQ-22** | Personalization | Personalized "For You" recommendation feed | **Must** | Zahin / Nazeefa | Sprint 5 | Taste recommendation query | Feed relevance test | Feed prioritizes genres selected during onboarding and audiobooks with matching tags. |
| **REQ-23** | AI Story Finder | Natural language search in Bangla & Banglish | **Must** | Lamia / Farhan | Sprint 5 | Gemini 2.0 Flash + `pgvector` | RAG benchmark suite | Query "amar voyer golpo shunte mon chacche" returns relevant horror audiobooks in top 5. |
| **REQ-24** | AI Story Finder | Anti-hallucination guarantee | **Must** | Lamia / Farhan | Sprint 5 | SQL inner join / RPC | Catalog verification | 100% of recommended books exist in the database; LLM cannot recommend fictitious books. |
| **REQ-25** | AI Story Finder | Daily usage quota by tier | **Must** | Farhan | Sprint 5 | `consume_ai_quota` RPC | Rate-limit test | Free = 1/day, Plus = 10/day, Premium = 50/day. Blocked requests return HTTP 429 and cost $0. |
| **REQ-26** | AI Summaries | AI-generated chapter/book summaries | **Should** | Farhan | Sprint 5 | `/api/ai/summary`, Gemini | Monthly limit test | Generates 3-sentence summary; respects monthly quotas (Plus: 5/mo, Premium: 30/mo, Free: 0). |
| **REQ-27** | Personal Library | Saved items, bookmarks, and playlists | **Should** | Zahin / Lamia | Sprint 5 | `bookmarks`, `playlists` tables | User data test | User can bookmark exact timestamp with note; view bookmarks in Library screen. |
| **REQ-28** | Creator Follow | Follow podcasters/authors & notifications | **Should** | Lamia / Farhan | Sprint 5 | `user_follows`, `notifications` | Notification test | Following author sends notification when admin uploads a new book by that author. |
| **REQ-29** | Content Security | Cross-device playback progress sync | **Should** | Nazeefa / Lamia | Sprint 5 | `listening_history` DB sync | Multi-device test | Pausing on desktop at 14:20 and opening book on mobile immediately offers resume at 14:20. |
| **REQ-30** | Offline Listening | In-browser offline audio playback | **Should** | Nazeefa | Sprint 5 | IndexedDB audio cache | Browser offline mode | Downloaded chapter plays when device is offline; restricted by tier (Plus 1, Premium all). |
| **REQ-31** | Reviews & Ratings | Star ratings and listener text reviews | **Could** | Zahin / Lamia | Sprint 6 | `reviews` table & RLS | Review submission test | Listeners can rate 1-5 stars and write a review; average rating calculated automatically. |
| **REQ-32** | Advertising | House / placeholder ad slots for Free tier | **Should** | Zahin | Sprint 6 | Ad banner component | Tier visibility test | Banner ad displays for Free users; completely hidden for Plus and Premium users. |

---

## 3. High-Risk Requirements: Technical Feasibility & Alternatives

### 3.1 Offline Downloads on Web Browsers (REQ-30)
- **Original Proposal Expectation**: Proposal Section 6 lists *"Podcasts + audiobooks (chapter-wise) for Premium; 1 download for Plus"* within a web browser app.
- **Technical Barrier**:
  1. Browsers cannot save DRM-protected audio files to arbitrary file system locations.
  2. Downloading raw `.mp3` files via browser `<a>` tags exposes the unencrypted commercial audio files to instant piracy.
  3. iOS Safari enforces aggressive 50MB-100MB IndexedDB storage quotas and evicts cache data after 7 days of non-use.
- **Architectural Alternative**: Implement an **IndexedDB Audio Cache** managed via a Service Worker:
  - When a Premium user clicks "Save for Offline", the audio stream chunks are stored inside the browser's origin-private `IndexedDB`.
  - When the browser goes offline, the audio controller checks IndexedDB before attempting network fetch.
  - The raw audio file is never exposed as a downloadable link in the operating system.

### 3.2 "Unlimited" AI Story Finder for Premium (REQ-25)
- **Original Proposal Expectation**: Proposal Section 6.1 states *"Premium users have no limit"*.
- **Technical Barrier**: Unlimited external AI API access without a fair-use threshold creates extreme economic risk. If a malicious script or curious student loops 10,000 queries in a day, the team will incur substantial API charges or trigger immediate provider rate limits.
- **Architectural Alternative**: Implement a **Fair-Use Ceiling of 50 queries/day** for Premium:
  - Display `"UNLIMITED"` to the user under normal usage.
  - Enforce the 50 query/day ceiling silently in the backend `consume_ai_quota` function to prevent denial-of-wallet exploits.

### 3.3 Banglish Query Degradation (REQ-23)
- **Original Proposal Expectation**: Passing raw Banglish strings directly to embedding models.
- **Technical Barrier**: Standard vector embedding models (like OpenAI `text-embedding-3-small`) do not understand colloquial romanized Bengali spellings (e.g. *"voyer golpo"*, *"bhoyonkhor kahini"*, *"mon kharap er boi"*).
- **Architectural Alternative**: Mandate a **Pre-Embedding Normalization Step** using Gemini 2.0 Flash:
  - Prompt extracts normalized Bengali script (`ভৌতিক গল্প`) and English thematic terms (`horror mystery`), which are then converted to vector embeddings.

---

## 4. Scope Boundary: Future Work (Explicitly Scoped Out of MVP)

As agreed in Section 10 and Section 21 of the proposal, the following items are strictly classified as **Future Scope** and will not be implemented during the semester:

1. **Live (Production) Financial Transactions**: All payment processing is strictly confined to the SSLCommerz Sandbox test environment.
2. **Native Mobile Applications (iOS / Android)**: The project is strictly responsive web.
3. **Proprietary ML Model Training**: All AI capabilities leverage pre-trained embedding and LLM models via external APIs.
4. **Ebook / PDF Reader Engine**: The platform is strictly audio-first; text e-readers and document parsers are out of scope.
5. **Multi-User Family Plans & Creator Revenue Sharing**: Monetization is limited to single-user monthly and yearly consumer tiers.
