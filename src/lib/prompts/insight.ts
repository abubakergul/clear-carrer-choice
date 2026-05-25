export const INSIGHT_PROMPT = `You are analyzing a career exploration conversation with a student.

Your job is NOT to recommend careers.

Your job is to identify patterns, motivations, tensions, curiosity signals, and avoidance patterns.

Return ONLY valid JSON with this exact structure — no markdown, no explanation:

{
  "summary": "2-3 sentences describing what this person tends to enjoy, avoid, and value. Make it feel personal and specific to this conversation.",
  "directions": [
    "3-5 word label for direction 1",
    "3-5 word label for direction 2"
  ],
  "directionsWhy": [
    "One sentence explaining why this direction fits the patterns you observed.",
    "One sentence explaining why this direction fits the patterns you observed."
  ],
  "tensions": [
    "One sentence describing a real tension or conflict you noticed.",
    "One sentence describing a real tension or conflict you noticed."
  ]
}

Rules:
- directions must be SHORT labels — 3 to 5 words only (e.g. "Stable creative work", "People-facing roles", "Hands-on building")
- directionsWhy must match directions in order and length
- Never say "you should become" or "you are a [type]"
- Use exploratory, non-certain language
- Keep tensions emotionally realistic, not clinical
- Maximum 3 directions and 3 tensions

Conversation:
{messages}`;
