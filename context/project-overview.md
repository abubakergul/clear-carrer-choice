# ClearCareerChoice — Project Overview

## What We're Building

**ClearCareerChoice** is an AI-powered career clarity app for students who feel stuck, anxious, or unsure about what to pursue.

This is not a quiz.
This is not a list of career options.

This is a **short conversation that leads to a testable hypothesis about you — and a way to verify it in real life before you waste time on the wrong path.**

**Core Idea:** Help users **stop guessing** their career by **testing what fits in reality.**

**Positioning:** "Don't guess your career. Test it before you commit."

---

## The Real Problem

Students are not just confused. They are:

- Afraid of choosing wrong and wasting years
- Overwhelmed by too many options
- Stuck in overthinking without action
- Distrustful of generic advice

Most tools fail because they:

- Give generic results
- Feel like homework
- Don't connect to real-world validation
- Don't give a reason to come back

**Key Insight:** Clarity comes from testing, not thinking.

---

## Target Users

**Primary:**

- Students (17–22)
- Unsure about degree or career direction

**Not targeting:**

- Professionals
- Job seekers
- People looking for placements

---

## Core Product Philosophy

We are NOT:

- A career quiz
- An answer engine

We ARE:

- A pattern detector
- A hypothesis generator
- A testing system

We never say: "You should be X"

We say: "Based on your patterns, X might fit — let's test it."

---

## Core User Flow

### Phase 1 — Conversation (Guest)

1. User lands on app
2. CTA: "Try it →"
3. AI asks: "What's making choosing a career feel hard right now?"
4. Conversation (3–6 messages max) — short, natural, pattern-focused
5. Build curiosity before showing results

---

### Signup Wall

Shown when user wants the result.

Goal: "I need to see what this says about me."

---

### Phase 2 — Fit Insight (Critical Moment)

Structure:

1. Pattern Summary — "You tend to avoid X and prefer Y..."
2. Fit Direction — "This aligns with paths like..."
3. Conflict Insight — "This may clash with paths like..."
4. Disclaimer — "This is a starting point, not a final answer."

---

### Phase 3 — 7-Day Exploration Cycle

(Not called "plan" — called "test" or "exploration")

Each day:

- One small experiment (10–15 min)
- Designed to test a specific assumption

**Bad:** "Research UX design"

**Good:** "Redesign the login screen of an app you use. Notice if you enjoy it or feel stuck."

---

## Feedback Loop

After each experiment:

- ✅ Interesting
- 😕 Not sure
- ❌ Not for me

This updates the Fit Insight.

Progress = clarity gained, not tasks completed

---

## Key Risks

1. Retention will be low by default
2. Generic AI = instant churn
3. Weak emotional hook = low urgency
4. Experiments may feel like homework if poorly written

---

## Product Decisions

- No subscriptions
- No email reminders
- No links in experiments
- No "you should be X"
- Always show disclaimer on results

If user shows distress → suggest talking to a real counselor.

---

## What Makes This Different

We do NOT just suggest careers.

We help users → test career assumptions in real life before committing.

---

## Success Metrics

- % who complete conversation
- % who sign up
- % who do 2–3 experiments
- % who feel less confused after 7 days

---

## UI / UX Direction

- Clean, calm, minimal — not clinical or robotic
- Mobile-first — students are on their phones
- Inspired by calm productivity tools, not dashboard-heavy SaaS
- NOT like ChatGPT. NOT like a quiz. A guided conversation with a sharp, caring friend.

### Design System (global)

- Brand color: `#7c3aed` (violet-600) — used for all primary CTAs, user bubbles, send button, logo mark
- CSS variables: `--color-accent: #7c3aed`, `--color-accent-hover: #6d28d9` defined in `globals.css`
- Use explicit `bg-violet-600` in components — CSS variable references in Tailwind `bg-[--var]` can silently fail
- Background: `#FAFAF9` warm off-white
- Typography: Geist Sans, bold headlines, muted subtext (`text-stone-500`)

### Conversation UX Rules (learned from testing)

- 7 user messages max — 5 felt abrupt and cut off genuine exploration
- Session must persist across back-navigation — restore from `sessionStorage` on mount
- AI messages: full-width white cards (authoritative, weighted)
- User replies: compact violet bubbles right-aligned (responses, not commands)
- Progress bar + reply counter in header creates intentional scarcity without pressure
- AI must ask career-specific questions — NOT generic emotional reflection
- AI must cover ALL paths the user mentions — not drill one and ignore others
- AI must explore goals/fears/tensions, not just past enjoyment
- First message is the highest drop-off point — always show quick-tap chips so user can start without typing
- Chips disappear after first reply; input placeholder says "Or type your own reply…"

---

## Tech Stack

- Next.js 16 (App Router, TypeScript strict)
- React 19
- Tailwind CSS v4
- Prisma 7 + Neon PostgreSQL
- NextAuth v5 (GitHub OAuth + credentials)
- OpenAI gpt-4o-mini
- shadcn/ui
- Vercel deployment

---

## Data Model (Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  conversations Conversation[]
  fitInsight    FitInsight?
  experiments   TaskEntry[]
}

model Conversation {
  id        String    @id @default(cuid())
  userId    String?
  sessionId String
  messages  Message[]
  createdAt DateTime  @default(now())

  user      User?     @relation(fields: [userId], references: [id])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  role           String       // "user" | "assistant"
  content        String
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id])
}

model FitInsight {
  id        String   @id @default(cuid())
  userId    String   @unique
  summary   String
  strengths String[]
  conflicts String[]
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}

model TaskEntry {
  id          String    @id @default(cuid())
  userId      String
  day         Int       // 1–7
  description String
  feedback    String?   // "felt_good" | "neutral" | "drained"
  completedAt DateTime?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])
}
```

---

## Final Note

Users don't need more advice. They need a way to stop guessing.

This product only works if:

- The insight feels real
- The experiments feel meaningful
- The user feels understood

If those fail, the product fails.
