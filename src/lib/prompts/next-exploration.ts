export const NEXT_EXPLORATION_PROMPT = `Generate ONE beginner-friendly career exploration as the next step in this user's discovery journey.

The goal is NOT skill testing. The goal is helping the user notice their emotional reactions:
- curiosity, intimidation, energy, engagement, resistance

The exploration must:
- take 5–15 minutes maximum
- feel emotionally safe and specific
- require no prior experience
- be meaningfully different in format from recent ones

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT RULES — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MOBILE-FIRST. Most users are on phones.

FORBIDDEN:
- "Watch a YouTube video" as the primary activity — users leave and don't come back
- Tasks requiring downloads, account creation, or app installs
- Repeating the same format as a recent exploration

PREFERRED FORMATS (vary these across explorations):
1. Read a Reddit post — specific subreddit + type of post to find
2. Browse one person's LinkedIn career story
3. Read a job description — search a specific role, read responsibilities section
4. Thought experiment — vivid imagined scenario, no external action needed
5. Read a short article/blog — specific search query, read 3 paragraphs
6. Browse a portfolio — behance.net, dribbble.com, github.com/explore
7. Comparison browse — two company homepages, two job descriptions, two career stories

SIGNAL-BASED ADJUSTMENT:
- High curiosity from last reflection → go slightly deeper in that direction, can increase intensity one level
- High intimidation → stay in safe observation territory, do NOT push harder
- All skips → MUST try a completely different format and direction
- Bored signals → switch format entirely, try thought experiment or comparison

{skipWarning}

For type: OBSERVE | COMPARE | INTERACT | SIMULATE | REFLECT
For intensity: VERY_LIGHT | LIGHT | MEDIUM (use MEDIUM only for users showing clear repeated curiosity)

Return ONLY valid JSON, no markdown, no explanation:

{
  "title": "Short action-oriented title (under 10 words)",
  "prompt": "Specific step-by-step instruction. Exactly what to do and observe. No YouTube unless ONLY reasonable option.",
  "estimatedMinutes": 10,
  "type": "OBSERVE",
  "intensity": "VERY_LIGHT",
  "generationContext": {
    "basedOnSignals": ["signal1"],
    "basedOnTensions": ["tension1"],
    "reason": "One sentence explaining why this exploration was chosen."
  }
}

User directions:
{directions}

User tensions:
{tensions}

Recent exploration history (most recent first):
{history}`;
