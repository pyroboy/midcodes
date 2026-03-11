# UX Audit — Manager Cross-Module Flow · Sir Dan · Alta Citta (tag) · Light

**Date:** 2026-03-11
**Auditor:** Claude Code (ux-audit v5.1.0)
**Role:** Manager (Sir Dan)
**Branch:** Alta Citta (Tagbilaran) — `tag`
**Viewport:** 1024×768 (tablet landscape)
**Theme:** Light
**Flow audited:**
POS floor overview → `/stock/counts` → `/reports/sales-summary` → `/reports/voids-discounts` → `/reports/eod`

---

## A. Text Layout Map

### 1. POS Floor Plan (manager view)

```
+--sidebar(240px)--+----------main-content(784px)----------+
| [W!]             | [📍] ALTA CITTA (TAGBILARAN) [Change] |
| ────────────     |---------------------------------------|
| QUICK ACTIONS    | POS  0 occ  8 free                    |
| [Receive Deliv.] |---------------------------------------|
| [Log Expense ]   | +--floor-canvas (63%)---+ +--sidebar-+|
| [Log Waste   ]   | | [T1][T2][T3][T4]      | | 🧾        ||
| [Stock Count ]   | | [T5][T6][T7][T8]      | | No Table  ||
| [X-Reading   ]   | |                       | | Selected  ||
| [Transfer Stk]   | | (all 8 tables visible)| |           ||
| [End of Day  ]   | +----------- ~~fold~~---+ +-----------+|
| ────────────     | 📦 TAKEOUT ORDERS 2                   |
| [POS][Kit][Stk]  | [#TO01 Carmen ₱965]  [#TO02 ₱0]      |
| [Reports]        |                                       |
| ────────────     |                                       |
| S [Logout]       |                                       |
+------------------+---------------------------------------+
```

### 2. Stock Counts (`/stock/counts`)

```
+--sidebar--+--------Stock Management---------+
|           | [Inventory][Deliveries 1]        |
|           | [Transfers][Counts 1][Waste Log] |
|           |---------------------------------|
|           | ╔═══════════════════════════════╗|
|           | ║ Enter counts… tap Save.       ║|
|           | ║ [Save Counts]                 ║|  ← sticky top
|           | ╚═══════════════════════════════╝|
|           | [Morning 10AM][Afternoon 4PM]    |
|           | [Evening 10PM  PENDING]          |
|           |---------------------------------|
|           | ℹ Count not yet started.         |
|           |   ...tap Submit Count to lock.   |
|           |---------------------------------|
|           | Table: Item | Expected | Count   |
|           | Pork Bone-In  20,500g   [−][  ][+]|
|           | Pork Bone-Out 13,500g   [−][  ][+]|
|           | Chicken Wing   6,000g  [−][  ][+]|
|           | Chicken Leg    8,000g  [−][  ][+]|
|           |  ... 50+ more rows ...           |
|           |          ~~fold at 768px~~        |
|           |  ... continues scrolling ...     |
|           | Beef Trimmings  750g   [−][  ][+]|
|           |---------------------------------|
|           | [Submit Count]                   |  ← bottom (off-screen)
+--sidebar--+---------------------------------+
```

### 3. Sales Summary (`/reports/sales-summary`)

```
+--sidebar--+--------Branch Reports-----------+
|           | Operations: [Meat][Variance]     |
|           |  [Table Sales][Voids & Disc.]    |
|           |  [X-Read][End of Day][Staff Perf]|
|           | Expenses: [Daily][Monthly]       |
|           | Revenue: [Sales Summary][Best    |
|           |  Sellers][Peak Hours]            |
|           | Profitability: [Gross][Net]      |
|           | Branch: [Compare]                |
|           |---------------------------------|
|           | [Daily][Weekly][All] [Today]     |
|           | [This Week][This Month]  Live    |
|           |---------------------------------|
|           | Gross ₱72,534  Net ₱71,208       |
|           | VAT ₱7,629  Avg ₱565  Pax 126   |
|           |---------------------------------|
|           | Period | Gross | Disc | Net...  |
|           | Today(live) ₱14,369 — ₱14,369   |
|           | Mar 10   ₱7,566 −₱360 ₱7,206    |
|           | Mar 9   ₱12,471 −₱124 ₱12,347   |
|           |  ... (7 rows + TOTAL)            |
+--sidebar--+---------------------------------+
                          ~~fold at 768px — summary cards visible, table partially~~
```

