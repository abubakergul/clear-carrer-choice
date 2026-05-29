# 17-clarity-output-spec.md

# Clarity Output

## Overview

After enough explorations and reflections, the product owes the user an answer.

Not:

> "You should be a UX designer."

But:

> "Here is what we've consistently noticed about you. Here are 2–3 environments worth exploring seriously."

This is the product's graduation moment — a synthesis of observed patterns expressed as environments and directions the user can act on. It gives the product an arc and an ending.

---

# Philosophy

The output should feel like:

> a trusted observer who has watched you for a few weeks sharing what they noticed.

NOT:

> a career test result.

It should:

- reference actual signal patterns (not generic platitudes)
- acknowledge what is still uncertain
- suggest concrete next steps (not careers — environments, communities, activities)
- feel earned, not instant

---

# Unlock Conditions

Clarity Output unlocks progressively:

| Completions | State |
|-------------|-------|
| 0–3 | Not available |
| 4–6 | Locked teaser on `/dashboard/pattern`: "Clarity Output unlocks after 7 explorations. You've completed N so far." |
| 7+ | Full Clarity Output unlocked |

COMPLETED explorations only. Skips and expirations do not count.

---

# Route

```text
/dashboard/clarity
```

Protected. Link from `/dashboard/pattern` once unlocked.

---

# Page Structure

## Section 1 — What We Noticed

3–5 pattern observations derived from accumulated signal data.

Each observation is:

- one sentence
- tied to specific signal trends (e.g. high curiosity + high energy in creative contexts)
- observational, not evaluative

Examples:

> "You consistently feel curious and energized when exploring creative, visually-oriented environments."
> "You feel resistant and drained when tasks are highly structured with little room for individual judgment."
> "You repeatedly showed interest in environments where collaboration is central, not optional."

Avoid:

- "You are creative." (label)
- "You scored high on curiosity." (score)

---

## Section 2 — What's Still Uncertain

1–2 honest observations about what the data cannot yet confirm.

Example:

> "It's not yet clear whether you prefer leading or contributing within collaborative environments — this is worth exploring."

This section builds trust. It shows the system is honest, not just flattering.

---

## Section 3 — Environments Worth Exploring

2–3 concrete environment suggestions (NOT job titles).

Each one:

- describes an environment type, not a career label
- explains why it fits based on signal patterns
- suggests one small real-world action to explore it further

Example:

**Collaborative creative problem-solving environments**

> You've shown high curiosity and energy in explorations involving visual collaboration, design decisions, and creative iteration. Environments like product design, creative strategy, or content direction may feel natural.
>
> *One thing to try: Find one person working in this space and read how they describe their day-to-day.*

Avoid:

- "You should become a UX Designer"
- Long career descriptions
- Salary data or job market information

---

## Section 4 — What To Do Next

2–3 lightweight next-step suggestions:

- Continue exploring (keep the loop going)
- Talk to someone in an environment that resonated
- Notice your reactions when you encounter this kind of work in daily life

Should feel like gentle guidance, not homework.

---

# Generation

Generated on first visit to `/dashboard/clarity` after unlock, then cached in DB.

## Schema changes

Add to `FitInsight`:

```prisma
clarityOutput   String?  // stored as JSON string
clarityUnlockedAt DateTime?
```

The JSON shape:

```ts
{
  observations: string[]
  uncertainties: string[]
  environments: { title: string; reasoning: string; action: string }[]
  nextSteps: string[]
}
```

## Generation flow

1. User visits `/dashboard/clarity`
2. If `clarityOutput` is null and completions ≥ 7 → show loading state, call generation server action
3. Generation is non-blocking — action returns immediately, generation runs, page polls with `router.refresh()` every 3 seconds until `clarityOutput` is populated (same pattern as ExplorationGenerator)
4. Once populated, render the page

## Regeneration trigger

Regenerate when `FitInsight.version` has incremented since clarity was last generated (i.e. insight evolved with new data). Add `clarityInsightVersion Int @default(0)` to track this.

---

# Prompt Guidelines

File: `src/lib/prompts/clarity-output.ts`

The prompt receives:

- `FitInsight.summary`, `directions`, `tensions`
- Last 10 completed reflections: `selectedSignals[]`, `energyLevel`, `curiosityLevel`, `intimidationLevel`
- Skip reasons from recent skips (optional — avoidance is signal too)

Instructions to AI:

- Be specific to THIS user's actual signals — do not write generic career advice
- Reference actual signal patterns by name (e.g. "your repeated Resistant signals in structured tasks")
- Acknowledge uncertainty honestly — do not overclaim
- Return valid JSON matching the shape above
- Language: observational, never prescriptive

---

# Language Rules

Avoid: score, percentage, trait, personality type, assessment, result, talent, aptitude, should, must
Prefer: noticed, pattern, drawn toward, reaction, curiosity, energy, environment, explore, seems, often

---

# Visual Design

- Clean, spacious — feels like a personal document, not a dashboard
- Each section clearly labeled with breathing room between them
- No charts, percentages, or scores anywhere
- Subtle violet accents consistent with the rest of the product
- Back link to `/dashboard/pattern`

---

# Empty / Loading States

**Before unlock (< 7 completions):**
Show teaser on `/dashboard/pattern`:

> "Clarity Output unlocks after 7 explorations. You've completed N so far."

No progress bar — just a plain sentence.

**Generating (first visit):**

> "Preparing your Clarity Output… this takes a moment."

Auto-refresh every 3s until `clarityOutput` is populated.

**If generation fails:**

> "We couldn't prepare this right now. Try again later."

No error codes shown.

---

# Key Files

- `src/app/dashboard/clarity/page.tsx` — new page
- `src/actions/exploration.ts` — add `generateClarityOutput(userId)` server action
- `src/lib/prompts/clarity-output.ts` — new prompt
- `prisma/schema.prisma` — add `clarityOutput`, `clarityUnlockedAt`, `clarityInsightVersion` to `FitInsight`

---

# What This Is NOT

- Not a personality type
- Not a career recommendation
- Not a guaranteed outcome
- Not a certificate

The product claims:

> "Here is what we observed. Here is what seems worth exploring."
