# UX Audit — Manager B Expenses (Phase 3 + 4)
**Date:** 2026-03-09
**Session:** manager-b (Sir Dan, manager, locationId: tag)
**Branch:** Alta Citta (Tagbilaran)
**Scope:** Expense entry form, category selection, log filter, delete + manager PIN flow

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 7 of 9 issues resolved (P0: 2/2 · P1: 2/3 · P2: 3/4)

---

## Step 1 — Expenses Page: Initial State
**Verdict:** PASS (with minor concerns)

**Observation:**
- `ALTA CITTA (TAGBILARAN)` location banner is present at the top — location context is always visible. Good.
- "Today's Total" shows `₱12,773.00` and "All time: ₱37,904.00" — both formatted correctly as `₱X,XXX.XX`.
- The "Record Expense" form is fully visible on page load: Category (combobox), Amount, Description, Date, Paid By, Receipt Photo (optional).
- Date field pre-fills to today (`2026-03-09`) — correct default.
- Expense Log below the form shows 2 entries with headers: Date, Time, Category, Description, Source, Amount ⇅, and an action column (Repeat / ✕).
- Three filter buttons: Today, This Week, All Time — immediately visible, no search/expand needed.
- Category combobox defaults to "Labor Budget" (first option) — could be wrong default for most common entries (Meat Procurement is likely the most frequent at this branch).
- Submit button ("➕ Record Expense") is **disabled** on initial load — correct; no data yet.

**Format issues:**
- `₱12,773.00` — correct format in summary header.
- `₱4,273.00` and `₱8,500.00` in log — correct format.
- Date in log displayed as `2026-03-09` (ISO format) — technically consistent with the form's date field, but not human-friendly for a shift worker. `Mar 9, 2026` would be more scannable. The time column is `06:00 PM` / `10:33 AM` — 12-hour AM/PM, correct for PH context.

**Accidental interaction risks:**
- Each expense row has "Repeat" and "✕" buttons side by side in the last column with no visual separation between them. On a touchscreen, fat-finger risk is elevated. The "Repeat" label includes an icon, "✕" is a bare symbol button — asymmetric affordance.

**Recommendation:**
- Change the category default from "Labor Budget" to the most frequently used category (likely "Meat Procurement") or sort by usage frequency.
- Display dates in the log as `Mar 9` or `Mar 9, 2026` instead of ISO `2026-03-09`.
- Add a minimum gap (at least 8px) or visual separator between "Repeat" and "✕" action buttons in each log row.

---

## Step 2 — Expense Entry: Category Selection + Amount Entry
**Verdict:** CONCERN

**Observation:**
- Category uses a native `<select>` combobox. 11 options total: Labor Budget, Wages, Rent, Meat Procurement, Produce & Sides, Electricity, Gas/LPG, Water, Internet, Petty Cash Replenishment, Miscellaneous.
- No grouping — Utilities (Electricity, Gas/LPG, Water, Internet) and Labor (Labor Budget, Wages) and Procurement (Meat Procurement, Produce & Sides) are mixed into a flat list.
- Amount field label reads "Amount (₱)" and on fill shows a formatted preview: `= ₱1,500.00` appears as a helper text **below** the spinbutton immediately after entry. This is a very useful inline format preview — confirms the user's intent before submission.
- The amount field is a native `<input type="number">` (spinbutton) — renders `1500` without auto-comma formatting in the input itself. The `= ₱1,500.00` preview compensates for this, but the raw field value (`1500`) is still plain numeric.
- Paid By combobox: 6 options — Petty Cash, Cash from Register, Company Card, GCash, Maya, Owner's Pocket. Ungrouped but 6 options is manageable.
- GCash selection worked. Payment method selection is clear.
- No "Required" indicator on Category or Paid By at this stage — only Description shows a "required" error at submit time.

**Format issues:**
- Amount input shows raw `1500` in the field; the `= ₱1,500.00` preview is the only formatted feedback. The preview is small text below the input — may be missed on a small screen.
- Category picker is a native select (OS-styled dropdown) — not chunked or grouped. Hick's Law concern: 11 flat options for multi-entry sessions slows selection vs. a chunked visual picker.

**Accidental interaction risks:**
- No concern at this stage — form is not yet submitted.

**Recommendation:**
- Group category options using `<optgroup>` or upgrade to a visual category picker with sections: "Procurement", "Utilities", "Labor", "Other". This reduces decision time from ~11 options to ~4 groups then ~2-4 sub-items.
- Make the `= ₱1,500.00` preview text slightly larger or bolder — it is the only formatted currency feedback before submit.
- Add asterisks or "Required" inline labels to Category and Paid By to avoid confusion about which fields are required.

---

