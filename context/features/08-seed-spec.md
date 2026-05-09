# Seed Data Specification

## Overview

Create a seed script (`prisma/seed.ts`) to populate the database with realistic demo data for development, dashboards, analytics, and UI previews.

The goal is to generate enough meaningful content so the app feels alive immediately after running the seed.

The seed should:

- Be idempotent
- Be safe to run multiple times
- Use realistic timestamps
- Generate useful dashboard/activity data
- Simulate AI coaching/productivity conversations

---

# Demo User

Create a single demo user.

| Field | Value |
| --- | --- |
| email | demo@mindframe.ai |
| name | Demo User |
| image | https://i.pravatar.cc/300?img=12 |
| emailVerified | Current date |

---

# General Theme

The seeded experience should simulate a user exploring:

- productivity coaching
- burnout prevention
- career alignment
- focus optimization
- habit tracking
- reflection and planning

The content should feel:

- conversational
- realistic
- slightly insightful
- useful for cards/charts/widgets

---

# Conversations

Create between:

- 5–6 conversations

Each conversation should:

- belong to the demo user
- have a unique `sessionId`
- contain realistic timestamps
- represent different productivity/career themes

---

## Suggested Conversation Themes

### Career Alignment

Topics:

- ideal work environments
- autonomy vs meetings
- technical strengths
- long-term career direction

---

### Focus & Productivity

Topics:

- distractions
- context switching
- async work
- prioritization

---

### Burnout Prevention

Topics:

- exhaustion
- energy management
- meeting fatigue
- work-life balance

---

### Weekly Reflection

Topics:

- wins
- blockers
- learning patterns
- self-review

---

### Planning & Execution

Topics:

- roadmap planning
- sprint organization
- task overwhelm
- consistency

---

# Messages

Each conversation should contain:

- 6–14 messages
- alternating `user` and `assistant` roles

---

## User Message Style

Messages should feel natural and realistic.

Examples:

- struggling to focus lately
- too many meetings draining energy
- unsure what to prioritize
- feeling productive but mentally exhausted
- wanting more deep work time

---

## Assistant Message Style

Assistant replies should feel:

- thoughtful
- structured
- encouraging
- actionable

Examples:

- identifying recurring patterns
- suggesting focus systems
- recommending recovery habits
- helping prioritize work

---

# FitInsight

Create:

- 1 FitInsight row for the demo user

This should summarize the user’s overall behavioral/work patterns.

---

## Suggested Summary Tone

The summary should feel AI-generated and insightful.

Example direction:

> The user performs best in autonomous environments with extended focus time. Frequent interruptions and excessive collaboration reduce energy levels and overall engagement.

---

## Strengths

Create 5–7 strengths.

Suggested ideas:

- Deep focus capability
- Systems thinking
- Fast learner
- Reflective mindset
- Strong technical curiosity
- Independent problem solving
- Consistent execution

---

## Conflicts

The `conflicts` field should represent recurring friction points or energy drains.

Create 4–6 realistic entries.

Suggested ideas:

- Context switching fatigue
- Meeting overload
- Difficulty disconnecting after work
- Perfectionism loops
- Overcommitting to tasks
- Inconsistent recovery habits

---

# TaskEntry

Create:

- 20–30 task entries
- spread across the last 14–21 days

The seeded data should support:

- dashboard charts
- productivity widgets
- streak analytics
- activity feeds
- completion metrics

---

# Day Mapping

| Day | Meaning |
| --- | --- |
| 1 | Monday |
| 2 | Tuesday |
| 3 | Wednesday |
| 4 | Thursday |
| 5 | Friday |
| 6 | Saturday |
| 7 | Sunday |

---

# Task Categories

Mix different styles of tasks.

---

## Deep Work

Examples:

- Refactor authentication flow
- Build dashboard analytics
- Optimize Prisma queries
- Research AI memory systems

---

## Planning

Examples:

- Weekly roadmap review
- Sprint planning
- Inbox cleanup
- Prioritize feature backlog

---

## Learning

Examples:

- Read Prisma optimization article
- Watch TypeScript architecture talk
- Explore vector embeddings
- Study React rendering patterns

---

## Health & Recovery

Examples:

- Evening walk
- Stretch session
- No-screen recovery break
- Morning journaling

---

# Feedback Values

Use more natural status/mood values.

Suggested values:

- energized
- focused
- neutral
- distracted
- exhausted

---

# Completion Logic

Tasks should have mixed completion states.

Recommended distribution:

- ~75% completed
- ~25% incomplete

Rules:

| Scenario | completedAt |
| --- | --- |
| completed | valid timestamp |
| incomplete | null |

---

# Timestamp Rules

All seeded data should:

- use realistic timestamps
- avoid identical creation times
- spread naturally across recent days
- randomize hours/minutes

---

# Optional Session Data

Optionally create:

- 1–2 Session rows

Useful for:

- auth dashboards
- admin panels
- active session indicators

Do NOT create fake OAuth providers/accounts unless needed.

---

# Seed Implementation Notes

## Prisma Import

```ts
import { PrismaClient } from "../src/generated/prisma";