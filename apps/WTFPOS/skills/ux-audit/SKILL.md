---
name: ux-audit
description: >
  Audits WTFPOS pages and flows for UX/UI quality using interactive playwright-cli
  commands and a comprehensive design reference ("Design Bible"). Use this skill when the user
  asks for a "UX audit", "design review", "usability check", "layout assessment", "heuristic
  evaluation", "accessibility check", "does this page feel right", "is this easy to use",
  "check the layout", "review the flow", "audit this screen", or any request to evaluate a
  page's usability, visual hierarchy, cognitive load, motor efficiency, or consistency with the
  WTFPOS design system. Also triggers on "touch targets", "contrast ratio", "too many buttons",
  "feels cluttered", "hard to find", "confusing layout".
version: 5.1.0
---

# UX Audit — WTFPOS

This skill uses **interactive `playwright-cli` commands** to audit any WTFPOS page or
flow against the Design Bible (`references/DESIGN_BIBLE.md`). 

**How audits work:** Open browser with `playwright-cli open` → set viewport → login interactively → navigate
and take snapshots at key points (`playwright-cli snapshot`) → read snapshots with Claude vision → close browser → produce the audit report.

## OUTPUT FORMAT — READ THIS FIRST

**Every audit MUST use this issue format in Section D:**

```
[01] Issue title
[02] Issue title
[03] Issue title
```

Each issue gets **five mandatory fields**: What, How to reproduce, Why this breaks, Ideal flow, The staff story.

**NEVER DO ANY OF THESE:**
- ❌ P0 / P1 / P2 priority grouping — BANNED
- ❌ Tables with Effort / Impact columns — BANNED
- ❌ `P0-1`, `P1-2` style IDs — BANNED
- ❌ Fix Checklist with priority prefixes — BANNED
- ❌ Referencing old audit files in `audits-legacy/` as format examples — they use a deprecated format

**ALWAYS DO THESE:**
- ✅ Flat sequential numbering: `[01]`, `[02]`, `[03]`…
- ✅ All five fields per issue (What, How to reproduce, Why this breaks, Ideal flow, The staff story)
- ✅ Named persona in "Why this breaks" (Ate Rose, Kuya Marc, Sir Dan, Boss Chris, Ate Lina, Kuya Benny)
- ✅ First-person quote in "The staff story"
- ✅ Fix Checklist uses `[01]`, `[02]` IDs (matching Section D)
- ✅ Structural proposals use `[SP-01]`, `[SP-02]` IDs (Section E) — max 3 per audit, only when warranted

See **Section D** in the Single-User Output Template for the full format specification.

---

## References

| Reference | Purpose | When to read |
|---|---|---|
| `references/DESIGN_BIBLE.md` | UX assessment framework | Every audit — the evaluation criteria |
| `references/ENVIRONMENT.md` | Restaurant physical context | Every audit — adjusts pass/fail thresholds |
| `references/KNOWN_PATTERNS.md` | 11 recurring systemic issues | Every audit — reference matches |
| `references/PRD_QUICK_REF.md` | Feature status map | Every audit — prevents false positives |
| `references/ROLE_WORKFLOWS.md` | Per-role shift workflows | Every audit — weights findings |
| `.claude/skills/playwright-cli/SKILL.md` | Tool usage conventions | To understand how to control browser via CLI |

---

## WORKSPACE RULES

These rules govern all file operations during any audit. Read them before starting. Re-read them before finishing.

### WR-1 — Snapshots are the audit observation tool

`playwright-cli snapshot` outputs a **YAML accessibility tree** — element refs, labels, roles, button names, and structural hierarchy. This is how you:
- Find element refs to click (e.g., `e7`, `e12`)
- Count buttons and choices (Hick's Law, Miller's Law)
- Verify labels, roles, and ARIA attributes (WCAG)
- Infer layout structure and information density

**Snapshot budget:** Max **15 snapshots per audit run**. Budget them for:
- First view of each new page (required)
- Modal/overlay open states (required)
- Error states, empty states, completion states (as needed)

### WR-2 — Dedicated workspace folder (run-scoped)

Every audit run gets its own uniquely-named folder to save the audit report draft while working.

**Naming pattern:** `skills/ux-audit/work-{run-id}/`

Generate `{run-id}` at the start of every audit using:
```bash
_ux_run_id=$(date +%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
```

> **Note:** `playwright-cli snapshot` automatically saves YAML files to `.playwright-cli/`. You do NOT store snapshots in `$_ux_work`. The workspace folder is only used as a scratch space if you need to write intermediate notes during the audit.


### WR-3 — Clean start, clean end

**First commands of every audit:**
```bash
_ux_run_id=$(date +%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
_ux_work="skills/ux-audit/work-${_ux_run_id}"
mkdir -p "$_ux_work"
```

**Last command of every audit (after saving the final report):**
```bash
rm -rf "$_ux_work"
```

---

## Audit Strategy — Choosing the Right Execution Method

Not all audits need the same approach. Pick the method based on what you're auditing:

| Scenario | Best Method |
|---|---|
| Quick single-page spot check (visible HTML buttons, links) | **playwright-cli commands** |
| SVG elements, canvas, custom components, `force:true` needed | **`playwright-cli -s=${_ux_run_id} run-code`** |
| Multi-role/multi-stint flow you'd want to replay or share | **Playwright spec file** |

---

### Method A — `playwright-cli` commands (interactive, simple)

Best for: quick single-page audits where elements are in the HTML accessibility tree.

```bash
playwright-cli -s=${_ux_run_id} --headed open "http://localhost:5173"
playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{"userName":"Ate Rose","role":"staff",...}'
playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/pos"
playwright-cli -s=${_ux_run_id} snapshot
playwright-cli -s=${_ux_run_id} click e7
```

**Limitations:** Fails on SVG, canvas, and elements not exposed in the accessibility tree. No `--force`, no CSS selectors.

---

### Method B — `playwright-cli -s=${_ux_run_id} run-code` (inline Playwright API)

Best for: complex interactions, SVG floor plan clicks, multi-step flows within a single session.

Full Playwright API available — locators, `force: true`, `waitFor`, `evaluate`, etc. Browser stays headed and visible. No spec file needed.

```bash
playwright-cli -s=${_ux_run_id} run-code "async page => {
  await page.locator('[aria-label=\"Table T1\"]').click({ force: true });
  await page.waitForSelector('.order-sidebar');
}"
```

Use this whenever Method A fails or when you need reliable element targeting.

---

### Method C — Export to Spec (after a successful CLI session)

**Yes — every `playwright-cli` command already outputs its Playwright TypeScript equivalent.** After a successful interactive audit, you can reconstruct a `.spec.ts` file by collecting the generated code from each command's output.

**How it works:** Every `playwright-cli` action prints `### Ran Playwright code` with the exact `await page.*` call:

```
playwright-cli -s=${_ux_run_id} click e86
→ Ran Playwright code:
   await page.getByRole('button', { name: 'Skip — I\'ll add float later' }).click();

playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{...}'
→ Ran Playwright code:
   await page.evaluate(() => sessionStorage.setItem('wtfpos_session', '...'));
```

**Export workflow:**
1. Run the full audit with Method A or B, confirming it works end-to-end
2. Collect every `### Ran Playwright code` block from the session output
3. Assemble into a spec file:

```ts
import { test, expect } from '@playwright/test';

test('Staff fires order → kitchen receives ticket', async ({ page }) => {
  // Paste collected Playwright code here
  await page.goto('http://localhost:5173/pos');
  await page.evaluate(() => sessionStorage.setItem('wtfpos_session', JSON.stringify({
    userName: 'Ate Rose', role: 'staff', locationId: 'tag', isLocked: true
  })));
  await page.getByRole('button', { name: "Skip — I'll add float later" }).click();
  // ... all collected steps ...

  // Add assertions manually (playwright-cli -s=${_ux_run_id} doesn't record these):
  await expect(page.locator('.kitchen-ticket')).toBeVisible();
});
```

