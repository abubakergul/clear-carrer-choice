# Current Feature: Exploration System

## Status

In Progress

## Goals

- ✅ Users can view their active exploration on the dashboard (only one active at a time)
- ✅ Users can complete an exploration → reflection screen collects signals, energy/curiosity/intimidation (1–5), notes
- ✅ Reflection submission marks COMPLETED → next exploration generated in background, page auto-refreshes
- ✅ Users can skip with a lightweight reason via modal overlay (not inline, no scroll jump)
- ✅ Skip redirects instantly → next exploration generated in background after landing on dashboard
- ✅ Explorations expire after 48h, marked on dashboard load, shown as non-failure in timeline
- ✅ Exploration history shown as vertical timeline on dashboard
- ✅ `/dashboard/pattern` page — proper My Pattern page inside dashboard shell (directions, tensions, summary, exploration signal recap)
- ✅ Sidebar nav: Home → `/dashboard`, My Pattern → `/dashboard/pattern` (both within dashboard layout, no layout switch)
- ✅ Consecutive skip detection: 2 skips → prompt hint to vary format; 3+ skips → CRITICAL override (no video, VERY_LIGHT, under 5 min)
- ✅ Prompts explicitly forbid YouTube-first explorations; give AI 7 mobile-friendly alternatives (Reddit posts, LinkedIn, job descriptions, thought experiments, portfolios, etc.)
- ⬜ Completed exploration detail — clicking a past COMPLETED exploration should show the reflection that was submitted (signals, scores, notes). Currently detail page only says "You reflected on this one." with no data shown.
- ⬜ Reflection view on `/dashboard/pattern` only shows 3 most recent — no way to see older ones
- ⬜ `ExplorationGenerator` triggers on every dashboard load when no active exploration — needs a guard so it doesn't fire if generation is already in progress (race condition if user opens two tabs)

## Notes

### Architecture

- **Skip/complete are now instant**: actions only do DB update + `redirect("/dashboard")`. No OpenAI call blocking.
- **Generation is client-side triggered**: `src/components/dashboard/ExplorationGenerator.tsx` — renders when `!activeExploration`, calls `triggerNextExploration()` server action, then `router.refresh()`.
- **`triggerNextExploration()`** in `src/actions/exploration.ts` — exported server action, calls `auth()` internally, safe to call from client.
- **`runGeneration(userId)`** — private function with full OpenAI logic, consecutive-skip detection, prompt building.

### Key files

- `src/actions/exploration.ts` — all exploration server actions
- `src/lib/prompts/next-exploration.ts` — next exploration prompt (has `{skipWarning}` placeholder)
- `src/lib/prompts/first-exploration.ts` — first exploration prompt (mobile-first, 7 format alternatives)
- `src/lib/exploration.ts` — `SKIP_REASONS` constant (not in "use server" file, importable by client)
- `src/app/dashboard/page.tsx` — dashboard with active card + timeline + ExplorationGenerator
- `src/app/dashboard/pattern/page.tsx` — My Pattern page with insight + exploration signal recap
- `src/app/dashboard/explore/[id]/page.tsx` — exploration detail with SkipDialog
- `src/app/dashboard/explore/[id]/reflect/page.tsx` — reflection page (server)
- `src/components/dashboard/ReflectionForm.tsx` — reflection form (client, signal chips + 1–5 scales)
- `src/components/dashboard/SkipDialog.tsx` — skip modal (client, fixed overlay)
- `src/components/dashboard/ExplorationGenerator.tsx` — background generation trigger (client)
- `src/components/dashboard/SidebarNav.tsx` — sidebar nav with active state matching
- `src/app/api/dev/seed-me/route.ts` — POST endpoint to seed demo data for current user (dev only)

### Dev seeding

To see the dashboard with real data, run in browser console while logged in:

```js
fetch('/api/dev/seed-me', { method: 'POST' }).then(r => r.json()).then(console.log)
```

This creates a FitInsight + 4 explorations (2 completed with reflections, 1 skipped, 1 active) for the currently logged-in user.

### Known issues / remaining work

1. **Reflection detail view**: `src/app/dashboard/explore/[id]/page.tsx` — completed explorations show "You reflected on this one. Great." but don't fetch or display the actual reflection data. Need to query `prisma.reflection.findFirst({ where: { explorationId } })` and show signals/scores/notes.
2. **Race condition in ExplorationGenerator**: if the user navigates away and back quickly, `triggerNextExploration` could be called twice. The server-side guard (`if (existing) return`) prevents duplicate explorations, but two simultaneous OpenAI calls could run. Low priority for now.
3. **Expiry on dashboard load only**: explorations expire only when the user visits the dashboard. No background cron. Fine for now but worth noting.

### Branch

`feature/exploration-system`

## History

<!-- Keep this updated. Earliest to latest -->

- **Landing Page** — Route `/`, public. Headline: "You don't need to choose a career. You need to stop guessing." Black CTA "Try it now →" → `/chat`. Background `#FAFAF9`. Files: `src/app/page.tsx`, `src/app/globals.css`.

