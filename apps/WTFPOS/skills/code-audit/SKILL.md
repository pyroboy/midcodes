---
name: code-audit
description: >
  Pre-flight code viability check for UX audit scenarios. Traces data flow, state transitions,
  store calls, and reactive chains through the codebase WITHOUT opening a browser. Identifies
  dead code paths, missing guards, broken reactive chains, unimplemented handlers, and state
  management gaps that would cause a UX audit to fail. This is a sub-skill of ux-audit —
  it runs automatically before every UX audit as Gate 0.5 (Code Viability Gate).
  Triggers on: "code audit", "pre-check", "code viability", "trace the flow", "will this
  scenario work", "dry run", or automatically when ux-audit is invoked.
version: 1.0.0
---

# Code Audit — WTFPOS

A **code-only** pre-flight check that traces scenario viability through the source code before
the UX audit opens a browser. No Playwright, no browser, no screenshots — just code reading,
grep, and static analysis of the reactive chain.

**Why this exists:** UX audits burn time and snapshots when a scenario hits a code-level blocker
(missing handler, broken state, unimplemented feature). Code-audit catches these *before* the
browser opens, letting you fix blockers first and giving the UX audit a much higher success rate.

---

## Relationship to ux-audit

```
User invokes ux-audit
       │
       ▼
┌─────────────────────────────────┐
│  Gate 0 — Scenario Presentation │  (ux-audit existing gate)
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  Gate 0.5 — CODE AUDIT          │  ◄── THIS SKILL
│  (auto-runs, no user prompt)    │
│                                 │
│  Reads code → traces scenario   │
│  → produces Viability Report    │
│                                 │
│  If blockers found:             │
│    HARD-STOP → show blockers    │
│    → user fixes or skips        │
│    → iterate until clean        │
│                                 │
│  If clean:                      │
│    AUTO-PROCEED to Gate 1       │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  Gate 1 — Audit Mode Selection  │  (ux-audit continues)
└─────────────────────────────────┘
```

**Integration rules:**
- Code-audit runs **automatically** when ux-audit is invoked — no separate user command needed
- Code-audit can also be invoked **standalone** (`/code-audit` or "check if this scenario will work")
- When run as part of ux-audit, its output feeds directly into the scenario plan
- When blockers are found, the user gets a **fix-iterate loop** before the browser ever opens

---

## What Code-Audit Checks

### 1. Route Existence & Access Control

For each page in the scenario:
- Does the route file exist? (`src/routes/<path>/+page.svelte`)
- Does the role have nav access? (check `ROLE_NAV_ACCESS` in `session.svelte.ts`)
- Is the route gated by warehouse check? (`isWarehouseSession()`)
- Does the route import the expected components?

### 2. Component Mounting Chain

For each UI interaction in the scenario:
- Does the component exist and export correctly?
- Is it mounted in the parent page/layout?
- Are its props being passed from the parent?
- Does it have the expected event handlers (`onclick`, `onsubmit`, etc.)?

### 3. Store → Component Data Flow

For each data display in the scenario:
- Which store provides the data? (trace from component `$derived` → store → RxDB collection)
- Does the store filter by `session.locationId`?
- Is the reactive chain unbroken? (`$state` → `$derived` → template binding)
- Are there any intermediate transforms that could lose data?

### 4. Write Path (User Actions → Store → RxDB)

For each user action in the scenario:
- Which handler fires? (trace `onclick` → store method → `incrementalPatch`/`incrementalModify`)
- Does the write include `updatedAt`?
- Does the write include `locationId`?
- Is `nanoid()` used for new record IDs?
- Does the handler guard with `if (!browser) return`?

### 5. Cross-Role Reactivity (Multi-User Scenarios)

For each handoff point:
- Does Role A's write to RxDB trigger Role B's `$derived` to update?
- Is the RxDB query subscription active on Role B's page?
- Are there any intermediate caches or manual refresh gates?
- Does the receiving component filter for the correct status/state?

### 6. Modal & Flow State Machine

For each modal in the scenario:
- What state variable controls visibility? (`showModal`, `isOpen`, etc.)
- What resets the state on close? (is there an `onclose` or cleanup?)
- Are there prerequisite states? (e.g., checkout requires order items > 0)
- Can the modal be opened from the expected trigger point?

### 7. Known Pattern Pre-Check

Cross-reference the scenario against `ux-audit/references/KNOWN_PATTERNS.md`:
- Which KP-## patterns are likely to surface in this scenario?
- Are any of those patterns already fixed in the current code?
- Flag expected KP hits so the UX audit knows what to watch for

---

## Execution Workflow

### Step 1 — Parse the Scenario

