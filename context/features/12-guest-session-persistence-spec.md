# Guest Session Persistence + FitInsight Generation

## Overview

Wire up the guest conversation so nothing is lost when a user signs up or logs in.
Right now messages live only in React state and sessionStorage — they disappear on
registration. This feature saves every message to the database as the conversation
happens, claims the conversation on auth, generates the FitInsight from it, and
redirects the user to their result.

---

## Current State (before this feature)

- Chat API (`/api/chat`) streams AI responses but writes nothing to the DB.
- `Conversation` and `Message` Prisma tables exist but are empty.
- On sign-up the guest conversation is lost — no insight is ever generated.
- `FitInsight` table exists but is never populated for real users.

---

## Goals

1. Persist every guest message to the DB under a browser `sessionId`
2. On registration or sign-in, claim the conversation (set `userId`)
3. Generate a `FitInsight` from the saved messages immediately after claiming
4. Redirect the new/returning user to the result page (`/result`) to see their insight
5. If a logged-in user has no insight yet (edge case), allow them to re-run the flow

---

## Data Flow

### Step 1 — Session ID

On the very first user message in `/chat`:
- Generate a UUID (`crypto.randomUUID()`) if one doesn't exist in `sessionStorage`
- Store it as `sessionStorage.getItem("ccc_session_id")`
- This ID persists for the browser tab session

### Step 2 — Create Conversation on First Message

When the first user message is sent, POST to `/api/chat/session` (new route):
```
POST /api/chat/session
Body: { sessionId, educationStage }
Response: { conversationId }
```
- Creates `Conversation { sessionId, userId: null }` in DB
- Store `conversationId` in component state

### Step 3 — Save Messages as They Happen

After each complete exchange (user message sent + AI response fully streamed):
- Call a Server Action `saveMessages(conversationId, userMsg, aiMsg)`
- Saves two `Message` rows to the DB

### Step 4 — Claim on Auth

After successful registration (`/api/auth/register`) or sign-in (`credentialsSignIn` /
Google callback):
- Read `sessionId` from `sessionStorage`
- Call Server Action `claimConversation(sessionId)`:
  ```ts
  // Finds Conversation by sessionId where userId is null
  // Sets userId = session.user.id
  // Returns conversationId
  ```
- If no conversation found (user signed in on a different device): skip silently

### Step 5 — Generate FitInsight

Immediately after claiming, call `generateFitInsight(conversationId, userId)`:
- Reads all `Message` rows for the conversation
- Calls OpenAI with the insight generation prompt (see below)
- Parses the JSON response
- Upserts `FitInsight { userId, summary, strengths, conflicts }`
- Generates 7 `TaskEntry` rows (day 1–7) using the tasks prompt

### Step 6 — Redirect to Result

After FitInsight is created → redirect to `/result`

---

## Routes

| Route | Purpose |
|-------|---------|
| `POST /api/chat/session` | Create a Conversation row for a new guest session |
| `/result` | Show the FitInsight (protected — redirect to `/sign-in` if no session) |

---

## FitInsight Generation Prompt

Store in `src/lib/prompts/insight.ts`

```
You are analyzing a career exploration conversation to identify patterns.

Based on the conversation below, return a JSON object with:
- summary: 2-3 sentences describing the user's pattern (what they lean toward, avoid, and care about)
- strengths: 4-6 short phrases describing aligned career directions (not job titles, directions)
- conflicts: 3-5 short phrases describing tensions or mismatches

Rules:
- Never say "you should be X"
- Write as patterns and tendencies, not diagnoses
- Keep each phrase under 8 words
- Return ONLY valid JSON, no markdown

Format:
{
  "summary": "...",
  "strengths": ["...", "..."],
  "conflicts": ["...", "..."]
}

Conversation:
{messages}
```

---

## Result Page (`/result`)

### Route
`/result` — protected. Redirect to `/sign-in` if no session.

### Content (3 sections)

**Section 1 — Pattern Summary**
> "Based on our conversation, here's what I noticed:"
> `{fitInsight.summary}`

**Section 2 — What fits**
Label: "Directions that might align:"
Render each `strengths` item as a tag/pill.

**Section 3 — What conflicts**
Label: "Tensions worth knowing:"
Render each `conflicts` item.

**Disclaimer** (always shown):
> "This is a starting point, not a final answer. Use it to explore, not to decide."

**CTA:**
"See your 7-day exploration →" → `/dashboard`

---

## Return Visit Logic

| State | Behavior |
|-------|----------|
| Logged in + has FitInsight | `/` and `/chat` → `/dashboard` (already implemented) |
| Logged in + no FitInsight | `/chat` → allow chat; after wall → re-claim + re-generate |
| Guest + same browser tab | sessionStorage restores conversation (current behavior) |
| Guest + new tab/session | Fresh start — sessionStorage cleared |

---

## Files to Create / Modify

**New:**
- `src/app/api/chat/session/route.ts` — create Conversation row
- `src/app/result/page.tsx` — FitInsight result page
- `src/actions/conversation.ts` — `saveMessages`, `claimConversation`, `generateFitInsight`
- `src/lib/prompts/insight.ts` — FitInsight generation prompt

**Modified:**
- `src/components/chat/ChatInterface.tsx` — generate sessionId, call session API, save messages, claim on wall click
- `src/components/chat/SignupWall.tsx` — trigger claim + insight generation before redirecting
- `src/app/chat/page.tsx` — handle logged-in with no FitInsight edge case

---

## Edge Cases

- **User signs in on a different device** — no `sessionId` in sessionStorage → skip claim, show empty dashboard with prompt to start a new chat
- **AI generation fails** — show error on result page with "Try again" button that re-runs generation
- **User registers but closes tab before insight generates** — `Conversation` is claimed but `FitInsight` is missing → detect on dashboard and offer "Generate your insight" CTA
- **User does multiple guest chats** — only the most recent unclaimed `Conversation` is claimed (order by `createdAt DESC`)

---

## References

- `@context/project-overview.md`
- `@context/features/010-result-page.md`
- `@context/features/09-dashboard.md`
- `prisma/schema.prisma` — `Conversation`, `Message`, `FitInsight`, `TaskEntry`
