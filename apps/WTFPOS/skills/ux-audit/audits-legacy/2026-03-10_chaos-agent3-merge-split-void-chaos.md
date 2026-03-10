# Chaos UX Audit — Agent 3: Merge, Split, Void & Multi-Table Chaos
**Date:** 2026-03-10
**Agent:** 3 of 3
**Role:** Staff (Maria Santos)
**Branch:** Alta Citta (tag) — Alta Citta Mall, Tagbilaran City
**Viewport:** 1024×768 (desktop/tablet landscape)
**Tools:** playwright-cli live testing + source code deep-read (7 component files)
**Session notes:** playwright-cli live session encountered intermittent z-index modal leaks and SVG click-through bugs during testing — all observed behaviors are documented as-is including those caused by app issues. Code analysis supplements live observations.

---

## Business Rules Being Tested
- Takeout → table merge → combined bill → one combined receipt
- Split bill → separate sub-receipts per guest
- Ice tea: 1 pitcher per ~6 pax (12 pax = 2 free), no refills (unli packages only)
- Void: requires Manager PIN (1234), grace period allows immediate free removal
- Utensil requests (tong, scissors) → Kitchen alert via RefillPanel Service section
- Multi-table context switching: sidebar must reflect correct active order when switching

---

## Layout Maps (Observed)

### POS Floor — Initial State
```
┌──────────────────────────────────────────────────────────┬───────────────────────────┐
│  POS  0occ  8free  [New Takeout]  [History 14]            │  🧾 No Table Selected      │
│                                                           │  Green = available        │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                                      │  Orange = occupied        │
│  │T1│ │T2│ │T3│ │T4│  (all white borders = available)     │                           │
│  └──┘ └──┘ └──┘ └──┘                                      │                           │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                                      │                           │
│  │T5│ │T6│ │T7│ │T8│                                      │                           │
│  └──┘ └──┘ └──┘ └──┘                                      │                           │
│                                                           │                           │
│  ── TAKEOUT ORDERS (2) ──────────────────────────────     │                           │
│  [#TO01 Jose ₱536 PREP]  [#TO02 Maria ₱225 PREP]         │                           │
└──────────────────────────────────────────────────────────┴───────────────────────────┘
```

### Order Sidebar — T6 Occupied (Pork Unlimited)
```
┌──────────────────────────────┐
│  T6  1 pax ✎  0m        [✕] │
│  Pork Unlimited               │
│  [🔄 Refill]  [Add Item]     │
│  ─────────────────────────   │
│  Pork Unlimited  SENT ₱399 PKG [✕] │
│  MEATS                        │
│    Samgyupsal       WEIGHING  │
│    Pork Sliced      WEIGHING  │
│  SIDES                        │
│    10 requesting   ▼ show    │
│  ─────────────────────────   │
│  BILL         13 items  ₱399 │
│  [Void] [  Checkout  ] [Print]│
│  [More ▼ Transfer·Merge·Split·Pax] │
│  ─────────────────────────   │
│  [Transfer] [Pax]   [Change Pkg] │
│  [Split Bill] [Merge]  [Attach Takeout] │
└──────────────────────────────┘
```

### Attach Takeout Modal
```
┌────────────────────────────────┐
│  Attach Takeout to T6      [✕] │
│  Select a takeout order to add │
│  ─────────────────────────     │
│  Jose                ₱536.00  │
│  4 items                       │
│  ─────────────────────────     │
│  Maria               ₱225.00  │
│  3 items                       │
│  ─────────────────────────     │
│  AuditTest           ₱0.00    │
│  0 items                       │
└────────────────────────────────┘
```

