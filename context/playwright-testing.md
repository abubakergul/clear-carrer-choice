# Playwright E2E Testing Plan

## Setup Status
- `@playwright/test` installed as dev dependency ✓
- Chromium browser downloaded ✓
- No `playwright.config.ts` yet — needs creating
- No test files yet — needs creating

---

## Todo List

### 1. Create `playwright.config.ts` at root
- `testDir: "./tests/e2e"`
- `timeout: 120_000` (AI calls are slow)
- `expect.timeout: 30_000`
- `fullyParallel: false` (sequential — single user flow)
- `headless: false` so we can watch
- `video: "on"` to record
- `webServer`: auto-start `npm run dev`, `reuseExistingServer: true`
- `baseURL: "http://localhost:3000"`

### 2. Create `tests/e2e/journey.test.ts`
Full end-to-end test of the entire user journey.

### 3. Run the test
```bash
npx playwright test
```

---

## Full Journey Test Steps

### Step 0 — Setup
- Generate a unique test email: `test-${Date.now()}@example.com`
- Password: `TestPass123!`

### Step 1 — Landing Page
- Navigate to `/`
- Assert headline contains "You don't need to choose a career"
- Click "Try it now →"
- Assert we're on `/chat`

### Step 2 — Education Stage Selector
- Assert 4 stage buttons are visible
- Click "Still in school"
- Assert opening message appears

### Step 3 — Chat Conversation (5–7 messages to trigger signup wall)
Each user message — type, send, wait for streaming to finish (no loading dots, text appears).

**Message 1:** `I love the idea of software but I'm terrified I'm not smart enough for it`
Wait for AI response (no dots, full text).

**Message 2:** `I'm 17, still in school. I also like writing but it doesn't feel like a real career`
Wait for AI response.

**Message 3:** `Honestly I get excited when I build things, even small websites. But I get scared thinking about university CS degrees`
Wait for AI response.

**Message 4:** `My family wants me to do medicine. I find it interesting but I don't know if I actually want that life`
Wait for AI response.

**Message 5 (may use chip):** If chips appear, click "Passion for it". Otherwise type:
`I feel most alive when I'm building something that works. Medicine feels more like obligation.`
Wait for AI response.

**Message 6 (if wall not triggered yet):**
`I think software engineering is where my heart is but army is the backup my dad keeps pushing`
Wait for response.

**After each message** — check if signup wall has appeared (`.fixed.inset-0` overlay visible). Stop sending messages once it appears.

### Step 4 — Signup Wall
- Assert signup wall is visible
- Assert heading contains "pattern" or "started something"
- Click the primary CTA (register link)
- Assert we're on `/register`

### Step 5 — Register
- Fill name: `Test User`
- Fill email: (the generated unique email)
- Fill password: `TestPass123!`
- Fill confirm password: `TestPass123!`
- Click submit
- Assert success toast or redirect to `/sign-in`

### Step 6 — Sign In
- If redirected to `/sign-in`, fill email + password
- Click sign in
- Assert redirect goes to `/claim` (credentials flow)

### Step 7 — Claim + Insight Generation
- Assert `/claim` page is shown with loading dots
- Wait up to 60 seconds for redirect to `/result`
- Assert `/result` page loads with a summary quote card visible

### Step 8 — Result Page
- Assert directions list is visible (at least 1 item)
- Assert "What you're navigating" tensions section exists
- Click the exploration CTA button
- Assert we're on `/dashboard/explore/[id]`

### Step 9 — First Exploration
- Assert exploration title is visible
- Assert prompt text is visible
- Check if it's interactive (this-or-that or real-day):
  - If `this_or_that`: click one of the two option cards → assert redirected to `/reflect`
  - If `real_day`: rate each chunk (click first option for each) → click Continue → assert redirected to `/reflect`
  - If plain: click "I did it — reflect →" → assert redirected to `/reflect`

### Step 10 — Reflect
- Assert "What did you notice?" heading
- Click at least 2 feeling chips (e.g. "Curious" and "Excited")
- Optionally type a note: "Really interesting, wanted to keep going"
- Click "Done →"
- Assert redirect to `/dashboard/explore/[id]/shift`

### Step 11 — Shift Screen
- Assert "What just shifted" eyebrow visible
- Assert stars component is visible (1 star lit)
- Assert reaction read text is visible
- Click "Keep exploring →"
- Assert redirect to `/dashboard`

### Step 12 — Dashboard
- Assert active exploration card OR "Something new is on its way…" spinner
- If spinner: wait up to 30 seconds for the next exploration to appear (page auto-refreshes)
- Assert progress stars visible (1 of 5 lit)

### Step 13 — Pattern Page (basic check)
- Navigate to `/dashboard/pattern`
- Assert directions are visible
- Assert tensions section visible
- Assert "Your answer unlocks after 5 explorations" teaser (since only 1 done)

### Step 14 — Done
- Log test passed with timestamp

---

## Waiting Strategy
- After sending a chat message: `await page.waitForFunction(() => !document.querySelector('.animate-bounce'))` OR wait for the loading dots to disappear and text to appear
- For streaming responses: poll until the last assistant bubble has stable text (no change for 500ms)
- For AI generation (claim, exploration): `page.waitForURL(...)` with 60s timeout
- For page refreshes triggered by ExplorationGenerator: `page.waitForSelector('[data-testid="active-exploration"]', { timeout: 30000 })` or wait for the spinner to disappear

---

## Notes
- All AI calls hit real OpenAI (gpt-4.1-mini) — test will cost a few cents
- The signup wall trigger depends on AI output — if it doesn't fire by message 6, add a 7th message
- The `choice` URL param on reflect page comes from interactive explorations — test needs to handle all 3 exploration types
- After claim, Google OAuth users land at `/dashboard` → ClaimRedirector → `/claim`. Credentials users land directly at `/claim`. Test uses credentials so this is fine.
- Session storage (`ccc_session_id`) is set in the browser context — Playwright handles this naturally within the same page context

---

## File Structure to Create
```
playwright.config.ts          ← root config
tests/
  e2e/
    journey.test.ts           ← full journey test
    helpers/
      chat.ts                 ← waitForStreamingDone(), sendMessage() helpers
```