4. Save to `skills/ux-audit/work-{run-id}/audit-replay.spec.ts`
5. Replay headed: `pnpm exec playwright test skills/ux-audit/work-{run-id}/audit-replay.spec.ts --headed`

> **Note:** Generated code captures actions, not assertions. You must add `expect()` calls manually for handoff checks (H1, H2, etc.).

---

## Playwright CLI Conventions

The conventions below apply when using **Method A** (`playwright-cli` commands) or **Method B** (`run-code`). For Method C (spec files), follow standard Playwright test patterns.

### PC-0 — playwright-cli -s=${_ux_run_id} is Always Headed

`playwright-cli -s=${_ux_run_id} open` opens a visible, headed browser by default. To be **explicit**, always use the `--headed` flag:

```bash
# Explicitly headed — always use this form
playwright-cli -s=${_ux_run_id} --headed open "http://localhost:5173"
```

> **Note:** `playwright-cli -s=${_ux_run_id} open` (without `--headed`) may open headless depending on environment. Always pass `--headed` to guarantee a visible window.

### PC-0b — Strict Timeout Rules

Every `eval`, `sessionstorage-set`, and interaction command must complete within **1 second**.
If an eval or action hangs past 1s, treat it as a failure and record it as a finding.

- Do **not** add `waitForTimeout` or artificial delays.
- If a page takes more than 1s to react after a `goto`, note it as a **Doherty Threshold violation** (finding).
- WTFPOS is local-first (RxDB instant writes) — anything taking >1s is a UX bug, not normal behavior.

### PC-1 — Role Injection (Skip Login UI)

Inject `sessionStorage` using `playwright-cli -s=${_ux_run_id} eval` instead of navigating the login UI.
This eliminates login UI failures and is faster.

```bash
# Open browser first
playwright-cli -s=${_ux_run_id} open "http://localhost:5173"

# Inject session via sessionstorage command (preferred — no JS string quoting issues)
playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{"userName":"Ate Rose","role":"staff","locationId":"tag","isLocked":true}'

# Navigate to authenticated route
playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/pos"
```

**Session payloads per role:**

| Role | userName | role | locationId | isLocked |
|------|----------|------|------------|---------|
| Staff | Ate Rose | `staff` | `tag` | `true` |
| Kitchen (grill) | Kuya Marc | `kitchen` | `tag` | `true` |
| Kitchen (sides prep) | Ate Lina | `kitchen` | `tag` | `true` |
| Manager | Sir Dan | `manager` | `tag` | `false` |
| Owner | Boss Chris | `owner` | `all` | `false` |

### PC-2 — Simulating Multi-User Environments (Same Browser, Multi-Tab)

WTFPOS stores session state in `sessionStorage` (which is natively isolated per-tab) but database state in `IndexedDB` (which is shared per-origin across tabs).

Because of this architecture, you should **never open multiple browsers** to simulate multiple roles. Instead, use **multiple tabs within the same browser session**. 

For all tests, pass the `-s=${_ux_run_id}` flag to isolate your audit workflow from other potential runs on the same machine.

**Approach 1: Single-Tab Sequential (Simulating a Shared Shared Device)**
If staff and manager share the exact same physical tablet, sequentially swap their sessions in Tab 0:
```bash
# Order taken
playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{"userName":"Ate Rose","role":"staff","locationId":"tag","isLocked":true}'
playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/pos"

# Manager overrides
playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{"userName":"Sir Dan","role":"manager","locationId":"tag","isLocked":false}'
playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/reports/voids"
```

**Approach 2: Multi-Tab Parallel (Simulating Multiple Physical Tablets)**
If simulating real-time sync (e.g. Staff fires order on tablet A, Kitchen receives it on tablet B), map each role to a different tab!

```bash
# Tab 0: Staff tablet
playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{"userName":"Ate Rose","role":"staff",...}'
playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/pos"

# Tab 1: Create new tab for Kitchen
playwright-cli -s=${_ux_run_id} tab-new "http://localhost:5173/kitchen/orders"
playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{"userName":"Kuya Marc","role":"kitchen",...}'
playwright-cli -s=${_ux_run_id} reload # Reload so tab 1 picks up its new session

# Now interact across tabs to test real-time IndexedDB sync!
playwright-cli -s=${_ux_run_id} tab-select 0
playwright-cli -s=${_ux_run_id} click e5  # Staff fires the order

playwright-cli -s=${_ux_run_id} tab-select 1
playwright-cli -s=${_ux_run_id} snapshot # Check if the ticket instantly appeared on the kitchen display!
```
*Why this is perfect:* IndexedDB triggers local sync events across tabs instantly, perfectly mirroring the intended multi-tablet network behavior without the hassle of multi-browser profiles.

### PC-3 — Dynamic Interactions

Always `snapshot` first to read the accessibility tree and get element refs, then interact:
```bash
playwright-cli -s=${_ux_run_id} snapshot
# The output shows element refs like [ref=e7] Button "Checkout"
playwright-cli -s=${_ux_run_id} click e7
# Or reference by visible text:
playwright-cli -s=${_ux_run_id} click text="T4"
```

### PC-4 — Saving a Named Snapshot

To save a snapshot with a specific filename (useful for referencing later):
```bash
playwright-cli -s=${_ux_run_id} snapshot --filename="$_ux_work/01-pos-initial.yaml"
```
The YAML accessibility tree records the structural state at that moment — element count, labels, hierarchy. Use it to compare states before/after interactions.

### PC-5 — Known Failure Patterns & Self-Fix Rules

When you hit these errors, apply the fix immediately — do NOT retry the same broken command.

---

#### ❌ SVG elements invisible to `snapshot` — the `/pos` floor plan problem

The `/pos` table floor plan is drawn in SVG. `playwright-cli -s=${_ux_run_id} snapshot` returns only the HTML accessibility tree — SVG `<text>` nodes (table labels like T1, T4) **do not appear as element refs**.

**Symptom:** `Error: Ref text=T1 not found in the current page snapshot.`

**Preferred fix — `run-code` with Playwright locators (reliable, no coordinate guessing):**
```bash
# Click a table by its aria-label
playwright-cli -s=${_ux_run_id} run-code "async page => { await page.locator('[aria-label=\"Table T1\"]').click({ force: true }); }"

# Click by SVG text content
playwright-cli -s=${_ux_run_id} run-code "async page => { await page.locator('svg text').filter({ hasText: 'T1' }).click({ force: true }); }"
```

**Alternative — coordinate-based clicking (fragile, use only if run-code fails):**
1. Take a snapshot to check if coordinates are guessable from page structure
2. Use mouse sequence:
```bash
playwright-cli -s=${_ux_run_id} mousemove 145 240
playwright-cli -s=${_ux_run_id} mousedown
playwright-cli -s=${_ux_run_id} mouseup
```

---

#### ❌ `eval` with complex function expressions fails

`playwright-cli -s=${_ux_run_id} eval` only accepts **simple JS expressions** — no arrow functions, no `.map()` chains.

**Wrong:**
```bash
playwright-cli -s=${_ux_run_id} eval "JSON.stringify([...document.querySelectorAll('svg button')].map(b => ({ label: b.getAttribute('aria-label') })))"
# → TypeError: result is not a function
playwright-cli -s=${_ux_run_id} eval "const btns = ...; btns.find(b => ...);"  
# → Passed function is not well-serializable!
```

