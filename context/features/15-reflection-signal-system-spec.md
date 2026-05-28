# 15-reflection-signal-system-spec.md

# Reflection + Signal System

## Overview

After each exploration, the user submits a lightweight reflection.

The goal is:

- emotional signal collection
- behavioral pattern detection
- insight refinement

NOT:

- journaling
- productivity tracking
- therapy
- performance evaluation

The reflection system exists to answer:

> “How did the user emotionally react to this experience?”

NOT:

> “Did the user succeed?”

---

# Reflection Philosophy

Reflections should be:

- fast
- emotionally intuitive
- low-friction
- lightweight
- structured

Reflections should feel like:

> noticing reactions

NOT:

> writing reports

---

# Reflection Timing

Reflections should happen immediately after exploration completion.

Recommended flow:

```text
Start Exploration
→ User explores
→ Reflection
→ Exploration marked COMPLETE
→ Generate next exploration
```

Immediate reflections improve:

- emotional accuracy
- signal quality
- behavioral consistency

---

# Reflection Structure

Users should primarily interact through:

- taps
- quick selections
- lightweight sliders
- optional short notes

Avoid requiring long-form typing.

---

# Reflection Requirements

Target completion time:

- under 10 seconds

Text input should always remain optional.

---

# Reflection Questions

Recommended reflection structure:

## Emotional Reaction

Examples:

- Curious
- Energized
- Calm
- Excited
- Overwhelmed
- Intimidated
- Bored
- Resistant
- Confused

Users may select MULTIPLE reactions.

---

## Energy Level

Example prompt:

> “How energized did this feel?”

Scale:

```text
Low → High
```

---

## Curiosity Level

Example prompt:

> “Did this make you want to continue exploring?”

Scale:

```text
Low → High
```

---

## Intimidation Level

Example prompt:

> “How intimidating did this feel?”

Scale:

```text
Low → High
```

---

## Optional Note

Optional lightweight text field.

Example prompt:

> “Anything you noticed?”

Should remain:

- optional
- short
- low-pressure

---

# Signal Philosophy

The system should prioritize:

- emotional resonance
- attraction
- resistance
- sustained curiosity

NOT:

- completion metrics
- productivity behavior
- performance indicators

Completion is NOT success.

Skipping is NOT failure.

Strong avoidance may be highly valuable signal.

---

# Signal Categories

Initial curated signal list:

```ts
enum ReflectionSignal {
  CURIOUS
  ENERGIZED
  CALM
  EXCITED
  ENGAGED
  OVERWHELMED
  INTIMIDATED
  BORED
  CONFUSED
  RESISTANT
  CREATIVE
  STRUCTURED
}
```

The initial system should use a fixed curated signal list.

Avoid AI-generated dynamic signals initially.

---

# Signal Storage

Signals should remain lightweight.

Recommended structure:

```ts
selectedSignals: string[]
```

---

# Signal Usage

Signals should help the system:

- refine future explorations
- evolve FitInsight
- identify recurring patterns
- detect attraction/resistance trends
- personalize exploration pacing

---

# Pattern Detection Philosophy

The system should detect patterns over time such as:

- recurring curiosity
- recurring intimidation
- attraction toward creative environments
- avoidance of highly structured environments
- increasing confidence
- sustained resistance

The system should observe trends WITHOUT reducing users to:

- scores
- percentages
- labels
- rankings

---

# Reflection UX Principles

Reflection screens should feel:

- calm
- emotionally safe
- fast
- intuitive

Avoid:

- long forms
- essay writing
- therapeutic tone
- clinical language
- productivity language

---

# Language Rules

Avoid words like:

- performance
- productivity
- achievement
- success
- score

Prefer words like:

- notice
- reaction
- curiosity
- energy
- exploration

---

# Reflection Sources

Reflections may originate from:

```ts
enum ReflectionSource {
  COMPLETION
  SKIP
  EXPIRATION
}
```

Different reflection sources may carry different behavioral meaning.

Example:

- skip + intimidation
- completion + boredom
- expiration + avoidance

These patterns are valuable insight signals.

---

# Insight Evolution

Reflections should gradually influence:

- FitInsight summaries
- directions
- tensions
- future exploration generation

The system should evolve slowly over time.

Avoid dramatic identity shifts after single reflections.

---

# Non-Goals

The reflection system is NOT intended to provide:

- mental health analysis
- psychological diagnosis
- personality typing
- aptitude scoring
- emotional evaluation

The system exists to:

> help users notice patterns in how different kinds of work environments affect them.