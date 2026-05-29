# 18-prompt-grounding-spec.md

# Prompt Grounding

## Overview

Currently, AI-generated text in this product feels generic. FitInsight directions like "Creative problem-solving environments" could belong to anyone. Explorations feel random. The product doesn't feel like it *knows* the user.

The fix is grounding: every AI output should visibly reference what the user actually said or did — not just produce abstract observations.

This is a prompt improvement task, not a UI feature. No new pages. No schema changes. Just better prompts.

---

# The Problem

## What it looks like now

User says: *"I love working on things that feel alive and visual. I get bored doing the same thing twice."*

FitInsight generates: *"Creative environments"*, *"Visual work"*

These labels are accurate but dead. The user doesn't recognize themselves in them.

## What it should look like

FitInsight generates: *"You described feeling 'alive' with visual, ever-changing work — environments built around iteration and variety seem to pull you naturally."*

The user reads that and thinks: *"That's exactly what I said."*

---

# Grounding Rules

Apply to ALL AI prompts in the product:

1. **Quote or paraphrase the user's actual words** where possible
2. **Reference specific signals by name** (e.g. "your repeated Curious + Energized signals", not "high engagement")
3. **Acknowledge the source** of the observation (e.g. "based on your reactions in the last 4 explorations")
4. **Never generate a label without a reason** — every direction, tension, or observation needs a "because"

---

# Prompts to Update

## 1. `src/lib/prompts/insight.ts` (FitInsight generation)

Current state: receives conversation messages, generates directions/tensions/summary.

Changes needed:

- Instruct AI to write `summary` in first-person observational tone referencing what the user said: *"You described feeling [X] when [Y]..."*
- Instruct AI to write each `direction` as a sentence, not a label: *"Environments where visual creativity drives the work"* → *"You seem pulled toward environments where visual creativity is the main language — you used words like 'alive' and 'exciting' specifically for these."*
- Instruct AI to write each `tension` as an observation with a because: *"You expressed resistance to highly repetitive or rule-bound work — this came up multiple times unprompted."*

## 2. `src/lib/prompts/first-exploration.ts` (first exploration)

Current state: generates an exploration based on FitInsight.

Changes needed:

- Pass 1–2 direct quotes from the conversation into the prompt
- Instruct AI to generate `generationContext.reason` as: *"You used the word 'exciting' when describing [X] in your conversation — this explores that reaction."*
- The reason should always reference something the user actually said or did, never a generic insight

## 3. `src/lib/prompts/next-exploration.ts` (subsequent explorations)

Current state: receives directions, tensions, history. Generates next exploration.

Changes needed:

- `generationContext.reason` must reference a specific signal from recent reflections: *"You felt Curious and Energized in your last creative exploration — this goes a step further in that direction."* OR *"You skipped the last structured task with 'felt intimidating' — this explores why from a safer angle."*
- Never generate a generic reason like "Based on your interests"

## 4. `src/lib/prompts/insight-evolution.ts` (FitInsight evolution — new, from spec 15)

- Each evolved direction should reference the specific signal patterns that informed it
- Example: *"You've now shown Resistant + Overwhelmed signals in 3 of 4 structured explorations — the tension around high-structure environments is strengthening."*

## 5. `src/lib/prompts/clarity-output.ts` (Clarity Output — new, from spec 17)

- Observations MUST reference signal names and counts: *"In 6 of your 8 completed explorations, you selected Curious and Energized — both appeared most often in creative, visually-oriented contexts."*
- Do not write a single observation without naming the signal data behind it

---

# Conversation Data Access

For first exploration and FitInsight generation, the conversation messages are available via `claimAndGenerate()` in `src/actions/conversation.ts`.

The prompt should include 2–3 of the most emotionally expressive user messages (not all messages — just the ones with strong language about feelings, reactions, or preferences).

Add a helper: extract messages where the user used emotional language (contains words like "love", "hate", "excited", "scared", "boring", "alive", "interesting", "terrifying", etc.) — pass these as `keyUserQuotes` in the prompt.

---

# Tone After Grounding

Every AI output should make the user feel:

> "This is about me specifically."

NOT:

> "This is a generic career observation that could apply to anyone."

The test: if you replaced the user's name with another person's, would the output still make sense? If yes — it's not grounded enough.

---

# What NOT to Change

- Do not change prompt file locations or export names
- Do not add new UI elements for this feature — grounding is invisible infrastructure
- Do not change the JSON response shapes the prompts return — only the instructions and examples within them

---

# Implementation Order

1. Update `insight.ts` — highest impact (first thing every user sees)
2. Update `next-exploration.ts` — `generationContext.reason` grounding (partially done — field exists, needs richer instructions)
3. Update `first-exploration.ts` — pass key quotes
4. Update `insight-evolution.ts` when spec 15 is implemented
5. Update `clarity-output.ts` when spec 17 is implemented
