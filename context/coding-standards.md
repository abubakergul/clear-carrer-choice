# Coding Standards

## TypeScript

- Strict mode enabled
- No `any` types — use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused — one job per component
- Extract reusable logic into custom hooks

## Next.js

- Server components by default
- Only use `'use client'` when needed (interactivity, hooks, browser APIs)
- Use Server Actions for form submissions and simple mutations
- Use API routes when you need:
  - Webhooks
  - Streaming AI responses
  - File uploads
  - Specific HTTP status codes or headers
  - Third-party integrations (OpenAI streaming)
- Otherwise, fetch data directly in server components
- Dynamic routes for user-specific pages (dashboard, result)

## Tailwind CSS v4

**CRITICAL**: We are using Tailwind CSS v4, which uses CSS-based configuration.

- **DO NOT** create `tailwind.config.ts` or `tailwind.config.js` files (those are for v3)
- All theme configuration must be done in CSS using the `@theme` directive in `src/app/globals.css`
- Use CSS custom properties for colors, spacing, etc.
- No JavaScript-based config allowed

Example v4 configuration:

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(50% 0.2 250);
}
```

## File Organization

- Components: `src/components/[feature]/ComponentName.tsx`
- Pages: `src/app/[route]/page.tsx`
- Server Actions: `src/actions/[feature].ts`
- Types: `src/types/[feature].ts`
- Lib/Utils: `src/lib/[utility].ts`
- AI prompts: `src/lib/prompts/[name].ts`

## Naming

- Components: PascalCase (`ConversationBubble.tsx`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Tailwind CSS for all styling
- Use shadcn/ui components where applicable
- No inline styles
- Light mode default, dark mode as option
- Mobile-first breakpoints

## Database

- Use Prisma ORM for all database operations
- Always use `prisma migrate dev` for schema changes (not `db push`)
- Run `prisma migrate status` before committing to verify migrations are in sync
- Production deployments must run `prisma migrate deploy` before the app starts

## AI / OpenAI

- All prompts live in `src/lib/prompts/` as exported constants
- Never hardcode prompt strings inside components or API routes
- Always use a system prompt to control tone, length, and format
- Streaming responses via API route (not Server Actions — streaming needs response headers)
- Never expose the OpenAI API key client-side

## Data Fetching

- Server components fetch directly with Prisma
- Client components use Server Actions or fetch to API routes
- Validate all inputs with Zod

## Error Handling

- Use try/catch in Server Actions and API routes
- Return `{ success, data, error }` pattern from actions
- Display user-friendly error messages via toast
- Never expose raw database or API errors to the client

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible
- AI conversation logic must be isolated — not mixed into UI components
