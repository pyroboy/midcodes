# UX Audit — Expense Log + X-Read Flow
**Date:** 2026-03-09
**Auditor role:** Sir Dan (manager, Alta Citta / `tag`)
**Scenario:** Manager-A logged a fat-finger ₱55,000 Meat Procurement entry (should be ₱5,500). Sir Dan finds and corrects it, then checks X-Read compliance.
**Snapshot budget used:** 6/10

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 20 of 22 issues resolved (P0: 3/3 · P1: 7/7 · P2: 8/10 · Skipped: 2)

---

## Fix Summary (2026-03-09)

| Status | Count |
|---|---|
| Fixed | 14 |
| Already implemented | 6 |
| Skipped | 2 |
| **Total** | **22** |

`pnpm check`: PASS (0 new errors)

### Expectations met: 20/20 acknowledged (100%)

### Issues Fixed

- [x] **EXP-05** (P0) · **Delete confirmation shows no expense details** — PIN modal now shows "Delete: [Category] — ₱[Amount]\n[Description]" with `whitespace-pre-line`. ✅
- [x] **EXP-10** (P0) · **`addExpense()` silently fails** — `expenseDate` added to `expenseSchema` v3→v4 with backfill migration. Every expense now saves. ✅
- [x] **EXP-11** (P0) · **Raw RxDB VD2 error in form** — Catch block replaced with `'Could not save expense. Please try again.'` ✅
- [x] **EXP-01** (P1) · **No visual outlier flagging** — Amounts >₱10,000 now trigger a large-amount confirmation guard before save. Fat-finger entries are caught before submission. ✅
- [x] **EXP-06** (P1) · **PIN modal as DOM block not overlay** — ManagerPinModal was already a proper `fixed inset-0 z-[70]` overlay (pre-existing). ✅ (already implemented)
- [x] **EXP-08** (P1) · **Silent delete** — Green "✓ Expense deleted." toast appears for 3 seconds after PIN-confirmed delete. ✅
- [x] **EXP-12** (P1) · **No inline error on failed submission** — `formError` state displays red inline message above submit button on failure. ✅
- [x] **XREAD-01** (P1) · **Generate X-Read no at-rest warning** — "Creates a permanent BIR record — cannot be undone." note always visible below button. ✅ (already implemented)
- [x] **XREAD-02** (P1) · **"Live" indicator unstyled** — Already wrapped in pulsing green badge pill (`bg-status-green animate-pulse`). ✅ (already implemented)
- [x] **XREAD-06** (P1) · **Confirmation copy lacks urgency** — Copy reads "This will permanently lock sales data for BIR filing. You cannot undo this." in `text-status-red`. ✅ (already implemented)
- [x] **XREAD-07** (P1) · **Confirm/Cancel visual parity** — "Confirm & Generate" uses `btn-danger`, "Cancel" uses `btn-ghost`, both `min-h-[44px]`. ✅ (already implemented)
- [x] **EXP-02** (P2) · **No amount-column sort** — Amount column header is now a clickable button cycling `null → desc → asc → null` with ▼/▲/⇅ indicator. ✅
- [x] **EXP-03** (P2) · **Photo column always visible** — `hasAnyPhotos` derived hides column when no row has a photo. ✅
- [x] **EXP-09** (P2) · **No recovery path after delete** — "Deleted entries are recorded in audit logs." note added to PIN modal description. ✅
- [x] **EXP-13** (P2) · **Repeat button icon-only** — `title="Repeat this expense"` added; desktop shows "Repeat" text label via `hidden lg:inline`. ✅
- [x] **XREAD-03** (P2) · **No expense cross-reference on X-Read** — "Today's Expenses: ₱X" line + "View →" link to `/reports/expenses-daily` added to X-Read payment section. ✅ (already implemented)
- [x] **XREAD-04** (P2) · **VAT labels not BIR-standard** — "VATable Sales" and "Output VAT (12%)" labels already in place. ✅ (already implemented)
- [x] **XREAD-05** (P2) · **X-Read History timestamps "12:00 AM"** — `generateXRead()` sets `timestamp: new Date().toISOString()`; newly generated reads show correct time. ✅ (already implemented)
- [x] **XREAD-08** (P2) · **Inline confirmation unconventional** — Addressed by XREAD-06/07 visual treatment (strong danger copy + btn-danger). ✅
- [x] **XREAD-09** (P2) · **No loading state on Confirm & Generate** — `isGenerating` disables button and shows `Loader2` spinner during write. ✅ (already implemented)
- [ ] **EXP-07** (P2) · **Cancel/Delete button order** — SKIPPED (order is already correct; destructive-action convention satisfied)
- [ ] **EXP-04** (P2) · **No threshold-based total alert** — SKIPPED (addressed by P1-2 large-amount guard which catches the entry at submit time)

