# Data Architecture

The database is designed around:

* evolving user patterns
* exploration history
* behavioral signals
* reflection-driven insight updates

The system does NOT store:

* scores
* rankings
* personality types
* completion metrics

The product focuses on:

> reactions and patterns over time.

---

# Core Models

## User

Represents an authenticated student account.

A user can have:

* multiple conversations
* one evolving insight
* multiple explorations
* multiple reflections over time

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

Stores the original AI conversation.

Guest conversations are persisted using a browser `sessionId`
before authentication.

After signup/login:

* the conversation is claimed by the authenticated user
* used to generate the initial insight

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

Stores individual conversation messages.

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

Represents the user's current evolving insight.

This is NOT:

* a final answer
* a personality type
* a static recommendation

The insight evolves over time based on:

* explorations
* reflections
* behavioral patterns
* skips
* recurring reactions

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

Explorations are the core mechanic of the product.

An exploration is:

* short
* guided
* lightweight
* behavior-focused

The goal is NOT skill development.

The goal is observing:

* curiosity
* energy
* resistance
* engagement
* intimidation
* attention patterns

Only ONE exploration should be active at a time.

Explorations can:

* complete
* expire
* be skipped

```prisma
model Exploration {
  id                String   @id @default(cuid())

  userId            String

  fitInsightId      String?

  title             String
  prompt            String

  status            String
  // "active" | "completed" | "skipped" | "expired"

  aiInterpretation  String?

  createdAt         DateTime @default(now())

  expiresAt         DateTime?
  completedAt       DateTime?
  skippedAt         DateTime?

  user              User @relation(fields: [userId], references: [id])

  reflections       Reflection[]
}
```

---

## Reflection

Stores the user's emotional and behavioral reactions
to an exploration.

Reflections are structured instead of fully free-text.

This improves:

* signal quality
* interpretation consistency
* adaptive exploration generation

The product prioritizes:

* emotional reactions
* engagement patterns
* avoidance patterns

over:

* task completion

```prisma
model Reflection {
  id               String   @id @default(cuid())

  explorationId    String

  selectedSignals  String[]

  createdAt        DateTime @default(now())

  exploration      Exploration @relation(fields: [explorationId], references: [id])
}
```

---

# Behavioral Signal Philosophy

The system collects signals such as:

* curiosity
* confusion
* intimidation
* excitement
* boredom
* energy
* avoidance
* desire for structure
* desire for creativity

These signals help the system:

* refine future explorations
* evolve the insight
* identify stronger or weaker directions

The system should never reduce users to:

* scores
* personality labels
* rankings
* percentages

The goal is:

> gradual clarity through repeated interaction.

Note: This is will the second migration that is need to be done because this is the new architecture

## References

- `@context/project-overview.md`
- `@context/features/07-database-spec.md`
- `@context/features/08-seed-spec.md`