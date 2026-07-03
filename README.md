# 🦉 Ibis Physics — Project Reference

> **The single source of truth for this project.** Read this before touching any code.
> It explains **what Ibis Physics is, what the goal is, exactly what has been built, what is
> pending, how it is wired end‑to‑end, and how to run/ship it.** Keep it up to date — every
> feature, option and pending item should be reflected here so anyone (human or AI) can
> understand what the program is, where it stands, and where it's going.

---

## 1. What this project is

**Ibis Physics** is a production‑oriented, full‑stack **online physics learning platform**
for school students (JEE/NEET/board level). Students watch curated lessons, read notes,
take timed tests, track their progress and rank against peers; an admin (the teacher,
**Ganesh**) manages all content, tests, students and batches.

**Goal:** a polished, fully backend‑connected, production‑ready SaaS that runs on free
tiers — with a warm "paper & clay" editorial design language, real analytics, gamified
student progress, and **zero fake / frontend‑only features**.

**Core principles (enforced across the codebase):**
- Nothing is frontend‑only — every UI action is wired to the backend and DB.
- Vanilla CSS only (no Tailwind). Reuse the existing design language, colors and branding.
- Every action has loading / success / failure feedback (global toast system).
- No developer‑facing error strings shown to users — messages are translated to plain English.
- Layered, separated architecture (routes → controllers → services → repositories).

> ⚠️ **Note:** an older version of this README described a *frontend‑only, dark‑mode,
> KaTeX* prototype. That is obsolete. Ibis is now a **full‑stack** app, the theme is a
> **light "paper & clay"** editorial look, and **KaTeX/LaTeX has been fully removed**.

---

## 2. Live environment & infrastructure (all free tier)

| Piece | Service | URL / identifier |
|---|---|---|
| **Frontend** | Cloudflare Pages | https://ibis-frontend.pages.dev (project `ibis-frontend`) |
| **Backend API** | Render (Docker, `node:22-slim`, singapore) | https://ibis-backend-svno.onrender.com/api (service `srv-d92kmo8js32c73bgusn0`) |
| **DB / Auth / Realtime / Storage** | Supabase | project ref `bkyfkkujcohsnmidkaji` |
| **Cache** | Upstash Redis | via `UPSTASH_REDIS_REST_*` (toggle `CACHE_ENABLED`) |
| **File storage** | Supabase Storage | public bucket `content` (thumbnails + PDF notes) |
| **Email** | nodemailer (SMTP) | optional; activates when `SMTP_*` env is set |
| **Repo** | GitHub | `github.com/Kaviselvaram/ibis-ready-test` (branch `main`) |

**Free‑tier caveats (never auto‑upgrade — the owner upgrades manually):**
- Render free plan sleeps after ~15 min idle → first request cold‑starts in ~30–50s.
- Supabase free pauses after ~7 idle days and has no automated backups.
- Render was created via API with **no auto‑deploy webhook** → backend deploys must be
  **triggered manually** (see §12).

**Cost at ~500 monthly active users:** ~**$32/mo** (Supabase Pro $25 + Render Starter $7;
everything else stays free because video is offloaded to YouTube and reads are cached).

---

## 3. Tech stack

**Frontend:** React **19**, Vite **8**, React Router **7**, vanilla CSS, `framer-motion`,
`lucide-react`, OGL/WebGL for shader effects, `@supabase/supabase-js` (browser, anon key —
used for realtime + direct Storage uploads via signed URLs). Typography: **Fraunces**
(display) + **Manrope/Plus Jakarta** (body).

**Backend:** Node **22**, Express **5**, `@supabase/supabase-js` (service role — bypasses
RLS), `zod` (validation), `bcrypt`, `nodemailer`, custom JWT (access + rotating refresh),
Upstash Redis cache.

**Shared:** `/shared/contracts/v1/**` — zod DTOs/enums shared by frontend and backend.

---

