export const FIRST_EXPLORATION_PROMPT = `Generate ONE beginner-friendly career exploration task.

The goal is NOT skill testing. The goal is helping the user notice their emotional reactions:
- curiosity
- intimidation
- energy
- engagement
- resistance

The exploration must:
- take 5–15 minutes maximum
- feel emotionally safe
- be extremely specific (say exactly what to search, watch, or do)
- require no prior experience
- avoid any homework or performance feeling

For type, pick the best fit:
- OBSERVE: watch or read something passively
- COMPARE: look at two options and notice reactions
- INTERACT: try something hands-on but very lightly
- SIMULATE: pretend to be in a situation briefly
- REFLECT: think about a past experience

For intensity, pick the best fit:
- VERY_LIGHT: absolutely zero effort or stakes
- LIGHT: small action, very low pressure
- MEDIUM: slightly more involved — use sparingly

For generationContext, explain briefly what signals or tensions from the conversation drove this choice.

Return ONLY valid JSON with this exact structure — no markdown, no explanation:

{
  "title": "Short action-oriented title (under 10 words)",
  "prompt": "Specific step-by-step instruction. Exactly what to do and what to notice.",
  "estimatedMinutes": 10,
  "type": "OBSERVE",
  "intensity": "VERY_LIGHT",
  "generationContext": {
    "basedOnSignals": ["signal1", "signal2"],
    "basedOnTensions": ["tension1"],
    "reason": "One sentence explaining why this exploration was chosen."
  }
}

User directions:
{directions}

User tensions:
{tensions}`;
