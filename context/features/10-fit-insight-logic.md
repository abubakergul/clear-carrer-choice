# Fit Insight Logic

## Overview

The "fit insight" is the core output of ClearCareerChoice. It is NOT a quiz result, NOT a percentage of tasks done. It is a living description of the user's patterns — updated over time based on their conversation and task feedback.

## What the Fit Insight Is

A `FitInsight` has:
- `summary` — 1–2 sentences describing what the student tends to enjoy, avoid, and value. Written in pattern language, not advice language.
- `areas` — 2–3 career areas that match the pattern

Example:
```
summary: "You tend to enjoy work that combines creativity with clear structure, 
and you're drawn to seeing tangible results from your efforts. 
You've shown low interest in high-uncertainty or fast-changing environments."

areas: ["UX Design", "Architecture", "Industrial Design"]
```

## When the Fit Insight is Created

Immediately after the user signs up and their conversation is linked to their account:
1. Retrieve the full conversation transcript
2. Call OpenAI with the analysis prompt (see `@context/features/07-result-page.md`)
3. Parse the JSON response
4. Save to `FitInsight` model
5. Immediately also generate 7 tasks (see `@context/features/09-daily-tasks.md`)
6. Redirect to `/result`

This should be triggered in the signup Server Action after the user is created and the conversation is linked.

## When the Fit Insight is Updated

After the user submits feedback on 3 or more tasks, the insight is updated using the task feedback (see `@context/features/09-daily-tasks.md` for the update prompt).

The update is triggered automatically after `submitTaskFeedback` when feedback count reaches 3, 5, or 7.

## Important Rules

- The summary must NEVER say "you should become X" or "you are a X type"
- Always use pattern language: "you tend to...", "you've shown...", "you're drawn to..."
- The disclaimer on the result page is always visible — this is not a final answer
- The fit insight can change. That is intentional. It means the product is working.

## What the Fit Insight is NOT

- NOT a personality type label
- NOT a percentage match score
- NOT based on task completion
- NOT a final career recommendation
- NOT permanent

## References

- `@context/project-overview.md`
- `@context/features/07-result-page.md`
- `@context/features/09-daily-tasks.md`
- `@context/coding-standards.md`