### 4. Voids & Discounts (`/reports/voids-discounts`)

```
+--sidebar--+--------Branch Reports-----------+
|           | [same sub-nav as above]          |
|           |---------------------------------|
|           | "Today's Voids & Discounts" 🟢Live|
|           |---------------------------------|
|           | +---Voided Orders----+  +--Disc-+|
|           | | 10 Orders          |  | 10    ||
|           | | ₱13,570 Total Lost |  | ₱1,326||
|           | |                    |  |       ||
|           | | Mistakes    [4]    |  |Senior ||
|           | | Walkouts    [2]    |  | ₱1,087||
|           | | Write-offs  [4]    |  |Promo  ||
|           | +--------------------+  | ₱239  ||
|           |  ~~fold at 768px~~        | PWD ₱0||
|           | +---Void Detail----------+  +----+|
|           | | TAG-T8  4x Item... — ₱1,996    ||
|           | | TAG-T1  2x Item... — ₱798      ||
|           | | TAG-T6  5x Item... — ₱1,995    ||
|           | | Cashier: — (all empty)         ||
+--sidebar--+---------------------------------+
```

### 5. EOD (`/reports/eod`)

```
+--sidebar--+--------Branch Reports-----------+
|           | [same sub-nav as above]          |
|           |---------------------------------|
|           | Mar 11, 2026   🟢 Live totals    |
|           | [Start End of Day]               |
|           |---------------------------------|
|           | 🙈 Detailed Reports Hidden        |
|           | Click "Start End of Day" to begin|
|           | your blind cash count and unlock  |
|           | today's detailed sales reports.  |
+--sidebar--+---------------------------------+
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | CONCERN | Sales summary filter: 6 buttons (Daily, Weekly, All, Today, This Week, This Month) in one flat row with no visual grouping. Voids page: zero filter choices (no way to scope date range). | Group resolution buttons (Daily/Weekly/All) separately from range selectors (Today/This Week/This Month). Add date scope to Voids page. |
| 2 | **Miller's Law** (chunking) | FAIL | Stock counts: 55+ items in one alphabetical list with no category grouping (meats / pantry / beverages / condiments). Manager must mentally scan the full list each count session. Reports sub-nav: 15 links grouped in 5 categories — well-chunked (PASS for reports). | Add category headers to stock counts table. Group items: Meats, Pantry & Produce, Beverages, Condiments. |
| 3 | **Fitts's Law** (target size/distance) | CONCERN | Stock counts spinbutton (−/+) per item: small stepper controls on a touch device for 55 items × 3 daily. Quick Actions strip: 7 links appear as text-only items — touch target height unknown from snapshot. | Replace spinbuttons with a numpad-based QuickNumberInput tap. Confirm Quick Actions links meet 44px min height. |
| 4 | **Jakob's Law** (conventions) | CONCERN | EOD uses 🙈 emoji in a BIR compliance form — non-standard tone for a regulatory workflow. "Save Counts" vs "Submit Count" on stock counts uses inconsistent terminology vs. standard form patterns (typically one primary save action). | Replace 🙈 with a professional icon (lock, eye-slash). Standardize stock count save action to one consistent label. |
| 5 | **Doherty Threshold** (response time) | PASS | All pages loaded immediately (RxDB local-first). No observed delays >1s on any navigation. Quick Actions shortcuts respond instantly. | — |
| 6 | **Visibility of System Status** | FAIL | Three compounding failures on Voids & Discounts: (1) "Today's" heading on all-time data, (2) "—" cashier on all voids (no attribution), (3) "Nx Item" item names (no specifics). EOD: strong status display — "Mar 11, 2026" + "Blind count" instruction is clear. Stock counts: "Evening 10:00 PM Pending" badge communicates status well. | Fix voidsAndDiscountsSummary() to filter by today. Populate closedBy on void. Store/display actual item names in void. |
| 7 | **Gestalt: Proximity** | CONCERN | Sales Summary filter bar: resolution controls (Daily/Weekly/All) and range selectors (Today/This Week/This Month) are adjacent with no visual separator — they appear as one group of 6 identical buttons despite different semantic roles. | Add a vertical divider between resolution and range button groups. |
| 8 | **Gestalt: Common Region** | PASS | Reports sub-nav grouped into 5 labeled regions (Operations, Expenses, Revenue & Sales, Profitability, Branch). Quick Actions strip uses a visually distinct region in the sidebar. EOD sections clearly separated. | — |
| 9 | **Visual Hierarchy** (scale) | CONCERN | Voids: ₱13,570 total void value uses large font (3xl extrabold) giving it visual dominance over Cashier attribution (absent) and item specifics (generic). The most visible data point (gross loss) is also the least actionable because it's not contextualized by who/what. | Elevate Cashier column once attribution is fixed. |
| 10 | **Visual Hierarchy** (contrast) | CONCERN | From snapshot: Reason breakdown badges (Walkouts in red/5, Write-offs in yellow/5) and status indicators follow design system tokens. KP-02 badge contrast issues likely apply. Date timestamps in void table use `text-[10px] text-gray-400` — 10px text fails WCAG at any contrast ratio. | Fix 10px timestamp to 12px minimum. Verify badge contrast ratios. |
| 11 | **WCAG: Color Contrast** | CONCERN | `text-gray-400` used on timestamps (void date/time cell) and on column headers throughout — gray-400 (#9CA3AF) on white = ~2.8:1, fails AA. `text-xs text-gray-500` on report sub-nav group labels (~3.3:1, borderline). | Raise timestamp text to gray-600. Raise sub-nav group labels to gray-700. |
| 12 | **WCAG: Touch Targets** | CONCERN | Stock count spinbutton +/− buttons: accessibility tree shows unnamed `button [cursor=pointer]` — likely small icon buttons. Reports sub-nav links: displayed as text-only links inside grouped nav, height may be below 44px. Quick Actions links show as full-width links (likely adequate). | Confirm +/- stepper buttons ≥44px. Test sub-nav link tap area on physical tablet. |
| 13 | **Consistency** (internal) | FAIL | "Save Counts" (top sticky, calls handleSubmitCount) ≠ "Submit Count" (bottom button, calls handleSubmitCount) — same function, two labels. Instruction text says "tap Save" but references a different label than what is shown at both positions. Heading "Today's Voids & Discounts" contradicts multi-week data range. | Unify stock count save button to one label everywhere. Fix voids heading to reflect actual date scope. |
| 14 | **Consistency** (design system) | PASS | Reports pages follow the same sub-nav shell. LocationBanner always present. sidebar quick actions strip is consistent across all pages. Color tokens used correctly (status-red for voids, accent for discounts). | — |

**Verdict summary:** 3 FAIL · 7 CONCERN · 4 PASS

---

## C. "Best Day Ever" — Sir Dan's Shift Vision

Sir Dan arrives at Alta Citta at 3pm. He opens the app on the tablet at the manager's desk and glances at the floor plan — 0 occupied tables, 8 free. Good. He sees the Quick Actions strip in the sidebar: Receive Delivery, Log Expense, Log Waste, Stock Count, X-Reading, Transfer Stock, End of Day. Every compliance shortcut he needs is right here, one tap from anywhere. That part is excellent. He taps Stock Count and enters the afternoon counts.

In the ideal shift, Sir Dan taps Stock Count, sees the 55 items organized by category — Meats at the top (the things that matter most for cost control), then Pantry, then Beverages, then Condiments. He enters the 4 meat counts in 30 seconds, tabs through the pantry in another 60 seconds, hits Save Counts, and gets a green confirmation: "Afternoon count locked — 2 variances found (Pork Bone-Out: −200g)." He's done in under 2 minutes, exactly when the 4pm service push starts.

At 9pm, between checkouts, Sir Dan taps Voids & Discounts. He wants to know if Ate Rose's shift had any walkout incidents — he remembers seeing an empty table earlier. In the ideal shift, he'd see today's voids only, each row showing the cashier name and the actual items voided: "TAG-T6, 7:29pm — Ate Rose — 3x Pork Bone-In, 2x Chicken Wing — ₱1,995 — Walkout." He'd know who to debrief after service. Instead, what he sees today is 10 void records from the past week — some from Mar 5 — all showing "—" for cashier and "Nx Item" for items. He can't act on this at all.

At 11pm, he taps End of Day, enters the blind cash count, and unlocks the Z-Read. That flow is clean and clear — the date is right, the single action button is visible, the blind count instruction makes sense.

Sir Dan's frustration is concentrated in one place: the Voids & Discounts page is the only page in the app where his managerial accountability work is completely blocked. Everything else works well enough. The Quick Actions strip and the reports sub-nav grouping are genuine strengths that need protecting.

---

## D. Recommendations

---

##### [01] "Today's Voids & Discounts" heading shows all-time data

**What:** The heading `<h2>Today's Voids & Discounts</h2>` is hardcoded. The `voidsAndDiscountsSummary()` function (reports.svelte.ts line 421) queries all cancelled orders with no date filter — `allOs.filter(o => o.status === 'cancelled')`. On 2026-03-11, the page shows 10 void records spanning Mar 5–11. The "Live totals" indicator reinforces the expectation that the data is scoped to today.