**Self-fix — use `run-code` for any complex JS:**
```bash
playwright-cli -s=${_ux_run_id} run-code "async page => { const labels = await page.evaluate(() => [...document.querySelectorAll('svg text')].map(el => el.textContent)); return labels; }"
```

---

#### ❌ `mouseclick` is not a valid command

**Wrong:** `playwright-cli -s=${_ux_run_id} mouseclick 300 350` → `Unknown command: mouseclick`

**Self-fix:**
```bash
playwright-cli -s=${_ux_run_id} mousemove 300 350
playwright-cli -s=${_ux_run_id} mousedown
playwright-cli -s=${_ux_run_id} mouseup
```

---

#### ❌ `playwright-cli -s=${_ux_run_id} navigate` is not a valid command

**Wrong:** `playwright-cli -s=${_ux_run_id} navigate "..."` → `Unknown command: navigate`

**Self-fix:** `playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/pos"`

---

#### ❌ `playwright-cli -s=${_ux_run_id} click "selector" --force` is not valid

`playwright-cli -s=${_ux_run_id} click` only accepts element refs (e.g. `e7`) or `text=...` — not CSS selectors, and has no `--force` flag.

**Wrong:** `playwright-cli -s=${_ux_run_id} click "button[aria-label='Table T1']" --force`

**Self-fix — use `run-code` with full Playwright API:**
```bash
playwright-cli -s=${_ux_run_id} run-code "async page => { await page.locator('[aria-label=\"Table T1\"]').click({ force: true }); }"
```

---

### PC-6 — When to Use `run-code` vs `playwright-cli` commands

| Situation | Use |
|---|---|
| Clicking a standard HTML button/link with a ref | `playwright-cli -s=${_ux_run_id} click e7` |
| Clicking by visible text label | `playwright-cli -s=${_ux_run_id} click text="Confirm"` |
| SVG element, canvas, or no ref found | `playwright-cli -s=${_ux_run_id} run-code "async page => { ... }"` |
| Complex JS evaluation (loops, maps, async) | `playwright-cli -s=${_ux_run_id} run-code "async page => { ... }"` |
| Simple value read (title, count) | `playwright-cli -s=${_ux_run_id} eval "document.title"` |
| Setting sessionStorage | `playwright-cli -s=${_ux_run_id} sessionstorage-set key value` |
| Navigating to a route | `playwright-cli -s=${_ux_run_id} goto url` |
| Typing into an input | `playwright-cli -s=${_ux_run_id} fill eN "text"` |

**Rule of thumb:** If `snapshot` shows the element as an accessible ref, use `playwright-cli -s=${_ux_run_id} click`. If not (SVG, canvas, custom components), use `run-code`.

### PC-7 — Session Persistence & Crash Checkpointing

**Problem:** If the browser closes unexpectedly, IndexedDB (RxDB data — orders, tables, shifts) is lost.

**Fix — two layers:**

#### Layer 1 — Persistent Browser Profile (`--persistent`)

Use `--persistent` when opening the browser. This keeps IndexedDB alive across runs using a persistent Chrome profile:

```bash
playwright-cli -s=${_ux_run_id} --headed open --persistent "http://localhost:5173"
```

On restart after a crash, re-open with the same `--persistent` flag and the IndexedDB data will still be there. **Always use `--persistent` for multi-user/multi-stint audits.**

---

#### Layer 2 — Post-Snapshot Checkpoint (belt-and-suspenders)

After every `playwright-cli -s=${_ux_run_id} snapshot`, immediately dump the current session state to a checkpoint file:

```bash
playwright-cli -s=${_ux_run_id} snapshot
# → immediately after, checkpoint:
playwright-cli -s=${_ux_run_id} run-code "async page => {
  const state = await page.evaluate(() => ({
    session: JSON.parse(sessionStorage.getItem('wtfpos_session') || 'null'),
    url: location.href,
    ts: new Date().toISOString()
  }));
  return JSON.stringify(state);
}" | grep -o '{.*}' > "$_ux_work/checkpoint.json"
```

This captures: who is logged in, which route, and when — enough to **resume the audit** from the last known state.

**On crash recovery:**
1. Read `$_ux_work/checkpoint.json`
2. Re-open with `--persistent` (IndexedDB may still be there)
3. Re-inject the session: `playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '<session from checkpoint>'`
4. Navigate back to the checkpointed URL: `playwright-cli -s=${_ux_run_id} goto "<url from checkpoint>"`
5. Take a fresh snapshot to confirm state, then continue

---

#### Snapshot wrapper — do both at once

To make this automatic, use this pattern for every snapshot:

```bash
# Instead of bare: playwright-cli -s=${_ux_run_id} snapshot
# Use this wrapper:

playwright-cli -s=${_ux_run_id} snapshot --filename="$_ux_work/snap-$(date +%H%M%S).yaml" && \
playwright-cli -s=${_ux_run_id} run-code "async page => JSON.stringify({ session: JSON.parse(sessionStorage.getItem('wtfpos_session')||'null'), url: location.href, ts: new Date().toISOString() })" \
  | grep -oE '\{.*\}' > "$_ux_work/checkpoint.json"
```




## WTFPOS Design Context

These are the app-specific parameters to audit against:

### Touch & Interaction

| Parameter | Value | Source |
|---|---|---|
| Min touch target | 44px (`button`, `[role='button']`, `a`) | `app.css` base layer |
| Button min-height | 48px (`.btn` class) | `app.css` components |
| Device | 10-12" tablets, touch-first | PRD |
| Active scale | `active:scale-95` on all `.btn` | `app.css` |
| User select | Disabled on buttons (`.no-select`) | `app.css` |

### Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `accent` | `#EA580C` | Primary brand orange |
| `accent-dark` | `#C2410C` | Hover states |
| `accent-light` | `#FFF7ED` | Badges, soft backgrounds |
| `surface` | `#FFFFFF` | Cards, panels |
| `surface-secondary` | `#F9FAFB` | Page background |
| `border` | `#E5E7EB` | Borders, dividers |
| `status-green` | `#10B981` | Active, success, open |
| `status-yellow` | `#F59E0B` | Warning, pending |
| `status-red` | `#EF4444` | Danger, critical, overdue |
| `status-purple` | `#8B5CF6` | Owner/admin badges |
| `status-cyan` | `#06B6D4` | Info, Bluetooth |
| `foreground` | `#111827` | Default text |

### CSS Classes

| Class | Purpose |
|---|---|
| `.pos-card` | Rounded card (xl radius, white bg, border, p-4) |
| `.btn-primary` | Orange CTA button |
| `.btn-secondary` | White bordered button |
| `.btn-danger` | Red destructive button |
| `.btn-success` | Green confirmation button |
| `.btn-ghost` | Transparent hover button |
| `.badge-orange/green/yellow/red` | Status badges |
| `.pos-input` | Form input with focus ring |
| `.topbar` | DEPRECATED — do not expect on new pages |

### Layout Shell

```
SidebarProvider
+-- AppSidebar          (collapsible left rail / Sheet drawer)
+-- SidebarInset
    +-- MobileTopBar    (md:hidden, hamburger trigger)
    +-- LocationBanner  (always visible, all authenticated pages)
    +-- {children}      (page content)
```

### Roles & Their Primary Pages

| Role | Primary pages | Context |
|---|---|---|
| `staff` | `/pos` | Cashier during service — speed is everything |
| `kitchen` | `/kitchen/*` | Cook at grill station — glanceable, hands may be wet/greasy |
| `kitchen` (sides prep) | `/kitchen/*`, `/stock/inventory` | Sides preparer — banchan, rice, soup, utensils. Shares KDS with grill cook. Hands wet from produce/soup. |
| `manager` | `/pos`, `/stock/*`, `/reports/*` | Oversees operations — needs cross-page efficiency |
| `owner` | All pages + `/admin/*` | Reviews data across branches — analytical lens |

