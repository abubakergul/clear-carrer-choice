export const NEXT_EXPLORATION_PROMPT = `Generate ONE beginner-friendly career exploration as the next step in this user's discovery journey.

The goal is NOT skill testing. The goal is helping the user notice their emotional reactions:
- curiosity, intimidation, energy, engagement, resistance

The exploration must:
- take 5–15 minutes maximum
- feel emotionally safe and specific
- require no prior experience
- be meaningfully different in format from recent ones

GROUND IT IN THEIR REALITY — most important rule:
- NEVER ask them to DO or PLAN something the directions/tensions say they can't access right now. For a blocked interest, explore it only by OBSERVING or IMAGINING, never by acting on it.
- Build on what genuinely gave them energy (look at the directions and recent positive signals).

BE CONCRETE AND REAL — no "air in the sky":
- Name actual, specific, real-world moments — real tasks, tools, situations people in that path do day-to-day. Never vague ("imagine running a business").
- Narrow broad fields to one real slice. A this-or-that must contrast two REAL day-in-the-life moments concrete enough to picture exactly.
- If a field wasn't narrowed, use the MOST COMMON, representative version — never an obscure/unappealing niche (for "army", a regular soldier's day, NOT "vehicle mechanic").

LANGUAGE LEVEL — critical:
Write for a 16-year-old, including an English-as-a-second-language reader. Short sentences, common everyday words, no jargon. Any this-or-that scenes must be plain and concrete.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT RULES — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MOBILE-FIRST. Most users are on phones.

GUIDING PRINCIPLE — minimize leaving the app:
Every external trip loses users. STRONGLY prefer explorations completed in the user's head, right here, without navigating anywhere. Only send them out when the reaction genuinely cannot be reached otherwise — never more than one external trip.

FORBIDDEN:
- "Watch a YouTube video" as the primary activity — users leave and don't come back
- Tasks requiring downloads, account creation, or app installs
- Repeating the same format as a recent exploration

IN-APP FORMATS — strongly preferred (no leaving, vary these across explorations):
1. Thought experiment — vivid imagined "normal Tuesday" in this field; what do they feel?
2. This-or-that — two concrete workday scenes; which do they lean into vs. tense up at?
3. Vivid scenario / role-play — a small real task in the field, walk first moves in their head
4. Reflect on a memory — replay the last time they did something like this; enjoyed vs. tolerated?

EXTERNAL FORMATS — use sparingly, only if no in-app format fits (cap: one site, one quick read):
5. Read ONE Reddit post / job description / short article — exact place + section + what to notice
6. Browse a portfolio — behance.net, dribbble.com, github.com/explore

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
    "direction": "Copy the EXACT, VERBATIM text of the ONE direction from the 'User directions' list below that this exploration tests. Must match a direction string character-for-character so it can be linked back to that direction.",
    "option": "Which ONE of the user's options (from the 'User options' list below) this exploration tests. Copy it VERBATIM. This tracks where each option stands.",
    "reason": "One sentence citing a specific signal from a recent reflection. Must reference the actual signal name and exploration it appeared in. Examples: 'You felt Curious and Energized in your last creative exploration — this goes a step further in that direction.' OR 'You skipped the last structured task — this explores a similar theme from a much safer, observation-only angle.' Never write a generic reason like 'Based on your interests' or 'Aligned with your directions'."
  }
}

INTERACTIVE THIS-OR-THAT (use this whenever the format fits — it keeps the user in the app):
If you choose a "this-or-that" exploration, the user taps between two scenes right here — no leaving. In that case:
- Make "prompt" a single sentence setting up the choice (e.g. "Two ways a workday could go. Which one pulls you in?").
- Add an "interaction" object INSIDE generationContext with two vivid, concrete, one-sentence workday scenes:
  "interaction": { "kind": "this_or_that", "optionA": "First concrete scene, 1 sentence.", "optionB": "Second concrete scene, 1 sentence." }
- The two scenes should pull in genuinely different directions so the choice is revealing.

INTERACTIVE "REAL DAY" — strongly preferred when they're seriously weighing a path and need the un-glamorized truth:
Shows the honest hour-by-hour breakdown of ONE narrow, specific role — boring parts included — and the user taps how each part feels. When you choose this format:
- "title": "A real day as a [specific narrow role]"
- "prompt": one line, e.g. "Here's what this work really looks like, hour to hour — dull parts included. Tap how each part feels."
- Add an "interaction" object INSIDE generationContext:
  "interaction": {
    "kind": "real_day",
    "role": "the specific narrow role",
    "chunks": [
      { "percent": 40, "text": "the LARGEST, usually most boring chunk — be honest" },
      { "percent": 30, "text": "another real part" },
      { "percent": 20, "text": "another real part" },
      { "percent": 10, "text": "the fun part, if any — keep small and honest" }
    ],
    "closer": "one honest line, e.g. 'Most of this day is admin. Still you?'"
  }
- RULES: 3–5 chunks, percents roughly add to 100, largest-first. Show the UNGLAMOROUS reality — never a highlight reel. Plain words, real tasks.

Use AT MOST ONE interaction per exploration (this_or_that OR real_day). Omit "interaction" for plain formats.

COVER ALL THEIR OPTIONS — the whole point is helping them compare:
The user is torn between the options listed below. Don't keep probing the same one. Look at the history: if an option has NOT been explored yet, strongly prefer testing it now. Rotate across their options so each gets a fair look — that's how they see where each one stands.

User options (the concrete paths they're torn between — tie this exploration to ONE and copy it into generationContext.option):
{options}

User directions:
{directions}

User tensions:
{tensions}

Recent exploration history (most recent first):
{history}`;