**How to reproduce:**
1. Login as manager (Sir Dan) at `tag`
2. Navigate to `/reports/voids-discounts`
3. Note the heading "Today's Voids & Discounts" + green "Live totals" badge
4. Observe void detail table rows — dates include Mar 5, 6, 7, 8, 9, 10, 11
5. Expected: only today's (Mar 11) voids visible. Actual: all cancelled orders across all dates.

**Why this breaks:** Sir Dan checks this page at 9pm to review accountability for the current shift. When he sees ₱13,570 in voided orders, he needs to know if this happened tonight or is accumulated from the past week. The current display makes both the count ("10 Orders") and the total (₱13,570) completely uninterpretable — it might be a normal night or a disaster, and Sir Dan has no way to tell. He brings this number to Boss Chris the next morning and can't explain what happened tonight specifically. This erodes trust in the entire reporting system.

**Ideal flow:** `voidsAndDiscountsSummary()` should accept a `period` parameter (default: `'today'`) and filter using the existing `inPeriod()` helper already in reports.svelte.ts. The heading should update dynamically: "Today's Voids & Discounts" when period is today, "This Week's Voids & Discounts" when week is selected. Add a small filter toggle (Today / This Week / All Time) consistent with the Sales Summary filter pattern.

**The staff story:** "Kuya, I checked the voids tonight and it says ₱13,570 lost. But I think most of that is from last week's walkout incident. I can't tell what's from tonight only — the page doesn't let me filter."

