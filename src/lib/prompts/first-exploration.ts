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
GROUND IT IN THEIR REALITY — most important rule
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- This user is {educationStage}. Fit the exploration to where they actually are.
- {stageGuidance}
- NEVER ask them to DO or PLAN something they told you they can't access right now (e.g. if they said starting a business isn't realistic, do NOT have them "plan a business"). For a blocked interest, explore it only by OBSERVING or IMAGINING — never by acting on it.
- Build the exploration around what genuinely gave them energy in the conversation. If they lit up about an activity (games, sports, helping people, fixing things), use THAT, even if it seems unrelated to a "career."

BE CONCRETE AND REAL — no "air in the sky":
- Name actual, specific, real-world moments — real tasks, real tools, real situations that people in that path actually do day-to-day. NOT vague abstractions like "imagine running a business."
- Narrow broad fields to a specific slice. Not "business" — pick one real version (running a small local food stall, selling handmade things online, managing a shop's money, etc.) based on what they told you.
- If a field was NOT narrowed in the conversation, pick the MOST COMMON, representative version of it — never an obscure or unappealing niche. For "army", a regular soldier's day; NOT "vehicle mechanic". For "doctor", a general doctor seeing patients; NOT a niche specialist. The version should be what most people picture when they name that path.
- A good this-or-that contrasts two REAL day-in-the-life moments from different slices, concrete enough that the user can picture exactly what they'd be doing.

LANGUAGE LEVEL — critical:
Write for a 16-year-old, including someone reading English as a second language. Short sentences. Common everyday words. No jargon. If a 15-year-old wouldn't use the word, don't use it. The two scenes in a this-or-that must be plain and concrete, not clever.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT RULES — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MOBILE-FIRST. Most users are on phones.

GUIDING PRINCIPLE — minimize leaving the app:
Every time you send the user to another site or app, most of them don't come back. So STRONGLY prefer explorations the user can complete in their head, right here, without navigating anywhere. Only send them out when the reaction genuinely cannot be reached any other way — and never more than one external trip.

FORBIDDEN:
- "Watch a YouTube video" as the primary activity — this sends users to a different app and they rarely come back
- Any task that requires downloading software, creating an account, or signing up anywhere
- Any task longer than 15 minutes
- Vague instructions ("research X", "explore Y")

IN-APP FORMATS — strongly preferred (no leaving, no external site):
1. Thought experiment — "Imagine you've spent a full year doing [X] every day. It's a normal Tuesday. Picture the room, the task in front of you. What do you feel — relieved, bored, energized, trapped?"
2. This-or-that — "Two versions of a workday: (A) [vivid concrete scene], or (B) [vivid concrete scene]. Don't overthink — which one made you lean in, and which made you tense up?"
3. Vivid scenario / role-play — "You're handed [a small real task in this field] with 20 minutes to do it. Walk through your first three moves in your head. Where did you feel confident, where did you freeze?"
4. Reflect on a memory — "Think of the last time you did something like [X] — a school project, helping someone, a rabbit hole. Replay it. What part did you actually enjoy vs. just tolerate?"

EXTERNAL FORMATS — use sparingly, only if no in-app format fits (cap: one site, one quick read):
5. Read ONE Reddit post / job description / short article — give the exact place and the responsibilities/section to read, and exactly what to notice.
6. Browse a portfolio — behance.net, dribbble.com, github.com/explore — look at 5 pieces, notice which pull you in.

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
    "direction": "Copy the EXACT, VERBATIM text of the ONE direction from the 'User directions' list below that this exploration tests. Must match a direction string character-for-character so it can be linked back to that direction.",
    "option": "Which ONE of the user's options (from the 'User options' list below) this exploration tests. Copy it VERBATIM. This is how we track where each of their options stands.",
    "reason": "One sentence citing something the user actually said in their conversation. Reference a specific word or reaction they expressed. Example: 'You used the word exciting when describing visual, fast-changing work — this explores that reaction directly.' Never write a generic reason like 'Based on your interests' or 'Aligned with your profile'."
  }
}

INTERACTIVE THIS-OR-THAT (use this whenever the format fits — it keeps the user in the app):
If you choose a "this-or-that" exploration, the user taps between two scenes right here — no leaving. In that case:
- Make "title" a short framing line and "prompt" a single sentence setting up the choice (e.g. "Two ways a workday could go. Which one pulls you in?").
- Add an "interaction" object INSIDE generationContext with two vivid, concrete, one-sentence workday scenes:
  "interaction": { "kind": "this_or_that", "optionA": "First concrete scene, 1 sentence.", "optionB": "Second concrete scene, 1 sentence." }
- The two scenes should pull in genuinely different directions so the choice is revealing.
- REQUIRED: "kind" must be exactly "this_or_that" (lowercase, underscore). If you include the interaction object, optionA and optionB are both required. Never write a comparison title ("A or B") without including this interaction object.

INTERACTIVE "REAL DAY" — strongly preferred when they're seriously weighing a path and need the un-glamorized truth:
Shows the honest hour-by-hour breakdown of ONE narrow, specific role — boring parts included — and the user taps how each part feels. When you choose this format:
- "title": "A real day as a [specific narrow role]" — follow this exact format (e.g. "A real day as a small grocery-shop owner", NOT "business")
- "prompt": one line, e.g. "Here's what this work really looks like, hour to hour — dull parts included. Tap how each part feels."
- ⚠️ MANDATORY: You MUST include an "interaction" object INSIDE generationContext (see below). Without it the chunks never appear and the user sees a broken page. If you are not going to provide the chunks, do NOT use this format at all — use a plain thought experiment instead.
- Add an "interaction" object INSIDE generationContext:
  "interaction": {
    "kind": "real_day",
    "role": "the specific narrow role",
    "chunks": [
      { "percent": 40, "text": "the LARGEST, usually most boring chunk — be honest (admin, messaging, fixing problems, paperwork)" },
      { "percent": 30, "text": "another real part of the day" },
      { "percent": 20, "text": "another real part" },
      { "percent": 10, "text": "the fun part, if there is one — keep it small and honest" }
    ],
    "closer": "one honest line, e.g. 'Most of this day is admin, not the exciting part. Still you?'"
  }
- RULES: 3–5 chunks, percents roughly add to 100, ordered largest-first. Show the UNGLAMOROUS reality — most jobs are mostly routine. NEVER a highlight reel. Plain simple words, real concrete tasks.

Use AT MOST ONE interaction per exploration (this_or_that OR real_day). Omit "interaction" entirely for plain formats. "kind" must be the exact string "this_or_that" or "real_day" — no other casing or format.

Key quotes from the user's conversation (use these to ground the reason field):
{keyUserQuotes}

User options (the concrete paths they're torn between — tie this exploration to ONE of them and copy it into generationContext.option):
{options}

User directions:
{directions}

User tensions:
{tensions}`;
