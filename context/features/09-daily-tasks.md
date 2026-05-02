# Daily Tasks & Feedback

## Overview

After the initial result, the user gets one small task per day for 7 days. Each task is designed to test whether the fit insight actually feels right. The feedback they give (Interesting / Not sure / Not for me) is what refines the fit insight over time — NOT task completion.

## How Tasks Work

- 7 tasks are generated on Day 1 when FitInsight is first created
- One task is shown per day based on account age
- Tasks are stored in the `TaskEntry` model (day 1–7, one per user)
- The dashboard reads today's task by calculating: `dayNumber = daysSinceSignup + 1`

## Feedback Mechanism

After reading today's task, the user sees three buttons:
- ✅ **Interesting** — saves `feedback: "interesting"` to TaskEntry
- 😕 **Not sure** — saves `feedback: "not_sure"` to TaskEntry
- ❌ **Not for me** — saves `feedback: "not_for_me"` to TaskEntry

This is a Server Action: `actions/tasks.ts → submitTaskFeedback(taskId, feedback)`

After submitting, the feedback buttons are replaced with: **"See you tomorrow ✓"**

## Fit Insight Update Logic

After the user has given feedback on at least 3 tasks, the FitInsight summary can be updated.

Trigger: When `submitTaskFeedback` is called and the user now has 3+ feedback entries, run the update prompt.

Update prompt: Send the original conversation + all task feedback to OpenAI and ask it to revise the FitInsight summary and areas. Save the updated result to the FitInsight model.

Store update prompt in `src/lib/prompts/update-insight.ts`

```
You are updating a student's career fit insight based on their task feedback.

Original fit insight:
Summary: {summary}
Areas: {areas}

Task feedback:
{taskFeedbackList}
(format: "Day N task: [description] → Feedback: [interesting/not_sure/not_for_me]")

Update the fit insight based on the pattern of feedback.
- If most feedback is "interesting" → strengthen the current areas
- If most feedback is "not_for_me" → shift the areas
- If mixed → keep areas but update summary to reflect uncertainty

Return ONLY a JSON object — no markdown, no explanation:
{
  "summary": "Updated summary sentence or two",
  "areas": ["Area 1", "Area 2"]
}
```

## Edge Cases

- User gives no feedback for a day → show the same task again the next day (do not skip)
- User is past Day 7 → show completion state on dashboard (see `@context/features/08-dashboard.md`)
- User clicks "Not for me" on most tasks → do not auto-change areas silently; wait until at least 3 responses, then update

## References

- `@context/project-overview.md`
- `@context/features/08-dashboard.md`
- `@context/coding-standards.md`