## 4. Repository layout

```
/backend
  server.js                      # Express bootstrap, CORS, middleware
  src/
    routes/         *.routes.js   # HTTP routing + zod schemas + auth/roles/rate-limit
    controllers/    *.js          # thin request handlers
    services/       *.js          # business logic
    repositories/   *.js          # all Supabase/DB access (service role)
    middleware/     rbac.js …
    utils/          jwt, cache, mailer, logger, routeBuilder …
    config/         supabase, env, redis
  Dockerfile                      # node:22-slim, installs deps at /app so shared/ resolves
/frontend
  src/
    main.jsx                      # routes + provider tree (Toast→Auth→UI→Admin→Access→Course)
    api/            ApiClient.js, AuthClient.js   # fetch wrapper, single-flight refresh
    repositories/   *.js          # frontend data layer (calls the API)
    hooks/          use*Controller.js
    contexts/       Auth, UI, Admin, Course, Access, Toast
    components/
      admin/        AdminLayout, AdminContent*, TestManager*, AdminStudents, AdminBatches* …
      student/      StudentPortal, ChapterView, ProgressDashboard …
      test/         TestCenter, StudentTest (TestRunner/TestReport), PracticeBuilder …
      common/       Landing, HomeSession, WhyIbisView, Checkout, LegalInfoPage …
      ui/           LegacyUI (Brand/Button/GlassButton/Pill), shared components
    styles/         variables.css, global.css, components.css, admin.css
    utils/          youtube.js, csv.js, upload.js, token.js
/shared/contracts/v1             # zod DTOs shared FE+BE
.env.local                       # ALL secrets (gitignored, repo root; Vite envDir:'..')
deploy.env                       # deploy tokens (gitignored)
```

---

## 5. Data model (Supabase `public` schema)

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | one row per user | `id`(=auth uid), `email`, `full_name`, `is_admin`, `batch_id`→batches, `phone`, `school`, `grade`, `created_at` |
| `chapters` | course chapters | `title`, `order_index`, `is_published`, `is_free`, `image_url` (uploaded thumbnail), `description` |
| `topics` | topics in a chapter | `chapter_id`→chapters, `title`, `order_index`, `is_free` |
| `youtubes` | lesson videos | `topic_id`→topics, `youtube_video_id` (bare 11‑char id only), `title` |
| `media` | topic PDF/notes/examples | `topic_id`, `media_type`, `r2_object_key` (holds the Storage public URL) |
| `questions` | question bank prompts | `topic_id`, `prompt`, `options`, `difficulty_level`, `bloom_level`, `question_type`, `source` |
| `sealed_answers` | correct answers (kept apart from questions) | `question_id`, `correct_option_id` |
| `tests` | admin‑published "live" tests | `title`, `test_type`(half_chapter/full_chapter/combined/full_syllabus), `chapter_ids uuid[]`, `is_live`, `question_count`, `duration_minutes` |
| `test_attempts` | every submitted attempt (practice + live) | `profile_id`, `test_id`, `title`, `test_type`, `score`, `total/correct/wrong/skipped`, `time_taken_seconds`, `report jsonb`, `completed_at` |
| `subscriptions` | paid access | `profile_id`, `status`, `valid_until` |
| `batches` | school batches | `code`, `name`, `school`, `status` |
| `activity_events` | real engagement log (content views etc.) powering admin analytics | `profile_id`, `event_type` (e.g. `note_view`/`video_watch`), `chapter_id`, `topic_id`, `metadata jsonb`, `created_at` |
| `audit_log`, `security_events`, `deletion_log`, `processed_events`, `payment_history`, `test_results` | audit / security / payment / webhook‑idempotency scaffolding (mostly unused today) | |

RLS is enabled on all tables; **the backend uses the service role and bypasses RLS** — the
API layer (auth + roles) is what actually protects data. `SECURITY DEFINER` functions
(`process_payment`, `update_user_password_hash`, `get_user_hash_cost`, `handle_new_user`)
are locked down from anon/authenticated.

