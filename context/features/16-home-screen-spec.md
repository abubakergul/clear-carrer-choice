# 16-home-screen-spec.md

# Home Screen

## Overview

The home screen is NOT a productivity dashboard.

It is:

- a calm continuation screen
- a lightweight exploration hub
- a reflection-aware discovery space

Primary emotional goal:

> help users continue exploring without overwhelm.

The screen should feel:

- calm
- lightweight
- emotionally safe
- non-judgmental

Avoid productivity-app energy.

---

# Route

```text
/dashboard
```

Protected route. This IS the home screen — no separate `/home` route needed.

---


---

# What Needs Building

## 1 — Current Direction strip

A subtle one-liner above the "Up next" section — pulled from `FitInsight.summary`.

Design:

- Single sentence, violet-tinted soft banner
- Example: *"You seem repeatedly drawn toward collaborative creative environments."*
- Only show after FitInsight exists (already guaranteed since dashboard guards for insight)
- Tap/click links to `/dashboard/pattern` for the full view
- Should feel like a quiet personal orienting note, not a section header

Language rule: never say "You are a X." Say "You seem drawn toward…" / "You often react with curiosity to…"

---

## 2 — Signal chips on timeline entries

Each COMPLETED entry in the journey timeline shows up to 3 signal chips from the reflection.

- Add `reflections: { take: 1, select: { selectedSignals: true } }` to the `pastExplorations` query
- Show first 3 signals as tiny inline chips (e.g. `Curious · Energized · Resistant`)
- SKIPPED and EXPIRED entries show nothing extra — just title + status text

---

## 3 — Synthesis milestone banner

After the user has 3+ COMPLETED explorations, show a banner above the active card:

> "A pattern is forming. See what we've noticed about you →"

- Link to `/dashboard/pattern`
- Soft violet background, not alarming or urgent
- Use `sessionStorage` to avoid showing it every single render
- Do not show if completedCount < 5

---

# Visual Tone

- Spacious, calm, emotionally safe
- No gamification, streaks, progress bars, or percentages
- Avoid crowded dashboards

---

# Language Rules

Avoid: task, mission, assignment, productivity, achievement, performance, score
Prefer: exploration, notice, curiosity, reflection, discover, drawn toward

---

# Mobile-First

Primary exploration CTA must remain highly accessible. No horizontal scrolling.

---

# Implementation Notes

## Files to touch

- `src/app/dashboard/page.tsx` — add Current Direction strip, signal chips on timeline, synthesis banner
- No new components needed — all server-side additions to the existing page

## Data fetching changes

- Fetch `FitInsight.summary` (add to the existing insight query which currently only selects `id`)
- Include `reflections: { take: 1, select: { selectedSignals: true } }` in the `pastExplorations` query
- Count COMPLETED explorations for the milestone banner threshold (already available from `pastExplorations`)