**Affected role(s):** Manager, Owner

---

##### [02] Void detail table: Cashier column shows "—" for all rows

**What:** The void detail table has a "Cashier" column header (`<th>Cashier</th>` in voids-discounts/+page.svelte line 88), but every data row shows an em dash. The template displays `order.closedBy` if truthy, otherwise "—". The `closedBy` field is not being populated when orders are voided/cancelled — it is only populated at checkout (`status: 'paid'`). As a result, the accountability chain is broken: voids have no staff attribution.

**How to reproduce:**
1. Login as manager at `tag`, navigate to `/reports/voids-discounts`
2. Scroll to "Void Detail" table
3. Observe the Cashier column — every row shows "—"
4. Expected: name of staff member who performed the void. Actual: always empty.

**Why this breaks:** Sir Dan uses the void report specifically to identify patterns — is one cashier voiding more than others? Are walkouts concentrated at certain tables during a specific staff member's shift? With every cashier cell blank, the void report cannot answer any accountability question. If Boss Chris calls and asks "who voided the ₱3,594 on TAG-T3?", Sir Dan has no answer. This forces him to cross-reference manually with audit logs, adding 10+ minutes to what should be a 30-second check.

**Ideal flow:** The orders store's void/cancel flow (`orders.svelte.ts`) should set `closedBy: session.userName` at the moment the order is cancelled, alongside the existing `cancelReason` write. Since this uses `incrementalPatch`, the fix is a one-line addition to the cancel handler.