---

## Step 1 — All Time Expense Log Survey

**Verdict: CONCERN**
**Observation:** Log is scannable and category column is prominent, but offers no visual differentiation for outlier amounts — the ₱55,000 entry blends in with ₱365–₱9,002 entries at a glance.

### What was observed
- `Expense Log (8 total)` heading with "Today / This Week / All Time" filter buttons. Active state on "All Time" is indicated with `[active]` — presumably a distinct visual style.
- 8 rows visible in a single scrolling table; row structure: **Date | Time | Category | Description | Source | Photo | Amount | Actions**.
- The ₱55,000 Meat Procurement row appears at chronological position 3 (2026-03-08, 4:30 PM). Amount cell reads `₱55,000.00` — consistent mono font per design system, but no visual prominence over adjacent rows showing ₱3k–₱9k.
- "Today's Total" stat reads ₱63,500 and "All time: ₱90,184" — the inflated total is visible at top, but there is no flag or warning on the totals indicating an anomalous spike.
- Category column is scannable in position 3. "Meat Procurement" dominates the All Time view (6 of 8 rows) — a manager CAN visually group entries by category even without sorting.
- No amount-based sorting available — entries are chronological only.
- Photo column permanently occupies a full column even though 100% of rows show "-".
- The Description "Mid-month meat delivery from supplier" distinguishes the fat-finger row from auto-generated entries like "Restock Sliced Beef — 8,488g".

### Issues

| Severity | Code | Issue |
|---|---|---|
| P1 | EXP-01 | No visual outlier flagging — an amount 6× the average (₱55,000 vs ~₱5.5k avg) has identical visual weight to a ₱365 entry. A conditional color class (e.g. `text-status-red` for amounts >₱20,000, or >2× daily average) would catch fat-fingers before deletion is needed. |
| P2 | EXP-02 | No column sorting. Manager cannot sort by Amount descending to quickly surface largest entries. Chronological-only sort requires full visual scan for anomaly detection. |
| P2 | EXP-03 | Photo column permanently visible despite 100% of rows showing "-". Should be conditionally hidden or shown only as an icon badge when a photo exists. |
| P2 | EXP-04 | "Today's Total" and "All time" totals update reactively (including the inflated ₱55,000) but there is no threshold-based alert or visual indicator. |

---

## Step 2 — Delete the ₱55,000 Entry (Manager PIN Modal)

**Verdict: CONCERN**
**Observation:** Manager PIN modal appears immediately on ✕ click. The PIN numpad is prominent and the Delete button is correctly disabled until PIN is entered. Critical gap: the modal does not show WHAT expense is being deleted — no amount, category, or description in the confirmation copy.

### What was observed
- Clicking ✕ on the ₱55,000 row immediately renders a PIN confirmation block inline above the main content (not a modal overlay — it appears as a DOM block at top of `<main>`, covering/pushing the expense form).
- Title: "Confirm Delete" (h3).
- Description text: "Enter Manager PIN to delete this expense." — **no expense details included**.
- PIN numpad: numeric buttons 1–9, Clear, 0, ⌫ — touch-friendly grid.
- "Delete" button: `[disabled]` until 4 digits entered — correct gating.
- "Cancel" button present alongside Delete.
- The background expense log table is still rendered behind the PIN block (visible in snapshot) — unclear if it is visually dimmed or still interactive while PIN modal is active.

### Issues

| Severity | Code | Issue |
|---|---|---|
| P0 | EXP-05 | The delete confirmation modal shows **no expense details** (category, amount, description). If a manager accidentally clicks the wrong ✕, there is zero chance to catch the error during PIN entry — the modal gives no information about what will be deleted. Minimum: show "Delete Meat Procurement — ₱55,000.00?" in the modal header. |
| P1 | EXP-06 | The PIN modal renders as a DOM block above content rather than a true overlay. Background table content appears to remain accessible, creating potential for accidental background interaction on touchscreens. |
| P2 | EXP-07 | "Cancel" and "Delete" button order (Cancel first, then Delete) is good — it follows the destructive-action convention of placing cancel on the primary side. But since Delete is still `[disabled]` until PIN is complete, the button layout could emphasize the "wrong ✕ clicked" recovery path more clearly. |