- **AI Conversation** — Full streaming chat at `/chat`. Education stage selector (school/college/graduating/graduated) as pre-conversation step. Stage-aware opening message and system prompt. 7-area conversation arc with dream path question by message 3. Quality-gated signup wall (pattern vs continue variants) with smart quote normalization. Mid-conversation chips (motivation, resources, fear, experience, yes/no, scale). 3-segment circular SVG progress ring. Session persistence (fresh visits clean, back/reload restores). Ethical career guidance in prompt. Safety ceiling at 12 messages. Files: `src/components/chat/ChatInterface.tsx`, `src/components/chat/SignupWall.tsx`, `src/app/api/chat/route.ts`, `src/lib/prompts/conversation.ts`.

- **Prisma + Neon PostgreSQL Setup** — Prisma 7 installed with Neon PostgreSQL (serverless). Schema defines `User`, `Conversation`, `Message`, `FitInsight`, `TaskEntry` plus NextAuth models (`Account`, `Session`, `VerificationToken`) with cascade deletes and indexes. `prisma.config.ts` at root loads `DIRECT_URL` from `.env.local` for CLI operations; runtime uses pooler `DATABASE_URL` via `PrismaNeon` adapter. Client generated to `src/generated/prisma` (gitignored) via `postinstall` script. Initial migration `20260509065700_init` applied to Neon dev branch. Files: `prisma/schema.prisma`, `prisma.config.ts`, `src/lib/db.ts`.

- **Seed Data** — Idempotent seed script at `prisma/seed.ts`, run via `npx prisma db seed`. Upserts demo user (`demo@mindframe.ai`), deletes and recreates 5 conversations (Career Alignment, Focus & Productivity, Burnout Prevention, Weekly Reflection, Planning & Execution) with 57 total messages, 1 `FitInsight` with 6 strengths and 5 conflicts, and 27 `TaskEntry` rows with randomized timestamps and ~75% completion rate. Seed command wired into `prisma.config.ts` via `migrations.seed` (Prisma 7 config). Import path uses `../src/generated/prisma/client` (explicit file, not directory). Files: `prisma/seed.ts`, `prisma.config.ts`.

- **Auth Setup - NextAuth + Google OAuth** — NextAuth v5 (`next-auth@beta`) installed with `@auth/prisma-adapter`. Split config: `src/auth.config.ts` (edge-compatible, Google provider) + `src/auth.ts` (PrismaAdapter, JWT strategy, session callback adding `user.id`). Route handler at `src/app/api/auth/[...nextauth]/route.ts`. Proxy at `src/proxy.ts` (named export, Node.js runtime) protects `/dashboard/*` and redirects unauthenticated users to sign-in with callbackUrl. Session type extended with `user.id` in `src/types/next-auth.d.ts`. Minimal dashboard placeholder at `src/app/dashboard/page.tsx`. Fixed pre-existing `src/lib/db.ts` import (`@/generated/prisma` → `@/generated/prisma/client`). Env vars: `AUTH_SECRET`, `CLIENT_ID`, `CLIENT_SECRET` (Google OAuth). Google Console requires `http://localhost:3000/api/auth/callback/google` as authorized redirect URI.

- **Auth Credentials - Email/Password Provider** — Added `password String?` to `User` model (migration `20260510020057_add_password_to_user`). Credentials placeholder (`authorize: () => null`) added to `src/auth.config.ts` for edge compatibility. `src/auth.ts` overrides with full bcrypt validation, filtering the placeholder from the spread to avoid duplicate provider. `src/proxy.ts` fixed to use `NextAuth(authConfig)` directly (not `@/auth`) to prevent `bcryptjs` from loading on the Edge runtime. `POST /api/auth/register` validates inputs, checks for existing user, hashes with bcrypt (cost 12), creates user. Files: `src/auth.config.ts`, `src/auth.ts`, `src/proxy.ts`, `src/app/api/auth/register/route.ts`, `prisma/schema.prisma`.

- **Auth UI - Sign In, Register & Sign Out** — Custom `/sign-in` page (email/password + Google, controlled inputs). Custom `/register` page with client-side validation and `confirmPassword` in body. `(auth)` route group with server-side session guard (redirects to `/dashboard` if already signed in). Dashboard layout with fixed sidebar: branding, nav slot, user section at bottom. `UserMenu`: opens on hover with 120 ms close delay, chevron indicator, red "Sign out" with icon, "View profile" link. `UserAvatar`: Google image or initials fallback (violet background). `Toast`: auto-dismiss (3 s), success/error/info variants. `auth.config.ts` updated with `pages.signIn` and `allowDangerousEmailAccountLinking`. `proxy.ts` redirect updated to `/sign-in`. `SignupWall` links fixed to `/register` and `/sign-in`. Landing page (`/`) and `/chat` redirect logged-in users to `/dashboard`. `next.config.ts` adds `lh3.googleusercontent.com` for Google avatars. Files: `src/actions/auth.ts`, `src/app/(auth)/`, `src/app/dashboard/layout.tsx`, `src/components/dashboard/UserMenu.tsx`, `src/components/dashboard/WelcomeToast.tsx`, `src/components/ui/Toast.tsx`, `src/components/ui/UserAvatar.tsx`, `src/auth.config.ts`, `src/proxy.ts`, `src/components/chat/SignupWall.tsx`, `src/app/page.tsx`, `src/app/chat/page.tsx`, `next.config.ts`.