---

## Audit Workflow

### Step 0 — Interpret Freeform Prompt (ALWAYS FIRST)

**Trigger:** Any time the audit request arrives as natural language, a complaint, a frustration, or a mix of unrelated UX concerns. This step MUST run before Step 1.

**Goal:** Distill the raw input into a structured list of testable scenarios and identify which roles are directly affected.

**How to do it:**

1. **Read the raw prompt** — look for: pain points, broken behaviors, missing features, confusing labels, workflow friction.
2. **Extract discrete issues** — each complaint or suggestion becomes one numbered scenario. If two concerns touch the same screen, keep them as separate issues (they may have different fixes).
3. **Map each issue to an affected role** — who experiences this? Use WTFPOS role vocabulary: `staff`, `kitchen`, `manager`, `owner`, `cashier-weigh`. If a concern spans roles, list all affected.
4. **Identify the primary page / component** — where does this happen? (e.g., `RefillPanel.svelte`, `kitchen/dispatch`, `weigh-station`, `AddItemModal`).
5. **Write a one-sentence actionable scenario** — concrete enough to reproduce in the browser.

**Output format (present to user before proceeding):**

```
## Interpreted Audit Scope

| # | Scenario | Affected Roles | Primary Page/Component |
|---|----------|---------------|----------------------|
| 1 | [one-sentence actionable description] | staff | RefillPanel → kitchen/dispatch |
| 2 | [one-sentence actionable description] | kitchen, weigh-station | kitchen/weigh-station |
| 3 | [one-sentence actionable description] | staff, cashier | pos/AddItemModal, OrderSidebar |

Proceeding with these scenarios. Let me know if any should be adjusted.
```

**Then immediately continue** to Step 1 using the extracted scope — do NOT wait for explicit user confirmation unless a scenario is ambiguous.

**Code-change assessment (auto-gate):**

After extracting scenarios, classify each one:

| Signal in the issue | Classification |
|---|---|
| "add blocking", "prevent double tap", "guard against", "block until" | → **Needs code change** |
| "show info", "attach data", "display count", "add badge" | → **Needs code change** |
| "wrong label", "doesn't make sense", "rename", "misleading text" | → **Needs code change** |
| "hard to find", "too small", "confusing layout", "cluttered" | → **UX observation only** |
| "slow", "no feedback", "nothing happens" | → Could be either — read code first |

**If ANY scenario is classified as "Needs code change":**
→ **Auto-run `code-audit`** (Step 3.5 sub-skill) on those scenarios immediately after producing the scope table, before opening the browser.
→ This traces the data flow, finds the exact file:line to change, and surfaces blockers early.
→ Print: `"Code changes likely — running code-audit on affected flows before browser session."`

**If ALL scenarios are UX observation only:**
→ Skip code-audit, proceed directly to browser session.

---

### Step 1 — Define Scope