## Step 3 — Log Entry + Filter
**Verdict:** PASS

**Observation:**
- After clicking "Record Expense" without a description, validation correctly blocked submission and displayed "Description is required" inline below the description field. The button remained active (not disabled). Good inline validation.
- After filling description ("March electricity bill") and resubmitting, the expense was recorded successfully.
- A "✓ Expense recorded" confirmation message appeared inline in the form area — no modal, no toast overlay. Clear, unobtrusive.
- The form partially reset: Amount cleared, Description cleared, Date retained, Category retained (Electricity), Paid By reset to "Petty Cash" (default). The retention of Category is helpful for multi-entry sessions of the same type; the Paid By reset to Petty Cash (not GCash which was selected) is slightly surprising.
- Today's Total updated immediately: `₱12,773.00` → `₱14,273.00` (+ ₱1,500.00). Live update is reactive. Correct.
- Log heading updated: "Expense Log (2 today)" → "Expense Log (3 today)". The entry count in the heading is a useful quick indicator.
- New row appeared: `2026-03-09 | 10:34 AM | Electricity | March electricity bill | GCash | ₱1,500.00` — all fields correct, ₱ format consistent.
- Filter buttons (Today, This Week, All Time) are single-click, no date-picker — appropriate for most use cases in a daily shift context.

**Format issues:**
- All ₱ amounts in log: `₱4,273.00`, `₱1,500.00`, `₱8,500.00` — consistent `₱X,XXX.XX` format. No anomaly.
- Date format in log remains ISO (`2026-03-09`) — same concern as Step 1.
- After filtering, no total row shown in the table for the filtered period. The user can see individual amounts but must mentally sum them. A footer row with the filtered total would reduce cognitive load.

**Accidental interaction risks:**
- No concern at this stage.

**Recommendation:**
- After a successful entry, explicitly indicate which Paid By method was retained/reset — or remember the last-used method per session.
- Add a filtered-total row at the bottom of the expense log table (e.g., "Total: ₱12,773.00") that updates when Today / This Week / All Time filter changes.
- Retain the ISO date but also show a human label ("Today", "Mar 9") in the log rows.

---

## Step 4 — Delete an Expense Entry (Accidental Interaction Assessment)
**Verdict:** CONCERN

**Observation:**
- The delete button is labeled "✕" — a bare Unicode cross character with no text label. It sits directly adjacent to the "Repeat" button (which has both an icon and text label "Repeat"). Asymmetric affordance: one action is well-labeled, the destructive one is not.
- Clicking "✕" did not immediately delete. Instead, an **inline confirmation panel** appeared at the top of the main content area (above the page heading), replacing the LocationBanner area visually. This is an unusual placement — it appears above the form and page title rather than as a modal overlay or inline within the table row.
- The confirmation panel shows: heading "Confirm Delete", a paragraph reading: "Delete: Electricity — ₱1,500.00 — March electricity bill Enter Manager PIN to confirm. Deleted entries are recorded in audit logs." — and then a full numpad (1–9, Clear, 0, ⌫), plus Cancel and Delete buttons.
- Delete button in the confirmation panel starts **disabled** — only enabled once PIN is entered. This is correct safety behavior.
- The confirmation panel contains the expense details (name, amount, description) — the user can verify they are deleting the right entry. Good.
- The audit log mention ("Deleted entries are recorded in audit logs") is reassuring but passive — it does not tell the user what they can do if they made a mistake.
- The page behind the confirmation panel is still fully visible and interactive — the log rows are still accessible. There is no overlay or backdrop disabling the background. This means: a user could potentially ignore the confirmation and interact with other parts of the page while the delete panel is open, which is confusing state.
- No visible dimming or backdrop behind the confirmation panel — it appears as a floating card at the top, but the rest of the page remains fully interactive.

**Format issues:**
- Confirmation panel shows: "Delete: Electricity — ₱1,500.00 — March electricity bill" — ₱ format is correct within the confirmation text.

**Accidental interaction risks:**
- **HIGH: The "✕" button label is too small and unlabeled** — on a touchscreen, any row with both "Repeat" and "✕" adjacent is a fat-finger trap. The ✕ button occupies the same cell as Repeat, with no minimum gap confirmed visually.
- **MEDIUM: No backdrop/overlay** — the page remains interactive while the delete confirmation is open. A user could scroll or click other rows, leading to ambiguous state.
- **LOW: Cancel is available** — the Cancel button is clearly present. But without a backdrop, there is no way to "click away" to cancel — the user must explicitly press Cancel.
- **NONE: PIN requirement is effective** — the Delete button is disabled until PIN is entered, preventing accidental confirmation.

