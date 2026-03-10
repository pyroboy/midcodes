# Kitchen Partial Audit — Hard 4-User — 2026-03-09

**Auditor persona:** Kuya Marc (Kitchen role, Pedro Cruz test account)
**Branch:** Alta Citta (Tagbilaran)
**Date:** 2026-03-09
**Session notes:** playwright-cli sessions were ephemeral (in-memory, headless); browser crashed repeatedly between steps. Each step required re-login. This in itself is a non-UX infra note but impacted audit continuity.

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 9 issues resolved (P1: 0/3 · P2: 0/4 · P3: 0/2)

---

## Steps Completed

- **B1: PASS** — Login flow found and used "Pedro Cruz Kitchen Alta Citta" quick-login button. Username "Kuya Marc" was typed in the manual form field before quick-login. Quick-login button bypasses the manual form entirely and lands directly on `/kitchen/orders`. No friction. Location already set to Alta Citta by the dev account.

- **B2: PASS with observation** — `/kitchen/orders` loaded with empty queue ("No pending orders") showing ✅ checkmark icon, supporting text "New orders will appear here automatically", and three stat pills: "57 Served Today", "20m Avg Service", "just now Last Completed". Discoverable and clean. The header bar has "↩ UNDO LAST" (prominent orange button) and "History 57" — both visible even on empty state. No visual noise, calm state messaging is good.