### Checkout Modal
```
┌────────────────────────────────────────┐
│  Checkout  T6                     [✕]  │
│  Subtotal (1 pax)           ₱399.00    │
│  VAT (inclusive)             ₱43.00    │
│  TOTAL                      ₱399.00    │
│  ─────────────────────────────────     │
│  Discount:                             │
│  [👴 Senior Citizen (20%)] [♿ PWD (20%)] │
│  [🎟️ Promo] [💯 Comp] [❤️ Service Rec] │
│  ─────────────────────────────────     │
│  PAYMENT METHOD         Tap to add/remove │
│  [💵 Cash] [📱 GCash] [📱 Maya]          │
│  💵 Cash                [Exact]         │
│  [₱20][₱50][₱100][₱200]                │
│  [₱500][₱1,000][₱1,500][₱2,000]       │
│  📱 GCash  [_____]                     │
│  Total Paid                 ₱0.00      │
│  [Cancel]       [✓ Confirm Payment]    │
└────────────────────────────────────────┘
```

### Split Bill Modal — Step 1 (Choose)
```
┌─────────────────────────────────────────┐
│  ✂️ Split Bill                       [✕] │
│  ─────────────────────────────────      │
│  Bill Total                  ₱399.00    │
│  ─────────────────────────────────      │
│  SPLIT METHOD                           │
│  [⚖️ Equal Split] [📋 By Item]          │
│  ─────────────────────────────────      │
│  HOW MANY WAYS?                         │
│  [2] [3] [4] [5] [6] [8]               │
│  Each guest pays ₱200 (for 2 ways)     │
│  ─────────────────────────────────      │
│  [Cancel]     [Continue →]             │
└─────────────────────────────────────────┘
```

---

## Scenario Results

### S1: Merge Takeout Order into Dine-In Table

**Flow tested:**
1. Navigated to POS floor as Staff (Maria Santos)
2. Opened T6 table (auto-assigned Pork Unlimited + 1 pax via dev test interaction)
3. Order sidebar shows T6 with 13 items (package + auto-sides), ₱399
4. Clicked "More" to reveal extended actions
5. Clicked "Attach Takeout" button
6. **AttachTakeoutModal opened** showing 3 available takeout orders:
   - Jose: ₱536.00 (4 items)
   - Maria: ₱225.00 (3 items)
   - AuditTest: ₱0.00 (0 items)

**What works:**
- "Attach Takeout" button appears correctly in "More" actions panel — it's conditionally shown only when there are open takeout orders (`hasTakeoutOrders` prop)
- Modal header is clear: "Attach Takeout to T6" with subtitle "Select a takeout order to add to this table's bill"
- All 3 available takeout orders are listed with name, item count, and total
- Each takeout card acts as a selection button
- Flow has 3 steps: select → confirm (with combined total preview) → Manager PIN → merge

**Per code analysis (AttachTakeoutModal.svelte):**
- After selecting a takeout, the "confirm" step shows a split-view with table total + takeout total + combined total preview
- The merge requires **Manager PIN (1234)** — staff cannot merge without manager authorization (correct access control)
- On success, `mergeTakeoutToTable()` is called which moves all takeout items to the table order and closes the takeout
- The combined checkout then shows both table items + former takeout items in one combined bill

**Issues found:**
1. **HIDDEN UNDER "MORE"**: The "Attach Takeout" button is 2 taps away (More → Attach Takeout). During a rush, staff may miss this entirely if they don't know to look in "More". There's no visual hint on the floor plan or takeout queue that a takeout can be attached to a table.
2. **MANAGER PIN GATE**: A staff member cannot complete the merge alone — they must always call a manager. For a common operation in samgyup (customer walks in and says "we also ordered takeout"), requiring manager PIN adds friction. No "request manager" visual flow exists.
3. **AuditTest (0 items)** appears in the list — empty takeout orders should probably be excluded or shown with a warning label since attaching them adds nothing.
4. **No "Attach" option from the Takeout Queue**: The takeout queue at the bottom shows takeout orders but there's no button to "attach to a table" from that direction — the flow only starts from the dine-in table side.

**P-level:** P1
**Screenshot:** `.playwright-cli/page-2026-03-09T16-59-42-546Z.png` (Attach Takeout modal with Jose, Maria, AuditTest)

---

### S2: Split Bill — Separate Receipts

**Flow tested (code analysis + partial live):**
- `SplitBillModal.svelte` accessed via More → Split Bill
- Three-step flow: choose → configure → pay

