# Next.js Project Setup

## Overview

Initial setup of the ClearCareerChoice Next.js project from scratch.

## Requirements

- Create a new Next.js app using the latest version with the App Router
- TypeScript strict mode enabled
- Tailwind CSS v4 (CSS-based config — NO tailwind.config.js)
- ShadCN UI initialised
- ESLint configured
- Folder structure set up as per `@context/coding-standards.md`
- Clean `globals.css` with base theme variables

## Folder Structure to Create

```
src/
  app/
    page.tsx          ← landing page (placeholder for now)
    layout.tsx        ← root layout
    globals.css       ← tailwind v4 + theme vars
  components/
    ui/               ← ShadCN components go here
  lib/
    prompts/          ← AI system prompts
  actions/            ← Server Actions
  types/              ← TypeScript types
```

## Notes

- Do NOT install or configure `tailwind.config.js` — we are on Tailwind v4
- Dark mode class strategy: `class` (so we can toggle manually later)
- Default theme should feel calm and clean — light background, soft neutrals
- The landing page at this stage is just a placeholder `<h1>ClearCareerChoice</h1>`

## References

- `@context/coding-standards.md`
- `@context/project-overview.md`