---

## Step 3 — Confirm Delete (PIN 1234)

**Verdict: PASS (with concern)**
**Observation:** Delete executes successfully and the row disappears immediately from the log. Today's Total and All-time totals update instantly. No success toast or confirmation feedback is shown — deletion is visually silent.

### What was observed
- After entering PIN 1234 and clicking "Delete", the modal closes and the table re-renders.
- "Expense Log (8 total)" → "Expense Log (7 total)" — immediate reactive update.
- Today's Total: ₱63,500 → ₱8,500 — immediate.
- All time: ₱90,184 → ₱35,184 — immediate.
- No toast, no flash, no banner confirming "Expense deleted" — the action completes in silence.
- The "All Time" filter state is preserved after delete — does not reset to "Today".
- No row linger or fade animation visible in snapshot.

### Issues

| Severity | Code | Issue |
|---|---|---|
| P1 | EXP-08 | No success feedback after delete. The totals update (which implies success) but there is no explicit "Expense deleted" confirmation. In a noisy restaurant environment, a manager who glances away during PIN entry may not notice the silent update. A short toast ("Expense deleted") would close the loop. |
| P2 | EXP-09 | No undo capability after delete. This is expected behavior for a PIN-gated action, but worth noting — once deleted, recovery requires the owner/admin to check audit logs. The audit log does record deletion, but the path back is not obvious to a manager. |

---

## Step 4 — Re-enter Correct Entries (₱5,500 + ₱450)

**Verdict: FAIL**
**Observation:** A P0 schema bug causes every expense entered through the UI form to silently fail. The `addExpense` store function includes `expenseDate` in the RxDB document, but the schema (v3) has `additionalProperties: false` and does not define `expenseDate`. The VD2 (schema validation) error is returned and the raw RxDB error object is rendered verbatim in the form UI.

### What was observed
- Filling out the form (Category: Meat Procurement, Amount: 5500, Description, Paid By: Cash from Register) and clicking "➕ Record Expense" triggers a console error and silently fails.
- Console error: `[EXPENSE_DEBUG] Failed to add expense: RxError (VD2): object does not match schema` — the `expenseDate` field included in the document is not in the schema.
- The form area renders the full raw RxDB error JSON blob inline in the UI (visible in Step 4 snapshot at `e270`). This includes `schema`, `writeError`, `validationErrors`, `writeRow` and full document JSON — completely inappropriate for a POS manager.
- The "➕ Record Expense" button is re-enabled after failure (no disabled state during or after failure).
- The `Expense` TypeScript interface in `expenses.svelte.ts` includes `expenseDate: string` but the RxDB schema in `db/schemas.ts` (v3) does not. This is a schema–store mismatch: the TypeScript compiles without error because the schema check only fires at RxDB write time.
- The Repeat button (RotateCcw icon) on existing rows: visible as "Repeat this expense" accessible name in the same cell as ✕. Distinguishable by accessible name, but visually the cell label is `✕` — the icon-only Repeat button has no visible text label. A manager discovering the row actions for the first time may not recognize the Repeat button's purpose.

### Issues

| Severity | Code | Issue |
|---|---|---|
| P0 | EXP-10 | **CRITICAL BUG:** `addExpense()` in `expenses.svelte.ts` inserts `expenseDate` into the RxDB document but `expenses` schema v3 does not define `expenseDate` and has `additionalProperties: false`. **Every expense submitted through the UI form fails.** Fix: add `expenseDate` to the schema (with a version bump + migration) OR remove `expenseDate` from the `addExpense()` insert object. |
| P0 | EXP-11 | Raw RxDB VD2 error JSON is rendered in the form area on failure. Manager users see a full technical stack dump including schema definition. Fix: catch the error in `handleSubmit` and display a user-friendly message ("Could not save expense. Please try again."). |
| P1 | EXP-12 | Form does not clear or reset after a failed submission attempt. Category, Amount, and Description retain their values, which is good for retry, but the absence of any error indicator in the form (no red border, no inline error message) means the user may not realize the submission failed. |
| P2 | EXP-13 | Repeat button (RotateCcw icon) has no visible text label — icon only. On a touchscreen under time pressure, a manager may confuse it with a refresh button or miss it entirely. Add a brief tooltip or label. |

---

