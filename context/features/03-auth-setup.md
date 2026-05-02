# Authentication Setup

## Overview

Set up NextAuth v5 with email/password and GitHub OAuth for ClearCareerChoice.

## Requirements

- NextAuth v5 (Auth.js)
- Two providers:
  - Email + Password (credentials provider)
  - GitHub OAuth
- Prisma adapter for session storage
- Protect dashboard and result routes (redirect to login if not authenticated)
- Guest users can access landing page and conversation without login
- Auth is only required at the signup wall (after conversation, before showing results)

## Key Auth Behaviour

- `/` — public (landing page)
- `/chat` — public (guest conversation)
- `/signup` — public
- `/login` — public
- `/result` — protected (redirect to login if no session)
- `/dashboard` — protected (redirect to login if no session)

## Session Strategy

- Use database sessions (not JWT) so we can link guest conversation to the user after signup
- After signup, link the guest `sessionId` from the conversation to the new `userId`

## Notes

- Password hashing with `bcryptjs`
- Do not use `next-auth` v4 patterns — v5 has a different config structure. Read the Auth.js v5 docs before implementing.
- GitHub OAuth requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` env vars
- `NEXTAUTH_SECRET` must be set in `.env`

## Environment Variables Needed

```
DATABASE_URL=
NEXTAUTH_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## References

- `@context/project-overview.md`
- `@context/coding-standards.md`
- Auth.js v5 docs: https://authjs.dev
