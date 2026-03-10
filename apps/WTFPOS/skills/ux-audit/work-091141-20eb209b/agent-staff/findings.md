# Agent: Staff (Maria Santos) — Extreme Orders

## Session Setup
- Role: Staff, Alta Citta (tag)
- Viewport: 1024x768
- Login method: Dev login card (auto-filled credentials)
- Shift start: Required "Start Shift →" (₱0 float); "Skip — I'll add float later" button showed [active] state but did NOT dismiss the overlay — only "Start Shift →" worked.

---

## B1 — Floor plan under full load
Verdict: CONCERN
Finding: The "Start Your Shift" cash float overlay blocks all POS access on login and the Skip button does not work — only "Start Shift" dismisses it.
Detail: After logging in, a full-page "Start Your Shift" modal overlaid the floor plan, requiring a float declaration before any table interaction. The "Skip — I'll add float later" button entered an [active] state but the modal persisted — this is a UX bug. Under a rush, a staff member returning from break cannot reach any table until the float modal is resolved via "Start Shift →". Once cleared, the floor shows 8 tables (T1–T8), occupancy counter "0 occ / 8 free" in the header (readable), and Takeout Orders section below the floor plan. T1 showed as an occupied button with "BEEF / 1m / T1 / 2 pax / ₱1,198.00 / 13" when occupied — dense but informative. Table statuses (green vs. orange) cannot be verified from the accessibility tree alone (no screenshot taken per audit rules), but the data labels are clear.

---

## B2 — PaxModal under pressure
Verdict: PASS
Finding: PaxModal opens immediately on table click, defaults to 2 adults, with 3 clearly separated rows (Adults / Children / Free) and quick-select number buttons.
Detail: The modal title "How many guests for T1?" is unambiguous. Three pax categories are presented as separate sections: Adults (full price), Children ages 6–9 (reduced), Free under 5 — each labeled with their price tier. Stepper buttons (−/+) are present for each, plus quick-select number buttons (1–8 for adults, 0–4 for children/free). Default is 2 adults, which is a reasonable AYCE starting point. Total guests counter "2" shown at the bottom. The Cancel and Confirm buttons appear at the bottom. Touch target size cannot be measured from snapshot, but the button count is low (4 action buttons + 12 number buttons) — manageable under pressure. Under a rush, the clear labeling makes it fast to distinguish Adults vs. Children without re-reading.

---

## B3 — AddItemModal under extreme scenario
Verdict: CONCERN
Finding: AddItemModal opens on the Package tab by default (correct) — but no prior confirmation that a package is required before meats, and the CHARGE button is grayed out until items are pending.
Detail: The modal opens with 5 category tabs (Package, Meats, Sides, Dishes, Drinks) and defaults to the Package tab — appropriate flow. Package cards are large with image, name, description, price per pax, and inclusions. Adding Beef Unlimited for 2 pax populated the Pending Items section with "Beef Unlimited × 2 pax / PKG" and enabled "⚡ CHARGE (13)". The Meats tab shows 4 items (Premium USDA Beef, Sliced Beef, Pork Sliced, Samgyupsal) each with "tap to enter weight" — staff knows to weigh. The CHARGE button is prominently labeled with item count. Concern: the modal shows no explicit instruction that a package must be selected before meats will be processed. Under a rush, a new staff might try to add meats without a package and wonder why CHARGE stays disabled at 0.

---

## B4 — Order sidebar with a busy table
Verdict: PASS
Finding: The order sidebar shows clear package name, Refill and Add Item buttons prominently, SENT/WEIGHING/REQUESTING statuses per item group, with the full bill total and 3 action buttons.
Detail: T1 order sidebar after charging showed: header with T1 label, "2 pax ✎" edit button, timer "0m", the package badge "Beef Unlimited", and two action buttons "🔄 Refill" and "Add Item". The bill section showed Beef Unlimited (SENT / ₱1,198 / PKG), with Meats sub-section showing "Premium USDA Beef" and "Sliced Beef" both in WEIGHING status, and "10 requesting ▼ show" for sides. Bill footer: "BILL / 13 items / ₱1,198.00". Bottom row: Print | Void | Checkout, plus "More ▼ Transfer · Merge · Split · Pax". The Refill button is visible without scrolling. Status badges SENT / WEIGHING / REQUESTING are all present simultaneously — but their visual distinction cannot be confirmed without screenshot. Under pressure, "10 requesting ▼ show" collapses sides which reduces cognitive load, though it hides important status.

