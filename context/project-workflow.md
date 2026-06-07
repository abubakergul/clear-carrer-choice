# ClearCareerChoice — Product Workflow

The full user journey from first visit to final answer. Each stage maps to specific routes and files.

---

## Stage 1 — AI Conversation

**Route:** `/chat`

The entry point. No account required.

What happens:

1. User picks their education stage (school / college / graduating / graduated).
2. A short guided conversation begins — 5 to 12 messages, mobile-first, emotionally aware.
3. The AI explores interests, fears, motivations, tensions, and the concrete options the user is torn between (e.g. "army vs. software vs. business").
4. Mid-conversation chips surface (motivation, resources, fear, experience, yes/no, scale) to reduce typing friction.
5. A circular progress ring shows conversation depth (3 segments).
6. When enough signal is gathered, the AI emits a trigger phrase that opens the **signup wall**.

Key rules for the conversation prompt:

- Narrow every broad field to its most common version (army → infantry soldier, not "officer track").
- Never mention a path the user said is unrealistic.
- Write at a 16-year-old / ESL reading level.
- Extract key emotional quotes from the user to pass into insight generation.

**Key files:** `src/app/chat/page.tsx`, `src/components/chat/ChatInterface.tsx`, `src/lib/prompts/conversation.ts`, `src/app/api/chat/route.ts`

---

## Stage 2 — Initial Insight

**Route:** `/result` (after claim) · `/claim` (transition)

What happens:

1. Guest conversation is persisted to DB in real time via `POST /api/chat/session`.
2. After signup/login, `claimAndGenerate()` claims the conversation (sets `userId`), generates a `FitInsight` and first `Exploration` via OpenAI, then redirects to `/result`.
3. `/result` shows: pattern summary, possible directions, tensions, and first exploration CTA.

`FitInsight` fields populated at this point:

- `summary` — 1–2 sentences quoting the user's own words
- `directions` — full explanatory sentences ("you seem drawn to X because you said Y")
- `tensions` — what's pulling in opposite directions
- `options String[]` — the concrete named paths the user is torn between (e.g. `["army", "software engineer"]`)

The result page is intentionally lightweight — curiosity and emotional resonance, not certainty or career labeling.

**Key files:** `src/app/result/page.tsx`, `src/app/claim/page.tsx`, `src/actions/conversation.ts`, `src/lib/prompts/insight.ts`, `src/lib/prompts/first-exploration.ts`

---

## Stage 3 — Guided Exploration (Core Loop)

**Routes:** `/dashboard` · `/dashboard/explore/[id]` · `/dashboard/explore/[id]/reflect` · `/dashboard/explore/[id]/shift`

This is where the product lives. One exploration at a time, up to 5 completions.

### 3a — Dashboard Home (`/dashboard`)

Shows:

- Greeting + date
- **Stars progress** (5 stars, one lights up per completed exploration)
- **Active exploration card** — title, type badge, intensity badge, "Open exploration" CTA
- **Journey timeline** — past explorations with status and up to 3 signal chips

Special states:

- `completedCount >= 5` → replaces the active card with "You've done your 5 — see where you've landed" (no more explorations generated)
- `consecutiveSkips >= 3` → 12h cooldown timer
- Disengaged (skipped through a cooldown) → soft exit to pattern page

**Key files:** `src/app/dashboard/page.tsx`, `src/components/dashboard/Stars.tsx`, `src/components/dashboard/ExplorationGenerator.tsx`

### 3b — Exploration Detail (`/dashboard/explore/[id]`)

Renders the exploration in one of three modes based on `generationContext.interaction.kind`:

| Kind | Component | Description |
|------|-----------|-------------|
| `this_or_that` | `ThisOrThat` | Tap one of two vivid workday scene cards |
| `real_day` | `RealDay` | Honest hour-by-hour role breakdown (boring % included), rate each chunk |
| _(none)_ | plain text | Read the prompt, "I did it" button |

"What to notice / No right answer" box is hidden for interactive formats (they handle their own framing).

The chosen option or summary from interactive explorations flows into the reflection as `emotionalState`.

**Key files:** `src/app/dashboard/explore/[id]/page.tsx`, `src/components/dashboard/ThisOrThat.tsx`, `src/components/dashboard/RealDay.tsx`

### 3c — Reflection (`/dashboard/explore/[id]/reflect`)

8 plain feeling chips — no 1–5 scales, no jargon:

**Positive:** Excited · Curious · Enjoyed it · Calm

