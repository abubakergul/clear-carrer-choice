# 14-exploration-system-spec.md

# Exploration System

## Overview

Explorations are the core interaction loop of the product.

The system exists to:

> reduce career uncertainty through guided behavioral exploration.

Explorations are NOT:

- assignments
- skill tests
- mini-courses
- productivity tasks
- assessments

Explorations ARE:

- lightweight guided experiences
- emotional signal collection opportunities
- low-pressure exposure to real-world work patterns
- tools for self-discovery

The system is NOT trying to determine:

- intelligence
- competence
- readiness
- expertise

The system IS trying to observe:

- curiosity
- intimidation
- engagement
- resistance
- energy
- boredom
- desire to continue

---

# Core Exploration Loop

```text
explore
→ notice reaction
→ reflect
→ gain clarity
→ continue
```

This loop should guide:

- UX decisions
- navigation
- reflection design
- AI generation
- home screen hierarchy

---

# Exploration Lifecycle

Only ONE exploration may be active at a time.

## Statuses

```ts
enum ExplorationStatus {
  ACTIVE
  COMPLETED
  SKIPPED
  EXPIRED
}
```

---

# Exploration Flow

## Initial Exploration

Generated after:

- FitInsight creation

Uses:

- conversation patterns
- tensions
- directions
- emotional indicators

---

## Future Explorations

Generated after:

- reflection submission
- skip submission
- expiration

Generation should use:

- recent reflections
- recurring signals
- curiosity patterns
- avoidance patterns
- evolving FitInsight state

---

# Exploration Completion Flow

Recommended flow:

```text
Start Exploration
→ User explores
→ Reflection screen
→ Reflection submission marks exploration COMPLETE
```

Completion should happen ONLY after reflection submission.

The system should prioritize:

- emotional feedback
- behavioral patterns

NOT:

- completion tracking

---

# Exploration Rules

Every exploration must be:

## Beginner-Friendly

Users should not require:

- prior experience
- technical expertise
- special tools
- confidence in the field

---

## Lightweight

Target duration:

- 5–15 minutes

The user should feel:

> “I can quickly try this.”

NOT:

> “This is work.”

---

## Specific

Every exploration should clearly explain:

- what to do
- what to observe
- what to notice
- what to search for (if needed)

Bad:

> “Research UX design.”

Good:

> “Search YouTube: ‘A day in the life of a UX designer’ and watch 5 minutes.”

---

## Observation-Focused

Explorations should prioritize:

- observing
- noticing reactions
- reflection

NOT:

- producing
- performing
- proving ability

---

## Low Pressure

Explorations should never feel:

- graded
- evaluative
- competitive
- overwhelming

The system should reduce:

- fear of failure
- perfectionism
- pressure to “be good”

---

# Exploration Progression

Explorations should gradually deepen over time.

General progression:

```text
observe
→ interact lightly
→ tiny experimentation
→ deeper reflection
```

Early explorations should focus on:

- observing
- watching
- noticing emotional reactions

Later explorations may include:

- lightweight interaction
- simple decision-making
- tiny simulations
- comparison exercises

The system should avoid overwhelming users too early.

---

# Exploration Types

```ts
enum ExplorationType {
  OBSERVE
  COMPARE
  INTERACT
  SIMULATE
  REFLECT
}
```

Purpose:

- pacing
- exploration diversity
- progression balancing

---

# Exploration Intensity

```ts
enum ExplorationIntensity {
  VERY_LIGHT
  LIGHT
  MEDIUM
}
```

Most early explorations should remain:

- VERY_LIGHT
- LIGHT

Avoid high-pressure experiences.

---

# Expiration Rules

Explorations expire after:

- 48–72 hours

Expired explorations:

- move to history
- are NOT failures
- should not create guilt

The system should avoid backlog behavior.

---

# Skipping Explorations

Users are allowed to skip explorations.

Skipping is valuable behavioral data.

Skipping should NEVER feel punitive.

When skipping, collect a lightweight reason.

Examples:

- Didn’t feel interesting
- Felt intimidating
- Too confusing
- Already know it’s not for me
- Not in the mood right now

---

# AI Generation Constraints

Explorations should:

- feel personalized
- reference concrete activities
- avoid vague self-help language
- avoid repetitive patterns
- avoid sounding like homework

Avoid repeatedly generating:

- identical formats
- repetitive YouTube-only prompts
- broad generic tasks

---

# Emotional Safety Rules

Avoid explorations that may:

- trigger shame
- imply competence judgment
- feel like testing
- create performance anxiety

Especially for early-stage users.

---

# Friction Rules

Explorations should require:

- minimal setup
- low cognitive overhead
- no complex tooling

Prefer experiences that:

- work on mobile
- require no signup elsewhere
- can begin immediately

---

# Exploration UI Principles

The exploration UI should feel:

- calm
- lightweight
- emotionally safe
- curiosity-driven

Avoid productivity-app behavior.

Avoid:

- progress bars
- streaks
- gamification
- completion pressure

---

# Exploration Card Structure

Each exploration contains:

```ts
{
  title: string
  prompt: string
  estimatedMinutes?: number
  type?: ExplorationType
  intensity?: ExplorationIntensity
}
```

---

# Exploration History Philosophy

History should feel like:

> a personal discovery timeline

NOT:

> a task archive

The goal is helping users notice patterns over time.

---

# Non-Goals

The exploration system is NOT intended to provide:

- career certainty
- aptitude testing
- personality typing
- perfect matching
- performance evaluation

The system exists to:

> help users gradually understand themselves through repeated guided exposure.