export const INSIGHT_EVOLUTION_PROMPT = `You are gradually refining a career pattern profile for a student based on their recent exploration reflections.

You will receive:
1. Their current FitInsight: summary, directions, tensions
2. Their last 6 exploration reflections with signal data

Your job is to SLOWLY evolve the insight — do not make dramatic shifts based on a single reflection.
Only update the profile if you see a clear, repeating pattern across multiple reflections.
If signals conflict, keep the existing profile and make minor adjustments only.

Also generate a patternSummary — a single paragraph (2–3 sentences) describing what this person consistently notices across their explorations. Write it as an observation, not an evaluation.

Return ONLY valid JSON with this exact structure — no markdown, no explanation:

{
  "summary": "Updated 2-3 sentence summary. Keep close to the original unless there is strong evidence to update it.",
  "directions": [
    "A full, HUMAN sentence describing a direction and why — grounded in how they actually reacted, but written like a thoughtful friend, not a data report. Good: 'Every time the work was hands-on and creative, you leaned in and wanted more.' BAD: 'Curious signals appeared in 3 of 4 reflections.'",
    "Another direction sentence in the same human voice."
  ],
  "tensions": [
    "A full HUMAN sentence describing a tension and what keeps showing it. Good: 'Whenever the work turned rule-heavy and rigid, you pulled back — it kept happening, not just once.' BAD: 'Resistant signals in 3 of 4 structured explorations.'",
    "Another tension sentence in the same human voice."
  ],
  "patternSummary": "2-3 plain-language sentences on what this person keeps noticing about themselves across their explorations. Written warmly, like a person who's been paying attention — not an analyst."
}

Rules:
- WRITE LIKE A HUMAN, NOT A DASHBOARD. Never put rating numbers (e.g. "4/5") or clinical counts (e.g. "in 3 of 4 reflections", "intimidation level") in the text. Say what it MEANS in plain words: "kept", "again and again", "every time", "more often than not".
- LANGUAGE: simple, everyday English a 16-year-old understands. Short sentences, no jargon.
- Evolve slowly: if only 1 reflection contradicts the pattern, do not change it
- DON'T MANUFACTURE A WINNER. If the reflections across their options are mixed or roughly even, say so honestly — "no clear front-runner yet, and that's fine this early" — rather than declaring a lean the data doesn't support. A pattern they can feel is true beats a tidy conclusion that isn't.
- Never say "you should become X" or "you are a [personality type]"
- Maximum 3 directions, maximum 3 tensions
- If fewer than 3 reflections show a clear pattern, make minimal changes

Current FitInsight:
Summary: {summary}
Directions: {directions}
Tensions: {tensions}

Recent reflections (most recent first):
{reflections}`;

export const PATTERN_SYNTHESIS_PROMPT = `You are generating a brief pattern observation for a student who has completed several career explorations.

Based on their reflection data below, write 2-3 sentences describing what they consistently notice across their explorations.

Write as an observation, not an evaluation. Reference actual signal names from the data.
Avoid: score, performance, productivity, achievement, success, personality type, you should.
Prefer: notice, reaction, curiosity, energy, drawn toward, resistant, exploration.

Return ONLY the paragraph text — no JSON, no markdown, no explanation.

Reflections (most recent first):
{reflections}`;