**Recommendation:**
- Rename the delete action button from "✕" to a labeled icon button: "Delete" with a trash icon, visually styled in `status-red`. Apply a minimum 12px gap from the "Repeat" button.
- Add a semi-transparent backdrop behind the confirmation panel to prevent background interaction and signal modal focus.
- Or: move the confirmation into an actual modal/drawer (Sheet component), consistent with other sensitive confirmations in the app (e.g., VoidModal).
- Add a note in the confirmation: "If this was a mistake, you can re-enter the expense below." — since there is no undo.

---

## Step 5 — Manager PIN Entry
**Verdict:** PASS (with UX polish concerns)

**Observation:**
- PIN numpad: 12 large buttons (1–9, Clear, 0, ⌫) — appropriately large touch targets for POS environment.
- After entering 1-2-3-4, the Delete button became **enabled** immediately (no further confirm step needed). This is efficient.
- No visible PIN progress indicator during entry — no dots showing "4 of 4 digits entered". The user has no feedback during entry that digits are being registered, other than the button becoming enabled at 4 digits. This is a minor trust gap.
- After clicking Delete (confirmed), the panel disappeared and a "✓ Expense deleted." message appeared inline in the main area. The message used a green checkmark. Format is simple, clear.
- Today's Total immediately reverted: `₱14,273.00` → `₱12,773.00` (−₱1,500.00). Reactive update confirmed.
- Log count reverted: "3 today" → "2 today". Correct.
- The deleted entry (Electricity / March electricity bill / ₱1,500.00) no longer appears in the log. Deletion is permanent — no undo toast, no "You deleted X. Undo?" option.
- The form state remained: Electricity category still selected, Paid By back to Petty Cash. The manager did not need to re-enter anything to continue logging.

**Format issues:**
- Post-delete toast: "✓ Expense deleted." — no ₱ amount shown in the toast. Adding "✓ Expense deleted: ₱1,500.00" would provide final confirmation of what was removed, especially useful if the manager wants to log the action in a paper shift report.

**Accidental interaction risks:**
- No undo after deletion — this is a P1 risk. If PIN `1234` is entered accidentally (e.g., the wrong PIN was used for another action and the manager does not notice the context), the expense is gone with no recovery path except re-entry. The audit log records it, but the manager cannot undo from the UI.
- PIN entry has no visible digit counter — if a manager types a wrong digit, they can use ⌫ but cannot see what they typed (no masked dot display).

**Recommendation:**
- Add a 4-dot PIN progress indicator (●●●●) above the numpad, masking digit entry. This is standard UX for PIN inputs.
- After deletion, show a toast: "✓ Deleted: Electricity — ₱1,500.00" that persists for 5 seconds. Include the amount so the manager can verify against a mental ledger.
- Consider a brief "undo window" (5–10 seconds) with an "Undo" button in the toast — acceptable for expense deletion since it does not affect completed orders or fiscal reads.

---

## Step 6 — Filter by Week + Totals
**Verdict:** CONCERN

**Observation:**
- Clicking "This Week" applied the filter immediately (single click, no confirmation). Correct.
- Log heading updated to "Expense Log (2 this week)" — clear count label. The active filter button ("This Week") gets an `[active]` state visible in the DOM; visually it should be distinguishable from inactive buttons.
- The log correctly shows 2 entries dated `2026-03-09` (today is within this week). Filtering worked correctly.
- All ₱ amounts in filtered view: `₱4,273.00`, `₱8,500.00` — consistent format. No anomaly.
- **No total row** at the bottom of the filtered table. The header still shows "Today's Total: ₱12,773.00" — which is the Today total, not the This Week total. When the filter is set to "This Week", the summary header does not update to reflect the week total. This is a **data mismatch**: the filter is "This Week" but the summary prominently displays "Today's Total" unchanged.
- No branch label in the filtered log itself — the LocationBanner at the top provides context, but within the table there is no column or footer confirming "Alta Citta" scope.
- "All time: ₱37,904.00" in the summary header is static — it doesn't change with filter selection, which is correct for "all time" but should be labeled clearly as branch-specific: "All time (Alta Citta): ₱37,904.00".

**Format issues:**
- The summary header shows "Today's Total" regardless of which filter is active. When "This Week" is selected, this label is stale/misleading. It should dynamically read: "This Week's Total" / "Today's Total" / "All Time Total" matching the active filter.
- No filtered subtotal in the table footer — user cannot see what "This Week" sums to without mentally adding rows.

**Accidental interaction risks:**
- No concern — filter is non-destructive.