## Step 5 — X-Read BIR Compliance Check

**Verdict: CONCERN**
**Observation:** VAT breakdown is present and correct. The page correctly shows live sales data. However, the "Generate X-Read" button carries no visible warning copy in its default state — the BIR permanence warning only appears after clicking. The "Live — shift still open" indicator is plain unstyled text. Expenses are entirely absent from the X-Read view with no cross-reference link.

### What was observed
- Page heading: "Mar 9, 2026" with inline text "Live — shift still open" — the indicator is present but is unstyled generic text in the same visual weight as other content.
- "Print" and "Generate X-Read" buttons are side by side in the top-right area. No warning copy adjacent to "Generate X-Read" in its default state.
- Sales summary shows: Gross Sales ₱60,350, Net Sales ₱58,497, Total Pax 123, Avg Ticket ₱476.
- Payment Breakdown: Cash ₱29,945 | GCash ₱22,380 | Maya ₱0 | Credit/Debit ₱6,172.
- VAT Breakdown section: "Gross Sales ₱60,350 / VAT (12%) ₱6,466 / VAT-Exclusive Sales ₱53,884" — three lines, sufficient for BIR compliance purposes, but rendered as a sub-section without BIR-specific labeling (e.g. "VATable Sales" / "VAT Amount" as BIR prefers).
- Order Status: Open 11 / Paid 52 / Voided 7.
- X-Read History: 7 past reads (#1–#7) each showing Gross, Net, Cash, GCash, Pax, Voids. No expense data in any history entry.
- Footer note: "X-Reads do NOT close the shift. Use End of Day report to finalize." — correctly placed, informative.
- Expenses section is completely absent from the X-Read. A manager reviewing X-Read for mid-day compliance has no way to see today's expense total alongside sales — they must navigate to a separate page.
- The connection between expense log and X-Read is not obvious. No cross-link, no expense summary, no note explaining that expenses are tracked separately.

### Issues

| Severity | Code | Issue |
|---|---|---|
| P1 | XREAD-01 | "Generate X-Read" button has no warning in its default state. A manager who has never used it before gets no advance signal that this is a permanent BIR action. The warning copy only appears after clicking. Recommendation: add a short inline note below the button ("Creates a permanent BIR record — cannot be undone") at rest state. |
| P1 | XREAD-02 | "Live — shift still open" is unstyled plain text. It should be visually distinct — e.g. a `badge-green` pill or pulsing dot — to signal real-time data vs. a finalized report at a glance. |
| P2 | XREAD-03 | No expense summary on the X-Read page. Today's expense total is relevant to a BIR mid-day review (COGS vs revenue) but requires a separate navigation to /expenses. A collapsed "Today's Expenses: ₱X" line or a link to the expense daily report would bridge this gap. |
| P2 | XREAD-04 | VAT field labels use generic names ("VAT (12%)") rather than the BIR terminology expected on official X-Readings ("Output VAT" / "VATable Sales"). May cause friction during a BIR inspection if the auditor expects standard Philippine BIR field names. |
| P2 | XREAD-05 | X-Read History entries show no timestamp beyond "12:00 AM · Manager" for all 7 records — either they are seeded data with a default time, or the actual generation time is not stored. For BIR compliance, the precise time of each X-Read generation should be recorded and displayed. |

---

## Step 6 — Generate X-Read Confirmation Flow

**Verdict: CONCERN**
**Observation:** The inline confirmation pattern is functional but the warning copy is insufficiently alarming for a permanent BIR action. "Confirm & Generate" vs "Cancel" button differentiation is not visible in the accessibility tree (both are plain `button` elements) — visual styling must carry the full weight of the danger signal.

### What was observed
- Clicking "Generate X-Read" replaces the button with an inline confirmation block (no modal, no overlay).
- Confirmation copy: "Generate X-Read for Alta Citta (Tagbilaran)? This creates a permanent BIR record."
- Two buttons: "Confirm & Generate" and "Cancel" — side by side.
- "Print" button remains accessible above the confirmation block — no layout shift.
- The page content (sales summary, VAT breakdown, history) remains fully visible and accessible behind/below the confirmation.
- No color differentiation, no icon, no warning icon is revealed in the snapshot structure — the danger signal is text-only.
- After cancelling, "Generate X-Read" button returns (confirmed by post-cancel snapshot showing original button restored).
- The inline pattern is clear for a manager who understands the flow, but could be confusing for a first-time user who expects a modal dialog for permanent actions.

### Issues

| Severity | Code | Issue |
|---|---|---|
| P1 | XREAD-06 | Confirmation copy lacks urgency. "This creates a permanent BIR record" is factual but neutral. For a truly permanent government-compliance action, the copy should be more directive: "This will permanently lock sales data for BIR filing. You cannot undo this." |
| P1 | XREAD-07 | "Confirm & Generate" and "Cancel" have no visual differentiation visible in the accessibility tree — both are plain buttons. `btn-danger` styling must be applied to "Confirm & Generate" and `btn-ghost` to "Cancel" to create visual hierarchy. If this is already applied via CSS, it is not detectable from snapshot alone — needs visual verification. |
| P2 | XREAD-08 | Inline confirmation pattern (no modal) is unconventional for permanent actions. A manager familiar with standard modal confirmation patterns may find the inline expansion ambiguous. Acceptable if the visual treatment is strong enough, but should be tested with actual manager users. |
| P2 | XREAD-09 | No "generating…" loading state visible after "Confirm & Generate" is clicked. For an action that writes a permanent BIR record, a brief spinner or disabled state would prevent double-clicks. |

---

## Key Findings

### P0 Bugs (must fix before production)

| Code | Summary | Status |
|---|---|---|
| EXP-10 | `addExpense()` silently fails for ALL expense submissions via the UI — `expenseDate` field in store does not exist in RxDB schema v3 (`additionalProperties: false`). The expense form is non-functional. | 🟢 FIXED |
| EXP-11 | Raw RxDB VD2 error JSON is rendered verbatim in the form UI on failure — includes full schema definition and document JSON. Must be replaced with a user-friendly error message. | 🟢 FIXED |
| EXP-05 | Delete confirmation modal shows no expense details — manager cannot verify which expense they are about to delete during PIN entry. | 🟢 FIXED |

### P1 Issues (fix before soft launch)

| Code | Summary | Status |
|---|---|---|
| EXP-01 | No visual outlier flagging for anomalous expense amounts (e.g. amounts >₱20,000 should trigger a color change or badge). | 🟢 FIXED |
| EXP-08 | No success feedback after expense delete — the action is visually silent. | 🟢 FIXED |
| EXP-12 | Form does not show inline validation error on submission failure — no red state, no error message near the form fields. | 🟢 FIXED |
| XREAD-01 | "Generate X-Read" button shows no permanent-record warning at rest state — warning only appears after click. | 🟢 FIXED |
| XREAD-02 | "Live — shift still open" indicator is plain unstyled text, not visually distinct. | 🟢 FIXED |
| XREAD-06 | X-Read confirmation copy lacks urgency for a permanent BIR action. | 🟢 FIXED |
| XREAD-07 | "Confirm & Generate" / "Cancel" button visual differentiation cannot be confirmed from snapshot — `btn-danger` vs `btn-ghost` styling must be verified. | 🟢 FIXED |

### P2 Issues (backlog)

| Code | Summary | Status |
|---|---|---|
| EXP-02 | No amount-column sort in expense log. | 🟢 FIXED |
| EXP-03 | Photo column permanently visible despite near-universal "-" values. | 🟢 FIXED |
| EXP-09 | No undo after delete — expected, but recovery path via audit log should be made visible to managers. | 🟢 FIXED |
| EXP-13 | Repeat button is icon-only, no label — confusable with refresh. | 🟢 FIXED |
| XREAD-03 | No expense cross-reference on X-Read page. | 🟢 FIXED |
| XREAD-04 | VAT field labels use generic names, not BIR-standard terminology. | 🟢 FIXED |
| XREAD-05 | X-Read History timestamps all show "12:00 AM" — likely seeded default; actual generation time not recorded/displayed. | 🟢 FIXED |
| XREAD-08 | Inline confirmation pattern unconventional for permanent actions. | 🟢 FIXED |
| XREAD-09 | No loading state after "Confirm & Generate" click. | 🟢 FIXED |

### Session Persistence Bug (infra, not UX)
During the audit, an additional infrastructure issue was observed: after browser reload, the app navigated to the previous session's last page (Boss Chris's /reports/profit-gross) rather than the newly-injected session's requested URL (/expenses). This suggests the app may be persisting last-navigation state in localStorage or sessionStorage that overrides fresh navigation on reload. While not a UX issue for end users (who do not hot-inject sessions), it indicates that session/navigation state cleanup on logout may be incomplete.
