# Current Feature

## Status

<!-- Not Started | In Progress | Completed -->

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details -->

## History

<!-- Keep this updated. Earliest to latest -->

- **Landing Page** — Route `/`, public. Headline: "You don't need to choose a career. You need to stop guessing." Black CTA "Try it now →" → `/chat`. Background `#FAFAF9`. Files: `src/app/page.tsx`, `src/app/globals.css`.

- **AI Conversation** — Full streaming chat at `/chat`. Education stage selector (school/college/graduating/graduated) as pre-conversation step. Stage-aware opening message and system prompt. 7-area conversation arc with dream path question by message 3. Quality-gated signup wall (pattern vs continue variants) with smart quote normalization. Mid-conversation chips (motivation, resources, fear, experience, yes/no, scale). 3-segment circular SVG progress ring. Session persistence (fresh visits clean, back/reload restores). Ethical career guidance in prompt. Safety ceiling at 12 messages. Files: `src/components/chat/ChatInterface.tsx`, `src/components/chat/SignupWall.tsx`, `src/app/api/chat/route.ts`, `src/lib/prompts/conversation.ts`.
