# Exploration System

## Overview

Explorations are the core loop of the product.

The system generates ONE exploration at a time.

Explorations are:
- short
- beginner-friendly
- emotionally focused
- under 15 minutes

The goal is NOT skill testing.

The goal is observing reactions.

---

# Exploration Lifecycle

Statuses:
- `ACTIVE`
- `COMPLETED`
- `SKIPPED`
- `EXPIRED`

Only ONE exploration can be active at once.

---

# Generation Flow

## Initial Exploration

Generated:
- after FitInsight creation

Uses:
- directions
- tensions
- conversation patterns

---

## Future Explorations

Generated after:
- reflection submission
- skip submission
- expiration

Generation should use:
- latest reflections
- recent signals
- current insight

---

# Expiration Rules

Explorations expire after:
- 48–72 hours

Expired explorations:
- move to history
- are not failures

Do NOT create backlog systems.

---

# UI/UX

The buttons and where it should it display was not explain use your own intelligence to do it.

# Exploration Structure

Each exploration contains:

```ts
{
  title: string
  prompt: string
}