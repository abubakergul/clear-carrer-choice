# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

Database (Prisma):

```bash
npx prisma migrate dev       # Apply schema changes in development
npx prisma migrate status    # Verify migrations are in sync before committing
npx prisma migrate deploy    # Apply migrations in production
npx prisma studio            # Visual DB browser
```

## Tech Stack

- **Next.js 16.2.4** — App Router, TypeScript strict mode, `@/*` path alias for `src/`
- **React 19** — functional components only
- **Tailwind CSS v4** — CSS-based config only (see below)
- **Prisma 7 + Neon PostgreSQL** — ORM for all DB access
- **NextAuth v5** — GitHub OAuth + email/password credentials
- **OpenAI gpt-4o-mini** — AI conversation engine
- **shadcn/ui** — UI component library

## Architecture

### Server vs. Client Components

Server components are the default. Add `'use client'` only for interactivity, hooks, or browser APIs.

Use **Server Actions** (`src/actions/`) for form submissions and simple mutations.  
Use **API routes** (`src/app/api/`) for streaming AI responses, webhooks, file uploads, or third-party integrations requiring specific headers/status codes.

### File Organization

```text
src/
  app/           # Next.js pages and layouts (App Router)
  actions/       # Server Actions, organized by feature
  components/    # UI components — src/components/[feature]/ComponentName.tsx
  lib/           # Utilities — src/lib/[utility].ts
  lib/prompts/   # AI prompts as exported constants — never inline them
  types/         # TypeScript interfaces — src/types/[feature].ts
```

### Tailwind CSS v4 — CRITICAL

**Do not create `tailwind.config.ts` or `tailwind.config.js`** — those are v3 patterns.  
All theme customization goes in `src/app/globals.css` using the `@theme` directive:

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(50% 0.2 250);
}
```

### AI Integration

All prompt strings live in `src/lib/prompts/` as exported constants. Never hardcode prompts inside components or API routes. Stream AI responses through an API route — Server Actions cannot stream.

### Data Fetching Pattern

- Server components: fetch directly with Prisma
- Client components: call Server Actions or fetch to API routes
- Validate all inputs with Zod

### Server Action Return Shape

Actions return `{ success: boolean, data?: T, error?: string }`. Surface errors to users via toast; never expose raw DB or API errors.

## Data Models

Key Prisma models: `User`, `Conversation`, `Message`, `FitInsight`, `TaskEntry`.  
`Conversation` supports guest sessions via `sessionId` (no `userId` required).  
`FitInsight` is 1-to-1 with `User` and holds pattern analysis results.  
`TaskEntry.day` is 1–7 for the 7-day exploration cycle.

## Naming Conventions

- Components: `PascalCase` (`ConversationBubble.tsx`)
- Files: match component name or `kebab-case`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: `PascalCase` (no `I` prefix)

## Project Context

ClearCareerChoice is an AI-powered career clarity tool for students (17–22). The core flow is:

1. Guest AI conversation (3–6 messages) surfaces patterns
2. Signup wall gates the result
3. Fit Insight shows pattern summary, aligned paths, and conflicts
4. 7-day exploration cycle with daily experiments and feedback loop

The product never says "you should be X" — it generates testable hypotheses. Always include a disclaimer on results. If a user shows distress, suggest a real counselor.

See `context/` for detailed feature specs and `context/project-overview.md` for full product philosophy.
