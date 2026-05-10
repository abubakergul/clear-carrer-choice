# Current Feature

## Status

<!-- Not Started | In Progress | Completed -->

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details -->

## History

<!-- Keep this updated. Earliest to latest -->

- **Landing Page** — Route `/`, public. Headline: "You don't need to choose a career. You need to stop guessing." Black CTA "Try it now →" → `/chat`. Background `#FAFAF9`. Files: `src/app/page.tsx`, `src/app/globals.css`.

- **AI Conversation** — Full streaming chat at `/chat`. Education stage selector (school/college/graduating/graduated) as pre-conversation step. Stage-aware opening message and system prompt. 7-area conversation arc with dream path question by message 3. Quality-gated signup wall (pattern vs continue variants) with smart quote normalization. Mid-conversation chips (motivation, resources, fear, experience, yes/no, scale). 3-segment circular SVG progress ring. Session persistence (fresh visits clean, back/reload restores). Ethical career guidance in prompt. Safety ceiling at 12 messages. Files: `src/components/chat/ChatInterface.tsx`, `src/components/chat/SignupWall.tsx`, `src/app/api/chat/route.ts`, `src/lib/prompts/conversation.ts`.

- **Prisma + Neon PostgreSQL Setup** — Prisma 7 installed with Neon PostgreSQL (serverless). Schema defines `User`, `Conversation`, `Message`, `FitInsight`, `TaskEntry` plus NextAuth models (`Account`, `Session`, `VerificationToken`) with cascade deletes and indexes. `prisma.config.ts` at root loads `DIRECT_URL` from `.env.local` for CLI operations; runtime uses pooler `DATABASE_URL` via `PrismaNeon` adapter. Client generated to `src/generated/prisma` (gitignored) via `postinstall` script. Initial migration `20260509065700_init` applied to Neon dev branch. Files: `prisma/schema.prisma`, `prisma.config.ts`, `src/lib/db.ts`.

- **Seed Data** — Idempotent seed script at `prisma/seed.ts`, run via `npx prisma db seed`. Upserts demo user (`demo@mindframe.ai`), deletes and recreates 5 conversations (Career Alignment, Focus & Productivity, Burnout Prevention, Weekly Reflection, Planning & Execution) with 57 total messages, 1 `FitInsight` with 6 strengths and 5 conflicts, and 27 `TaskEntry` rows with randomized timestamps and ~75% completion rate. Seed command wired into `prisma.config.ts` via `migrations.seed` (Prisma 7 config). Import path uses `../src/generated/prisma/client` (explicit file, not directory). Files: `prisma/seed.ts`, `prisma.config.ts`.

- **Auth Setup - NextAuth + Google OAuth** — NextAuth v5 (`next-auth@beta`) installed with `@auth/prisma-adapter`. Split config: `src/auth.config.ts` (edge-compatible, Google provider) + `src/auth.ts` (PrismaAdapter, JWT strategy, session callback adding `user.id`). Route handler at `src/app/api/auth/[...nextauth]/route.ts`. Proxy at `src/proxy.ts` (named export, Node.js runtime) protects `/dashboard/*` and redirects unauthenticated users to sign-in with callbackUrl. Session type extended with `user.id` in `src/types/next-auth.d.ts`. Minimal dashboard placeholder at `src/app/dashboard/page.tsx`. Fixed pre-existing `src/lib/db.ts` import (`@/generated/prisma` → `@/generated/prisma/client`). Env vars: `AUTH_SECRET`, `CLIENT_ID`, `CLIENT_SECRET` (Google OAuth). Google Console requires `http://localhost:3000/api/auth/callback/google` as authorized redirect URI.
