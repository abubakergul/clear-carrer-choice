# Exploration System Architecture

## Overview

Explorations are the core mechanic of the product.

The system exists to:

> reduce career uncertainty through guided exploration and behavioral observation.

The product does NOT attempt to:

- assign personality types
- measure intelligence
- predict guaranteed career outcomes
- score users
- rank users
- test competence

The system focuses on:

- emotional reactions
- curiosity patterns
- resistance patterns
- behavioral signals
- evolving self-awareness

---

# Core Philosophy

Explorations are NOT:

- assignments
- mini-courses
- productivity tasks
- skill tests
- assessments

Explorations ARE:

- lightweight guided experiences
- emotional signal collection
- low-pressure exposure to work patterns
- behavioral discovery tools

The system is trying to observe:

- curiosity
- resistance
- engagement
- intimidation
- boredom
- excitement
- energy
- desire to continue

NOT:

- expertise
- readiness
- achievement
- intelligence

The goal is:

> “How does the user react when exposed to this kind of work?”

NOT:

> “Can the user perform this career?”

---

# Exploration Principles

Every exploration must be:

## Beginner-Friendly

Users should not need:

- prior experience
- technical expertise
- special tools
- confidence in the field

The experience should feel approachable even for uncertain users.

---

## Lightweight

Target duration:

- 5–15 minutes maximum

The user should feel:

> “I can quickly try this.”

NOT:

> “This is work.”

---

## Specific

Explorations should clearly explain:

- what to do
- what to observe
- what to notice
- what to search for (if needed)

Bad:

> “Research software engineering.”

Good:

> “Search YouTube: ‘How developers debug code’ and watch 5 minutes.”

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
- competitive
- evaluative
- overwhelming

The system should reduce:

- perfectionism
- fear of failure
- pressure to “be good”

---

# Exploration Lifecycle

Only ONE exploration may be active at a time.

## Exploration Statuses

```ts
enum ExplorationStatus {
  ACTIVE
  COMPLETED
  SKIPPED
  EXPIRED
}
```

---

# Expiration Rules

Explorations expire after:

- 48–72 hours

Expired explorations:

- move to history
- are NOT failures
- should not create guilt

The product should avoid backlog behavior.

---

# Exploration Progression

Explorations should gradually deepen over time.

Progression should generally move from:

```text
observe
→ interact lightly
→ tiny experimentation
→ deeper reflection
```

Early explorations should focus on:

- watching
- observing
- noticing reactions

Later explorations may include:

- tiny interactions
- lightweight simulations
- small decision-making
- deeper comparison

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
- progression balancing
- reducing repetitive experiences

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

The system should avoid high-pressure experiences.

---

# Exploration Generation

## Initial Exploration

Generated after:

- FitInsight creation

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
- recurring signals
- curiosity patterns
- tensions
- avoidance patterns
- evolving insight state

---

# Reflection Philosophy

Reflections should be:

- short
- emotionally intuitive
- structured
- low-friction

The system should avoid:

- essays
- long journaling
- therapy-like interactions

Goal:

> collect behavioral and emotional signals.

---

# Reflection Signal Philosophy

Completion is NOT success.

Skipping is NOT failure.

Strong resistance or avoidance may be more valuable than completion.

The system should prioritize:

- emotional resonance
- attraction
- resistance
- sustained curiosity

over completion metrics.

---

# Skipping Explorations

Skipping is allowed.

Skipping is valuable behavioral data.

Skipping should never feel punitive.

When skipping, the system should collect a lightweight reason.

Examples:

- Didn’t feel interesting
- Felt intimidating
- Too confusing
- Already know it’s not for me
- Not in the mood right now

---

# Behavioral Signals

The system collects lightweight signals such as:

- curiosity
- excitement
- intimidation
- boredom
- confusion
- resistance
- energy
- avoidance
- desire for creativity
- desire for structure

Signals are used to:

- refine future explorations
- evolve FitInsight
- identify recurring patterns
- improve personalization

The system should NEVER reduce users to:

- scores
- percentages
- rankings
- personality labels

---

# AI Generation Constraints

Explorations should:

- feel personalized
- reference something concrete
- avoid generic self-help language
- avoid repetitive formats
- avoid sounding like homework

The system should avoid repeatedly generating:

- identical exploration styles
- repetitive YouTube-only experiences
- overly broad prompts