---

## 6. API surface (all under `/api`)

**Auth** (`/auth`): `POST /login`, `POST /signup` (creates auth user + profile and logs in,
setting the rotating refresh cookie), `POST /refresh`, `POST /logout`.
**User** (`/user`): `GET /me`, `DELETE /delete`.
**Content** (`/content`): `GET /pricing`, `POST /upload-url` (admin — signed Supabase Storage
upload URL for thumbnails/notes), `ALL /media`, `ALL /video`.
**Course** (`/course`): `GET /chapters` (full tree), `GET /study-data`; admin CRUD:
`POST/PATCH/DELETE /chapters`, `PATCH /chapters/reorder`, `POST/PATCH/DELETE /topics`,
`PATCH /topics/reorder`, `POST/PATCH/DELETE /videos`, `POST /notes`, `DELETE /notes/:id`.
**Analytics** (`/analytics`): `GET /` (admin — backend‑aggregated dashboard, `?force=true`
bypasses a short cache), `POST /event` (any auth — engagement logging → `activity_events`).
**Question bank** (`/question`): `GET /` (admin), `POST /` (admin, replace bank).
**Tests** (`/test`): student practice engine — `GET /scope` (chapters→topics with counts,
no answers), `POST /generate` (single/multi chapter, single/multi topic, or full‑syllabus),
`POST /evaluate` (grades + persists attempt); live tests — `GET /available`, `POST /start/:id`;
history — `GET /history`, `GET /result/:id`; admin — `GET/POST/PATCH/DELETE /manage`.
**Students** (`/student`): `GET /leaderboard` (batch‑scoped when the student is in a batch),
`GET /progress` (progress dashboard aggregation); admin — `GET /`, `POST /`, `POST /bulk`
(create accounts + optional emailed credentials), `DELETE /:id`.
**Batches** (`/batch`): student — `POST /join` (by code), `GET /mine`; admin — `GET /`,
`POST /`, `GET /:id/analytics` (on‑demand), `DELETE /:id`.
**Health** (`/health`): `GET /`, `GET /live`, `GET /ready`.

Route policy is declared per‑route in `*.routes.js` via `withHandler`/`admin` wrappers
(`requireAuth`, `roles: ['admin'|'student']`, `rateLimit`).

---

## 7. Frontend routes

**Public:** `/` (landing), `/signup`, `/login`, `/why-ibis` (teacher/Ganesh page),
`/checkout`, `/legal/:page`.
**Student (auth):** `/student` (portal), `/chapter` (chapter view: videos/notes/test tabs),
`/test-center` (live tests + "build your own" practice), `/progress` (progress dashboard),
`/test-history`, `/test-result/:id`.
**Admin (auth + role=admin, all lazy‑loaded):** `/admin` (dashboard), `/admin/content` →
`/:chapterId` → `/:chapterId/:topicId` (content drill‑down), `/admin/tests` `/tests/new`
`/tests/bank`, `/admin/students`, `/admin/batches` `/batches/:id`, `/admin/settings`.

---

## 8. Auth & security model

- **JWT access token** (in memory) + **httpOnly rotating refresh cookie**. Cross‑domain
  (Pages↔Render) so the cookie is `SameSite=None; Secure` (`COOKIE_CROSS_SITE=true`).
- **Single‑flight refresh** (`ApiClient.js`): concurrent 401s share ONE `/auth/refresh`
  call — prevents a refresh "storm" that used to trip the 20/min rate‑limit and, because
  the refresh token rotates, collapse the session. Resync is throttled to ≤1/20s.
- JWT carries `role` (`admin`/`student`) and `plan` (`pro`/`free`); admin routes are
  guarded by `roles:['admin']`. Access tier is re‑derived on focus/interval so DB plan
  changes reflect without re‑login.
