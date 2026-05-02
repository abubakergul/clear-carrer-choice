# AI Conversation

## Overview

The core of the entire product. This is the conversation screen where the student talks to the AI. It must feel like texting a calm, non-judgmental friend — not a chatbot, not a quiz, not a counsellor.

## Route

`/chat`

## Requirements

- Public route — no login required
- A `sessionId` is generated client-side (uuid) and stored in sessionStorage to track the guest user
- The conversation is saved to the database (Conversation + Message models) using the sessionId
- AI uses a tightly controlled system prompt (see below)
- Max 5–6 AI exchanges, then the conversation ends and triggers the signup wall
- Messages stream in real time (use streaming API route, not Server Actions)
- Text input at the bottom — feels like a chat UI
- AI messages appear on the left, user messages on the right
- No avatars, no names — keep it minimal

## Conversation Flow

1. Page loads → AI immediately sends the opening message (do not make the user go first):
   *"What's making choosing a career hard for you right now?"*

2. User types a response → AI asks a follow-up question

3. After 5–6 total exchanges → AI sends a closing message:
   *"I've started to understand you. Let me save your results so we can continue."*

4. The signup wall appears (see `@context/features/06-signup-wall.md`)

## AI System Prompt

Store in `src/lib/prompts/conversation.ts`

```
You are a calm, non-judgmental career conversation guide for students.
Your job is to understand the student through natural conversation — not to give advice yet.

Rules:
- Ask only ONE question at a time. Never ask two questions in one message.
- Keep every response under 3 sentences.
- Use simple, friendly language. No academic or career-coach jargon.
- Never suggest a specific career yet — you are still listening.
- Show empathy if the student expresses anxiety or fear.
- Do not use bullet points or lists in your responses.
- After exactly 5 student responses, end with: "I've started to understand you. Let me save your results so we can continue."

Your opening message (sent first, before the user types anything):
"What's making choosing a career hard for you right now?"
```

## Streaming Implementation

- Use an API route: `POST /api/chat`
- Accept: `{ messages: Message[], sessionId: string }`
- Save each message to the database after streaming completes
- Stream the AI response using the OpenAI SDK's streaming API
- Return a `ReadableStream` to the client

## State Management

- Conversation messages stored in React state (client component)
- `sessionId` stored in `sessionStorage`
- Exchange count tracked in state — when it hits 5, set a flag to show signup wall after next AI response

## What NOT to Build Here

- No typing indicators (keep it simple for MVP)
- No file uploads
- No voice input
- No regenerate button

## References

- `@context/project-overview.md`
- `@context/coding-standards.md`
- OpenAI streaming docs: https://platform.openai.com/docs/api-reference/streaming