---

# Friction Rules

Explorations should require:

- minimal setup
- low cognitive overhead
- no complex tools

Prefer experiences that:

- work on mobile
- require no signup elsewhere
- can start immediately

---

# Emotional Safety Rules

Avoid explorations that may:

- trigger shame
- imply competence judgment
- feel like testing
- create performance anxiety

Especially for early-stage users.

---

# UX Principles

## Main Screen

Display:

- one active exploration card
- title
- short prompt
- estimated duration
- lightweight context (“Why this exploration?”)

Actions:

- Start
- Skip
- Already know this about myself

---

# Reflection UX

Reflections should ask:

> “What did you notice?”

NOT:

> “How did you perform?”

Reflections should primarily use:

- taps
- lightweight selections
- optional short notes

---

# Database Architecture

The database is designed around:

- evolving user patterns
- exploration history
- behavioral signals
- reflection-driven insight updates

The system does NOT store:

- scores
- rankings
- personality types
- completion metrics

The system focuses on:

> reactions and patterns over time.

---

# Prisma Schema

## User

```prisma
model User {
  id            String   @id @default(cuid())

  email         String   @unique
  name          String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  conversations Conversation[]
  fitInsight    FitInsight?
  explorations  Exploration[]
}
```

---

## Conversation

```prisma
model Conversation {
  id              String    @id @default(cuid())

  userId          String?
  sessionId       String

  educationStage  String?

  createdAt       DateTime @default(now())

  user            User? @relation(fields: [userId], references: [id])

  messages        Message[]
}
```

---

## Message

```prisma
model Message {
  id              String   @id @default(cuid())

  conversationId  String

  role            String
  content         String

  createdAt       DateTime @default(now())

  conversation    Conversation @relation(fields: [conversationId], references: [id])
}
```

---

## FitInsight

```prisma
model FitInsight {
  id            String   @id @default(cuid())

  userId        String   @unique

  summary       String

  directions    String[]
  tensions      String[]

  version       Int      @default(1)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User @relation(fields: [userId], references: [id])
}
```

---

## Exploration

```prisma
enum ExplorationStatus {
  ACTIVE
  COMPLETED
  SKIPPED
  EXPIRED
}

enum ExplorationType {
  OBSERVE
  COMPARE
  INTERACT
  SIMULATE
  REFLECT
}

enum ExplorationIntensity {
  VERY_LIGHT
  LIGHT
  MEDIUM
}

model Exploration {
  id                 String   @id @default(cuid())

  userId             String
  fitInsightId       String?

  title              String
  prompt             String

  status             ExplorationStatus

  type               ExplorationType?
  intensity          ExplorationIntensity?

  generationContext  Json?

  skipReason         String?

  systemObservations Json?

  createdAt          DateTime @default(now())

  expiresAt          DateTime?
  completedAt        DateTime?
  skippedAt          DateTime?

  user               User @relation(fields: [userId], references: [id])

  reflections        Reflection[]

  @@index([userId, status])
}
```

---

## Reflection

```prisma
enum ReflectionSource {
  COMPLETION
  SKIP
  EXPIRATION
}

model Reflection {
  id                  String   @id @default(cuid())

  explorationId       String

  source              ReflectionSource?

  emotionalState      String?

  energyLevel         Int?
  curiosityLevel      Int?
  intimidationLevel   Int?

  selectedSignals     String[]

  notes               String?

  createdAt           DateTime @default(now())

  exploration         Exploration @relation(fields: [explorationId], references: [id])
}
```

---

# Important Implementation Notes

## One Active Exploration Rule

Application logic must ensure:

- only ONE ACTIVE exploration exists per user

This should be enforced both:

- in backend logic
- and ideally at DB level if possible

---

## generationContext Purpose

`generationContext` exists for:

- AI explainability
- debugging
- generation quality improvement
- future personalization refinement

Example:

```json
{
  "basedOnSignals": ["curiosity", "avoidance"],
  "basedOnTensions": ["stability vs creativity"],
  "reason": "User repeatedly showed energy around creative workflows but avoided technical implementation"
}
```

---

# Non-Goals

The system is NOT intended to provide:

- career certainty
- aptitude scoring
- personality typing
- perfect career matching

The system exists to:

> help users gradually understand themselves through guided exploration.