- CORS allows the main Pages domain **and any `*.ibis-frontend.pages.dev`** preview deploy.
- Passwords via Supabase Auth (+ a fire‑and‑forget bcrypt rehash edge function). Payment
  (`RAZORPAY_*`) and TOTP scaffolding exist but payments are currently **"Coming soon"**.

**Test credentials:** `testadmin@ibis.com` / `teststudent@ibis.com` — password `password123`.
**The one free chapter:** *Moving Charges and Magnetism* (`chapters.is_free=true`); all
other chapters are premium → trial users are redirected to `/checkout`.

---

## 9. Features implemented (chronological — see `git log`)

- **Foundation:** real Supabase data (no fabricated fallbacks), admin CRUD, Redis caching
  (course tree, question bank, leaderboard), Docker/Render + Cloudflare deploy, security
  hardening & RLS advisors clean.
- **Signup reliability:** 30/60s client timeouts for cold starts; removed a redundant
  second login; surface real server errors; CORS fix for preview URLs; single‑flight refresh.
- **Phase A – Access control:** 1 free chapter + live tier sync (focus/interval resync).
- **Phase B – Admin shell:** universal **top‑nav** layout (logo chip in corner, account
  menu), full‑width workspace, correct internal scrolling; Batch Management in nav.
- **Phase C – Content drill‑down:** `/admin/content` (chapter tiles) → topics → **spacious
  topic editor** with Free/Premium/Published toggles.
- **Phase D – Tests/Students/Settings:** Students roster with filter tabs
  (All/Paid/Trial/Pending), search, pagination (scales to thousands), real deletion
  (removes auth user); Tests list + "New test" modal; real Settings panel.
- **Phase E – Video UX:** paste a YouTube link → auto‑detect + thumbnail + privacy‑enhanced
  (`youtube-nocookie`) preview; only the bare video id is stored.
- **Phase F – Onboarding & home:** bulk student CSV upload (creates real auth accounts +
  temp passwords, downloadable credentials CSV, optional emailed creds); batch create/
  delete/pause; home page mentor section.
- **Admin UX pass:** fixed a critical scroll bug (workspace was a `<main>` caught by a global
  `overflow:hidden !important`); split Tests into routed pages (list / create / question
  bank); **custom batch code** on creation; **on‑demand batch analytics** page with a
  **batch‑scoped ranking**; logo on a gradient chip so the white wordmark is legible.
- **Global feedback:** toast system (`ToastContext`) wired into content/tests/students/
  batches/uploads/auth — loading→success/failure with friendly messages.
- **Video workflow (fully persisted):** URL + title entered together, both saved; inline
  title edits persist via `PATCH /course/videos/:id`; add/edit/delete reflect on the
  student side immediately.
- **Batch join (student):** `POST /batch/join` links by code; connected‑batch chip shows in
  the portal; batch‑scoped leaderboard refreshes.
- **Chapter thumbnails:** Supabase Storage `content` bucket + signed‑upload endpoint;
  upload on create, per‑tile replace/remove; shown on student chapter tiles.
- **Student practice tests:** "Build your own test" in the Test Center — **Full Mock**,
  **By Chapter** (single/multi), **By Topic** (single/multi) — drawn from the admin JSON
  bank; reliable submission (runner awaits save, retries once, never loses answers, routes
  to the persisted result, always lands in **My History**).
- **Student progress dashboard** (`/progress`): level/XP, daily streak, per‑chapter
  coverage + mastery, Bloom's‑levels + difficulty analysis, recent‑scores trend, badges —
  all aggregated from real `test_attempts` via `GET /student/progress`.
- **Landing/teacher:** replaced the confusing rocker switch with clean text entries; the
  `/why-ibis` page is the real mentor (Ganesh) story.

---

## 10. Pending / planned work

**Uncommitted on disk (built & verified locally, awaiting "push it"):**
- 429 single‑flight refresh fix + throttled resync.
- Student **Progress Dashboard** (backend `GET /student/progress` + `/progress` UI).

