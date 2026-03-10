# UX Audit — Manager Expenses, Delivery & Transfer — Alta Citta (Tagbilaran)
**Date:** 2026-03-09
**Role:** Manager (Juan Reyes)
**Branch:** Alta Citta (Tagbilaran)
**Viewport:** 1024×768 (tablet)
**Pages Audited:** `/expenses`, `/stock/deliveries`, `/stock/transfers`
**Sessions:** 5 managers × 5 scenarios (full chaos coverage)

---

## Manager Scenarios Run

| Manager | Location | Focus |
|---|---|---|
| A — Juan Reyes | Alta Citta | Morning utility expense entry (Gas/LPG, Water, Electricity) |
| B — Juan Reyes | Alta Citta | Delivery receiving + delivery history |
| C — Juan Reyes | Alta Citta | Stock transfer (3-step wizard) |
| D — Juan Reyes | Alta Citta | Comprehensive expense category testing + overlap analysis |
| E — Juan Reyes | Alta Citta | Expense log review, filter, sort, delete, Repeat button |

---

## A. Text Layout Map — `/expenses`

```
┌────────────────────────────────────────────────────────────────────┐
│ [Sidebar: POS / Kitchen / Stock / Reports]       Alta Citta (Tagbilaran) │
├──────────────────────────────────┬─────────────────────────────────┤
│ EXPENSES           Today's Total │                                 │
│                        ₱0.00    │                                 │
├────────────────────┬─────────────┴────────────────────────────────┤
│ RECORD EXPENSE     │ EXPENSE LOG     [Today] [This Week] [All Time]│
│ ┌────────────────┐ │ ┌─────────────────────────────────────────┐  │
│ │ Category ▼     │ │ │ Date  Time  Category  Desc  Source  Amt │  │
│ │ Amount (₱)     │ │ │ ─────────────────────────────────────── │  │
│ │ Description    │ │ │ entries...                              │  │
│ │ Date           │ │ │                                         │  │
│ │ Paid By        │ │ │                                         │  │
│ │ Receipt Photo  │ │ │                                         │  │
│ │ [Record Expense]│ │ │                                         │  │
│ └────────────────┘ │ └─────────────────────────────────────────┘  │
└────────────────────┴────────────────────────────────────────────────┘

← FOLD LINE at ~500px — form above, log requires scroll on short screens
```

