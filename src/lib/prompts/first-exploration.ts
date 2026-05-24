export const FIRST_EXPLORATION_PROMPT = `Generate ONE beginner-friendly career exploration.

The goal is NOT skill testing.

The goal is helping the user notice:
- curiosity
- intimidation
- energy
- engagement
- resistance

The exploration must:
- take under 15 minutes
- feel emotionally safe
- be extremely specific
- require no prior experience
- avoid homework feeling

Return ONLY JSON:

{
  "title": "...",
  "prompt": "..."
}

User directions:
{directions}

User tensions:
{tensions}`;
