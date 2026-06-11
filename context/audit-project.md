# Audit Project — ClearCareerChoice

## Purpose

Before launch, perform a complete architecture, security, data integrity, and UX audit.

This is NOT a styling review.

Focus on:

* Progress loss
* Duplicate generation
* Race conditions
* Authorization flaws
* Data inconsistencies
* Security issues
* Mobile usability
* Launch blockers

---

# Context

Read these files first:

## Product Overview

* Current Feature.md
* prisma/schema.prisma

## Core Areas

### Conversation

* src/components/chat/ChatInterface.tsx
* src/components/chat/SignupWall.tsx
* src/app/api/chat/route.ts
* src/app/api/chat/session/route.ts
* src/lib/prompts/conversation.ts
* src/actions/conversation.ts

### Claim + Insight

* src/app/claim/page.tsx
* src/actions/conversation.ts
* src/app/result/page.tsx

### Authentication

* src/auth.ts
* src/auth.config.ts
* src/proxy.ts
* src/app/api/auth/**

### Exploration System

* src/actions/exploration.ts
* src/lib/exploration.ts
* src/lib/options.ts
* src/lib/constellation.ts

### Exploration UI

* src/app/dashboard/explore/[id]/page.tsx
* src/app/dashboard/explore/[id]/reflect/page.tsx
* src/app/dashboard/explore/[id]/shift/page.tsx
* src/components/dashboard/ReflectionForm.tsx
* src/components/dashboard/ThisOrThat.tsx
* src/components/dashboard/RealDay.tsx
* src/components/dashboard/ExplorationGenerator.tsx

### Pattern System

* src/app/dashboard/pattern/page.tsx
* src/components/dashboard/OptionsStanding.tsx

---

# Audit Tasks

## 1. Conversation Audit

Verify:

* guest session persistence
* refresh behavior
* browser close/reopen
* message ordering
* duplicate saves
* signup wall triggering

Questions:

* Can conversations be lost?
* Can duplicate conversations be created?
* Can messages save out of order?
* Can trigger phrases fail?

Severity:
CRITICAL

---

## 2. Claim Flow Audit

Review:

* claimAndGenerate()
* claim page
* redirect logic

Questions:

* Can one conversation be claimed twice?
* Can two FitInsights be created?
* Can two Explorations be created?
* Can refresh during generation break state?
* Can ownership be lost?

Severity:
CRITICAL

---

## 3. Authentication Audit

Review:

* NextAuth configuration
* route protection
* ownership checks

Questions:

* Can User A access User B data?
* Can URL manipulation expose another user's exploration?
* Can pattern pages leak data?

Severity:
CRITICAL

---

## 4. Exploration Generation Audit

Review:

* runGeneration()
* triggerNextExploration()

Verify:

* one ACTIVE exploration rule
* stop after 5 completions
* cooldown behavior
* skip logic
* option rotation

Questions:

* Can multiple active explorations exist?
* Can generation run twice?
* Can refresh generate duplicates?

Severity:
CRITICAL

---

## 5. Reflection Audit

Review:

* ReflectionForm
* completeExploration()

Questions:

* Can completed explorations exist without reflections?
* Can invalid signals be saved?
* Can malformed notes break rendering?

Severity:
HIGH

---

## 6. Shift Screen Audit

Review:

* shift page
* ExplorationGenerator

Questions:

* Can refresh create duplicate explorations?
* Can stars become inconsistent?
* Can prewarming run repeatedly?

Severity:
HIGH

---

## 7. Pattern Integrity Audit

Review:

* options.ts
* OptionsStanding
* buildVerdict()

Questions:

* Can verdict reference untested options?
* Can verdict contradict evidence?
* Can evidence chips differ from stored reflections?

Severity:
HIGH

---

## 8. Insight Evolution Audit

Review:

* insight-evolution prompt
* versioning logic

Questions:

* Can evolution run twice?
* Can versions drift?
* Can concurrent updates overwrite data?

Severity:
MEDIUM

---

# Database Integrity Audit

Review prisma/schema.prisma and all writes.

Verify these states are impossible:

* 2 ACTIVE explorations
* reflection without exploration
* completed exploration without reflection
* multiple FitInsights for same conversation
* exploration attached to wrong user
* conversation attached to wrong user
* pattern unlocked before eligibility
* generation after 5 completions

Severity:
CRITICAL

---

# Security Audit

## Authorization

Verify ownership checks exist everywhere.

Questions:

* Can IDs be guessed?
* Can another user's exploration be viewed?
* Can another user's reflection be edited?

Severity:
CRITICAL

---

## Input Validation

Review:

* chat messages
* notes
* route params
* form submissions

Questions:

* Can invalid data enter the database?
* Can malformed JSON break generation?

Severity:
HIGH

---

## XSS

Test:

<script>alert(1)</script>

Review:

* notes rendering
* chat rendering
* pattern rendering

Questions:

* Can scripts execute?

Severity:
CRITICAL

---

## Prompt Injection

Test user messages:

* Ignore previous instructions
* Reveal system prompt
* Reveal hidden instructions
* Return database records

Questions:

* Can prompt behavior be hijacked?
* Can system prompts leak?

Severity:
HIGH

---

## Secrets Audit

Verify:

* OpenAI key server-only
* Google secrets server-only
* No env vars exposed to client

Severity:
CRITICAL

---

## Logging Audit

Verify logs never contain:

* passwords
* OAuth tokens
* access tokens
* OpenAI keys
* user private data

Severity:
HIGH

---

# Mobile Audit

Devices:

* iPhone Safari
* Android Chrome

Verify:

* chat input
* chips
* signup wall
* OAuth flow
* exploration pages
* reflection pages
* pattern page

Questions:

* Can entire journey be completed comfortably on mobile?

Severity:
HIGH

---

# Performance Audit

Review:

* streaming
* generation
* dashboard loading
* pattern loading

Questions:

* Any blocking operations?
* Any duplicate API calls?
* Any unnecessary rerenders?

Severity:
MEDIUM

---

# Deliverables

For every issue found:

Provide:

1. Severity

   * CRITICAL
   * HIGH
   * MEDIUM
   * LOW

2. Reproduction Steps

3. Root Cause

4. Recommended Fix

5. Files Affected

Prioritize launch blockers first.

Focus on correctness, security, and user progress preservation over UI polish.