```
/stock/deliveries
┌─────────────────────────────────────────────────────────────────┐
│ STOCK MANAGEMENT  [Inventory] [Deliveries] [Transfers] [Counts] │
├─────────────────────────────────────────────────────────────────┤
│ DELIVERY HISTORY & BATCHES                 [Receive Delivery]   │
│ [Search...] [All Dates▼] [All Items▼] [ ] Show Depleted         │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Time  Item/Supplier  Qty  Batch & Expiry  FIFO Usage       │  │
│ │ ─────────────────────────────────────────────────────────  │  │
│ └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

```
/stock/transfers — 3-Step Wizard
┌─────────────────────────────────────────────────────────────────┐
│ INTER-BRANCH STOCK TRANSFERS                                    │
│ [✓ Select Item] → [2 Destination] → [3 Confirm]                 │
│                                                                 │
│ Step 1: Item dropdown + Qty + Source Inventory table            │
│ Step 2: Destination radio buttons (with Before/After stock)     │
│ Step 3: Transfer Summary + optional Notes + [Confirm Transfer]  │
│                                                                 │
│ RECENT TRANSFERS (ISO timestamps — not human-readable)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Status | Finding |
|---|---|---|---|
| 1 | **Hick's Law** | CONCERN | 11 expense categories in one flat dropdown. No icons or visual grouping beyond optgroup labels. Scanning 11 text options is slow on a tablet. |
| 2 | **Miller's Law** | CONCERN | Delivery modal: Item search + Qty + Unit + Supplier + 4 quick-select buttons + Batch No + Expiry + Photos + Notes = 9 input areas. Approaching overload. |
| 3 | **Fitts's Law** | PASS | All buttons ≥44px. Record Expense, Receive Stock, Confirm Transfer all full-width or prominent. Filter pills are 44px min-height. ✓ |
| 4 | **Jakob's Law** | PASS | Layout follows standard tablet POS form-left, log-right pattern. Filter pills, sort headers, and delete buttons match expected conventions. ✓ |
| 5 | **Tesler's Law** | FAIL | **Utility expenses force managers to compute their own amounts.** Water/Gas/Electricity have no meter reading fields. Manager must calculate (current − previous) × rate and enter the peso total manually. The system bears none of this complexity. |
| 6 | **Doherty Threshold** | PASS | Expense save is instant (RxDB local-first). Success flash appears immediately. Toast on delete appears within ~200ms. ✓ |
| 7 | **Visibility of System Status** | CONCERN | After submitting a delivery, the modal closes with no success toast or notification. The manager must look at the delivery history table to confirm the entry was saved. |
| 8 | **Gestalt — Proximity** | CONCERN | In delivery form, the "Don't forget batch & expiry dates for FIFO tracking ↓" hint is between the supplier and batch fields — good positioning. But the delivery cost/price field is missing entirely, breaking the natural grouping (what was received, how much it cost, from whom). |
| 9 | **Gestalt — Similarity** | FAIL | "Labor Budget" and "Wages" look identical in the category dropdown. No visual differentiation (icon, color, separator). Managers are unsure which to use for daily wage payments. |
| 10 | **Visual Hierarchy** | CONCERN | The expense form panel is 320px fixed width — narrow for a tablet that could show a wider form. On the right, the log table has 8 columns that get cramped. The "Today's Total" header stat is small and easy to miss. |
| 11 | **Information Hierarchy** | CONCERN | Expense log shows category name (e.g., "Water") in the same column weight as description. The category should be more visually prominent (badge/pill) so managers scan categories faster. |
| 12 | **WCAG — Contrast** | PASS | Text on white backgrounds, status-red amounts on white — sufficient contrast. Filter pill active state (orange bg, white text) passes 3:1. ✓ |
| 13 | **WCAG — Targets** | PASS | All interactive elements ≥44px. Delete (✕) button is 44×44. Repeat button is 44px. ✓ |
| 14 | **Consistency — Internal** | FAIL | **"Log Expense" sidebar quick action links to `/reports/expenses-daily` instead of `/expenses`.** A manager clicking "Log Expense" lands on the report, not the entry form. |
| 15 | **Consistency — Patterns** | CONCERN | Delivery history uses no cost/price column — inconsistent with the expense log which tracks amount. Manager can see what was received but not what it cost, and must context-switch to expenses to find that. |
| 16 | **Format Consistency** | FAIL | **Transfer Recent History shows raw ISO 8601 timestamps** ("2026-03-09T02:27:32.757Z") instead of human-readable times ("Today 10:27 AM"). Every other time in the app uses 12h format (HH:MM AM/PM). |
| 17 | **Accidental Interaction** | PASS | Large amount guard (>₱10,000) prevents accidental fat-finger amounts. Delete requires Manager PIN. Repeat button is orange-tint, not red — reduces accidental destructive triggers. ✓ |
| 18 | **Error Prevention** | CONCERN | Large amount threshold of ₱10,000 is too low for Wages/Labor Budget. A standard daily wage for 5 staff (₱2,400×5=₱12,000) triggers the warning every time, training managers to ignore it. |

---

## C. Best Day Ever — Manager's Perspective

> It's Monday morning, 8:45 AM. I just did my opening checklist. Now I need to encode last week's utility bills before the delivery truck arrives.
>
> I go to `/expenses`. Category: Water. Amount... wait, what do I type here? The bill says "previous reading 1245, current reading 1289, 44 cu.m consumed, ₱25/cu.m = ₱1,100." I do the math in my head — ₱1,100 — and type that. But tomorrow I'll need to know how many cubic meters we used this month. That's not in the app. It's in my notebook. Okay, I type "prev:1245 curr:1289 = 44 cu.m x25" into the description field. It works, but it feels like a workaround.
>
> Gas/LPG is next. We got a 50kg refill. How much? ₱3,500. I type it in. Good. But I also want to note what the previous tank level was. There's no field for that.
>
> Then the delivery arrives — 15kg of Pork Bone-In from Metro Meat Co. I open the delivery form. I fill in Item, Qty, Supplier, Batch, Expiry. But there's no field for how much I paid. I'll have to go to expenses separately and add "Meat Procurement — ₱2,250" as a separate step. I can't link them.
>
> Later, I want to transfer 5kg of Pork Bone-In to Alona Beach. The 3-step wizard is actually very clear — I can see the stock levels, the destination before/after, and I write a note. That part feels good.
>
> At end of day, I check the expense log. I click "All Time" to see everything. I want to sort by highest amount. I click the Amount column header and the sort works instantly. That's nice. But the timestamps in the transfer history look like computer code — "2026-03-09T02:27:32.757Z". What is that?