**The staff story:** "I can see a walkout happened at TAG-T3 for ₱3,594 but I have no idea which staff was handling that table. The Cashier column is blank for every single row."

**Affected role(s):** Manager, Owner

---

##### [03] Voided items display as "Nx Item" instead of actual product names

**What:** The `itemsSummary()` function in voids-discounts/+page.svelte uses `i.name ?? 'Item'` as a fallback (line 30). When order items are stored without a `name` field (or with a null name), the void detail shows "4x Item, 3x Item, 1x Item" — generic placeholders that reveal nothing about what was actually voided.

**How to reproduce:**
1. Login as manager at `tag`, navigate to `/reports/voids-discounts`
2. Review any row in the "Void Detail" table under the "Items" column
3. All rows show "Nx Item" patterns (e.g., "4x Item, 3x Item, 1x Item, 3x Item...")
4. Expected: actual product names (e.g., "4x Pork Bone-In, 3x Samgyup Package, 1x Soju")

**Why this breaks:** Combined with finding [02] (no cashier) and finding [01] (all-time data), this means the void detail table is entirely non-actionable. Sir Dan opens the page and sees rows like "TAG-T8, Mar 10 — 4x Item — ₱1,996 — Mistake" — none of this tells him what actually happened. Investigating a potential theft or walkout becomes impossible without the specific items. The page exists but provides zero investigative value in its current state.

**Ideal flow:** Order items should have their `name` field populated at the time of order entry (from the menu item name). When an order is voided, the items array in the stored order document should already contain `{ name: 'Pork Bone-In', quantity: 4 }`. The `itemsSummary()` function should then display correctly. Verify that the AddItemModal and order creation flow saves `item.name` when building the order items array.

**The staff story:** "I see ₱1,996 voided at TAG-T8 as 'Mistake' but the items just say '4x Item, 3x Item'. I can't tell if this was a package void or specific meat cuts — I can't do anything with this information."

**Affected role(s):** Manager, Owner

---

##### [04] Stock counts: two save buttons with different labels, same function

**What:** The `/stock/counts` page has two buttons that both call `handleSubmitCount()`: (1) "Save Counts" in the sticky top bar (StockCounts.svelte line 70), and (2) "Submit Count" at the bottom of the 55-item table (line 194). The instruction text immediately below the top button says "Enter counts for each item, then tap **Submit Count** to lock in this session" — referencing the bottom button label while the prominently visible sticky button says "Save Counts". The two labels are never explained as being the same action.

**How to reproduce:**
1. Login as manager at `tag`, navigate to `/stock/counts`
2. Read the instruction text: "Enter counts for each item, then tap Submit Count to lock in this session"
3. Look at the visible button directly below: it says "Save Counts"
4. Scroll to the bottom of the 55-item list: find a second button labeled "Submit Count"
5. Both buttons trigger the same `handleSubmitCount()` function.