---

## B5 — Checkout flow under pressure
Verdict: PASS
Finding: Two-step checkout (Leftover Check → Payment) works correctly; ₱5,000 chip is present; "Incl. VAT (12%)" displays; Cash Change appears immediately after chip selection.
Detail: Clicking Checkout launched a modal with a visible step indicator "1: Leftover Check → 2: Payment". The leftover check shows a numpad, "0 g / No penalty" default, and "✓ No Leftovers — Proceed to Checkout" button — single tap to skip if clean. The Payment step shows: Subtotal (2 pax) ₱1,198.00, Incl. VAT (12%) ₱128.00, TOTAL ₱1,198.00. Cash quick chips: ₱20/₱50/₱100/₱200/₱500/₱1,000/₱2,000/₱5,000 — all 8 denominations present. After tapping ₱5,000: Total Paid ₱5,000.00 and Cash Change ₱3,802.00 appeared immediately. "✓ Confirm Payment" button became active. No blocking issues found in the checkout flow.

---

## B6 — Multiple tables open simultaneously
Verdict: CONCERN
Finding: Opening T3 while T1 is occupied launches T3's PaxModal immediately — but the occupancy counter does not update to "2 occ" until T3 is actually confirmed; staff cannot see T1's full bill info in the sidebar while T3 PaxModal is active.
Detail: With T1 occupied (BEEF / 1m / ₱1,198.00 / 13 items), clicking T3 opens the T3 PaxModal directly on top of the floor. The floor plan in the background shows T1 as [occupied with data labels] and T3 as [active]. The occupancy counter remains "1 occ / 7 free" during the T3 PaxModal — it does not pre-increment. The order sidebar shows the T1 order underneath (still visible in snapshot), but the PaxModal visually dominates. Under extreme rush with 6+ tables, staff must remember which table they just tapped — there is no "currently opening T3" confirmation banner visible in the sidebar or header. If Maria accidentally tapped T2 instead of T3, she might not notice until the pax modal title appears.

---

## Key Issues (for orchestrator)

- **BUG (FAIL equivalent) — B1:** "Skip — I'll add float later" button does not dismiss the Start Your Shift modal on login; only "Start Shift →" works. A staff returning from break mid-rush cannot access tables until this is resolved — blocks all POS operations.

- **CONCERN — B1:** Cannot verify green/orange visual distinction for table statuses without screenshot; accessibility tree shows data labels on occupied tables (BEEF / timer / pax / price / item count) but no explicit status color attribute.

- **CONCERN — B3:** No explicit guidance that a package must be selected before meats will count — CHARGE (0) disabled state with no explanatory text. New or stressed staff may not understand why items won't charge.

- **CONCERN — B6:** Occupancy counter does not pre-increment while a PaxModal is open for a new table, and there is no confirmation in the sidebar/header of which table is being opened — creates risk of wrong-table errors under a 6+-table rush.

- **OBSERVATION — B4:** "10 requesting ▼ show" collapses the sides status list which aids scan speed, but under rush, staff may miss if a side has been refused by kitchen since it requires a tap to expand.

- **PASS — B2:** PaxModal is clear, fast, and defaults to 2 adults; 3-category separation (Adults/Children/Free) with price tier labels is well-designed for an AYCE context.

- **PASS — B5:** Checkout two-step flow (Leftover Check → Payment) is clean; ₱5,000 chip, VAT display, and instant Cash Change calculation all work correctly; no blocking issues.

## Snapshot count: 6/10