---

## D. Recommendations

### P0 — Service-Blocking

**P0-01 · Manager · Utility expenses have no meter reading fields [Effort: M] [Impact: High]**
Water, Gas/LPG, and Electricity all use the same generic "Amount (₱)" field. Philippine utility billing is based on meter readings (prev/current) — not flat amounts. When the "Water" or "Gas/LPG" or "Electricity" category is selected, the form should reveal additional fields: **Previous Reading**, **Current Reading**, **Rate/Unit**, and auto-compute the total amount. The manager fills in readings; the system does the math. Without this, consumption trends are invisible and managers must do manual arithmetic.
*Specific fields needed:*
- Water: Previous (cu.m), Current (cu.m), Rate (₱/cu.m) → computed amount
- Electricity: Previous (kWh), Current (kWh), Rate (₱/kWh) → computed amount
- Gas/LPG: Cylinder weight before (kg), after (kg), or delivery kg → peso amount

**P0-02 · Manager · "Log Expense" sidebar quick action links to wrong page [Effort: S] [Impact: High]**
The sidebar quick action "Log Expense" links to `/reports/expenses-daily` (the daily expense report) instead of `/expenses` (the expense entry form). A manager who taps "Log Expense" lands on a read-only report, not the input form. Must be changed to `/expenses`.

---

### P1 — Fix This Sprint

**P1-01 · Manager · "Labor Budget" and "Wages" categories are indistinguishable [Effort: S] [Impact: High]**
Both categories relate to labor costs with no clear definition. In the dropdown they sit adjacent with no explanation of when to use which. Result: managers split labor costs inconsistently across both, making reports unreliable. Options:
1. Remove "Labor Budget" — use "Wages" for all labor payments
2. Add descriptive subtexts in the dropdown (optgroup or tooltips)
3. Rename to "Wages (Actual)" and "Labor Allocation (Budget)" to clarify

**P1-02 · Manager · Missing critical expense categories for restaurant operations [Effort: S] [Impact: High]**
The current 11 categories don't cover several common samgyupsal restaurant expenses:
| Missing Category | Why Needed |
|---|---|
| Repairs & Maintenance | Kitchen equipment, AC, grills, electrical — very frequent |
| Packaging & Supplies | Takeout containers, cups, utensils, wrap |
| Cleaning Supplies | Detergent, disinfectant, mops, gloves |
| Employee Benefits | SSS, PhilHealth, Pag-IBIG — legally mandated |
| Transportation | Market runs, courier delivery fees |
| Marketing & Promotions | Facebook ads, banners, vouchers |
Without these, everything goes into "Miscellaneous" — destroying report granularity.

**P1-03 · Manager · "Petty Cash Replenishment" is a fund movement, not an expense [Effort: S] [Impact: Med]**
When a manager tops up the petty cash fund from the register, it's an internal cash transfer — not an outgoing business expense. Recording it as an expense overstates operational costs in reports. Should either: (a) be removed as a category, or (b) display a warning: "This records a fund transfer, not a business expense — it will appear in expense totals."

**P1-04 · Manager · Large amount warning fires on every normal Wages/Labor Budget entry [Effort: S] [Impact: Med]**
The ₱10,000 threshold is too low for wage categories. A standard day's wages for 5 staff easily exceeds this. Managers see the "Large Amount Warning" modal every time they enter wages, training them to ignore it — defeating its purpose. Fix: either raise the threshold to ₱50,000, or make it category-aware (no warning for Wages, Labor Budget; warning at ₱10,000 for Miscellaneous, Petty Cash Replenishment).

**P1-05 · Manager · Delivery form has no purchase price/cost field [Effort: M] [Impact: High]**
The delivery receive form captures: Item, Qty, Supplier, Batch No, Expiry, Photos, Notes — but no price per unit or total delivery cost. A manager receiving 15kg of Pork Bone-In at ₱150/kg cannot record the ₱2,250 cost in the delivery record. They must separately open `/expenses` and add "Meat Procurement" — with no link between the two records. Add an optional "Unit Cost (₱)" and auto-computed "Total Cost" field to the delivery form, with a "Create Expense" shortcut button on submission.

