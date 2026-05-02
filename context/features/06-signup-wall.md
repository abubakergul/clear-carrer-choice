# Signup Wall

## Overview

After the AI conversation ends, before showing the result — the user hits a signup wall. This is the key moment. They have already invested time and feel understood, so they are motivated to sign up.

## Trigger

Shown automatically after the AI sends its closing message at the end of the conversation (5–6 exchanges).

## UI

- Appears as an overlay or a new section below the conversation
- Keep it minimal and warm — not a hard wall

**Heading:**
"I've mapped your strongest career matches and next steps."

**Subtext:**
"Create a free account to see your full result and save your progress."

**CTA Button:**
"Unlock my results" → goes to `/signup`

**Secondary link (subtle):**
"Already have an account? Log in"

## Behaviour

- The `sessionId` from the guest conversation must be passed to the signup/login flow
- After signup or login, the server should find the Conversation with that `sessionId` and link it to the new `userId`
- After linking, redirect to `/result`

## What NOT to Do

- Do not show any career result on this screen — the teaser copy is enough
- Do not make this feel aggressive or like a paywall
- Do not require payment

## References

- `@context/features/05-ai-conversation.md`
- `@context/features/07-result-page.md`
- `@context/coding-standards.md`
