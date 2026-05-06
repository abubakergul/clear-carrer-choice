# AI Conversation

## Purpose

Build a simple chat experience at `/chat` where a student talks to AI for a few messages and then hits a signup wall.

This is the core MVP feature.

The focus is:

* Natural conversation
* Short interaction
* Strong emotional clarity
* Clean ending that creates curiosity

---

## High-Level Flow

1. User lands on `/chat`
2. AI message appears immediately (no API call)
3. User replies
4. AI responds with a follow-up question
5. Repeat until user sends 5 messages
6. AI sends closing message
7. Signup wall appears

---

## Non-Negotiable Rules

* Maximum: **7 user messages**
* AI must ask **only one question per message**
* AI responses must be **short (max ~3 sentences)**
* AI must **not suggest careers**
* Conversation must feel **human, not robotic**

---

## System Prompt

Stored in:

`src/lib/prompts/conversation.ts`

The prompt must:

* Define tone (calm, non-judgmental)
* Enforce 1-question rule
* Prevent advice
* Force closing message after 5 responses

---

## Frontend Responsibilities

### Chat Page (`/chat`)

* Generate `sessionId` (UUID)
* Store in `sessionStorage`
* Pass it to chat component

---

### Chat State

Maintain:

* messages (array of user + AI messages)
* isStreaming (boolean)
* showSignupWall (boolean)

---

### Initial Behavior

On page load:

* Insert AI opening message instantly:

  "What's making choosing a career hard for you right now?"

* Do NOT call API for this

---

### Sending a Message

When user sends a message:

1. Add user message to state
2. Count total user messages

---

### Conversation Limit Logic

If user message count === 7:

* Do NOT call API
* Instead:

  * Show final AI message:
    "I've started to understand you. Let me save your results so we can continue."
  * After ~500ms:

    * Show signup wall

---

### Normal AI Response Flow

If under limit:

1. Call `/api/chat`

2. Send:

   * messages array
   * sessionId

3. Receive streaming response

4. Append tokens progressively to UI

5. Disable input while streaming

---

## API Responsibilities (`/api/chat`)

### Model Configuration

Use:

* model: `gpt-4.1-mini`

NOTE:
The API key does NOT define the model.
The model is explicitly set in code.

---

### API Implementation (Next.js App Router)

File:

`app/api/chat/route.ts`

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: process.env.SYSTEM_PROMPT!,
        },
        ...messages
      ],
    });

    return Response.json({
      output: response.output[0].content[0].text,
    });

  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

### Streaming (Recommended)

Replace `.create()` with:

```ts
const stream = await client.responses.stream({
  model: "gpt-4.1-mini",
  input: [...messages],
});
```

Stream tokens back to client.

---

## Message Persistence

* Save user message immediately
* Save AI message after streaming completes
* Link via `sessionId`

---

## UI Rules

* Chat layout (text-message style)
* AI messages → left
* User messages → right
* No avatars
* No usernames
* Minimal design

---

## Input Behavior

* Input at bottom
* Disabled while AI responds
* Press Enter to send

---

## Error Handling (Simple)

If API fails:

Show:

"Something went wrong. Try again."

Allow resend.

---

## Signup Wall Trigger

* Only after final AI message
* Must clearly interrupt flow
* Modal or full-screen overlay

---

## Session Persistence

* Store `sessionId` and full `messages` array in `sessionStorage`
* Key: `ccc_session` and `ccc_messages`
* On mount: restore from `sessionStorage` if present — back navigation must resume the conversation, not restart it
* Do NOT clear session on page reload or back-navigation

---

## Chat Design Principles (Not a quiz. Not ChatGPT.)

The conversation should feel like a guided interview with a sharp, caring friend — not an open-ended AI chat.

Visual treatment that enforces this:

* AI messages → full-width white cards with subtle shadow (weighted, authoritative)
* User replies → right-aligned compact violet bubbles (responses, not commands)
* Progress bar in header showing exchange count
* Reply counter ("X of 7 replies") in header — creates intentional scarcity
* Logo mark in header (violet square with icon)
* No avatars. No timestamps. No "AI" label.

Do NOT make it look like ChatGPT (equal-width bubbles, dark sidebar, tokens-per-second counter).

---

## Quick-Tap Chips (Opening Message)

The first question requires typing — highest drop-off point. Show tap-to-select chips under the opening AI message.