**P1-06 · Manager · ISO 8601 timestamps in Transfer Recent History [Effort: S] [Impact: Med]**
The Recent Transfers table displays raw timestamps ("2026-03-09T02:27:32.757Z") instead of human-readable time ("Today 10:27 AM" or "Mar 9, 2:27 PM"). All other time displays in WTFPOS use 12-hour AM/PM format. Fix: pass through `formatTimestamp()` or equivalent.

**P1-07 · Manager · No success feedback after delivery submission [Effort: S] [Impact: Med]**
After clicking "Receive Stock" in the delivery modal, the modal closes silently. No toast, no flash, no confirmation that the entry was saved. The manager must verify by finding their new row in the delivery history table. Add a green success toast ("✓ Delivery recorded — 15,000g Pork Bone-In") matching the expense success flash pattern already in use.

**P1-08 · Manager · "Transfer from wh-tag" appears as a supplier name in delivery history [Effort: S] [Impact: Med]**
Inter-branch transfers are stored as delivery records with supplier name "Transfer from wh-tag". In the delivery history, these rows look identical to vendor deliveries — just with "Transfer from wh-tag" in the supplier column. This conflation of transfers and deliveries is confusing to managers reviewing stock history. Consider: a visual badge or row variant to distinguish transfer-origin records from vendor deliveries.

**P1-09 · Manager · No stock transfer authentication [Effort: S] [Impact: High]**
Transferring 5,000g+ of expensive meat from one branch to another requires no manager PIN. Any user who reaches the Transfers page can execute a transfer. Given that this is a manager-only page (correct), the risk is lower — but a confirmation step (or PIN for large-quantity transfers, e.g., >2kg) would be prudent.

**P1-10 · Manager · Expense category select defaults to "Labor Budget" on first load [Effort: S] [Impact: Low]**
The first option in the dropdown is "Labor Budget" — the least-frequently used daily expense. The last-used category is remembered after the first submit (P2-1 is implemented), but on first page load, "Labor Budget" is selected. The default should be "Miscellaneous" or "Produce & Sides" (more common daily entries), or use the browser's last-visit memory.

---

### P2 — Backlog (Polish)

**P2-01 · Manager · Category-aware description placeholder [Effort: S] [Impact: Med]**
The description field always shows "e.g., Unbox wet wipes" regardless of category. Each category should suggest context-appropriate examples:
- Water: "prev: 1245, curr: 1289 — 44 cu.m consumed"
- Gas/LPG: "LPG 50kg tank refill — Tagbilaran Gas"
- Wages: "Maria Santos — Mon–Sat shift, 10am–8pm"
- Meat Procurement: "Pork Bone-In 15kg — Metro Meat Co."

**P2-02 · Manager · No custom date range in expense log filter [Effort: M] [Impact: Med]**
Expense log filter options: Today / This Week / All Time. There's no "This Month" or custom date picker. A manager preparing a month-end report for the owner must use "All Time" and mentally filter visually. Add "This Month" as a quick filter, or a date range picker.

**P2-03 · Manager · Expense category column shows plain text — no visual badge [Effort: S] [Impact: Low]**
The category column in the expense log is plain text ("Meat Procurement", "Gas/LPG", "Wages"). Visual pills/badges per category group (orange for Procurement, blue for Utilities, gray for Overhead) would let managers scan the log by category at a glance without reading each label.

**P2-04 · Manager · No "Add expense" link from delivery success [Effort: S] [Impact: Med]**
After recording a delivery, the natural next step is often to record the procurement cost as an expense. There's no contextual link ("Record procurement cost →") from the delivery confirmation. A small CTA button in the success state would close this workflow gap.

**P2-05 · Manager · Transfer date display is bare timestamp [Effort: S] [Impact: Low]**
In the Recent Transfers table, the date shows "2026-03-09T02:27:32.757Z". Apart from the format issue (P1-06), the column also doesn't distinguish "Today" from "Yesterday" or show relative labels. Relative time labels ("Today 10:27 AM", "Yesterday 4:21 PM") aid quick orientation.

**P2-06 · Manager · No expense summary/total by category in expense log view [Effort: M] [Impact: Med]**
The expense log shows individual entries but no category subtotals. A manager reviewing the week's expenses can't quickly see "₱14,000 on Meat Procurement, ₱3,500 on Gas/LPG" without doing mental arithmetic on the rows. A collapsible category summary row at the top of the log (or a small breakdown strip) would help.