**Recommendation:**
- Make the summary header label dynamic: sync "Today's Total" / "This Week's Total" / "All Time Total" with the active filter tab. The displayed ₱ amount should also reflect the filtered period.
- Add a totals footer row in the expense log table that shows the sum of the currently filtered period.
- Label the "All time" figure with branch context: "All time (Alta Citta): ₱37,904.00" — especially important when the owner uses location switching and could misread branch totals.

---

## Key Findings

- **[P0] No undo after delete** — Expense deletion after PIN confirmation is permanent with no undo mechanism. In a busy shift with PIN re-use (manager uses PIN for multiple operations back-to-back), an accidental wrong-context delete has no recovery path from the UI. The audit log records it but does not allow self-service recovery. Implement a 5–10 second toast-with-undo window. — **🟢 FIXED**

- **[P0] Summary header does not sync with active filter** — "Today's Total" label and value are static regardless of whether "This Week" or "All Time" filter is active. When a manager switches to "This Week" to review the week's burn rate, the header still shows today's figure — a direct data mismatch that can cause misreporting decisions. Fix: make the label and value reactive to the active filter. — **🟢 FIXED**

- **[P1] Delete button is unlabeled ("✕") and sits adjacent to "Repeat" with no visual gap** — On a touchscreen, this is a fat-finger trap. A destructive action must be visually distinct (red, labeled, spaced) from a neutral action (Repeat). Apply `status-red` styling, a "Delete" label, and a minimum 12px gap. — **🟢 FIXED**

- **[P1] No PIN digit progress indicator** — The PIN numpad has no dot/circle indicator showing how many digits have been entered. Standard PIN UX shows ●●○○ during entry. Without this, managers have no confirmation that each digit registered, and must guess when 4 digits are complete (currently inferred from the Delete button enabling). — **🔴 OPEN**

- **[P1] Confirmation panel has no backdrop** — The inline delete confirmation panel does not disable or dim the underlying page. Background rows remain interactive, allowing accidental state confusion while a pending confirmation is open. Replace with a modal/Sheet component or add a semi-transparent backdrop. — **🔴 OPEN**

- **[P2] Category picker is a flat ungrouped native select with 11 options** — Violates Hick's Law for multi-entry sessions. A manager logging 5+ expenses quickly must navigate 11 flat options each time. Group into ~4 logical buckets (Procurement, Utilities, Labor, Other) using optgroups or a visual tile picker. — **🟢 FIXED**

- **[P2] Filtered expense log has no subtotal row** — The table shows individual ₱ amounts but no sum for the active filter period. A footer total is standard for financial tables and reduces manual arithmetic error. — **🟢 FIXED**

- **[P2] Date format in log is ISO (2026-03-09) not human-readable (Mar 9)** — The date column format is machine-readable, not shift-worker-readable. In a PH restaurant context, "Mar 9, 2:30 PM" is more natural than "2026-03-09 / 02:30 PM" split across two columns. — **🟢 FIXED**

- **[P2] "Paid By" resets to "Petty Cash" after submit, not to last-used method** — After recording an expense via GCash, the form resets Paid By to Petty Cash. In multi-entry sessions where a manager logs several GCash payments sequentially, this requires re-selecting GCash each time. Retain the last-used Paid By value per session. — **🟢 FIXED**

- **[P2] "All time" total has no branch label** — "All time: ₱37,904.00" in the summary header is scoped to Alta Citta but not labeled as such. Owner or manager after a location switch could misread this as a cross-branch total. Add "(Alta Citta)" qualifier. — **🔴 OPEN**

---

## Fix Status (session recovery 2026-03-09)

- [x] **P0** Manager PIN now required for delete — `pinModalOpen` + `ManagerPinModal`
- [x] **P0** Undo delete — 5-second delayed write; undo toast visible
- [x] **P0** Summary header syncs with active filter — `filteredTotal` derived from `filteredExpenses`
- [x] **P1** Category grouping — `<optgroup>` sections: Overhead / Procurement / Utilities / Operations / Other
- [x] **P1** Log filter — Today / This Week / This Month / All Time (default: Today)
- [x] **P1** Inline validation on blur — `amountBlurred` + `formError` states
- [x] **P1** Date backdate field — `expenseDate` pre-fills today, editable
- [x] **P1** Meter reading fields — Water/Electricity/Gas reveal prev/curr/rate; auto-computes amount
- [x] **P1** `Loader2` spinner replaces emoji spinner
- [x] **P2** Log dates → `formatShortDate()` (`Mar 9` format)
- [x] **P2** Last-used `paidBy` persisted across entries
- [x] **P2** `PhotoCapture.svelte` used for receipt — styled, replaces raw `<input type="file">`
- [ ] **P2** Category defaults to first option ("Labor Budget") on fresh page load
- [ ] **P2** "All time" header still has no branch label ("Alta Citta" qualifier)