**Why this breaks:** Sir Dan does stock counts 3 times a day (10am, 4pm, 10pm). This is a timed compliance task — the 10am count must be entered before the morning prep crew depletes stock, the 10pm count must be entered before EOD. Every second of confusion adds up. When he reads "tap Submit Count" but sees "Save Counts", he hesitates: "Is Save different from Submit? Does Save save a draft? Does Submit lock it permanently?" This moment of confusion — multiplied by 3 counts × 365 days = 1,095 decision points per year — represents real cognitive friction in a compliance workflow that should be frictionless.

**Ideal flow:** Pick one label and use it everywhere: "Submit Count" is the better choice because it implies finality (locking the count session) vs. "Save" which implies a saveable draft. Change the sticky bar button from "Save Counts" to "Submit Count". Update the instruction text to match. If a save-as-draft behavior is desired, introduce it as a distinct secondary action with a clear label ("Save Draft") that differs from the final submission.

**The staff story:** "The instructions say 'tap Submit Count' but the button I see says 'Save Counts'. Are these the same thing? I've been tapping Save Counts — did I actually submit my count? I'm never sure."

**Affected role(s):** Manager, Kitchen (butcher for 10am count)

---

##### [05] Stock counts: 55+ items in an ungrouped alphabetical list

**What:** The stock counts table lists every inventory item — meats, pantry staples, beverages, condiments — in one alphabetical sequence with no category headers, visual separators, or filter controls. From the snapshot: the list spans from Pork Bone-In through Baguio Pechay, Squash, Baechu Kimchi, Soju, Coke Zero, Barley Tea, Lemonade, Beef Bones, Beef Trimmings — approximately 55 distinct items requiring individual count entry.

**How to reproduce:**
1. Login as manager at `tag`, navigate to `/stock/counts`
2. Observe the count table — scroll from top to bottom
3. All items appear in one continuous list with no category breaks
4. There is no search box, no category filter, no way to jump to a section

**Why this breaks:** Sir Dan submits stock counts 3 times per day under time pressure. At 10pm (EOD count), he may be simultaneously managing last tables, finalizing the z-read, and handling staff checkout. Scanning through 55 alphabetically-sorted items to find the 8 meat items that matter most for cost control wastes 2–3 minutes per count session. Over a month: roughly 90–135 minutes of unnecessary scroll-and-hunt. The BIR compliance window is real — counts must be entered at specific times, not whenever Sir Dan has a free moment.

**Ideal flow:** Add category group headers to the count table: "Meats" (Pork Bone-In, Pork Bone-Out, Chicken Wing…), "Pantry & Produce" (Kimchi, Lettuce, Garlic…), "Beverages" (Soju, Coke Zero, Barley Tea…), "Condiments & Dry Goods" (Salt, Sugar, Vinegar…). Each category should be collapsible — if Sir Dan only needs to update meats, he can collapse the 30 pantry items. A search box at the top of the table would serve as a fast-path for any specific item.

**The staff story:** "Every count I have to scroll through the whole list to find the meats at the bottom. Beef Trimmings is always the last row. Why can't the meats be at the top? I could be done in half the time."

**Affected role(s):** Manager, Kitchen (butcher)

---

##### [06] Sales Summary filter bar: 6 buttons with ambiguous semantic overlap

**What:** The sales summary page shows 6 filter buttons in a single flat row: "Daily", "Weekly", "All", "Today", "This Week", "This Month". There is no visual separator between them. "Daily" and "Today" appear to be the same concept but are two separate buttons. "Weekly" and "This Week" overlap similarly. It is not clear whether "Daily/Weekly/All" controls the data granularity (show per-day rows vs. per-week rows) while "Today/This Week/This Month" controls the date range — or whether these are 6 independent date-range filters.