**What works:**
- **Equal Split**: Divides total evenly. Shows each guest's share in real-time (e.g., ₱200/pax for 2-way split)
- **By Item**: Two-panel UI — unassigned items on left, guest columns on right. Staff taps item → taps guest to assign. Running total per guest updates live
- **Split counts**: 2, 3, 4, 5, 6, 8 ways supported (quick selection buttons)
- **Payment flow**: Sequential per-guest payment. Each sub-bill shows its total. After each payment, a per-guest receipt preview appears ("Guest 1 Paid — ₱200 via Cash — Change: ₱0")
- **Progress indicator**: "2/3 paid" shown at top during payment step
- **Mixed payment methods**: Each sub-bill can use a different method (Cash, GCash, Maya)
- **All paid state**: After all sub-bills paid, a final "All Done ✓" confirmation triggers

**Issues found:**
1. **NO 7-WAY SPLIT**: The quick selector offers 2, 3, 4, 5, 6, 8 — **7 is missing**. Tables of 7 guests can't quick-split; staff would need workarounds. In Philippine samgyup, odd group sizes are very common.
2. **NO PRINT/RECEIPT for By-Item mode**: The sub-receipt after each payment only shows the sub-bill total and method — it doesn't itemize which items were in that sub-bill. For "By Item" splits, the guest has no record of what they paid for.
3. **NO PARTIAL UNASSIGNMENT in By-Item mode**: Once an item is assigned to a guest, reassigning it requires selecting it again and tapping a different guest — not obvious UX. There's no "unassign" / "back to pool" button.
4. **Split Bill triggers Checkout modal racing**: During live testing, the Checkout modal appeared to persist in the DOM while the sidebar was open, causing z-index conflict. This is a **state management bug** not a UX design issue (see S7 Critical Bug).
5. **MANAGER PIN NOT REQUIRED for split bill itself** (only for individual item removal or certain discounts) — this is correct behavior; split should not require manager authorization.
6. **"By Item" flow label**: Unassigned items panel header says "Items (N unassigned)" — this is clear. However when all items ARE assigned, the "Proceed to Payment" button remains disabled if ANY item is still unassigned. The disable reason is not shown inline (just the button turns gray).

**P-level:** P1 (7-way split missing) / P2 (receipt itemization)
**Screenshot:** Observed in code at `src/lib/components/pos/SplitBillModal.svelte`

---

### S3: Ice Tea Pitcher Limit (12-Person Table)

**Flow tested:**
- Examined `RefillPanel.svelte` source code thoroughly
- Examined `AddItemModal.svelte` for ice tea limit logic
- Checked `orders.svelte.ts` for any item count guards on free sides

