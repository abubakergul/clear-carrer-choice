export const SKIP_REASONS = [
  "Didn't feel interesting",
  "Felt intimidating",
  "Too confusing",
  "Already know it's not for me",
  "Not in the mood right now",
] as const;

export type SkipReason = (typeof SKIP_REASONS)[number];