---

## Utility Readings — Design Recommendation

**The user's question: Should water and gas have a dedicated input for previous/current readings?**

**YES — this is required, not just nice-to-have.**

Philippine restaurant utilities are billed and tracked by readings, not flat amounts:
- **Water (BWSSB):** Cubic meters — previous reading vs current reading
- **Electricity (Meralco/local):** kWh — previous vs current
- **Gas/LPG:** Tank weight in kg (start vs end of period), or delivery kg

Without reading fields:
1. **No consumption trending** — Can't ask "did we use more water this month than last month?"
2. **No anomaly detection** — Can't spot an unexpected spike (leak, meter error, theft)
3. **No cross-branch comparison** — Owner can't compare electricity usage between Alta Citta and Alona Beach
4. **Manual computation errors** — Manager must calculate (current − previous) × rate manually before entering the amount

**Recommended implementation:**
```
When category = Water | Electricity | Gas/LPG:
  Show additional fields:
  [Previous Reading ____] [Current Reading ____] [Rate/Unit ____]
  → Computed: X units × ₱Y = ₱Z  [Auto-fill Amount field]
  Amount (₱) [editable override if bill differs from computed]
```

This makes meter readings first-class data — searchable, trendable, auditable.

---

## Fix Summary

| Priority | Count | Issues |
|---|---|---|
| P0 | 2 | Utility meter readings, Log Expense sidebar link |
| P1 | 9 | Category overlap, missing categories, petty cash confusion, large amount threshold, delivery cost field, ISO timestamps, delivery success feedback, transfer-as-delivery, transfer auth |
| P2 | 6 | Category placeholders, date range filter, visual badges, delivery→expense CTA, relative timestamps, category subtotals |
| **Total** | **17** | |

---

## Overall Score: 58/100 — NEEDS WORK

The expenses page's core form is solid (touch targets, validation, success/error states, delete PIN, repeat button). The transfers 3-step wizard is genuinely well-designed with clear stock impact previews.

**The system fails at the business logic layer:** it doesn't model how a Philippine samgyupsal restaurant actually records utilities (meter readings), procurement costs (linked to deliveries), and wages (category clarity). These are not polish items — they are the reason the expenses module exists.

The "Log Expense" sidebar navigation bug (P0-02) is a day-one regression that needs immediate fix.

---

## Fix Status (session recovery 2026-03-09)

### P0
- [x] **P0-01** Utility meter reading fields — Water/Electricity/Gas reveal prev/curr/rate inputs; amount auto-computed
- [ ] **P0-02** "Log Expense" sidebar quick action still links to `/reports/expenses-daily` — NOT FIXED

### P1
- [ ] **P1-01** "Labor Budget" vs "Wages" still indistinguishable — same category text, no subtext
- [ ] **P1-02** Missing categories (Repairs, Packaging, Cleaning, Benefits, Transport, Marketing) — not added
- [ ] **P1-03** "Petty Cash Replenishment" fund-movement confusion — not resolved
- [ ] **P1-04** Large amount threshold ₱10,000 fires on every normal Wages entry — not raised
- [x] **P1-05** Delivery unit cost field added — optional `Unit Cost (₱)` + auto-computed `Total Cost`
- [ ] **P1-06** ISO 8601 timestamps in Transfer Recent History — still showing raw UTC timestamps
- [x] **P1-07** Delivery success toast added — `✓ Delivery recorded — +Xg ItemName`
- [x] **P1-08** Transfer-origin delivery rows now show "Transfer" badge pill in Supplier column
- [ ] **P1-09** No stock transfer auth (manager PIN for large-qty transfers) — not added
- [ ] **P1-10** Category defaults to "Labor Budget" on fresh load — not changed

### P2
- [ ] **P2-01** Category-aware description placeholder — still generic "e.g., Unbox wet wipes"
- [ ] **P2-02** No "This Month" filter or custom date range in expense log
- [ ] **P2-03** Category column in log is plain text — no visual badge/pill
- [x] **P2-04** Procurement expense CTA after delivery save — links to `/expenses` prefilled with category/amount/description
- [ ] **P2-05** Transfer date still bare timestamp (relative labels not added)
- [ ] **P2-06** No category subtotals in expense log (subtotal strip added to expenses page but not by-category breakdown in log)