* Show only under message index 0, only before the first user reply (`userCount === 0`)
* Tapping a chip calls `send(chipText)` directly — no typing required
* Disappear automatically once user sends their first message
* Input placeholder changes to "Or type your own reply…" to signal chips are optional

Current chips (update if user research shows better options):

* "Too many options, I don't know where to start"
* "Scared of choosing wrong and wasting years"
* "I don't know what I'm actually good at"
* "Torn between passion and a stable income"
* "My family wants something different for me"
* "I just feel completely stuck"

---

## Prompt Conversation Arc (7 messages)

The AI must follow this arc — NOT drill one topic for 5 questions:

* Messages 1–2: Surface ALL options on the table. If user names multiple paths, reference BOTH.
* Messages 3–4: Dig into what drives them beyond enjoyment — goals, values, fears of wrong choice.
* Messages 5–6: Surface the real tension. What makes them hesitate? What would they regret?
* Message 7: Closing line only — no question. Triggers signup wall.

Rule: no more than 2 follow-up questions on any single sub-topic. Move the arc forward.

---

## Handling Vague Answers

The AI must NOT accept vague answers and pivot to the next topic. If the user says "no", "idk", "i don't know man", or any one-word non-answer:

* Stay on the same topic
* Ask from a completely different angle
* Example: "no" to "have you tried anything?" → "Even in school — is there a subject that felt less boring than the rest?"

The AI has not earned the right to move forward until it gets something real.

---

## Quality-Gated Signup Wall (not time-gated)

The wall fires when the AI decides the conversation is complete — NOT on a fixed message count.

The AI ends with one of two exact closing messages:

* **Pattern found:** "I'm starting to see a pattern. Sign up to see what I found — and get a plan to test if it actually fits you."
* **Still vague:** "We've started building a picture. Sign up to keep going — the more you share, the clearer it gets."

Frontend detects which trigger was used (startsWith check) and shows the matching wall variant.

Safety ceiling: 12 user messages max. If the AI hasn't self-closed by then, frontend forces the "continue" variant.

Progress shown as 3 named stage dots (not a countdown bar):

* Stage 1 (messages 1–3): "Getting to know you"
* Stage 2 (messages 4–8): "Going deeper"
* Stage 3 (messages 9+): "Finding your pattern"

Signup wall variants:

**Pattern variant:**

* Heading: "I'm starting to see a pattern."
* CTA: "See my results →"

**Continue variant:**

* Heading: "We've started something."
* CTA: "Continue the conversation →"

Session state (`ccc_wall`) is persisted in `sessionStorage` so the wall reappears on back-navigation.

---

## What NOT to Build

* No typing indicators
* No voice input
* No file uploads
* No regenerate button
* No multiple conversations

---

## Success Criteria (MVP)

* User completes conversation
* Feels natural
* AI feels understanding
* User is curious
* User reaches signup wall

---

## Key Risk

If AI feels generic or robotic, users will leave immediately.

Conversation quality matters more than technical implementation.

---

## Prompt Design Rules (Learned from v1 failure)

The first system prompt produced therapy-style conversations — vague emotional reflection with no career focus. The AI asked things like "What does security feel like in your everyday life?" after a student said "security and stability". This is wrong.

**The prompt must:**

* Push toward concrete, career-specific information
* Ask about actual paths being weighed, past moments of engagement, specific fears about choosing wrong
* Reject vague emotional probing
* Push back gently when answers are one-word or vague

**Bad AI questions (never allow):**

* "What does that mean to you?"
* "When have you felt happiest?"
* "What does security feel like in your everyday life?"

**Good AI questions (target these):**

* "What are the two or three paths you're actually weighing right now?"
* "Is there anything — a class, project, job — where you forgot to check the time?"
* "If you picked the wrong career in 5 years, what would that look like?"

---

## UI Color Rules

The chat UI must use the brand violet (`#7c3aed`, `--color-accent`) — not black/white everywhere.

* AI bubbles: `bg-violet-50 text-stone-800`
* User bubbles: `bg-[--color-accent] text-white`
* Send button: `bg-[--color-accent]`
* Input focus ring: `focus:border-[--color-accent]`
* Header: small violet dot + brand name
* Replies counter in header

---

## Critical Setup Requirements

Before this works:

1. Add `OPENAI_API_KEY` to `.env.local`
2. Enable billing in OpenAI dashboard
3. Restart dev server after adding env vars

Without billing, API calls may fail.