Extract from the ux-audit scenario (or user request):
- **Roles** involved (staff, kitchen, manager, owner, admin)
- **Pages** visited (routes)
- **Actions** performed (open table, add item, checkout, bump ticket, etc.)
- **Data expectations** (what should appear where, after which action)
- **Handoff points** (multi-user: which role's action triggers which role's view)

### Step 2 — Map Actions to Code Paths

For each action, build a trace:

```
ACTION: "Staff opens table T1"
  ├─ Trigger: FloorPlan.svelte → click on table SVG element
  │   └─ Handler: onclick → tablesStore.openTable(tableId, pax, packageId)
  ├─ Store: tables.svelte.ts → openTable()
  │   └─ RxDB write: tables collection → incrementalPatch({ status: 'occupied', ... })
  │   └─ Includes updatedAt? ✅
  │   └─ Includes locationId? ✅
  ├─ Side effect: PaxModal opens (controlled by showPaxModal $state)
  │   └─ PaxModal.svelte mounted in pos/+page.svelte? ✅
  │   └─ PaxModal receives tableId prop? ✅
  └─ Result: Table card changes to 'occupied' status via $derived
      └─ FloorPlan re-renders via reactive subscription? ✅
```

### Step 3 — Check Each Trace Point

For each trace, read the actual source files and verify:

| Check | Method | Pass condition |
|---|---|---|
| Route exists | `Glob` for route file | File exists |
| Component mounted | `Read` parent, search for import + tag | Import present AND tag in template |
| Handler exists | `Read` component, search for handler name | Function defined and callable |
| Store method exists | `Read` store file, search for method | Method exported and implemented |
| RxDB write correct | `Read` store method body | Uses `incrementalPatch`/`incrementalModify`, has `updatedAt` |
| Location filter | `Read` store queries | Filters by `session.locationId` |
| Reactive chain | `Read` component, trace `$derived` → store | Unbroken chain from RxDB → template |
| Modal state | `Read` component, find state var | Open/close/reset logic present |

### Step 4 — Produce Viability Report

Output format:

```markdown
## Code Audit — Viability Report

**Scenario:** <scenario description>
**Date:** YYYY-MM-DD
**Confidence:** HIGH / MEDIUM / LOW

### Route & Access Summary

| Route | Exists | Role Access | Components OK |
|---|---|---|---|
| `/pos` | ✅ | staff ✅ | FloorPlan ✅, OrderSidebar ✅, PaxModal ✅ |
| `/kitchen/dispatch` | ✅ | kitchen ✅ | DispatchBoard ✅ |

### Action Trace Results

#### [A1] Staff opens table T1
- **Trigger:** FloorPlan.svelte:L142 → onclick handler
- **Store call:** tables.svelte.ts:openTable() → L87
- **RxDB write:** ✅ incrementalPatch, updatedAt ✅, locationId ✅
- **Side effects:** PaxModal opens via showPaxModal state
- **Verdict:** PASS

#### [A2] Staff adds Pork Unlimited package
- **Trigger:** PaxModal.svelte:L65 → package selection
- **Store call:** orders.svelte.ts:createOrder() → L112
- **RxDB write:** ✅ but missing `packageId` field in order doc
- **Verdict:** BLOCKER — order.packageId not set during creation

### Blockers (must fix before UX audit)

| # | Description | File:Line | Fix hint |
|---|---|---|---|
| B1 | order.packageId not set during createOrder() | orders.svelte.ts:L115 | Add packageId to the incrementalPatch payload |

### Warnings (may cause UX audit friction)

| # | Description | File:Line | KP match |
|---|---|---|---|
| W1 | CheckoutModal "Confirm" button below fold at 1024x768 | CheckoutModal.svelte:L340 | KP-11 |
| W2 | No success toast after order creation | orders.svelte.ts:L120 | KP-05 |

### Expected Known Pattern Hits

| KP | Pattern | Where in scenario | Already fixed? |
|---|---|---|---|
| KP-01 | Touch target violations | PaxModal close button | No — inline style override at L23 |
| KP-05 | No success confirmation | After CHARGE action | No |

### Confidence Assessment

- **Routes:** 2/2 exist and accessible ✅
- **Components:** 8/8 mounted correctly ✅
- **Store methods:** 6/7 implemented (1 blocker)
- **RxDB writes:** 5/6 correct (1 missing field)
- **Reactive chains:** 4/4 unbroken ✅
- **Overall:** MEDIUM — 1 blocker must be fixed before UX audit
```

---

## Human in the Loop Gates

### Gate CA-1 — Blocker Review [HARD-STOP]

**Trigger:** Code audit finds 1+ blockers.

