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
  "summary": "Updated 2-3 sentence summary. Keep close to the original unless there is strong evidence to update it. If updating, reference the specific signal patterns that prompted the change.",
  "directions": [
    "A full sentence describing a direction with a because, grounded in specific signal data. Reference signal names and how often they appeared. Example: 'You have now shown Curious and Energized signals in 3 of your last 4 creative explorations — environments built around creative variety seem to pull you consistently.'",
    "A full sentence for another direction, citing specific signal evidence."
  ],
  "tensions": [
    "A full sentence describing a tension with its signal evidence. Example: 'You have shown Resistant or Overwhelmed signals in 3 of 4 structured explorations — the resistance to high-structure environments is strengthening across the data.'",
    "A full sentence for another tension, citing signal evidence."
  ],
  "patternSummary": "2-3 sentences observing recurring emotional patterns. Reference actual signal names and counts (e.g. 'In 4 of your last 6 explorations, you selected Curious and Energized — both appeared most in creative, open-ended contexts'). Never use the words: score, performance, productivity, achievement, success."
}

Rules:
- directions must be grounded sentences citing signal counts — not short labels
- Evolve slowly: if only 1 reflection contradicts the pattern, do not change it
- Never say "you should become X" or "you are a [personality type]"
- patternSummary must reference real signal names and counts from the data
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
