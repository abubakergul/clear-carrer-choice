# Landing Page (V2 — Approved)

## Status: Done ✓

---

## What Works (Do Not Change)

This design was approved. Future iterations must preserve:

- **Eyebrow** — small, uppercase, letter-spaced, violet accent color
- **Headline** — large, bold, flows as one block (no forced line breaks), "guessing" in violet
- **Subtext** — one short sentence, muted gray, comfortable size
- **CTA** — violet button, rounded-2xl, shadow-violet, scale on hover/click
- **Microcopy** — short and human: "Takes 3 minutes. No account. No pressure."
- **Background** — soft radial gradient with a violet tint at center
- **Animations** — staggered fade-in on load

---

## Layout

- `min-h-screen`, centered, content slightly above center via `pb-16`
- `max-w-2xl` — wide enough for headline to stretch naturally
- `text-center`
- `gap-6` between sections

---

## Hero

### Eyebrow

> Most people get this wrong

- `text-xs font-semibold uppercase tracking-widest`
- Color: `text-violet-400`
- Fade in at 100ms

---

### Headline

> You're **guessing** your future. And it's costing you.

- `text-4xl sm:text-5xl font-bold leading-[1.15] tracking-tight text-gray-900`
- "guessing" → `font-extrabold text-[--color-accent]`
- NO forced `<br />` — let it wrap naturally at container width
- Fade up at 200ms

---

### Subtext

> This helps you test what actually fits — before you waste years going the wrong direction.

- `text-lg sm:text-xl leading-relaxed text-gray-500`
- Fade in at 350ms

---

## CTA

**Button text:** `Try it →`

**Route:** `/chat`

**Style:**

- `bg-[--color-accent]` (violet `#7c3aed`)
- `px-8 py-4 rounded-2xl`
- `text-lg font-semibold text-white`
- `shadow-lg shadow-violet-200`
- `hover:scale-105 active:scale-95 transition-transform duration-150`
- Fade in at 480ms

**Microcopy below:**

> Takes 3 minutes. No account. No pressure.

- `text-sm text-gray-400`

---

## Colors

Defined in `globals.css`:

```css
--accent: #7c3aed;
--accent-hover: #6d28d9;
```

Used as:

- Eyebrow text: `text-violet-400`
- "guessing" word: `text-[--color-accent]`
- CTA button: `background: var(--accent)`
- CTA shadow: `shadow-violet-200`

---

## Background

```css
radial-gradient(ellipse at 50% 35%, #f5f3ff 0%, #fafafa 60%, #f3f4f6 100%)
```

Subtle violet tint at center, fades to neutral gray at edges.

---

## Animations

Defined in `globals.css`:

```css
.anim-fade-up  — fade + translateY(12px), 400ms
.anim-fade-in  — fade only, 300ms
```

Applied with inline `animationDelay` style:

- Eyebrow: 100ms
- Headline: 200ms
- Subtext: 350ms
- CTA group: 480ms

---

## What NOT to Do

- No badges or pills with icons
- No background blobs or glows
- No secondary CTAs
- No feature lists or explanations
- No forced `<br />` in the headline
- No black-only color scheme — use the violet accent
