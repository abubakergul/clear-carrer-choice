# 12-guest-session-persistence-spec.md

# Guest Session Persistence + Initial Insight Generation

## Overview

The conversation should never disappear when a user signs up.

Every guest conversation is persisted in the database while it happens.
After authentication, the conversation is claimed by the user and used to generate the initial Fit Insight and first exploration.

The goal is continuity.

The user should feel:

> “The app remembers me and understands where I left off.”

---

# Current State (Before This Feature)

Currently:

* chat messages exist only in React state + sessionStorage
* conversations are lost after signup/login
* database tables are mostly unused
* no real FitInsight is generated
* no exploration flow exists

---

# Goals

## Primary Goals

1. Persist guest conversations in real time
2. Claim the conversation after authentication
3. Generate an initial FitInsight
4. Generate the first exploration
5. Redirect users into the exploration flow

---

# High-Level Flow

## Step 1 — Guest Starts Chat

On first user message:

* generate a browser `sessionId`
* store in `sessionStorage`

Key:

```ts id="4b9t9y"
ccc_session_id
```

This persists only for the current browser session.

---

## Step 2 — Create Conversation Record

On the first message:

```http id="3m78kq"
POST /api/chat/session
```

Request:

```json id="q5m6s4"
{
  "sessionId": "...",
  "educationStage": "college"
}
```

Creates:

```text id="8s6t6r"
Conversation {
  sessionId,
  userId: null
}
```

Returns:

```json id="4y5o4s"
{
  "conversationId": "..."
}
```

---

# Step 3 — Persist Messages

After every completed exchange:

* save user message
* save assistant message

Messages should be persisted AFTER streaming finishes successfully.

Use:

```ts id="6n1n2y"
saveMessages(conversationId, userMessage, assistantMessage)
```

This creates two `Message` rows.

---

# Step 4 — Authentication Claim

After successful:

* signup
* login
* OAuth callback

The frontend reads:

```ts id="n6k2ha"
sessionStorage.getItem("ccc_session_id")
```

Then calls:

```ts id="m9q3w1"
claimConversation(sessionId)
```

Server action:

* finds latest unclaimed conversation
* sets `userId`
* returns `conversationId`

If none exists:

* fail silently

Example:

* user switched devices
* session expired

---

# Step 5 — Generate Initial Fit Insight

Immediately after claim:

```ts id="a6f9f2"
generateInitialInsight(conversationId, userId)
```

This:

1. loads conversation messages
2. sends them to OpenAI
3. generates:

   * summary
   * directions
   * tensions
4. saves `FitInsight`

The insight is NOT:

* a recommendation
* a final answer

It is:

> an initial hypothesis worth exploring.

---

# Step 6 — Generate First Exploration

After FitInsight creation:

```ts id="n1t5wa"
generateFirstExploration(userId)
```

Important:

* generate ONLY ONE exploration initially
* explorations are sequential
* avoid pre-generating 7 tasks

The first exploration should:

* feel approachable
* create curiosity
* reduce intimidation

---

# Step 7 — Redirect To Result

After successful generation:

```text id="m3n8xq"
/result
```

The result page introduces:

* initial insight
* possible directions
* tensions
* first exploration CTA

---

# Routes

| Route                    | Purpose                      |
| ------------------------ | ---------------------------- |
| `POST /api/chat/session` | Creates Conversation         |
| `/result`                | Shows initial insight        |
| `/home`                  | Main exploration home screen |

---

# Session Rules

## Same Browser Session

Conversation restores automatically.

## New Browser Session

Fresh start.

## Logged-In User With Existing Insight

Redirect:

```text id="o5s2fo"
/home
```

## Logged-In User Without Insight

Allow:

```text id="5t6xj2"
/chat
```

Then regenerate insight after conversation.

---

# AI Insight Prompt

Store:

```text id="v8r7mq"
src/lib/prompts/insight.ts
```

---

## Prompt

```text id="t8n9pb"
You are analyzing a career exploration conversation.

Your job is NOT to recommend careers.

Your job is to identify:
- patterns
- tensions
- motivations
- environmental preferences
- curiosity signals
- avoidance patterns

Return ONLY valid JSON:

{
  "summary": "2-3 sentence summary",
  "directions": [
    "Direction 1",
    "Direction 2"
  ],
  "tensions": [
    "Tension 1",
    "Tension 2"
  ]
}

Rules:
- Never say “you should become”
- Never sound certain
- Use exploratory language
- Keep directions broad enough to explore
- Keep tensions emotionally realistic
- No markdown

Conversation:
{messages}
```

---

# First Exploration Generation Prompt

Store:

```text id="4s2z0r"
src/lib/prompts/first-exploration.ts
```

---

## Prompt

```text id="c8q0ko"
Generate ONE beginner-friendly career exploration.

The goal is NOT skill testing.

The goal is helping the user notice:
- curiosity
- intimidation
- energy
- engagement
- resistance

The exploration must:
- take under 15 minutes
- feel emotionally safe
- be extremely specific
- require no prior experience
- avoid homework feeling

Return ONLY JSON:

{
  "title": "...",
  "prompt": "..."
}

User directions:
{directions}

User tensions:
{tensions}
```

---

# Files To Create

## New

```text id="t7m0rk"
src/actions/conversation.ts
src/app/api/chat/session/route.ts
src/lib/prompts/insight.ts
src/lib/prompts/first-exploration.ts
src/app/result/page.tsx
```

---

# Files To Modify

```text id="d8m6ao"
src/components/chat/ChatInterface.tsx
src/components/chat/SignupWall.tsx
src/app/chat/page.tsx
```

---

# Edge Cases

## User Closes Tab During Generation

Conversation remains persisted.

If:

* user exists
* no FitInsight exists

Then:

```text id="d4n4zj"
Generate your insight
```

should appear on `/home`.

---

## AI Generation Failure

Show:

```text id="h9r2u3"
We couldn't generate your insight yet.
```

CTA:

```text id="u2q9x1"
Try again
```

---

## Multiple Guest Conversations

Claim ONLY:

* latest unclaimed conversation

Ordered by:

```text id="v0s1af"
createdAt DESC
```

---

# Important Product Rules

The system should NEVER:

* claim certainty
* assign identity labels
* generate personality types
* produce ranked career lists

The system should ALWAYS:

* frame outputs as exploration
* encourage movement
* reduce pressure
* preserve emotional trust

## References

- `@context/project-overview.md`
- `@context/features/05-ai-conversation.md`
- `@context/features/11-auth-phase-3-spec.md`