- **Data Architecture** — Prisma schema migrated to new data model. `TaskEntry` removed; replaced by `Exploration` (title, prompt, status `active|completed|skipped|expired`, optional `aiInterpretation`, expiry/completion/skip timestamps) and `Reflection` (structured `selectedSignals String[]`). `FitInsight` updated: `strengths`→`directions`, `conflicts`→`tensions`, added `version Int @default(1)`. `Conversation` gains `educationStage String?`. `User` relation updated from `experiments` to `explorations`. Schema pushed to Neon dev via `prisma db push --accept-data-loss`. Prisma client regenerated. Seed updated with 4 demo explorations (3 completed with reflections, 1 active) and revised `FitInsight` with directions/tensions. Note: no migration file created — run `npx prisma migrate dev --name data_architecture` from an interactive terminal before deploying to production. Files: `prisma/schema.prisma`, `prisma/seed.ts`, `context/Data Architecture.md`.

- **Guest Session Persistence + Initial Insight Generation** — Every guest conversation is persisted to the DB in real time. `POST /api/chat/session` creates a `Conversation` record on first user message (keyed by `ccc_session_id` in sessionStorage). `saveMessages()` server action persists user+assistant pairs after each stream. After auth, `claimAndGenerate()` claims the conversation (sets `userId`), generates a `FitInsight` and first `Exploration` via OpenAI, then redirects to `/result`. Google OAuth lands on `/dashboard` where `ClaimRedirector` bounces to `/claim`; credentials sign-in goes directly to `/claim`. `/result` shows summary, directions, tensions, and first exploration CTA. Chat page now allows logged-in users without insight to access `/chat`. Bug fixed: `PATTERN_TRIGGER`/`CONTINUE_TRIGGER` did not match the actual AI prompt output — signup wall would never trigger. Removed unnecessary `signOut`-before-`signIn` from Google button (superseded by `allowDangerousEmailAccountLinking`). Files: `src/actions/conversation.ts`, `src/app/api/chat/session/route.ts`, `src/app/claim/page.tsx`, `src/app/result/page.tsx`, `src/components/dashboard/ClaimRedirector.tsx`, `src/lib/prompts/insight.ts`, `src/lib/prompts/first-exploration.ts`, `src/components/chat/ChatInterface.tsx`, `src/app/chat/page.tsx`, `src/app/dashboard/layout.tsx`, `src/actions/auth.ts`, `src/app/(auth)/sign-in/page.tsx`.

- **Result Page Redesign** — `/result` redesigned to feel like a personal reveal, not a report card. Hero has an overlapping-rings SVG (pattern symbol) with staggered `anim-fade-up` animations per section. Summary shown in a violet quote card. Directions use short 3–5 word AI-generated labels with expandable "why it fits" text via new `DirectionCard` client component (CSS grid animation). First exploration card shows title + static teaser only — no prompt dump. `FitInsight` schema gains `directionsWhy String[]` (db pushed, client regenerated). `claimAndGenerate` made retry-safe (finds already-claimed conversations for the same user), `fitInsight.create` wrapped in try/catch, return type changed to typed `{ to: string }` redirect. Existing-insight users routed to `/result` instead of `/dashboard`. Session ID only cleared on definitive outcomes. Files: `src/app/result/page.tsx`, `src/components/result/DirectionCard.tsx`, `src/lib/prompts/insight.ts`, `src/actions/conversation.ts`, `src/app/claim/page.tsx`, `prisma/schema.prisma`.

- **Exploration System + Data Architecture Revision** — Prisma schema upgraded with 4 enums (`ExplorationStatus`, `ExplorationType`, `ExplorationIntensity`, `ReflectionSource`). `Exploration` model gains `type`, `intensity`, `generationContext` (Json), `skipReason`, `systemObservations`; drops `aiInterpretation`. `Reflection` model gains `source`, `emotionalState`, `energyLevel`, `curiosityLevel`, `intimidationLevel`, `notes`. `FitInsight` drops `directionsWhy`. `claimAndGenerate` updated: produces typed enum values, 48 h expiry, one-active-exploration guard, AI now returns `type`/`intensity`/`generationContext`. `first-exploration.ts` prompt updated to return full metadata. `insight.ts` prompt cleaned (no `directionsWhy`). Result page and `DirectionCard` simplified. Stale migration history replaced with single baseline migration `20260101000000_initial_schema` (marked applied); `prisma migrate status` is clean. Seed updated to use enum values with reflection `source`/`emotionalState`/signal levels. Files: `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/20260101000000_initial_schema/migration.sql`, `src/actions/conversation.ts`, `src/lib/prompts/insight.ts`, `src/lib/prompts/first-exploration.ts`, `src/app/result/page.tsx`, `src/components/result/DirectionCard.tsx`.
