# Prisma + Neon PostgreSQL Setup

## Overview

Set up Prisma ORM with a Neon PostgreSQL database for ClearCareerChoice.

## Requirements

- Use Neon PostgreSQL (serverless)
- Create initial schema based on the data models in `@context/project-overview.md`
- Include NextAuth v5 models (Account, Session, VerificationToken)
- Add appropriate indexes and cascade deletes
- Use a development branch in Neon for local work, production branch for prod
- ALWAYS create migrations with `prisma migrate dev` — never use `db push`

## Schema Models to Implement

- User
- Conversation
- Message
- FitInsight
- TaskEntry
- NextAuth models (Account, Session, VerificationToken)

## Notes

- We will have a `DATABASE_URL` pointing to the Neon dev branch locally
- Production will use a separate Neon branch via environment variable
- Use Prisma 6 (check latest stable — Prisma 7 has breaking changes, verify before using)
- Add `@db.Text` annotation on long string fields (content, summary)
- sessionId on Conversation is a string used to track guest users before they sign up — this links a pre-signup conversation to the user after they register

## References

- `@context/project-overview.md` (data model section)
- `@context/coding-standards.md`
- Prisma docs: https://www.prisma.io/docs