**Negative:** Bored · Confused · Stressed · Not for me

Plus an optional free-text note.

Behind the scenes, chip valence derives `energyLevel`, `curiosityLevel`, and `intimidationLevel` so downstream prompts keep working without changing the DB schema.

After submit → `completeExploration()` fires, saves the reflection, then **redirects to the Shift screen**.

**Key files:** `src/components/dashboard/ReflectionForm.tsx`, `src/app/dashboard/explore/[id]/reflect/page.tsx`, `src/actions/exploration.ts`

### 3d — Shift Screen (`/dashboard/explore/[id]/shift`)

The payoff moment after every reflection.

Shows:

- **Stars** with the newly earned star animating in
- **Reaction read** — instant, data-derived sentence from the user's own signal counts (no AI call, no latency). Example: "You lit up 3 times and felt resistant once — that pattern is signal."
- Subtitle: "X of 5 lit — Y more to unlock your answer." or "All 5 lit — your answer is ready."
- CTA: "Keep exploring" (→ `/dashboard`) or "See where you've landed" (→ `/dashboard/pattern`) once 5 are done

`ExplorationGenerator` pre-warms the next exploration in the background while the user sits here.

**Key files:** `src/app/dashboard/explore/[id]/shift/page.tsx`, `src/lib/constellation.ts`

### 3e — Generation Rules

`runGeneration()` in `src/actions/exploration.ts`:

- Returns early if an ACTIVE exploration already exists (one at a time)
- Returns early if `completedSoFar >= 5` (the set is done — no treadmill)
- Detects consecutive skips: 2 → format hint; 3+ → CRITICAL override (VERY_LIGHT, no video, <5 min, in-app only)
- Tags each new exploration to one of the user's named `options` (rotating to cover untested ones)
- Preferred formats: `this_or_that`, `real_day`, thought experiment. External trips explicitly capped to one site, used sparingly.
- Every 3rd completion triggers `runInsightEvolution()` (fire-and-forget, updates summary/directions/tensions/patternSummary, increments `FitInsight.version`)

---

## Stage 4 — Pattern Output

**Route:** `/dashboard/pattern` (also catches `/dashboard/clarity` via redirect)

The final answer page. Unlocks fully at 5 completions.

### What's shown at 5+ completions:

**Verdict sentence** (`buildVerdict()`) — derived entirely from the user's own reaction data:

> "Based on how you've reacted, software engineer is pulling clearly ahead of army."

**Where Your Options Stand** (`OptionsStanding`) — one bar per named option:

- State label: "you lean in" / "you pull back" / "mixed" / "not tested yet"
- Evidence chips: the actual feeling words the user tapped, shown under the bar
- No fake scores or percentages

**What to do next** — 2–3 gentle nudges from `clarityOutput.nextSteps` (generated once by AI, cached in DB, auto-regenerates when `FitInsight.version` advances)

### What's shown below 5 completions:

- Directions (what's drawing the user in, with reasoning)
- Tensions (what's unresolved)
- Teaser: "Complete X more explorations to unlock your answer"

**Key files:** `src/app/dashboard/pattern/page.tsx`, `src/lib/options.ts`, `src/components/dashboard/OptionsStanding.tsx`, `src/actions/exploration.ts` (`generateClarityOutput`)

---

## Data Models (summary)

| Model | Key fields |
|-------|-----------|
| `FitInsight` | `summary`, `directions[]`, `tensions[]`, `options[]`, `patternSummary`, `clarityOutput`, `version` |
| `Exploration` | `title`, `prompt`, `status`, `type`, `intensity`, `generationContext` (Json), `expiresAt` |
| `Reflection` | `selectedSignals[]`, `energyLevel`, `curiosityLevel`, `intimidationLevel`, `emotionalState`, `notes`, `source` |

`generationContext` shape (no migration needed for new fields — stored as Json):

```json
{
  "direction": "...",
  "option": "army",
  "reason": "...",
  "basedOnSignals": ["Curious", "Bored"],
  "interaction": {
    "kind": "this_or_that | real_day",
    "optionA": "...",
    "optionB": "...",
    "role": "...",
    "chunks": [{ "percent": 40, "text": "..." }]
  }
}
```

---

## Navigation

Sidebar items (authenticated):

- **Home** → `/dashboard`
- **My Pattern** → `/dashboard/pattern` (also active for `/dashboard/clarity`)

Removed: "Clarity Output" (merged into pattern page).