- **B3: PASS** — No active tickets existed, so tested UNDO LAST from the header. Clicking UNDO LAST immediately restored the last bumped ticket (T4 #T4-OISX with 4 items: Samgyupsal 533g READY, Egg 3x, Cheese 3x). The UNDO LAST button became `[active]` state. History count dropped from 85 to 84, confirming the ticket was moved back into the active queue. **No toast was shown** — the undo was silent; the ticket simply reappeared in the queue.

- **B4: PASS (functional) / CONCERN (feedback)** — The ticket did reappear. However after undo, the ticket showed all items with pre-filled green checkmarks and timer at 00:00. This is confusing — the items appear "already done" visually after the undo, while the count shows 0/4. The UNDO LAST button is a **global action from the header**, not a per-ticket inline action. There is no temporary toast with countdown — the undo is just a button click with no undo confirmation or grace-period messaging.

- **B5: PASS** — Found refuse/alert functionality via the expand chevron on each ticket item. Clicking the expand arrow reveals "RETURN" (red) and "SOLD OUT" (grey) inline action buttons. Clicking RETURN opened a "Return Item" modal with:
  - Item name shown in header badge (e.g. "Samgyupsal")
  - "Select a reason for returning this item:" prompt
  - 5 reason buttons: Out of Stock, Equipment Issue, Quality Issue, Wrong Order, Other...
  - Cancel + "Confirm Return" (disabled until reason selected)
  - Selecting "Out of Stock" highlighted it with orange border and enabled the Confirm Return button (now red)
  - Modal confirmed successfully. UX is clear, discoverable, appropriately gated.
  - **CONCERN:** Item name "Samgyupsal" was truncated to "Sam..." in the collapsed ticket row — only the expanded state shows the full name.

- **B6: PASS** — `/stock/inventory` loaded with full inventory list. Summary strip shows Total Items 93, OK 93, Low Stock 0, Critical 0. Grouped by protein category (Beef shown with donut chart + variant count + stock bars). Search bar present. Expand/Collapse All and List/Grid toggle. Column headers: ITEM, CATEGORY, STOCK LEVEL (bar), CURRENT/MIN, STATUS. Status badges: Well-Stocked (green), Adequate (yellow). No issues.

- **B7: PASS with observations** — `/stock/deliveries` showed an "Expiring Soon (1)" warning banner (Kimchi B-243, 2d left) prominently above the history. The "+ Receive Delivery" CTA is orange and prominent. Delivery History table has TIME, ITEM/SUPPLIER, QTY, BATCH & EXPIRY, FIFO USAGE columns with FIFO progress bars. Filters: search text box, All Dates dropdown, All Items dropdown, Show Depleted checkbox.
  - **Receive Delivery / Batch modal:** Item picker has TWO components — a "Search items..." textbox above a full dropdown combobox. The search textbox appears to filter the dropdown. The dropdown shows all 93 items with units appended (e.g. "Pork Bone-In (g)"). Current stock indicator is shown below ("Current stock: 7500 g"). Supplier field has recent supplier chips: Metro Meat Co., SM Trading, Korean Foods PH, Transfer from wh-tag. Batch No (optional), Expiry (optional), Delivery Photos (optional), Notes (optional). "Receive Stock" button disabled until required fields filled.
  - **CONCERN:** The item search textbox and the dropdown are separate controls — it's unclear if typing in the search actually filters the dropdown below or is just a label. Not confirmed live due to session instability.
  - **CONCERN:** The "Transfer from wh-tag" appears as a supplier chip — this mixes delivery-from-supplier with inter-branch transfer semantics.

- **B8: PASS with observation** — `/stock/waste` showed summary cards (Total Waste Today 153, Top Wasted Item: Pork Bones, Most Common Reason: Unusable (damaged)). Waste Breakdown by Reason mini-bar chart is present but very small and hard to read. "Today's Waste Log" table shows ITEM, QTY, REASON (color-coded badge), BY, TIME. "Log Waste" CTA is orange and prominent.
  - Log Waste modal: Item dropdown (no search), Quantity field, Reason buttons (color-coded: Dropped/Spilled, Expired, Unusable (damaged), Overcooked, Trimming (bone/fat), Other). Clean and well-labeled.
  - **CONCERN (P2):** Waste item picker is a plain dropdown with no search — with 93 items, this is harder to use than the delivery form's searchable picker. Inconsistent pattern.

- **B9: CONCERN** — `/kitchen/weigh-station` shows a 3-column layout (Pending Meat | Main workspace | Dispatched). "All clear" state on left, "Select a meat order / Choose from the pending list on the left" in center, "No items dispatched yet" on right with "Yield %" button. **No Bluetooth scale connection indicator, no pairing button, no scale status anywhere on the page.** The scale emoji ⚖️ is used as a visual but is just decorative — there is no hardware connection UI.

---

## Key Findings

- **[P1] No bump undo toast / feedback** — UNDO LAST is a global header action with no toast, no inline feedback, no grace timer. The action is immediate and silent. A kitchen worker who accidentally hits UNDO LAST has no confirmation that it was triggered and no indication of what was restored. The `[active]` button state is subtle and may not be noticed on a touchscreen. Recommend: show a 3-second "Ticket T4 restored" toast at the bottom of the screen after UNDO LAST fires.

- **[P1] Items show as pre-checked after undo** — After UNDO LAST restores a ticket, the individual item checkmarks remain green (from when the order was served). The progress counter shows 0/4 but all items look "done." This creates a false sense of completion. A kitchen worker may see the ticket and think nothing needs to be done, missing the point that the undo is meant to re-queue the order.

- **[P1] Item name truncation on ticket cards** — In the collapsed state, "Samgyupsal" is truncated to "Sam..." due to space constraints. For a kitchen worker reading tickets under pressure, truncated names on meat items are a safety risk (e.g. Pork vs Pork Bone-In vs Pork Bone-Out all start with "P"). The full name must be visible in the collapsed item row.

- **[P2] Weigh Station: no Bluetooth scale UI** — The weigh station page has no pairing button, no connection status, no weight readout. The page feels incomplete — it's essentially a placeholder for the Bluetooth scale integration. A kitchen worker arriving here expecting a working scale will be confused. Should show at minimum a "Connect Scale" button or a disconnected scale status badge.

- **[P2] RETURN vs SOLD OUT naming ambiguity** — The two action buttons when a kitchen worker expands an item are "RETURN" and "SOLD OUT." "RETURN" suggests giving an item back to a customer, but in this context it means "refuse/reject." "SOLD OUT" is clearer but also ambiguous — does it mark the item sold out globally, or just for this order? The reason selection dialog that follows ("Return Item") uses better language but the button label itself is confusing. Suggest renaming to "REFUSE" or "CANNOT SERVE."

- **[P2] Waste Log item picker lacks search** — The Log Waste modal uses a plain select dropdown for 93 items, while the Receive Delivery modal has a dedicated search textbox. The inconsistency creates a jarring experience when kitchen staff need to quickly log waste. Recommend using the same searchable pattern as delivery.

- **[P2] Waste Breakdown chart is too small** — The "Waste Breakdown by Reason" horizontal bar chart is barely visible (a tiny colored strip). The legend labels show "(1%)" for all three categories. This is not useful at a glance. Either make the chart larger or replace with simple count pills.

- **[P3] "Transfer from wh-tag" supplier chip in delivery form** — Mixing warehouse transfers with supplier deliveries in the same form with the same chip pattern conflates two different stock flow types. A kitchen worker receiving from a supplier may accidentally select "Transfer from wh-tag" as the supplier name. These should be visually differentiated or in separate flows.

- **[P3] Delivery form: unclear if search box actually filters** — The delivery form has a "Search items..." textbox above the item dropdown, but it's not obvious whether typing in the search box filters the dropdown options in real-time. If the search box is just decorative, it's dead weight. If it does filter, the connection should be more explicit (e.g., options reduce visually as you type).

- **[P3] Waste Breakdown percentages all showing "1%"** — All three waste reasons show "(1%)" in the breakdown legend, suggesting the data is either incomplete or the percentage calculation is off. If items are at exactly 1% each, the chart should still proportionally reflect relative sizes.

## E. Fix Status

| ID | Issue | Status |
|----|-------|--------|
| P1 | No bump undo toast / feedback after UNDO LAST | 🔴 OPEN |
| P1 | Items show as pre-checked (green) after undo | 🔴 OPEN |
| P1 | Item name truncation on ticket cards ("Sam...") | 🔴 OPEN |
| P2 | Weigh Station: no Bluetooth scale UI or pairing button | 🔴 OPEN |
| P2 | RETURN vs SOLD OUT naming ambiguity — should be REFUSE | 🔴 OPEN |
| P2 | Waste Log item picker lacks search (plain 93-item dropdown) | 🔴 OPEN |
| P2 | Waste Breakdown chart is too small to be useful | 🔴 OPEN |
| P3 | "Transfer from wh-tag" supplier chip conflates delivery with transfer | 🔴 OPEN |
| P3 | Delivery form: search box relationship to dropdown unclear | 🔴 OPEN |

---

## Bump Undo Toast Assessment

**Was the toast visible?** No toast was shown. UNDO LAST is a silent global action. The only feedback is the button switching to `[active]` state and the ticket reappearing in the list.

**Did undo work?** Yes — functionally the ticket reappeared immediately. History count decreased from 85 → 84 confirming the ticket moved back to active queue.

**Was it discoverable?** The UNDO LAST button is highly discoverable — it's an orange primary-style button in the header bar, visible even on the empty queue state. However, "undo" usually implies a post-action toast with a countdown. The current implementation feels more like a "restore last" button with no temporal constraint.

**Timing ok?** There is no timing constraint on UNDO LAST — you can undo at any time, not just within N seconds of bumping. This is actually appropriate for the kitchen context (a manager reviewing history may want to restore a ticket), but it also means there is no urgency feedback. The button has no loading state or confirmation.

**Recommendation:** Add a brief toast: "Ticket [T4] restored to queue" with a 4-second dismiss. Also clarify whether UNDO LAST can be triggered multiple times in succession (can you restore the 2nd-to-last ticket?) — the current name implies only one level of undo.

---

## Delivery Form Assessment

**Searchable item picker present?** Yes — there is a "Search items..." textbox in the Receive Delivery modal. The item dropdown below it lists all 93 stock items with their units. Whether the search field actively filters the dropdown in real-time was not confirmed due to session instability during testing.

**Supplier chips present?** Yes — four recent supplier chips are shown: Metro Meat Co., SM Trading, Korean Foods PH, Transfer from wh-tag. These are a useful shortcut for the most common suppliers. Tapping a chip auto-fills the supplier text field.

**UX friction points:**
1. The "Transfer from wh-tag" chip conflates supplier deliveries with warehouse transfers — different workflows, different semantics.
2. The UNIT field is disabled (pre-populated from the item selection) — this is correct behavior but may confuse users who want to override it.
3. "Receive Stock" button stays disabled until required fields are complete — a disabled CTA with no inline error messaging may leave users guessing why the button isn't active.
4. Batch No and Expiry are both marked "(Optional)" — for food safety, Expiry should be strongly encouraged or required for perishables. A hint like "Highly recommended for meat items" would help.
5. No confirmation step after submission — it would be valuable to show a brief success toast or confirmation panel showing what was received.
