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
- be extremely specific (say exactly what to do)
- require no prior experience
- avoid any homework or performance feeling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT RULES — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MOBILE-FIRST. Most users are on phones. Prioritize activities that work without leaving the browser.

FORBIDDEN:
- "Watch a YouTube video" as the primary activity — this sends users to a different app and they rarely come back
- Any task that requires downloading software, creating an account, or signing up anywhere
- Any task longer than 15 minutes
- Vague instructions ("research X", "explore Y")

PREFERRED FORMATS (pick one that fits):
1. Read one Reddit post — e.g. "Go to reddit.com/r/cscareerquestions and read the top post this week. Notice what feelings come up."
2. Browse one person's LinkedIn — "Find someone who works as [X] and read their career story section. Notice: does their path sound like something you could imagine?"
3. Read a job description — "Search '[role] job description' and open the first result. Read the responsibilities section slowly. Notice what sounds interesting vs. draining."
4. Thought experiment — "Imagine you've been doing [X] every day for a year. What do you feel — relieved, bored, energized, trapped?"
5. Read one article/blog post — "Search '[field] explained for beginners' and read the first 3 paragraphs. Notice: does this make you want to read more or close the tab?"
6. Browse a portfolio — "Go to [specific site like dribbble.com, github.com/explore, behance.net] and look at 5 pieces of work. Notice which ones, if any, make you want to look closer."
7. Light comparison — "Open the homepage of [Company A] and [Company B]. Read their tagline and About section. Notice which environment sounds more like where you'd want to spend your days."

For type, pick the best fit:
- OBSERVE: read, browse, or watch something passively
- COMPARE: look at two options and notice reactions
- INTERACT: try something hands-on but very lightly
- SIMULATE: pretend to be in a situation briefly
- REFLECT: think about a past experience

For intensity, pick the best fit:
- VERY_LIGHT: absolutely zero effort or stakes
- LIGHT: small action, very low pressure
- MEDIUM: slightly more involved — use sparingly

Return ONLY valid JSON, no markdown, no explanation:

{
  "title": "Short action-oriented title (under 10 words)",
  "prompt": "Specific step-by-step instruction. Exactly what to do and what to notice. No YouTube unless it is the ONLY reasonable option for this specific task.",
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