**UI/UX + analytics overhaul — BUILT (verified locally, awaiting "push it"):**
1. ✅ **Admin Notes management rebuild** — real PDF upload to Supabase Storage via
   `uploadFile()` → persisted through new `POST/DELETE /course/notes` endpoints
   (`media_type='note'`); animated idle→uploading→success/error queue with friendly
   fallbacks; **instant student sync** via course‑tree cache invalidation.
2. ✅ **Student Notes reading experience** — new `PdfReader` (lazy‑loaded `pdfjs-dist`) with
   **single‑page / double‑page (spread)** toggle, page nav + keyboard, zoom, fullscreen,
   download, skeletons and a graceful failure fallback.
3. ✅ **Admin dashboard → real SaaS analytics** — `GET /analytics` (admin) aggregates real
   data (+ `activity_events`); KPI grid, custom animated SVG charts (area/bar/donut/rank),
   **manual Refresh button** (no auto‑refetch). Engagement logged via `POST /analytics/event`
   from student note/video views.
4. ✅ **Question Bank redesign** — same wiring (`updateQuestionBank`→`POST /question`);
   sticky toolbar (search + chapter/difficulty filters + collapsible importer) and a
   chapter‑grouped, internally‑scrolling list → no unbounded page scroll.
5. ✅ **Student portal redesign** — animated side rail; **reused components untouched**
   (Chapter Card, Open/Select button, Nav button, Glass button, Thumbnail via
   `StudentChapterShowcase`).
6. ✅ **Ranking system** — `RankStack`: gamification‑badges card sits *behind* the rank card
   (peeks on hover/tap); tiers derived from real streak/badges/rank.
7. ✅ **Calendar** — always‑on animated beam, flickering streak flame, per‑day "done"/streak
   glow, today pulse, and a notification pip nudging today's streak.
8. ✅ **Landing/teacher** — entry button renamed **"Yibis"** (→ `/why-ibis`); teacher page
   photo removed, all content kept, restyled full‑width around Yibis branding.
9. **Bulk‑upload emails** (still pending) — set `SMTP_HOST/PORT/USER/PASS/FROM` on Render to
   actually send credential emails (until then accounts still create and creds download as CSV).

New backend surface added by this overhaul: `course` — `POST /notes`, `DELETE /notes/:id`;
`analytics` — `GET /` (admin, `?force=true` bypasses a 30s cache), `POST /event` (auth).
New frontend dep: `pdfjs-dist` (lazy‑loaded only on the Notes tab).

**Known limitations / not yet built:** payments (Razorpay stubbed → "Coming soon"); the
`media` "worked examples" type isn't wired. **Content‑consumption events now exist**
(`activity_events` records note/video opens, surfaced in admin analytics), but per‑student
"chapter progress" is still derived from **test coverage**, not these views.

---

## 11. Local development

Secrets live in the **repo‑root `.env.local`** (gitignored). Vite reads it via
`envDir:'..'` in `frontend/vite.config.js` — **without this, Supabase realtime/uploads
silently break.**

```bash
# 1) Backend (port 4000) — reads ../.env.local
cd backend && node server.js

# 2) Frontend dev server (port 3005) — proxies /api → localhost:4000
cd frontend && npm run dev -- --port 3005
```

**To point the frontend at the LOCAL backend**, comment out `VITE_API_URL` in `.env.local`
(the dev proxy + dev‑mode CORS then use localhost). **Uncomment it before a production
build/deploy** — prod needs `VITE_API_URL=https://ibis-backend-svno.onrender.com/api`.
The frontend also needs `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` for realtime + uploads.

The app is **landscape‑first** (a "Rotate device" gate appears in portrait). Always run
`npm run build` (frontend) before shipping — it must compile with zero errors.

---

## 12. Deploy process

