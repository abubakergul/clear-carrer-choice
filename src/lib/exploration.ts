// How many explorations unlock the answer. Kept short on purpose — real users
// found 5 too long. Single source of truth so progress, gating, and copy agree.
export const EXPLORATION_GOAL = 3;

export type ExplorationAIResponse = {
  title: string;
  prompt: string;
  estimatedMinutes?: number;
  type?: string;
  intensity?: string;
  generationContext?: {
    basedOnSignals?: string[];
    basedOnTensions?: string[];
    direction?: string;
    option?: string;
    reason?: string;
    interaction?: {
      kind: string;
      optionA?: string;
      optionB?: string;
      role?: string;
      chunks?: { percent: number; text: string }[];
      closer?: string;
    };
  };
};

// Returns true if the AI chose an interactive format but forgot the required data.
// Used to decide whether to retry the generation before saving.
export function isInteractiveBroken(data: ExplorationAIResponse): boolean {
  const interaction = data.generationContext?.interaction;
  const title = data.title ?? "";
  const promptText = (data.prompt ?? "").toLowerCase();

  // real_day: title says "A real day as" but no chunks
  if (/^a real day as /i.test(title)) {
    const chunks = Array.isArray(interaction?.chunks) ? interaction!.chunks : [];
    if (chunks.length < 2) return true;
  }

  // this_or_that: title or prompt implies a comparison but no optionA/optionB
  const hasOptions = !!(interaction?.optionA && interaction?.optionB);
  if (!hasOptions) {
    const titleComparison = / or /i.test(title) || /^two /i.test(title);
    const promptComparison =
      promptText.includes("tap the one") ||
      promptText.includes("tap between") ||
      promptText.includes("which one") ||
      promptText.includes("which scene") ||
      promptText.includes("which feels") ||
      promptText.includes("which pulls");
    if (titleComparison || promptComparison) return true;
  }

  return false;
}

// If an interactive exploration is STILL broken after a retry, strip the
// interactive framing rather than save a page that promises taps/scenes it can't
// show. Degrades to a plain "picture it" reflection — generic, but never broken.
export function sanitizeBrokenInteraction(
  data: ExplorationAIResponse
): ExplorationAIResponse {
  if (!isInteractiveBroken(data)) return data;
  const ctx = { ...(data.generationContext ?? {}) };
  delete ctx.interaction;
  return {
    ...data,
    prompt:
      "Picture a normal working day in this kind of work — the routine parts, the busy parts, the dull stretches, and any moment that might spark something. Spend a quiet minute imagining it. Notice which parts you'd actually look forward to, and which would wear you down.",
    generationContext: ctx,
  };
}

export const SKIP_REASONS = [
  "Didn't feel interesting",
  "Felt intimidating",
  "Too confusing",
  "Already know it's not for me",
  "Not in the mood right now",
] as const;

export type SkipReason = (typeof SKIP_REASONS)[number];
