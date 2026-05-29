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
    "3-5 word direction label",
    "3-5 word direction label"
  ],
  "tensions": [
    "One sentence describing a tension.",
    "One sentence describing a tension."
  ],
  "patternSummary": "2-3 sentences observing recurring emotional patterns across their explorations. Reference actual signals (e.g. 'You consistently feel curious and energized in creative contexts, but resistant in highly structured solo work'). Never use the words: score, performance, productivity, achievement, success."
}

Rules:
- directions must be SHORT labels — 3 to 5 words only
- Evolve slowly: if only 1 reflection contradicts the pattern, do not change it
- Never say "you should become X" or "you are a [personality type]"
- patternSummary must reference real signal names from the data
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