**Action:** Present the blocker list and STOP:
> "I found [N] code-level blockers that will break the UX audit scenario. Here's what needs fixing:
> [blocker list with file:line and fix hints]
>
> Would you like me to fix these now, or skip and proceed to the UX audit anyway?"

**If fix:** Apply fixes → re-run the affected traces → confirm blockers resolved → loop until clean.

**If skip:** Proceed to UX audit with a warning note that these blockers are expected to surface.

### Gate CA-2 — Warning Acknowledgment [FAST-SKIP]

**Trigger:** Code audit finds warnings but no blockers.

**Action:** Show warnings briefly:
> "No blockers found. [N] warnings noted (known patterns that will likely surface in the UX audit).
> Proceeding to browser session."

**Auto-skip** unless warnings exceed 5, in which case pause for acknowledgment.

### Gate CA-3 — Clean Pass [AUTO-PROCEED]

**Trigger:** Code audit finds no blockers and ≤2 warnings.

**Action:** Brief confirmation, auto-proceed:
> "Code audit clean — all traces pass. Proceeding to UX audit."

### Gate CA-4 — Post-Fix Next Steps [AUTO-PROCEED]

**Trigger:** After all blockers and/or warnings have been fixed (either from CA-1 or CA-2).

**Action:** Present a brief summary of what was fixed, then **auto-proceed**:

> "All [N] issues fixed. Here's what changed:
> [brief list of fixes applied with file names]
>
> Proceeding to UX audit."

**Auto-proceed behavior:**
- When running as part of ux-audit → proceed directly to Gate 1 (Audit Mode Selection)
- When running standalone → end the code-audit session with the fix summary

**Note:** The user can always interrupt before the next gate if they want to re-run the code
audit, expand scope, or stop. No need to block — the fix summary gives them the information
they need to decide.

---

## Standalone Invocation

When invoked directly (not as part of ux-audit):

```
User: "code-audit, staff checkout flow, alta citta"
```

1. Parse the scenario into actions
2. Run the full trace workflow
3. Produce the Viability Report
4. Present blockers/warnings
5. Offer to fix blockers inline
6. **Do NOT proceed to ux-audit** — standalone mode ends after the report

---

## Trace Depth Guide

Not every scenario action needs the same depth of analysis:

| Action type | Trace depth | Example |
|---|---|---|
| Navigation (goto route) | Shallow — route exists + role access | Staff navigates to /pos |
| Read/display data | Medium — store → component binding | Floor plan shows table statuses |
| Write/mutate data | Deep — handler → store → RxDB → reactive update | Staff opens table, adds item |
| Cross-role handoff | Full — write path on Role A + read path on Role B | Staff fires order → kitchen ticket appears |
| Modal interaction | Medium — state var + open/close/reset + prerequisites | Checkout modal opens after items added |

---

## File Reading Strategy

Code-audit reads many files but should be efficient:

1. **Start with the route file** — it tells you which components are mounted
2. **Follow imports** — component imports reveal the component tree
3. **Jump to stores** — `$derived` and `$state` usage reveals which stores drive the UI
4. **Read store methods** — only the methods relevant to the scenario actions
5. **Spot-check RxDB writes** — verify `incrementalPatch`/`incrementalModify` patterns

**Do NOT read:**
- Unrelated components or stores
- CSS files (that's the UX audit's job)
- Test files
- Reference docs (already loaded via KNOWN_PATTERNS cross-reference)

---

## Self-Improvement Protocol

After each run:
1. If a blocker was missed (surfaced in UX audit but not caught by code-audit), add it to a
   new `references/MISSED_PATTERNS.md` file with the trace that should have caught it
2. If a false-positive blocker was flagged (code looked broken but worked fine in browser),
   document the pattern to avoid future false positives
3. Track accuracy: `blockers caught / blockers that surfaced in UX audit`
4. Update trace templates when new component patterns are added to WTFPOS

---

## References

| Reference | Purpose | When to read |
|---|---|---|
| `../ux-audit/references/KNOWN_PATTERNS.md` | Recurring UX issues to pre-check | Every run — cross-reference traces |
| `../ux-audit/references/ROLE_WORKFLOWS.md` | Action frequencies per role | Scenario parsing — identifies critical paths |
| `../ux-audit/references/PRD_QUICK_REF.md` | Feature implementation status | Prevents tracing unimplemented features |
| `references/MISSED_PATTERNS.md` | Previously missed blockers | Every run — expands check coverage |
| `references/TRACE_TEMPLATES.md` | Pre-built trace patterns for common flows | Speeds up repeat scenarios |

---

## Run Log

| Date | Scenario | Blockers | Warnings | UX Audit followed? | Blockers missed? |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-03-11 | Initial skill creation — sub-skill of ux-audit |
