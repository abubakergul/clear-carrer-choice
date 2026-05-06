# Current Feature: AI Conversation

## Status

In Progress

## Goals

- [x] Route `/chat` — public, no auth required
- [x] Education stage selector before conversation starts (school / college / graduating / graduated)
- [x] Stage-specific opening message based on education selection
- [x] Education stage context injected into system prompt per API call
- [x] AI opening message appears instantly on load (no API call)
- [x] Quick-tap chips under opening message (6 options) — user can start without typing
- [x] Streaming AI responses via `/api/chat` using `gpt-4.1-mini` Responses API
- [x] Input disabled while streaming, Enter to send, auto-resize textarea
- [x] Session persists on back-navigation and reload — fresh visits always start clean
- [x] Quality-gated signup wall — AI decides when to close, NOT a fixed message count
- [x] Two signup wall variants: "pattern" (AI got signal) vs "continue" (still vague)
- [x] Safety ceiling at 12 user messages — forces "continue" wall if AI hasn't self-closed
- [x] Signup wall trigger detection — normalized smart/curly quotes so `includes()` works reliably
- [x] 3-segment circular SVG progress ring in header (replaces flat dots)
- [x] Stage ring hidden until education stage is selected
- [x] Mid-conversation chips — topic-aware sets (motivation, resources, fear, experience, yes/no, scale)
- [x] Chip detection guard — no chips on open-ended listing questions
- [x] Logo mark in header (violet square with person icon)
- [x] Error state with retry
- [ ] **PENDING: Full conversation quality validation** — test all 4 education stages end-to-end

## Notes

### File locations

- `/chat` page → `src/app/chat/page.tsx`
- `src/components/chat/ChatInterface.tsx` — all state, streaming, education selector, session, stage ring, chips
- `src/components/chat/SignupWall.tsx` — two variants (pattern / continue)
- `src/app/api/chat/route.ts` — streaming POST, injects education stage context into system prompt
- `src/lib/prompts/conversation.ts` — full system prompt

### Education stage flow

1. User arrives at `/chat` → sees "Where are you right now?" with 4 cards (no AI call)
2. Taps a card → opening message appears (stage-specific, no API call)
3. Every subsequent API call includes `educationStage` → injected as extra context block appended to system prompt
4. Stage ring + stage label appear in header only after selection
5. Session stores `ccc_stage` in sessionStorage — restored on back/reload, cleared on fresh visit

### Conversation arc (system prompt — 7 areas)

1. Options on the table — get everything named
2. **Dream path question** — ask by message 3 if no concrete answer yet: "If money, qualifications, and connections weren't a concern — what's the one thing you'd actually try?" — anchors the rest of the conversation
3. Experience — what have they actually tried
4. Motivation — money, freedom, status, impact, passion
5. Access/resources — is this path realistic? (money, connections, qualifications, geography)
6. Wrong choice — what would they lose
7. Hesitation — what's holding them back

Pacing rules enforced in prompt:
- Dream path question by message 3
- Areas 1–3 by message 6
- 5 areas by message 10
- Max 3 exchanges per area then move forward

### Chip sets (mid-conversation)

- **Motivation** (what draws/drives/motivates): Passion for it, Money & security, Freedom & flexibility, Status & respect, Making an impact, Helping people
- **Resources** (afford/realistic/accessible/barriers): No it's not realistic right now, I have support, Money is tight, Need connections I don't have, Not sure yet
- **Fear** (wrong choice/regret/hesitation/losing): Wasting years, Disappointing my family, Not being good enough, Trying is better than nothing, Missing a better path
- **Experience** (tried/done/internship/hands-on): Yes a bit, Never tried it, Only in theory, Seen someone else do it
- **Yes/No** (last sentence starts with have you/did you/do you etc.): Yes, Sort of, Not really
- **Scale** (last sentence starts with how much/how often): A lot, A little, Not at all
- **Guard**: returns null (no chips) if question contains "name all/every", "list the", "what specific roles/paths/options" — open-ended listing questions never show chips

### Signup wall trigger detection

```ts
const normalized = text
  .replace(/['']/g, "'")
  .replace(/[""]/g, '"')
  .replace(/[–—]/g, "-");
if (normalized.includes(PATTERN_TRIGGER)) return "pattern";
if (normalized.includes(CONTINUE_TRIGGER)) return "continue";
```

GPT models output curly/smart apostrophes. Without normalization, `includes()` silently fails.

### System prompt key rules (summary)

- Dream path question by message 3 (area 2)
- Max 3 sentences per response, ONE question only
- Never say "Got it / Okay / I understand" to a vague answer
- Never use "have you / did you / do you" as question openers unless genuinely yes/no
- Accept concrete answers and move on — don't interrogate what's already answered
- Frustration signal → "Fair enough, let me ask something different" + pivot
- Ethical guidance: alcohol/gambling/adult content → surface concern, redirect to same motivation via cleaner path. Never say "haram". One mention only.
- Occasional single emoji when natural — never on heavy/distress topics
- Closing message must be sent ALONE — no prefix or suffix sentence
- PATTERN_TRIGGER: `"I'm starting to see a pattern. Sign up to see what I found — and get a plan to test if it actually fits you."`
- CONTINUE_TRIGGER: `"We've started building a picture. Sign up to keep going — the more you share, the clearer it gets."`

### Session storage keys

- `ccc_session` — UUID, identifies the conversation
- `ccc_messages` — full messages array (JSON)
- `ccc_wall` — "pattern" | "continue" — persists wall on back/reload
- `ccc_stage` — "school" | "college" | "graduating" | "graduated"

### Env and setup

- API key: `.env.local` at project root (NOT inside `src/app/` — that file is wrong location but gitignored)
- OpenAI billing must be active
- Restart dev server after changing env vars
- Dev server runs on port 3000 (PID varies)

### Known issues / watch list

- AI occasionally still asks two questions in one message (GPT compliance issue, not fully eliminatable via prompt)
- Chip detection is regex-based — will miss edge cases. Acceptable for MVP.
- Education stage selector has no animation — cards just appear. Could add fade-in later.

## History

- **Landing Page** — Route `/`, public. Headline: "You don't need to choose a career. You need to stop guessing." Black CTA button "Try it now →" → `/chat`. Background `#FAFAF9`. Minimal, no decorative elements. Files: `src/app/page.tsx`, `src/app/globals.css` (brand violet defined as oklch).
- **AI Conversation (core)** — Full streaming chat, session persistence, opening chips, circular stage ring, mid-conversation chips, quality-gated signup wall, education stage selector, dream path arc, ethical guidance, smart quote normalization for wall trigger.