Clarify with the user:
- **Page or flow** — Single page (e.g., `/pos`) or multi-step flow (e.g., "create order to checkout")?
- **Role** — Which role? (affects what's visible and what matters)
- **Branch** — Which location? (`tag`, `pgl`, `all`)
- **Viewport** — Default tablet `1024x768`, or specify mobile/desktop

### Step 2 — Read References and Component Source

Read the UX references:
```
references/DESIGN_BIBLE.md        ← evaluation criteria
references/ENVIRONMENT.md         ← physical context (adjusts thresholds)
references/HOW_TO_USE_APP.md      ← step-by-step POS ordering guide
references/KNOWN_PATTERNS.md      ← recurring issues to watch for
references/PRD_QUICK_REF.md       ← feature status (prevents false positives)
references/ROLE_WORKFLOWS.md      ← action frequency (weights findings)
```
Also read the code-audit sub-skill (used in Step 3.5):
```
skills/code-audit/SKILL.md                       ← code viability check workflow
skills/code-audit/references/TRACE_TEMPLATES.md   ← pre-built trace patterns for common flows
```
Read the relevant `.svelte` component source files to identify how the page should flow and find stable selectors.

### Step 3 — Present Scenario Plan (MANDATORY)

**DO NOT OPEN THE BROWSER YET.**

Before running any CLI commands, you MUST explicitly write out a step-by-step **Scenario Plan** to the user. This plan dictates exactly what you will do during the interactive session.

Example:
> **Scenario Plan:**
> 1. Login as Staff at Tagbilaran.
> 2. Open an available table on `/pos`.
> 3. Add 1 Pork Unlimited package.
> 4. Switch tab/session to Kitchen.
> 5. Wait for the ticket to appear and serve the table.
> 6. Switch back to Staff and Checkout the order.

Only proceed to Step 3.5 after the plan is defined.

### Step 3.5 — Code Viability Check (AUTO — Gate 0.5)

**DO NOT OPEN THE BROWSER YET.**

Run the `code-audit` sub-skill (`skills/code-audit/SKILL.md`) against the scenario plan from Step 3.
This traces every action through the codebase — route → component → store → RxDB — without a browser.

1. Read `skills/code-audit/SKILL.md` for the full workflow
2. Parse the scenario plan into actions, roles, pages, and handoff points
3. Use trace templates from `skills/code-audit/references/TRACE_TEMPLATES.md` as starting points
4. Read source files and verify each link in the chain
5. Cross-reference against `skills/ux-audit/references/KNOWN_PATTERNS.md`
6. Produce a **Viability Report** with blockers, warnings, and confidence score

**Based on results:**
- **Blockers found:** STOP. Present blockers with file:line + fix hints. Ask user: "Fix now or skip?"
  If fix → apply fixes → re-trace affected paths → loop until clean. Then proceed to Step 4.
- **Warnings only:** Show briefly, auto-proceed to Step 4.
- **Clean pass:** "Code audit clean." Auto-proceed to Step 4.

> This step dramatically increases the success rate of Step 5 (browser session) by catching
> dead code paths, missing handlers, and broken reactive chains before Playwright touches anything.

### Step 4 — Workspace Setup

```bash
_ux_run_id=$(date +%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
_ux_work="skills/ux-audit/work-${_ux_run_id}"
mkdir -p "$_ux_work"
```

### Step 5 — Interactive Browser Session

Run consecutive `playwright-cli` commands:

1. **Open** — `playwright-cli -s=${_ux_run_id} --headed open --persistent "http://localhost:5173"` (use `--persistent` to keep IndexedDB alive — see PC-7)
2. **Resize** — `playwright-cli -s=${_ux_run_id} resize 1024 768`
3. **Login** — Inject session via `playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{...}'`
4. **Navigate** — `playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/<route>"`
5. **Snapshot + Checkpoint** — after every snapshot, immediately write a checkpoint (see PC-7 snapshot wrapper)
6. **Interact** — click, type, interact; each action should complete within 1s (PC-0b)
7. **Snapshot + Checkpoint** — after each meaningful interaction
8. **Multi-User Switch (If Applicable)** — Use a multi-tab approach for multi-role syncing (see PC-2).
   > **CRITICAL RULE FOR ORDER FLOWS:** After all staff cashier input for table orders, you MUST perform kitchen staff inputs first (i.e. to "serve" the table) before you proceed to checkout. A table cannot be checked out until it has been served by the kitchen!
9. **Close** — `playwright-cli -s=${_ux_run_id} close`

### Step 6 — Write Report + Save Spec

**5a. Write the audit report** using the **Audit Output Templates** section below.
- **Single role:** Sections A–E  
- **Multi-role:** Sections A–I

Save report to:
```
skills/ux-audit/audits/YYYY-MM-DD_<page>-<role>-<branch>.md
```

**5b. Export the session to a spec file** — collect every `### Ran Playwright code` block from the session output and assemble into a replayable spec:

```ts
// skills/ux-audit/specs/YYYY-MM-DD_<page>-<role>-<branch>.spec.ts
import { test, expect } from '@playwright/test';

test('<scenario name>', async ({ page }) => {
  // Each "Ran Playwright code" block from the session output maps to one line here.
  // Example — the CLI command and its generated spec equivalent:
  //   playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/pos"
  await page.goto('http://localhost:5173/pos');

  //   playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{...}'
  await page.evaluate(() => sessionStorage.setItem('wtfpos_session', JSON.stringify({
    userName: 'Ate Rose', role: 'staff', locationId: 'tag', isLocked: true
  })));

  //   playwright-cli -s=${_ux_run_id} click e86
  await page.getByRole('button', { name: "Skip — I'll add float later" }).click();

  // ... paste all remaining "Ran Playwright code" blocks ...

  // Add assertions manually for each handoff check (playwright-cli -s=${_ux_run_id} doesn't record these):
  await expect(page.locator('.kitchen-ticket')).toBeVisible(); // H1
});
```

Save spec to `skills/ux-audit/specs/` (separate from `audits/`).

### Step 7 — Fast Replay (Regression Check)

After saving the spec, run a **fast headed replay** to verify the flow still works and to watch the actual UX:

```bash
pnpm exec playwright test skills/ux-audit/specs/YYYY-MM-DD_<page>-<role>-<branch>.spec.ts --headed
```

> **Fast replay ≠ audit.** The spec verifies the flow doesn't break. It does not replace the UX audit observations. Run it after fixes to confirm regressions are cleared.

### Step 8 — Report Delivery & Loop

```bash
rm -rf "$_ux_work"
```

#### Output Format Rules

Depending on how the session went, follow the exact response format:

**Scenario A: Audit Failed (Bug/Blocker)**
If the browser crashed or you hit a bug that prevented you from finishing the Scenario Plan:
1. Save the **Scenario Plan** tracking text to a new file: `skills/ux-audit/plans/YYYY-MM-DD_<name>.md`.
2. Save the **UX Audit Report** to `audits/` noting exactly which step the plan failed.
3. Save the **Spec Replay** up until the failure to `skills/ux-audit/specs/`.
4. **Final message MUST state:** "Report saved to `...`. I have saved 3 files: an audit report, a replayable spec, and a file for the failed scenario plan."
5. **Summary Display:** Display the summary of the audit, putting the **Structural Proposals FIRST**, followed by the issue list.
6. **Gated Questions:** Ask the user TWO questions at once:
   - "Would you like me to apply these fixes?"
   - "Should we retry the scenario plan after?"
> *Do not automatically loop. Wait for user input.*

**Scenario B: Audit Passed (Smooth Flow)**
If you reached the end of the Scenario Plan successfully:
1. Confirmation: audit report saved to `audits/` AND spec saved to `specs/`
2. **Summary Display:** Display the summary, putting **Structural Proposals FIRST**.
3. **Full issue list** — list EVERY finding from the audit.
4. **Overall recommendation** — A single, opinionated sentence
5. **HITL: Fix Selection Gate** — Ask the user which issues to fix right now.

```bash
rm -rf "$_ux_work"
```

**Scenario C: E2E Verification Passed (All Acceptance Criteria Met)**
If this was a **re-audit or fix-audit verification run** and ALL targeted acceptance criteria passed end-to-end (no regressions, full checkout/flow completed successfully):
1. Confirmation: re-audit report saved to `audits/`, workspace cleaned.
2. **Verification Scoreboard** — display a table of each acceptance criterion → `✅ PASS` (or `❌ FAIL` for any surprise regressions found and fixed inline).
3. **HITL: Three questions at once** — ask all three together, do not split across messages:
   - "Export this session as a regression spec to `skills/ux-audit/specs/`? (locks in the E2E flow so it can replay as a CI guard)"
   - "Any deferred issues remaining that you want to fix now? (e.g. touch targets, visual polish)"
   - "Run a broader regression sweep on related flows? (e.g. if SC/PWD checkout passed, sweep takeout + pax change flows)"
4. **Wait for user input.** Do not automatically export, fix, or sweep — wait for explicit confirmation.

> *This gate exists because a passing E2E run is a checkpoint moment: the user should decide whether to lock in a spec, address deferred issues, or widen coverage before moving on.*



## Audit Output Templates

### Single-User Output Template

Every single-user audit report MUST include all four sections. Do not skip any.

#### A. Text Layout Map

Create an ASCII art representation of the page layout. Show:
- Vertical space allocation (what takes how much room)
- Button positions and groupings
- The fold line (what's visible without scrolling at target viewport)
- Content zones and their relationships
- Touch target density hotspots

Example:
```
+--sidebar--+--------------------main-content--------------------+
| [nav]     | LocationBanner: [Alta Citta] [Change]              |
| [nav]     |---------------------------------------------------|
| [nav]     | +--floor-grid (70%)----------+ +--sidebar (30%)--+ |
| [nav]     | | [T1] [T2] [T3] [T4]       | | Order #1234     | |
| [nav]     | | [T5] [T6] [T7] [T8]       | | 3x Samgyup      | |
|           | |                            | | 2x Soju         | |
|           | |                            | |                 | |
|           | |          ~~fold~~           | | [Add Item]      | |
|           | |                            | | [Checkout]      | |
|           | +----------------------------+ +-----------------+ |
+--sidebar--+---------------------------------------------------+
```

#### B. Principle-by-Principle Assessment

Evaluate each snapshot against these 14 principles. Use the Design Bible for detailed criteria.

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | PASS / CONCERN / FAIL | What you observed | What to change |
| 2 | **Miller's Law** (chunking) | | | |
| 3 | **Fitts's Law** (target size/distance) | | | |
| 4 | **Jakob's Law** (conventions) | | | |
| 5 | **Doherty Threshold** (response time) | | | |
| 6 | **Visibility of System Status** | | | |
| 7 | **Gestalt: Proximity** | | | |
| 8 | **Gestalt: Common Region** | | | |
| 9 | **Visual Hierarchy** (scale) | | | |
| 10 | **Visual Hierarchy** (contrast) | | | |
| 11 | **WCAG: Color Contrast** | | | |
| 12 | **WCAG: Touch Targets** | | | |
| 13 | **Consistency** (internal) | | | |
| 14 | **Consistency** (design system) | | | |

Verdicts:
- **PASS** — Meets or exceeds the principle's requirements
- **CONCERN** — Technically passes but could be improved; may cause friction under stress
- **FAIL** — Violates the principle; will cause errors or slowdowns during service

#### C. "Best Day Ever" Vision

Write a short narrative (3-5 paragraphs) from the perspective of the target role user having a
perfect shift. Describe:
1. What the ideal experience looks like with this page/flow
2. How each interaction should feel (fast, confident, satisfying)
3. Where the current implementation gaps are relative to that ideal
4. What emotional state the user should be in at each step
5. **If the current page structure is the bottleneck** — what the *ideal interface* would look
   like, even if it doesn't exist yet. Don't limit the vision to the current architecture. If
   Ate Lina would be better served by a dedicated `/kitchen/sides` page, describe her ideal
   shift using that page, not the current generic KDS.

This section grounds the technical assessment in empathy for the restaurant worker. When the
vision describes an interface that doesn't exist, it feeds directly into Section E (Structural
Proposals).

#### D. Recommendations

Every issue gets the same depth of documentation. Issues are numbered sequentially: `[01]`, `[02]`, etc.
No priority grouping. No effort/impact metadata. The detail speaks for itself.

> ⚠️ **FORMAT ENFORCEMENT** — Do NOT output P0/P1/P2 tables, effort/impact columns, or any
> priority-grouped format. Every issue is a five-field dossier block (see template below).
> Old audit files in `audits-legacy/` use a deprecated format — do NOT copy their structure.
> New audits go in `audits/` only.

**Each issue MUST include all five fields:**

```markdown
---

##### [01] <Issue title>

**What:** <One paragraph — neutral, factual description of the issue. What is broken or
suboptimal. Reference specific components, routes, or elements.>

**How to reproduce:**
1. <Step — login role, branch>
2. <Step — navigate to route>
3. <Step — specific interaction>
4. <Result — what happens vs. what should happen>

**Why this breaks:** <One paragraph — scenario-based explanation of the real-world consequence.
Use a named persona (Ate Rose, Kuya Marc, Sir Dan, Boss Chris). Describe the cascade: what
error occurs, what it forces the user to do next, how much time/money it costs. Make it vivid
— this paragraph is what convinces someone to fix it.>

**Ideal flow:** <One paragraph — what the correct behavior looks like. This is the acceptance
criteria for the fix. Be specific: sizes, timings, visual states, interaction sequences.
A developer should be able to read this and know exactly what "done" looks like.>

**The staff story:** "<First-person quote from the affected role's perspective. Written as if
the restaurant worker is describing their frustration to the owner. Keep it human and grounded.>"

**Affected role(s):** <Role1, Role2>

---
```

**Rules for writing recommendations:**
- **All five fields are mandatory** — never skip any, even for "minor" issues
- **"Why this breaks" must use a named persona** — Ate Rose (staff), Kuya Marc (kitchen), Sir Dan (manager), Boss Chris (owner)
- **"Ideal flow" is the acceptance criteria** — the fix-audit skill will use this as the target state
- **"The staff story" must be first-person** — a quote, not a description
- **"How to reproduce" must be step-by-step** — a developer who has never seen the app should be able to follow it
- **Sequential numbering** — `[01]`, `[02]`, `[03]`… never skip numbers, never use priority prefixes
- **No tables for recommendations** — Section D is a series of `##### [NN]` blocks, NOT a markdown table with columns

#### Fix Checklist (end of report)

After all Section D issues, include a fix checklist for the fix-audit skill:

```markdown
## Fix Checklist (for `/fix-audit`)

- [ ] [01] — <Issue title>
- [ ] [02] — <Issue title>
- [ ] [03] — <Issue title>
...
```

IDs MUST match Section D numbering. Never use `P0-1`, `P1-2`, etc.

#### E. Structural Proposals (when warranted)

Section D fixes things within the current page/component structure. Section E proposes
**bigger changes** — new pages, tab reorganization, input consolidation, dedicated interfaces,
workflow splits, or interaction model overhauls.

**When to include Section E:**
- When 3+ Section D issues share the same root cause (a structural problem, not a styling problem)
- When a role's workflow doesn't map to any existing page (e.g., sides preparer using generic KDS)
- When the auditor observes that fixing individual elements cannot solve the fundamental friction
- When information is split across pages that should be consolidated, or crammed into one page that should be split
- When the audit reveals a missing interaction pattern (e.g., no drag-to-reorder, no inline editing, no batch actions)

**When NOT to include Section E:**
- When all issues are fixable within the current structure (contrast, sizing, spacing, copy)
- When the page is fundamentally sound and just needs polish
- If none of the Section D findings point to a structural root cause, **skip Section E entirely** — don't force it

**Each structural proposal uses the `[SP-##]` format:**

```markdown
---

##### [SP-01] <Proposal title>

**Problem pattern:** <Which Section D issues (by number) share this root cause, and what
the pattern is. E.g., "Issues [03], [07], and [11] all stem from the same problem: the
sides preparer has no dedicated view and must use the generic KDS, which was designed
for the grill cook's workflow.">

**Current structure:** <ASCII diagram or bullet list showing how the UI is organized today.
Show the page(s), tabs, panels, and information flow. Be specific about routes and components.>

**Proposed structure:** <ASCII diagram or bullet list showing the proposed reorganization.
Show new pages/tabs/panels, what moves where, what gets consolidated or split. Include
route paths if proposing new pages (e.g., `/kitchen/sides`).>

**Why individual fixes won't work:** <One paragraph explaining why patching the current
structure element-by-element is insufficient. What is the fundamental mismatch between
the current UI architecture and the user's real workflow? Reference the role workflow from
ROLE_WORKFLOWS.md if applicable.>

**Affected role(s):** <Which roles benefit, and how their workflow changes.>

**The staff story:** "<First-person quote from the role who would most benefit from this
restructuring. Frame it as what they wish existed.>"

**Implementation sketch:** <High-level technical notes — not a full spec, but enough for
a developer to understand the scope. Mention: new routes, new components, store changes,
data model implications. Reference existing WTFPOS patterns where possible.>

---
```

**Rules for structural proposals:**
- **`[SP-##]` numbering** — `[SP-01]`, `[SP-02]`, etc. Separate from `[01]` element issues.
- **Always link to Section D issues** — Every SP must reference which `[##]` issues it addresses. SPs without this link are vague wishlists.
- **Propose, don't prescribe** — SPs are conversation starters, not mandates. The user decides whether to pursue them.
- **Include ASCII diagrams** — Current vs. proposed structure must be visual, not just prose.
- **Be honest about scope** — Include an implementation sketch so the user understands the effort involved.
- **Max 3 SPs per audit** — If you have more than 3, combine related ones. Too many SPs dilutes the signal.

**Structural Proposals Checklist (end of report, after Fix Checklist):**

```markdown
## Structural Proposals (for discussion)

- [ ] [SP-01] — <Proposal title> (addresses [03], [07], [11])
- [ ] [SP-02] — <Proposal title> (addresses [05], [09])
```

### Multi-User Output Template

Multi-user audits include the single-user template sections (A–D) **per role stint**, plus
these additional sections that evaluate cross-role interaction quality.

#### E. Cross-Role Interaction Assessment

This section is **unique to multi-user audits**. It evaluates how well data and status flow
between roles at each **stint transition** — built directly from `[HANDOFF CHECK]` results
in the browser session (`[HANDOFF CHECK]` snapshots and observations).

| # | Stint Transition | Source Role | Target Role | Data Expected | Data Found | Visibility | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Stint 1→2 | Staff (POS) | Kitchen (KDS) | 4 KDS tickets | 4 tickets found | Clear — ticket cards prominent | PASS |
| 2 | Stint 2→3 | Kitchen (KDS) | Sides (prep) | Sides-only tickets | All tickets shown, no filter | Missing — no sides distinction | FAIL |
| 3 | Stint 5→6 | Kitchen (KDS) | Staff (POS) | Bumped badges on orders | Badges present but 12px text | Subtle — easy to miss at speed | CONCERN |

**Evaluation criteria:**
- **Data Expected** — What data should exist from the previous stint?
- **Data Found** — What data actually appeared in the snapshot?
- **Visibility** — When the data is present, how obvious is it? (Clear = impossible to miss, Subtle = easy to overlook, Missing = not shown)
- **Verdict** — PASS (instant + clear), CONCERN (delayed or subtle), FAIL (failed or missing)

#### F. "Best Shift Ever" Vision (Multi-Role)

Same as Section C but written from **multiple perspectives** woven into a single narrative.
Don't limit the vision to the current page structure — if a role would be better served by
a dedicated page or reorganized interface, describe their ideal shift using that ideal interface.
Follow the scenario chronologically, switching between role perspectives as they interact:

1. Staff opens the table and starts the order...
2. Meanwhile, in the kitchen, the ticket appears on the KDS...
3. The kitchen bumps the meat, and back at the register, the staff sees...
4. The manager glances at the reports screen and notices...

This narrative should highlight **handoff moments** — the points where one role's action
triggers a visible change for another role. These handoffs are where multi-device UX
succeeds or fails.

#### G. Scenario Scorecard

Unique to multi-user audits. Summarizes each generated scenario's outcome:

| # | Scenario Name | Completed? | Handoffs OK? | Friction Points | Verdict |
|---|---|---|---|---|---|
| 1 | "First Table of the Night" | Yes / Partial / Blocked | 3/3 | 0 | PASS |
| 2 | "The Impatient Group" | ... | 2/4 | 2 | CONCERN |
| ... | ... | ... | ... | ... | ... |

#### H. Cross-Role Recommendations

In addition to per-role recommendations (Section D), add cross-role issues that emerge from
multi-device interaction. Use the **same five-field format** as Section D:

```markdown
---

##### [CR-01] <Cross-role issue title>

**What:** <What breaks in the handoff between roles. Reference the interaction point.>

**How to reproduce:**
1. <Role A does X>
2. <Role B expects to see Y>
3. <Result — what Role B actually sees>

**Why this breaks:** <Scenario with named personas showing the real-world cascade.
Emphasize the handoff moment — what happens when the kitchen doesn't see the void,
when the staff doesn't see the bump, etc.>

**Ideal flow:** <What the cross-role interaction should look like. Timing, visibility,
confirmation signals. A developer should know exactly what "done" means across both roles.>

**The staff story:** "<First-person quote — can be from either role's perspective,
whichever is more impacted by the broken handoff.>"

**Affected role(s):** <Role1 ↔ Role2>

---
```

Cross-role issues use `[CR-01]`, `[CR-02]`, etc. to distinguish from per-role issues.

#### I. Structural Proposals (when warranted)

Same format as single-user Section E (`[SP-##]` blocks), but multi-user audits have an
additional lens: **cross-role structural problems**. These are cases where the issue isn't
just one role's page — it's the way pages interact (or fail to interact) across roles.

**Additional triggers for Section I in multi-user audits:**
- A handoff that fails because the receiving role's page wasn't designed for the data
  the sending role produces (e.g., sides tickets look identical to meat tickets on KDS)
- Two roles that need to see the same data but have no shared view
- A manager oversight gap that would be solved by a new dashboard widget or consolidated view
- An interaction that requires switching between pages when it should happen in one place

SPs in multi-user audits should reference `[CR-##]` cross-role issues in addition to
per-role `[##]` issues in their "Problem pattern" field.

**Example multi-user SP:**

```markdown
##### [SP-01] Dedicated Sides Prep View (`/kitchen/sides`)

**Problem pattern:** Issues [04], [08] and cross-role issues [CR-02], [CR-03] all stem
from the same root cause: the sides preparer shares the generic KDS with the grill cook,
but their workflows are fundamentally different — Ate Lina needs to see refills separately,
track utensil prep, and manage banchan portions, none of which the current KDS supports.

**Current structure:**
┌─ /kitchen/orders ──────────────────────────┐
│  All tickets (meat + sides + refills)      │
│  No distinction between grill vs sides     │
│  Refills mixed with original orders        │
└────────────────────────────────────────────┘

**Proposed structure:**
┌─ /kitchen/orders ───────┐  ┌─ /kitchen/sides ──────────┐
│  Meat tickets only      │  │  Banchan + sides tickets   │
│  Grill cook focus       │  │  Refills highlighted       │
│  (Kuya Marc's view)     │  │  Utensil prep checklist    │
│                         │  │  (Ate Lina's view)         │
└─────────────────────────┘  └────────────────────────────┘

**Why individual fixes won't work:** ...
```

---

## Human in the Loop Gates

### 0. Scenario Presentation [FAST-SKIP] (ZEROTH GATE — BEFORE EVERYTHING)

**Trigger:** Every time the ux-audit skill is invoked.

**Action:** Present the user with a scenario summary before proceeding.

**Fast-skip:** Auto-skip when user's invocation already contains a complete scenario specification.

### 0.5. Code Viability Check [AUTO-RUN] (CODE AUDIT GATE)

**Trigger:** Automatically after Gate 0 resolves — runs on every ux-audit invocation.

**Action:** Invoke the `code-audit` sub-skill (`skills/code-audit/SKILL.md`). It reads the source code to trace
every action in the scenario plan through the codebase (route → component → store → RxDB) WITHOUT opening a browser.

**Behavior based on results:**

- **Blockers found → HARD-STOP:** Present the blocker list with file:line references and fix hints.
  Ask: "I found [N] code-level blockers. Fix them now before opening the browser, or skip and proceed?"
  If user chooses fix → apply fixes → re-run affected traces → loop until clean.
  If user chooses skip → proceed with blockers noted as expected failures.

- **Warnings only (no blockers) → FAST-SKIP:** Show warnings briefly, auto-proceed to Gate 1.
  "No blockers. [N] known-pattern warnings noted for the UX audit to watch."

- **Clean pass → AUTO-PROCEED:** "Code audit clean. Proceeding to browser session."

**Why:** UX audits burn time and snapshot budget when a scenario hits a code-level dead end (missing handler,
broken reactive chain, unimplemented store method). This gate catches those issues *before* the browser opens,
dramatically increasing the UX audit's first-pass success rate. The fix-iterate loop means the user can
prepare the codebase for the UX audit in the same session.

**Standalone use:** This gate's skill can also be invoked directly as `/code-audit` or "check if this scenario
will work" — in standalone mode it produces a Viability Report without proceeding to any browser audit.

### 1. Audit Mode Selection [FAST-SKIP] (FIRST GATE)

**Trigger:** Every time the ux-audit skill is invoked.

**Action:** STOP and ask before doing anything else:
- "What type of audit do you want?"
  - **Single-user audit** — One role, sequential steps. Evaluates a page or flow in isolation.
  - **Multi-user audit** — Multiple roles simulated sequentially in the **same browser** (shared IndexedDB), switching via session token swap. Evaluates cross-role data flow and handoffs.

**Why:** The audit mode determines the entire execution shape — number of agents, number of browser sessions, output format, and whether cross-role interaction is evaluated. Getting this wrong wastes significant time and compute.

**Exception:** If the user's request already clearly specifies the mode (e.g., "audit the POS page as staff" → single-user, "simulate kitchen and POS together" → multi-user), skip this gate and proceed with the implied mode.

**Fast-skip:** Auto-resolve when selected scenario clearly implies single-user or multi-user.

### 2. Production URL Check [HARD-STOP]

**Trigger:** User provides a URL that is not `localhost` or `127.0.0.1`.

**Action:** STOP and confirm:
- "This URL looks like a production/staging server. UX audits should run against the local dev server (`http://localhost:5173`). Should I proceed anyway, or switch to localhost?"

**Why:** Automated browser interaction against production could trigger rate limits, create test data, or affect real users.

### 3. Muscle Memory Disruption Warning

**Trigger:** Recommendations include layout changes to pages that staff use daily (specifically `/pos` floor plan, `/kitchen/orders` KDS queue, or checkout flow).

**Action:** Flag in the recommendations:
- "WARNING: This change affects a page used during every shift. Staff have built muscle memory for the current layout. Consider: (a) making the change between shifts, (b) keeping the same spatial positions for primary actions, (c) briefing staff before deployment."

**Why:** Moving a button that a cashier taps 200 times per shift can cause errors during the adjustment period.

### 4. Scenario Script Approval [HARD-STOP]

**Trigger:** Every multi-user audit, after scenario generation (Step B3).

**Action:** Present the full generated scenario script and STOP:
- Show all scenarios with names, contexts, and key actions per role
- Show the cross-role [HANDOFF] points
- Show agent count and estimated session length
- Ask: "Does this script look right? Want to add, remove, or modify any scenarios?"

**Why:** Generated scenarios are creative interpretations. The user knows their restaurant better than any AI — they should validate that the scenarios are realistic and test what actually matters. A bad script wastes significant time and produces irrelevant findings.

### 5. Multi-User Scope Warning [FAST-SKIP]

**Trigger:** Multi-user audit with 3+ role switches OR more than 10 scenarios planned.

**Action:** Warn the user:
- "This audit involves [N] role switches and [M] scenarios. It may take some time to complete. Proceed?"

**Why:** Long sequential browser sessions can grow unwieldy. Better to confirm scope up front than abandon mid-audit.

**Fast-skip:** Auto-skip for 2-role audits. Only warn for 3+ roles or 10+ scenarios.

### 6. Fix Selection Gate [HARD-STOP] (POST-AUDIT, EVERY AUDIT)

**Trigger:** Every audit, after presenting the full issue list and overall recommendation.

**Action:** STOP and ask the user which issues to fix:
> "Which of these would you like me to fix right now? Reply with issue numbers (e.g. '01, 02, 05'), 'all', 'everything', or 'none / just the report'."

**Then:**
- If any items selected → implement fixes inline, one file at a time, run `pnpm check` after all changes
- If "none" → stop here; the report is the deliverable

**Why:** Audits without action are noise. This gate closes the loop between findings and code — making every audit immediately actionable, with the user in control of scope.

---

## Auditable Pages Quick Reference

| Route | Primary Role | Audit Focus |
|---|---|---|
| `/` | All | Login speed, role selection clarity, error states |
| `/pos` | Staff | Floor plan readability, table status at a glance, order creation speed |
| `/pos` (order sidebar) | Staff | Item adding flow, quantity changes, checkout efficiency |
| `/kitchen/orders` | Kitchen | Ticket readability, status progression, glanceable from distance |
| `/kitchen/all-orders` | Kitchen | Order queue density, priority visibility |
| `/kitchen/weigh-station` | Kitchen | Scale reading clarity, weight-to-portion mapping |
| `/stock/*` | Manager | Inventory scanning, delivery receiving flow, count accuracy |
| `/stock/transfers` | Manager | Transfer creation, branch selection, confirmation |
| `/reports/*` | Owner | Data density, chart readability, date range selection |
| `/reports/branch-comparison` | Owner | Cross-branch comparison clarity, metric grouping |
| `/admin/users` | Admin | User CRUD efficiency, role assignment clarity |
| `/admin/floor-editor` | Admin | Element placement precision, preview accuracy |
| `/admin/devices` | Admin | Device pairing flow, connection status visibility |

---

## Self-Improvement Protocol

When the user corrects any finding from this skill:
1. **Update immediately** — Fix the incorrect assessment in your response
2. **Check DESIGN_BIBLE.md** — If the correction reveals a wrong principle interpretation, update the reference
3. **Check WTFPOS Design Context** — If design tokens, CSS classes, or layout shell have changed, update this SKILL.md
4. **New pages** — When a new route is added to WTFPOS, add it to the Auditable Pages table
5. **Track interaction failures** — If a `click`, `goto`, or `sessionstorage-set` fails repeatedly on the same type of element, add a workaround note to the relevant PC rule.
6. **Track snapshot budget** — If audits consistently use fewer than 5 snapshots, reduce the budget. If 15 is regularly hit and more are needed, raise it.
7. **Track gate skip rate** — If a gate is auto-skipped 5+ times consecutively, consider removing it or merging with another gate.

**Feedback loop to code-audit (shared self-improvement):**

8. **Feed missed blockers back to code-audit** — When the browser session hits a code-level blocker
   (dead handler, broken reactive chain, missing state, unimplemented feature) that Step 3.5 (Code
   Viability Check) did NOT catch, append a new entry to `skills/code-audit/references/MISSED_PATTERNS.md`
   with: (a) the scenario that triggered it, (b) what broke in the browser, (c) what trace should
   have caught it. This makes future code-audits smarter.
9. **Update trace templates** — When a browser session reveals a new common flow pattern not covered
   by `skills/code-audit/references/TRACE_TEMPLATES.md`, add a new trace template (T10, T11, etc.)
   so code-audit can trace it in future runs.
10. **Track code-audit accuracy** — In the Run Log, record whether Step 3.5 caught all blockers
    (`CA: all caught`), missed some (`CA: missed N`), or was skipped (`CA: skipped`). If missed
    rate exceeds 20% over the last 5 runs, flag for trace template expansion.

When `tailwind.config.js` or `app.css` changes:
- Re-read the files and update the Color Tokens and CSS Classes tables above

---

## User Profile (auto-updated by Self-Improvement Protocol)

Track observed user patterns to optimize gate behavior. Update after each run.

| Pattern | Observed | Gate impact |
|---|---|---|
| Scenario spec style | COMPLETE — user always provides full spec | Gate 0: auto-fast-track |
| Fix preference | ALWAYS — user always wants fixes after audit | Gate 6: auto-invoke fix-audit |
| Intensity preference | EXTREME/CHAOS — user prefers thorough audits | Gate 5: show warning but don't block |
| Agent count comfort | HIGH — user comfortable with 4-8 parallel agents | Gate 5: informational only |

> **Rule:** After 3 consecutive runs with the same pattern, upgrade from observation to default.
> After 1 run that breaks the pattern, reset to neutral.

---

## Run Log

Append one row after every execution. This data drives self-improvement decisions.

| Date | Mode | Roles | Agents | Crashed | Snapshots used | Issues found | Fix invoked? | CA accuracy |
|---|---|---|---|---|---|---|---|---|
| 2026-03-11 | Multi-user | Staff + Kitchen (Dispatch + Stove) | 1 (sequential stints) | 0 | 12 | 11 + 2 CR + 1 SP | TBD | N/A (pre-code-audit) |

> **Self-improvement triggers:**
> - Crash rate > 10% across last 5 runs → review Agent Performance Rules
> - Gate 0 skipped 5+ times → mark as permanent FAST-SKIP
> - Average snapshots < 5 per agent → reduce budget to 8
> - Fix always invoked → auto-invoke fix-audit without asking
> - CA missed > 20% over last 5 runs → expand trace templates in `skills/code-audit/references/TRACE_TEMPLATES.md`
> - CA all-caught 5+ consecutive runs → code-audit is well-calibrated, note in User Profile

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 5.1.0 | 2026-03-11 | **Revert to playwright-cli directly**: (1) Removed `.spec.ts` test generation. (2) Simplified execution model to use `playwright-cli` interactive command steps. (3) Merged Path A and Path B back into a unified workflow. |
| 5.0.0 | 2026-03-10 | Full paradigm shift — Playwright spec files replace playwright-cli. |
| 4.7.0 | 2026-03-10 | Multi-agent with varied scenarios + script-first enforcement |
| 4.6.0 | 2026-03-10 | Multi-user audit rewrite — single browser, sequential stints, pre-built E2E scripts |
| 4.0.0 | 2026-03-10 | Recommendations overhaul + Workspace rules flat format |
| 1.0.0 | 2026-03-07 | Initial skill creation |

---

## ⚠️ FORMAT REMINDER (READ LAST)

Before writing ANY audit output, verify:

1. **Section D uses `[01]`, `[02]` blocks** — NOT P0/P1/P2 tables
2. **Each issue has all five fields** — What, How to reproduce, Why this breaks, Ideal flow, The staff story
3. **Fix Checklist uses `[01]` IDs** — NOT `P0-1`, `P1-2`
4. **No Effort/Impact columns anywhere**
5. **No priority grouping anywhere**

If you catch yourself writing a table with `| ID | Issue | Location | Fix | Effort | Impact |` — STOP. That is the deprecated format. Go back and use the five-field dossier blocks from the Section D template.