```bash
# from repo root, VITE_API_URL uncommented (prod), with deploy.env loaded:
set -a; . ./deploy.env; set +a

cd frontend && npm run build
git add -A && git commit -m "..."           # end message: Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
git push "https://Kaviselvaram:${GITHUB_TOKEN}@github.com/Kaviselvaram/ibis-ready-test.git" HEAD:main

# Frontend → Cloudflare Pages:
cd frontend && CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
  npx wrangler@latest pages deploy dist --project-name=ibis-frontend --branch=main --commit-dirty=true

# Backend → Render (MANUAL — no auto-deploy webhook):
curl -s -X POST -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" \
  https://api.render.com/v1/services/srv-d92kmo8js32c73bgusn0/deploys -d '{}'
# then poll GET /v1/services/{srv}/deploys/{id} until status="live"
```

Always test on the **stable** URL: **https://ibis-frontend.pages.dev** (the per‑deploy
`<hash>.ibis-frontend.pages.dev` links are immutable snapshots).

`deploy.env` (gitignored) holds: `GITHUB_TOKEN`, `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`, `RENDER_API_KEY`, `GITHUB_REPO_URL`.
⚠️ Rotate any tokens that were ever pasted into chat.

---

## 13. Environment variables (names only — values in `.env.local` / host dashboards)

**Backend/runtime:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`JWT_SECRET`, `INTERNAL_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, `CACHE_ENABLED`, `FRONTEND_ORIGIN`, `COOKIE_CROSS_SITE`,
`NODE_ENV`, `PORT`, `ADMIN_SECURITY_EMAIL`, `TOTP_MASTER_KEY`, `RAZORPAY_KEY_ID`,
`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`,
`SMTP_HOST/PORT/USER/PASS/FROM/SECURE` (optional — enables bulk‑upload emails).
**Frontend (Vite):** `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

---

## 14. Conventions, design contracts & gotchas (read before editing)

**Styling / layout**
- **Vanilla CSS only.** No Tailwind/utility libs; leftover Tailwind class names are dead and
  can cause layout bugs. Global styles: `variables.css` (theme tokens: `--paper*`, `--ink`,
  `--clay*`, `--line*`, `--display`, `--body`), `global.css`, `components.css`, `admin.css`.
- **Never overflow the viewport.** Confine scroll to the screen wrapper (`height:100%` +
  an internal `overflow-y:auto` pane). No congestion, overlap, or dead scrolling. Resizing
  to tablet/mobile must stack cleanly. Use `clamp()` + relative units for fluid type/spacing.
- The admin scroll container must be a `<div>`, **not** `<main>` — a global
  `main{overflow:hidden!important}` rule will otherwise clip it.
- **Glass/contrast:** don't put plain white transparency over the warm clay/terracotta
  gradients (low contrast) — use explicit RGBA/HSL for borders, fills and sheens.
- Avoid generic AI clichés (e.g. `Zap` for premium/checkout) — prefer academic/physics motifs.

**Wiring / data**
- Every mutation shows a toast (`useToast()`); surface real errors via `friendlyMessage(err)`.
- Frontend `data` shape uses `name`/`isFree`/`isPublished`/`imageUrl`; DB uses
  `title`/`is_free`/`is_published`/`image_url` (mapped in `CourseService`).
- Admin bundles are `React.lazy` code‑split — **students never download admin code**; keep it
  that way (don't statically import admin modules from student paths).
- For file uploads use `utils/upload.js` (signed URL → direct Supabase Storage upload) — the
  backend JSON body limit is 10kb, so never base64 large files through it.
- Node 22 is required (Supabase realtime needs native WebSocket). Keep comments, animation
  timeline indexes and state bindings intact when editing; make targeted replacements.

---

_Last updated: 2026‑07‑03. Owner: Kaviselvaram (teacher: Ganesh). This file is the canonical
project reference — keep every feature, option and pending item reflected here._