**What exists:**
- Ice Tea Pitcher appears in the Sides category as a FREE item (both in the Add Item modal and in the RefillPanel's "Free Sides" section)
- Staff can add it from two places: (a) Add Item → Sides → Iced Tea Pitcher, or (b) Refill → Free Sides → Iced Tea Pitcher
- The item is tagged as `tag: 'FREE'` in the order

**What is missing:**
1. **NO LIMIT ENFORCEMENT**: There is zero code-level cap on ice tea pitcher quantities. Staff can add 10 ice tea pitchers to a 2-pax table without any warning, gate, or alert. The business rule of "1 pitcher per ~6 pax" is not implemented anywhere in the codebase.
2. **NO PAX-BASED CALCULATION**: The system knows `order.pax` and has access to it in every store — but this is never used to derive "permitted free pitchers." There is no `maxFreePitchers = Math.floor(pax / 6)` or similar logic.
3. **NO "NO REFILL" INDICATOR**: The RefillPanel shows free sides but does not distinguish between items with and without refill eligibility. Ice tea is specifically a no-refill item in samgyup restaurant policy, but the UI shows it the same as lettuce or rice.
4. **NO TOAST/WARNING**: When a second ice tea is added to a 4-pax table, nothing alerts the staff that this exceeds the free allowance.

**Business impact:** This is a significant revenue leak risk. A table of 2 could order unlimited ice tea pitchers (each valued at ~₱50-80) for free. For a busy night with 8 tables, this is potentially hundreds of pesos in untracked giveaways.

**P-level:** **P0** — unimplemented business rule with direct revenue impact
**Screenshot:** N/A (code analysis finding)

---

### S4: Extra Tong Request → Kitchen Notification

**Flow tested:**
- Examined `RefillPanel.svelte` source code
- `SERVICE_PRESETS = ['Extra Tong', 'Extra Scissors', 'Extra Plates', 'Extra Tissue', 'Extra Cups']`

**What works:**
- "Extra Tong" is a pre-built preset button in the RefillPanel's "🔧 Needs (Kitchen Alert)" section
- Staff taps: Refill → "Extra Tong" → instant visual confirmation (button turns purple, "✓" appears for 1.4 seconds)
- `addServiceRequest(order.id, 'Extra Tong')` is called which creates a `kitchen_alerts` record in RxDB
- Kitchen sees this as an alert (separate from KDS tickets for food)
- Custom request option also available via "+ Custom" button

**Issues found:**
1. **DISCOVERABILITY**: Service requests live inside the "Refill" panel. A new staff member would reasonably look for utensil requests under a "Service" or "Requests" button, not "Refill." The label "Refill" primarily suggests food refills, not utensil requests.
2. **NO KITCHEN VIEW VERIFICATION possible in this session**: The alert creation was verified in code (`kitchen_alerts` collection), but no live confirmation of what the kitchen actually sees was possible in this single-role audit.
3. **1.4-SECOND FEEDBACK**: The sent confirmation (button turning purple for 1.4s) is brief. On a busy touchscreen, a distracted staff member might tap Tong twice, sending duplicate requests. No duplicate-send prevention exists.
4. **"🔧 Needs (Kitchen Alert)"** section header label is small (10px tracking-wider gray text) — may be hard to spot on a bright touchscreen in a noisy kitchen-adjacent area.

**P-level:** P2 (discoverability) — feature is functional
**Screenshot:** `.playwright-cli/page-2026-03-09T16-45-53-520Z.png` (Add Item modal showing Sides tab with free items)

---

### S5: Scissors / Utensil Request → Kitchen

**Flow tested:** Same as S4 (same code path)

**What works:**
- "Extra Scissors" is in the same SERVICE_PRESETS array in RefillPanel
- Same flow as Tong: Refill → Extra Scissors → purple confirmation
- Same kitchen alert mechanism

**Issues found:**
1. Same discoverability issue as S4 — Scissors buried inside Refill panel
2. **SCISSORS SPECIFIC CONCERN**: "Scissors" in Korean BBQ context means the kitchen scissor for cutting meat at the table. This is a mid-meal, time-sensitive request. The current flow requires: Open Refill panel → scroll to find "Extra Scissors" in the Needs section → tap. 3-4 taps minimum, which adds latency during a rush.
3. **NO URGENCY FLAG**: All service requests look identical regardless of urgency. Scissors requested for a guest waiting to eat meat should be higher priority than extra plates. No urgency tier exists.

**P-level:** P2 (discoverability + urgency differentiation)

---

### S6: Void an Item — Manager PIN Gate

**Flow tested:**
- `VoidModal.svelte` examined
- `OrderSidebar.svelte` — Void button behavior examined
- Live: Void button observed in sidebar at all times when activeItemCount > 0

**What exists in code:**
- "Void" button (red, `btn-danger`) is in the primary action row: [Void] [Checkout] [Print]
- Clicking Void opens `VoidModal` which has reason selection: 'mistake', 'walkout', 'write_off'
- The void operation calls `voidOrder(order.id, reason)` — this voids the **entire order**, not individual items
- For individual item removal: staff taps the ✕ button on each item row

**Individual Item Removal Logic:**
- Within "grace period" (configurable, checked via `isWithinGracePeriod(item.addedAt)`): Immediate removal, no PIN
- After grace period: Manager PIN required via `ManagerPinModal`

**Issues found:**
1. **"VOID" = ENTIRE ORDER**: The prominent "Void" button voids the WHOLE order (table). For a common operation of removing a single wrong item, staff must use the per-item ✕ button — which is visually smaller than the Void button. There is a cognitive mismatch: "Void" sounds like "remove this item" but actually means "cancel this entire table."
2. **VOID BUTTON LABEL CONFUSION**: In restaurant POS contexts, "Void" typically means "void a specific item." Here it means "void the entire order." This could lead a staff member to accidentally void an entire table's order when they meant to remove one item.
3. **NO ITEM VOID FROM WITHIN THE ORDER**: There's no dedicated "Void Item" option. The item-level removal (✕ button) is for "remove" semantics but shows as a small X on the row. The distinction between "remove" (grace period, free) and "void" (post-grace, manager PIN, creates audit record) is important but not visually differentiated.
4. **MANAGER PIN for item removal (post-grace)**: PIN entry via ManagerPinModal is functional. PIN is hardcoded at `1234`. The modal shows "Grace period has expired. Enter Manager PIN to remove this item." — clear copy.
5. **VOIDED ITEM DISPLAY**: After void, items show as `opacity-40` with "voided" in red italic and a "VOID" badge. This is good — clear visual diff.
6. **VOID ORDER REASON REQUIRED**: The 3-reason modal (mistake/walkout/write_off) is good for audit trail but adds a step. No PIN required for full-order void — **a staff member can void an entire table order without manager authorization**. This is a critical access control gap.

**P-level:** **P0** — Staff can void entire orders without manager PIN
**Screenshot:** Observed in `src/lib/components/pos/VoidModal.svelte` and `OrderSidebar.svelte`

---

### S7: Multi-Table Chaos — 3 Tables Simultaneously

**Flow tested:**
- During this audit session, T4 and T6 were opened simultaneously (T4 via SVG dispatchEvent)
- T6 was confirmed open with Pork Unlimited, 1 pax, ₱399
- T4 appeared in floor plan as occupied (green border, "2 pax") but sidebar showed it with 0 items initially

**What works:**
- **Table state persistence**: When T6 was selected and the sidebar was fully populated, switching context (e.g., clicking T4) would update the sidebar to show T4's order. The data itself persisted correctly in RxDB.
- **Counter accuracy**: Header shows correct occ/free count (0 occ → 2 occ after tables opened)
- **Floor plan visual**: Orange border = occupied, green border = occupied-with-items, white = available
- **Order history**: Closed orders showed count in History badge (14 → 15 → 16)

**Issues found:**

**P0 — Critical: CheckoutModal persists in DOM after close**
During live testing, the Checkout modal (z-60 overlay) repeatedly appeared AFTER being closed. The modal's close button was clicked and confirmed closed via JS, but within 1-2 seconds the overlay re-appeared. This happened **at least 3 times** during the session. Investigation revealed:
- The z-60 modal div was present in DOM with `opacity-1/visible` state
- It contained the full Checkout modal structure for T6
- The sidebar "More" click was blocked by the modal even when visually invisible
- Root cause likely: reactive state (`showCheckout = true`) being set by a `$effect` or reactive re-evaluation

**P1 — SVG Floor Plan Click Bleed-Through**
When using JS `dispatchEvent(new MouseEvent('click'))` on modal buttons, the synthetic click event bubbled through the modal backdrop and triggered clicks on SVG table `<g role="button">` elements underneath. This caused PaxModals for T2, T5, T6 to accidentally open during testing.
- This is a tooling limitation with `dispatchEvent` (vs natural pointer events)
- However, it reveals that modal backdrop `pointer-events: none` on the SVG `<g>` elements (`pointer-events="none"` on group, `pointer-events="all"` on inner rect) may be insufficient — the backdrop overlay may not fully intercept bubbled events in all browsers
- **Practical risk**: On a touchscreen, a mistouch through a semi-transparent backdrop could trigger a table click

**P1 — Multi-modal Z-index Cascade (Checkout + LeftoverPenalty + Authorize)**
During the session the following modals stacked:
- LeftoverPenaltyModal (z-60) — appeared when clicking "More" button near Checkout
- Checkout modal (z-60) — identical z-index, causing DOM ordering ambiguity
- Authorize Discount modal (z-70) — appeared during checkout flow

The identical z-60 values for LeftoverPenaltyModal and CheckoutModal means the DOM render order determines which appears "on top." This is fragile:
```
CheckoutModal:       z-[60]
LeftoverPenaltyModal: z-[60]  ← same z-index!
SplitBillModal:      z-[60]
AttachTakeoutModal:  z-[70]
ManagerPinModal:     z-[70]
```
When both CheckoutModal and LeftoverPenaltyModal are simultaneously `{#if}`-mounted, the z-index collision can make one cover the other unpredictably.

**P2 — "Cancel Table" confusing in multi-table context**
When T4 was opened with 0 items, the sidebar showed a red "Cancel Table" button instead of the normal action row. In a multi-table rush, a staff member handling 3 tables could accidentally tap "Cancel Table" thinking they're on a different table that actually has items. The confirmation dialog ("Cancel this table? Pax entry will be removed.") helps, but the red button on an otherwise clean sidebar is alarming.

**P2 — No cross-table visual indicator in sidebar header**
When multiple tables are occupied and you switch between them in the sidebar, there's no "breadcrumb" or numbered indicator that T4 is table 1 of 2 active tables. Staff must remember which table they're viewing. For 3+ tables, this creates cognitive load.

**P-level:** **P0 (CheckoutModal DOM leak)**, P1 (z-index cascade), P2 (Cancel Table visibility)

---

## Summary Table

| # | Scenario | Feature Status | Result | Priority |
|---|---|---|---|---|
| S1 | Merge Takeout to Table | EXISTS — 3-step modal, manager PIN | PASS with UX gaps | P1 |
| S2 | Split Bill — Separate Receipts | EXISTS — equal + by-item, per-guest payment | PASS with gaps | P1 |
| S3 | Ice Tea Pitcher Limit (12 pax) | NOT IMPLEMENTED | FAIL | **P0** |
| S4 | Extra Tong → Kitchen Alert | EXISTS — RefillPanel presets | PASS with discoverability gap | P2 |
| S5 | Scissors Request → Kitchen | EXISTS — same RefillPanel | PASS with discoverability gap | P2 |
| S6 | Void Item — Manager PIN Gate | PARTIAL — full-order void has no PIN | FAIL | **P0** |
| S7 | Multi-Table Chaos | WORKS but has state management bug | FAIL (modal leak) | **P0** |

---

## Critical Findings (P0)

### P0-A: Ice Tea Pitcher Has No Quantity Limit (S3)
**Location:** `RefillPanel.svelte` free sides, `AddItemModal.svelte` sides category
**Issue:** The business rule "1 ice tea pitcher per ~6 pax, no refills" is completely unimplemented. Staff can add unlimited ice tea pitchers for free. No cap, no warning, no "no refill" flag.
**Impact:** Direct revenue loss on every table. A 2-pax table can order 10 pitchers for free.
**Fix required:**
- Add `maxFreeIceTea: Math.ceil(order.pax / 6)` derived value
- Count existing ice tea pitcher items in order
- Block/warn when count >= maxFreeIceTea
- Display "Ice Tea: 1/2 used" counter in RefillPanel sides section
- Add `noRefill: true` flag to Iced Tea Pitcher menu item and show a visual badge

---

### P0-B: Staff Can Void Entire Table Orders Without Manager PIN (S6)
**Location:** `OrderSidebar.svelte` → `VoidModal.svelte` → `voidOrder()`
**Issue:** The red "Void" button in the primary action row voids the ENTIRE TABLE ORDER. Staff role can trigger this with no manager authorization. Only a reason selection is required (mistake/walkout/write_off).
**Impact:** A disgruntled or confused staff member can eliminate an entire table's order with 2 taps (Void → Select reason). No manager oversight. Audit trail records the reason but no manager confirmation.
**Fix required:**
- Add Manager PIN gate to `VoidModal` (same `ManagerPinModal` component used elsewhere)
- OR: Move "Void" to the "More" overflow menu, making it less accidentally triggerable
- Rename "Void" button to "Void Order" to clarify scope

---

### P0-C: CheckoutModal Persists in DOM After Close — Multi-Table Context (S7)
**Location:** `src/routes/pos/+page.svelte` — `showCheckout` / `checkoutOrder` state
**Issue:** During testing, the CheckoutModal was visually closed but the z-60 overlay remained in the DOM and blocked clicks on the OrderSidebar's More actions. This happened repeatedly across multiple close attempts.
**Root cause hypothesis:** `showCheckout` is set to `true` reactively (via `$effect` or reactive assignment). The `checkoutOrder` capture pattern (`checkoutOrder = currentActiveOrder ?? null`) may be re-assigning when the order reactively updates, accidentally resetting `showCheckout` to a truthy state.
**Impact:** Staff cannot access "Merge", "Split Bill", "Attach Takeout" or other More actions when the Checkout modal is ghost-present. In a rush, this is table-blocking.
**Fix required:**
- Audit all sites where `showCheckout = true` is set — ensure it's only triggered by explicit user gesture
- Add `onDestroy` or explicit reset guard to CheckoutModal
- Consider using a modal stack manager to prevent z-60 conflicts

---

## P1 Findings

### P1-A: "Attach Takeout" Discoverability (S1)
The "Attach Takeout" button requires: (1) having an active dine-in order, (2) clicking "More" to reveal the overflow menu, (3) finding it among 6 other overflow actions. For the scenario where a customer says "I also placed a takeout — can you add it to our table?", staff must know this flow exists. Suggestion: show a contextual "ATTACH" badge on the takeout queue card when a dine-in table is selected in the sidebar.

### P1-B: No 7-Way Split (S2)
The Split Bill modal offers: 2, 3, 4, 5, 6, 8 splits. **7 is omitted**. Groups of 7 cannot use the quick split — they'd have to use By Item mode or work around with manual calculations. Fix: add 7 to the quick selector grid.

### P1-C: Merge Requires Manager PIN for Attach Takeout (S1)
The merge flow requires Manager PIN (`AttachTakeoutModal.svelte:step = 'pin'`). While this is a reasonable security measure, for a common operation during lunch rush, this workflow is friction-heavy for staff. Consider a configurable "require PIN for merge" setting.

### P1-D: Z-Index Modal Cascade (S7)
CheckoutModal and LeftoverPenaltyModal share z-[60]. When both conditions are true simultaneously, DOM order determines display priority — this is fragile. LeftoverPenaltyModal should be z-[61] or z-[70] to ensure it always appears above CheckoutModal.

---

## P2 Findings

### P2-A: Utensil Requests Buried in Refill Panel (S4, S5)
"Extra Tong", "Extra Scissors" are in the Refill Panel under "🔧 Needs" section. Since staff open the Refill Panel primarily for meat/side refills, the service requests section may be overlooked. Consider a dedicated "Service" button in the sidebar alongside "Refill" and "Add Item".

### P2-B: Void vs Remove Item Semantic Confusion (S6)
"Void" button = void entire order. Per-item removal = small ✕ on each item row. These are very different operations with very different consequences but the visual distinction is insufficient. The ✕ button for individual item removal has no label. Suggestion: add a "Remove item" tooltip/label and rename the primary Void button to "Void Order" with explicit scope.

### P2-C: Split Receipt Doesn't Itemize for By-Item Mode (S2)
When using By-Item split, each guest's sub-receipt shows only the total, not the individual items. For accountability ("why am I paying ₱325?"), item-level receipt listing is needed.

### P2-D: Empty Takeout Orders in Attach List (S1)
AuditTest takeout (₱0.00, 0 items) appeared in the Attach Takeout list. Attaching an empty order is useless. Empty takeout orders should be filtered out of the attach list or shown with a warning.

### P2-E: Cancel Table Button Visual Risk (S7)
When a table is open with 0 items (just pax entered), the sidebar shows a prominent red "Cancel Table" button with a TriangleAlert icon. In a multi-table rush, this high-contrast danger button on an otherwise sparse sidebar creates accidental-tap risk. The two-step confirmation mitigates but a less prominent entry point would be safer.

---

## Recommendations

### Immediate (P0)
1. **Implement ice tea pitcher cap**: Add `maxFreePitchers` derived from `Math.ceil(pax / 6)` and enforce it in both `AddItemModal` and `RefillPanel`. Block adds over limit, show "2/2 pitchers used" counter.
2. **Add Manager PIN to full-order Void**: Gate the VoidModal with the same ManagerPinModal used for other elevated operations. Staff should not be able to void an entire table order without manager authorization.
3. **Fix CheckoutModal state leak**: Audit `showCheckout` reactive assignments in `pos/+page.svelte`. Add explicit `showCheckout = false` reset in checkout close handler. Test for phantom modal in multi-table switch scenarios.

### Short-term (P1)
4. **Add 7 to split count options**: `[2, 3, 4, 5, 6, 7, 8]` — trivial code change.
5. **Surface "Attach Takeout" contextually**: When a dine-in table is selected AND takeout orders exist, show a small "Attach Takeout" chip or badge on the takeout queue card.
6. **Fix z-index hierarchy**: LeftoverPenaltyModal → z-[62], AttachTakeoutModal → z-[70], ManagerPinModal → z-[80]. Establish a strict z-index registry.

### Medium-term (P2)
7. **Separate "Service Requests" from Refill panel**: Add a dedicated "🔔 Service" quick-action button in the sidebar alongside Refill and Add Item.
8. **Rename Void button to "Void Order"**: Add scope clarity.
9. **Add item-level receipt to By-Item split**: Per-guest receipt should list items in that sub-bill.
10. **Filter empty takeout orders from Attach list**: Only show takeouts with items > 0.

---

## Appendix: Observed Flows (Source Code Verified)

### Flow: Attach Takeout → Combined Bill
```
1. Open dine-in table (must have currentOrderId)
2. Sidebar → More → Attach Takeout
   (only shows if hasTakeoutOrders AND order.orderType === 'dine-in' AND table exists)
3. AttachTakeoutModal opens with list of open takeout orders
4. Select takeout → "confirm" step shows:
   - Table order total
   - + merge + takeout order total
   - = Combined Total
   - "All items from X will be added to T6's bill. Takeout will be closed."
5. Confirm → Manager PIN (ManagerPinModal)
6. PIN correct → mergeTakeoutToTable(takeoutId, tableOrderId)
7. Takeout items appended to table order
8. Takeout order closed
9. Sidebar now shows combined bill
```

### Flow: Split Bill → Sequential Receipts
```
1. Sidebar → More → Split Bill (requires activeItemCount > 0)
2. SplitBillModal step 1: choose method (equal/by-item) + how many ways
3. Step 2: configure split
   - Equal: shows sub-bills with amounts
   - By-item: left panel (items), right panel (guest columns). Tap item → tap guest
4. Step 3: pay each sub-bill
   - Active sub-bill highlighted in orange tab
   - Pay via Cash/GCash/Maya
   - Per-guest receipt shown after each payment
   - "Next Guest → (N left)" or "All Done ✓"
5. All paid → oncomplete(paidOrder) → receipt modal shows split summary
```

### Flow: Item Remove (Grace) vs Item Void (Post-Grace)
```
Within grace period:
  ✕ on item row → removeOrderItem(order.id, item.id) → item removed immediately

Post-grace period:
  ✕ on item row → ManagerPinModal opens ("Grace period expired")
  → PIN correct → removeOrderItem() → item removed

Full order void (any time, NO PIN):
  [Void] button → VoidModal (reason) → voidOrder(order.id, reason)
  → All items marked 'cancelled', order closed
```