**How to reproduce:**
1. Login as manager at `tag`, navigate to `/reports/sales-summary`
2. Observe the filter bar below the LocationBanner: 6 buttons in one row with no divider
3. Tap "Daily" — note any change. Tap "Today" — note any change.
4. Expected: clear visual separation between button groups with tooltips or labels explaining their function. Actual: 6 identical-styled buttons with no grouping.

**Why this breaks:** Sir Dan checks sales summary 2–5 times per shift to monitor revenue against targets. He wants to answer "how much have we done today so far?" quickly. With 6 buttons competing for his attention, he has to read all 6 labels to find the right one. "Daily" sounds like "today's daily total" but might mean "show daily breakdown." This 3-second hesitation × 5 checks × 300 shifts = 25 minutes of annual decision friction on what should be a single-tap question.

**Ideal flow:** Separate the two button groups with a visual divider or distinct styling. Group 1 (Granularity): "Daily / Weekly" — controls row resolution. Group 2 (Range): "Today / This Week / This Month / All" — controls date range. Use a different visual style for each group (e.g., outlined vs. filled, or different background colors). Label the groups with small uppercase headers ("VIEW" and "RANGE") so intent is immediately clear.

**The staff story:** "I tap 'Daily' thinking it means today but the table doesn't change much. Then I try 'Today' and I'm not sure what the difference is. There are too many buttons that seem to do the same thing."

**Affected role(s):** Manager, Owner

---

##### [07] EOD page: playful emoji in BIR compliance flow

**What:** The End of Day page uses the 🙈 emoji with the heading "Detailed Reports Hidden" to communicate that sales data is hidden until the blind cash count is initiated. While this is technically clear, the 🙈 ("see no evil") emoji is a playful, casual tone choice that contrasts with the formality expected in a BIR-compliance document flow. The Z-Read generated from this page is a legal document used for tax filing.

**How to reproduce:**
1. Login as manager at `tag`, navigate to `/reports/eod`
2. Before clicking "Start End of Day", observe the page state below the primary button
3. Note the 🙈 emoji with "Detailed Reports Hidden" heading

**Why this breaks:** Sir Dan submits the Z-Read to Boss Chris at the end of every shift. If Boss Chris ever screenshots the EOD screen for a BIR audit query, the 🙈 emoji could undermine the system's professional credibility. More practically: the tone inconsistency (playful emoji in a financial compliance flow) breaks the user's mental model of the system — the rest of the reports module is formal and data-focused.

**Ideal flow:** Replace 🙈 with a lock icon (🔒 or lucide `Lock`) and change the heading to "Reports Locked — Blind Count Mode". The instruction copy is already well-written and should remain. This is a single-character swap with meaningful professional impact.

**The staff story:** "The End of Day button works fine, but the monkey emoji always feels out of place when I'm doing the official count for the boss. It's a small thing but it feels like a toy when I need it to feel serious."

**Affected role(s):** Manager, Owner

---

## Fix Checklist (for `/fix-audit`)

- [x] [01] — Voided Orders shows all-time data labeled "Today's"
  > **Fix:** `voidsAndDiscountsSummary()` now accepts `'today' | 'week' | 'all'` and filters via `inPeriod()`. Voids page got a 3-button filter row (Today / This Week / All Time) with `$state` period and `$derived` summary; heading updates dynamically.
  > **Validate:** Visibility of System Status ✅ · Consistency (internal) ✅
  > **Snapshot:** SKIPPED (no dev server during fix run)

- [x] [02] — Cashier column shows "—" for all void rows (closedBy not saved on cancel)
  > **Fix:** Added optional `closedBy?: string` param to `voidOrder()` in `orders.svelte.ts`; sets `doc.closedBy` in `incrementalModify`. All 3 call sites in `pos/+page.svelte` now pass `session.userName`.
  > **Validate:** Visibility of System Status ✅ · Recognition over Recall ✅
  > **Snapshot:** N/A (store change — no UI without placing a void)

- [x] [03] — Voided items display as "Nx Item" (item names not stored in voided orders)
  > **Fix:** Fixed `itemsSummary()` to use `i.menuItemName ?? 'Item'` instead of `i.name ?? 'Item'`; updated TypeScript type to `Pick<OrderItem, 'menuItemName' | 'quantity'>`.
  > **Validate:** Visibility of System Status ✅
  > **Snapshot:** SKIPPED

- [x] [04] — Stock counts: "Save Counts" (sticky) vs "Submit Count" (bottom) — same function, two labels
  > **Fix:** Changed sticky bar button label from "Save Counts" to "Submit Count". Both buttons and instruction text now consistently say "Submit Count".
  > **Validate:** Consistency (internal) ✅ · Jakob's Law ✅
  > **Snapshot:** N/A

- [x] [05] — Stock counts: 55+ items ungrouped — no category headers or filter
  > **Fix:** Replaced flat `{#each branchItems}` with grouped structure. `$derived` Map groups by `category`, sorted by `CATEGORY_ORDER` (Meats first). Each category has a collapsible header with item count badge and chevron toggle via `$state Map<string, boolean>`.
  > **Validate:** Miller's Law ✅ · Motor Efficiency ✅
  > **Snapshot:** N/A

- [x] [06] — Sales Summary: 6 filter buttons with ambiguous "Daily" vs "Today" overlap
  > **Fix:** Restructured filter bar into two groups — "VIEW" (Daily/Weekly) and "RANGE" (Today/This Week/This Month/All) — separated by a vertical divider, each with a 10px uppercase label. Active state uses `bg-accent text-white`.
  > **Validate:** Hick's Law ✅ · Gestalt (Proximity) ✅ · Consistency ✅
  > **Snapshot:** SKIPPED

- [x] [07] — EOD: 🙈 emoji in BIR compliance flow
  > **Fix:** Imported `Lock` from `lucide-svelte`; replaced emoji `<div>` with `<Lock class="w-8 h-8 text-gray-400 mb-3 mx-auto" />`; changed heading to "Reports Locked — Blind Count Mode".
  > **Validate:** Jakob's Law ✅ · Consistency (design system) ✅
  > **Snapshot:** SKIPPED

- [x] [SP-02] — Stock counts role-optimized form (progress indicator + deadline badge)
  > **Fix:** Added `enteredCount` `$derived` (items with non-null counted value) and `deadlineInfo` `$derived` (deadline time + urgency from `activePeriod`). Sticky bar now shows "X / N items entered" and "Period count — submit by [time]" with ⚠ urgency coloring (warning <15 min, overdue after).
  > **Validate:** Motor Efficiency ✅ · Visibility of System Status ✅
  > **Snapshot:** N/A

---

## E. Structural Proposals

##### [SP-01] Void audit trail requires a three-field fix before the Voids & Discounts page has managerial value

Issues [01], [02], and [03] share the same root: the void audit trail is architecturally incomplete. Fixing the page heading alone ([01]) would show fewer rows, but those rows would still have blank cashier fields ([02]) and generic item names ([03]). All three fixes must land together. Recommended sequencing: fix [02] first (populate `closedBy` in void handler), then [03] (verify item names are saved in order items), then [01] (add date filter once the underlying data is trustworthy). Without this sequencing, fixing the heading first creates the false impression that the problem is solved while the accountability data remains broken.

##### [SP-02] Stock counts should be a role-optimized entry form, not a generic inventory table

Issue [05] describes 55+ ungrouped items. The deeper structural issue is that `/stock/counts` is built as a generic inventory table that happens to have count entry inputs — but the manager's actual task at count time is much narrower: enter expected vs. actual for ~8 meats + ~15 priority pantry items, flag variances, lock the session. A restructured page would lead with the most critical items (meats first), collapse low-variance categories by default, show a "count progress" indicator (14/55 items entered), and make the compliance deadline visible: "Afternoon count — submit before 4:15 PM." This is a medium-complexity page restructure, not a styling pass.
