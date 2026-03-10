# UX Audit — Butcher Weigh Station & Stock Inventory (Meat Creation/Editing)

**Date:** 2026-03-10
**Auditor:** Claude Sonnet 4.6 (via agent)
**Role under test:** Benny Flores — Kitchen / Butcher — Alta Citta (Tagbilaran)
**Screens audited:**
1. `/kitchen/weigh-station` — The butcher's primary working screen
2. `/stock/inventory` — Meat inventory read + stock adjustment + edit item info
3. `InventoryActionModal` — Stock add/deduct/set-level modal (rendered when admin/manager clicks row)
4. `InventoryEditModal` — Item name/description/image edit modal
5. `YieldCalculatorModal` — Accessible from the Dispatched panel's "Yield %" button

**Viewport:** 1024 × 768 px (tablet landscape — standard for POS stations in WTF! kitchen)
**Session method:** Quick-login via dev panel as Benny Flores (Kitchen / ⚖️ Butcher role, Alta Citta tag)
**Nav access as Benny:** Kitchen (All Orders, Order Queue, Weigh Station) + Stock (all sub-tabs)

---

## Scope Notes

### Role Capability Matrix for Benny (kitchen role)

| Capability | Benny (kitchen) | Manager | Owner/Admin |
|---|---|---|---|
| View pending meat orders | ✅ Yes | n/a | n/a |
| Dispatch meat weight | ✅ Yes | n/a | n/a |
| Log yield % | ✅ Yes (no PIN) | ✅ Yes | ✅ Yes |
| View stock inventory | ✅ Yes (read-only rows) | ✅ Yes | ✅ Yes |
| Adjust stock (add/deduct/set) | ❌ No — rows are readonly | ✅ Yes | ✅ Yes |
| Edit stock item info | ❌ No — pencil hidden | ✅ Yes | ✅ Yes |
| Create new stock item | ❌ No — no UI exists | ❌ No — no UI exists | ❌ No — no UI exists |
| 86 a menu item (mark sold out) | ❌ No — 86 button hidden | ✅ Yes | ✅ Yes |
| View deliveries | ✅ Yes | ✅ Yes | ✅ Yes |
| Receive a delivery | ✅ Yes (delivery form) | ✅ Yes | ✅ Yes |
| Log waste | ✅ Yes (waste form) | ✅ Yes | ✅ Yes |

**Key finding from capability matrix:** Creating a new stock item (new meat type/cut) is impossible for ANY role in the current UI. Items must be seeded by a developer via `src/lib/db/seed.ts`. This is a Phase 1 gap that will block real-world operations when WTF! Samgyupsal adds a new seasonal cut.

---

## A. Text Layout Map

### Screen 1: `/kitchen/weigh-station` — Idle State (No meat item selected)

```
1024px viewport width
────────────────────────────────────────────────────────────────────────────────
│ ← 48px → │ ←─────────────────── 976px content area ──────────────────────→ │
│           │                                                                   │
│  [W!]     │  📍 ALTA CITTA (TAGBILARAN)               [location banner 32px]│
│           ├───────────────────────────────────────────────────────────────────│
│  🍳       │  [🧾 All Orders] [📋 Order Queue] [⚖️ Weigh Station ◀active]     │
│ Kitchen   │                     [⚖️ Butcher Station badge]  [🔵 Bluetooth]   │
│  📦       │                                              sub-nav ~52px        │
│ Stock     ├──────────────────┬────────────────────────────┬───────────────────│
│           │  LEFT PANEL      │  CENTER PANEL              │  RIGHT PANEL      │
│           │  w=384px         │  flex-1 ≈ 340px            │  w=288px          │
│           │  bg-white        │  bg-surface-secondary      │  bg-white         │
│           │  border-r        │                            │  border-l         │
│           │                  │                            │                   │
│  [B]      │ "Pending Meat"   │         ⚖️ emoji           │ "Dispatched"      │
│ Benny     │ [h2, extrabold]  │   Select a meat order      │ "0 items · 0.0kg" │
│           │ "0 items waiting"│   [text-xl gray-600]       │ [xs gray-500]     │
│  [→]      │ [xs gray-500]    │   Choose from pending      │    [Yield %] btn  │
│ Logout    │                  │   list on the left         │                   │
│           │    [✅ emoji]    │   [text-sm gray-400]       │  "No items        │
│           │   "All clear"    │                            │   dispatched yet" │
│           │   [text-sm gray] │                            │  [text-sm gray]   │
│           │   [centered in   │                            │                   │
│           │    flex-1 area]  │                            │                   │
│           │                  │                            │                   │
│           │                  │                            │                   │
│           │                  │                            │                   │
│           │                  │                            │                   │
│ FOLD 768px ────────────────────────────────────────────────────────────────── │
│           │ (nothing below fold in idle state — fold falls in empty space)    │
────────────────────────────────────────────────────────────────────────────────
```

**Idle state pixel budget:**
- Sidebar rail: 48px (fixed)
- Location banner: ~32px
- Sub-nav (with badge row): ~52px
- Panel header (Pending Meat title): ~65px
- Remaining for content list: 768 - 32 - 52 - 65 = **619px** — adequate for idle

---

### Screen 1 (Active) — Meat Item Selected, Manual Mode, 1024×768

```
1024px viewport width
────────────────────────────────────────────────────────────────────────────────────
│ 48px │ Location Banner: 📍 ALTA CITTA (TAGBILARAN)                 [≈32px]      │
│      ├──────────────────────────────────────────────────────────────────────────  │
│      │ [🧾 All Orders] [📋 Order Queue] [⚖️ Weigh Station*]                      │
│      │                        [⚖️ Butcher Station]  [🔵 Bluetooth]  [≈52px]      │
│      ├──────────────────┬──────────────────────────────┬──────────────────────── │
│      │ LEFT (384px)     │ CENTER (340px)               │ RIGHT (288px)           │
│      ├──────────────────┤ ─────────────────────────    ├──────────────────────── │
│      │ [Table group     │                              │ "Dispatched"            │
│      │  card T3]        │ "Weighing for"    [≈20px]   │ "3 items · 1.2kg"       │
│      │ ┌──────────────┐ │ "T3 — Beef Bone-In" [28px]  │ [Yield %] button        │
│      │ │T3   #ord..   │ │ "2 pax | Suggested:~300g"   │ ─────────────────        │
│      │ │[gray-50 bg]  │ │            [≈20px text-sm]  │ [entry row]             │
│      │ │pkg name      │ │ Current stock: 9,200g [14px]│ T3 Beef Bone-In 480g    │
│      │ │~300g/meat    │ │ [≈20px total]               │ 19:31                   │
│      │ ├──────────────┤ │                              │ ─────────────────        │
│      │ │[BEEF BONE-IN]│ │ [Manual | 🔵 Scale] toggle  │ [entry row]             │
│      │ │ selected     │ │ rounded pill [≈44px]        │ T3 Sliced Beef 450g     │
│      │ │ ring-accent  │ │                              │ 19:30                   │
│      │ │ bg-accent-lt │ │ ┌──────────────────────────┐│ ─────────────────        │
│      │ ├──────────────┤ │ │  Weight (grams)   [14px] ││                         │
│      │ │[SLICED BEEF] │ │ │                          ││                         │
│      │ │ 2x           │ │ │   480          g  [60px] ││                         │
│      │ │              │ │ │  font-mono extrabold     ││                         │
│      │ └──────────────┘ │ └──────────────────────────┘│                         │
│      │                  │  [≈120px weight display box] │                         │
│      │ [Table group     │                              │                         │
│      │  card T5]        │  ┌────┬────┬────┐  ┌──      │                         │
│      │ ┌──────────────┐ │  │ 7  │ 8  │ 9  │           │                         │
│      │ │T5  Pork Belly│ │  ├────┼────┼────┤   72px each│                         │
│      │ └──────────────┘ │  │ 4  │ 5  │ 6  │           │                         │
│      │                  │  ├────┼────┼────┤           │                         │
│      │                  │  │ 1  │ 2  │ 3  │           │                         │
│      │                  │  ├────┼────┼────┤           │                         │
│      │                  │  │ C  │ 0  │DEL │           │                         │
│      │                  │  └────┴────┴────┘           │                         │
│ FOLD ─────────────────────────────────────────────────────────────────────────── │
│      │                  │                              │                         │
│      │                  │  [     DISPATCH      ] ←─ PRIMARY CTA (below fold!)   │
│      │                  │  green full-width 64px       │                         │
────────────────────────────────────────────────────────────────────────────────────

PIXEL BUDGET FOR CENTER PANEL (768px total height):
  Location banner:      32px
  Sub-nav:              52px
  "Weighing for" label: 20px
  Item name (28px h1):  36px (with margins)
  Pax + suggested:      28px
  Current stock:        24px
  Mode toggle:          52px (with margins)
  Weight display box:  120px (px-8 py-6 = 48px padding + 72px min-h display)
  Numpad (4 rows×72px): 288px + 3×12px gaps = 324px
  Gap between sections:  ~30px (gap-6 = 24px × multiple)
  ─────────────────────────────────
  SUBTOTAL:             718px
  DISPATCH button:       64px
  TOTAL:                782px > 768px

The DISPATCH button is pushed below the fold by approximately 14px on a
1024×768 display. In practice with OS chrome (browser address bar, etc.)
the overflow is worse. Benny must scroll down on every single dispatch.
```

---

### Screen 2: `/stock/inventory` — List View (Benny's Read-Only View)

```
1024px viewport
────────────────────────────────────────────────────────────────────────────────────
│ 48px │ 📍 ALTA CITTA (TAGBILARAN)                               [≈32px]         │
│  W!  ├─────────────────────────────────────────────────────────────────────────── │
│      │ Stock Management   [h1, text-2xl font-bold]              [≈40px]         │
│      │ [Inventory*][Deliveries🔴1][Transfers][Counts🔴1][Waste Log]              │
│      │ sub-tab nav                                              [≈44px]         │
│      ├─────────────────────────────────────────────────────────────────────────── │
│      │ StockHealthStrip:                                                         │
│      │ [📦 93 TOTAL][✅ OK 93][⚠ LOW 0 ← yellow badge][🚨 CRIT 0] [≈72px]     │
│      ├─────────────────────────────────────────────────────────────────────────── │
│      │ [🔍 Search items or category...] [Expand All][Collapse All][≡ list][⊞ grid]│
│      │ toolbar                                                  [≈44px]         │
│      ├─────────────────────────────────────────────────────────────────────────── │
│      │ TABLE HEADER: [img][ITEM ↑][CATEGORY][STOCK LEVEL][CURRENT/MIN][STATUS]  │
│      │               header row                                [≈40px]         │
│ FOLD ─────────────────────────────────────────────────────────────────────────── │
│      │  ← Everything below here requires scroll →                                │
│      │                                                                           │
│      │ Beef section header (pink bg, border-l-4 red, donut chart)   [≈64px]    │
│      │ ┌─────────────────────────────────────────────────────────────────────┐  │
│      │ │ [donut] Beef (5 items) 27.8k Total  Beef Bone-In 9,500  [Variants 5]│  │
│      │ └─────────────────────────────────────────────────────────────────────┘  │
│      │                                                                           │
│      │ [img 56×56] Beef Bone-In    Meats  [level bar]  9,500g/3,000 [Well-Stckd]│
│      │             2 minutes ago          [stock level]  Min: 3,000    [≈68px]  │
│      │             ← no 86 button, no edit button for Benny (readonly role) →   │
│      │                                                                           │
│      │ [img 56×56] Beef Bone-Out   Meats  [level bar]  7,500g/3,000 [Well-Stckd]│
│      │             2 minutes ago                        Min: 3,000    [≈68px]  │
│      │                                                                           │
│      │ [img 56×56] Beef Bones      Meats  [level bar]  1,500g/1,000 [Adequate] │
│      │             2 minutes ago                        Min: 1,000    [≈68px]  │
│      │                                                                           │
│      │ ... (continuing scroll with more meat cuts)                              │
────────────────────────────────────────────────────────────────────────────────────

ABOVE-FOLD HEIGHT BUDGET:
  Location banner:   32px
  Page title:        40px
  Sub-tab nav:       44px
  Health strip:      72px
  Toolbar:           44px
  Table header:      40px
  ──────────────────────
  TOTAL CHROME:     272px
  REMAINING:    768-272 = 496px available for content

  First content visible (Beef protein group header): ~64px
  First row visible: ~68px
  → Benny can see approx 5-6 stock rows above fold, or 3-4 rows + the Beef
    group header. This is adequate for scanning but the density of chrome
    reduces the browsable area significantly.
```

---

### Screen 3: `InventoryActionModal` (stock add/deduct/set — admin/manager only)

```
Fixed modal overlay, centered, max-w-md (≈448px), bg-white rounded-2xl
────────────────────────────────────────────────────────────────────────
│ [CategoryIcon 48px] Beef Bone-In                          [✕ button] │
│                     Current: 9,500g · Min: 3,000                     │
│                     [header, 64px]                                    │
├────────────────────────────────────────────────────────────────────── │
│ "Select Action" [xs uppercase gray-400]                               │
│                                                                       │
│ ┌───────────────┬───────────────┬───────────────┐                    │
│ │  + (circle)   │  - (circle)   │  ✏ (circle)   │                    │
│ │    Add        │    Deduct     │   Set Level   │                    │
│ │ green border  │  red border   │  blue border  │  3-col, 100px each │
│ └───────────────┴───────────────┴───────────────┘                    │
│                                                                       │
│ ─── (after action selected) ────────────────────────────────────────  │
│ "QUANTITY TO ADD (g) *" [xs uppercase]                                │
│ [________________________________ g]  (number input, lg font-mono)   │
│                                                                       │
│ "REASON (Optional)"                                                   │
│ [____________________________________]  (text input)                  │
├────────────────────────────────────────────────────────────────────── │
│ bg-gray-50 footer:                                                    │
│ [Cancel text-only]          [Confirm Addition] ← color-coded btn      │
└────────────────────────────────────────────────────────────────────── │

Note: This modal is invisible to Benny — it requires a non-readonly row
click. Kitchen role rows have onclick=undefined. Benny cannot open this.
```

---

### Screen 4: `InventoryEditModal` (item name/desc/image — admin/manager only)

```
Fixed modal overlay, centered, max-w-md, bg-white rounded-2xl
────────────────────────────────────────────────────────────────────
│ "Edit Item Info"                               [✕ button p-2]    │
│ [border-b, 56px header]                                           │
├────────────────────────────────────────────────────────────────── │
│ ITEM NAME *                                                       │
│ [________________________________________]  pos-input             │
│                                                                   │
│ DESCRIPTION (OPTIONAL)                                            │
│ [________________________________________]  textarea h-20         │
│ [________________________________________]                        │
│                                                                   │
│ ITEM PICTURE                                                      │
│ [Choose File  ] no file chosen                                    │
│ (if image exists: shows 128×128 preview with ✕ remove overlay)   │
├────────────────────────────────────────────────────────────────── │
│ bg-gray-50:  [Cancel text]           [Save Changes] accent btn    │
└────────────────────────────────────────────────────────────────── │

Critical gap: The edit modal only allows changing NAME, DESCRIPTION,
and IMAGE. It does not expose: minLevel, unit, proteinType, category,
locationId, or menuItemId linkage. To change any of these operational
properties, a developer must directly update RxDB or the seed file.
```

---

### Screen 5: `YieldCalculatorModal` (accessed from Dispatched panel Yield % button)

```
Fixed overlay, max-w-2xl (≈672px), dark theme bg-gray-900
────────────────────────────────────────────────────────────────────────────
│ "Yield Calculator"                                          [✕ 44px btn] │
│ [border-b border-gray-700, dark]                                         │
├─────────────────────────────────────────────────┬────────────────────── │
│ LEFT PANEL (flex-1)                             │ RIGHT PANEL (224px)   │
│                                                 │ [numpad grid]         │
│ "Meat Cut"  [label xs gray-400]                 │                       │
│ [search input dark bg-gray-800]                 │ Active: "Raw Weight"  │
│ [select list size=5 dark]                       │ [xs green/blue label] │
│ - Beef Bone-In                                  │                       │
│ - Beef Bone-Out                                 │ ┌───┬───┬───┐         │
│ - Sliced Beef                                   │ │ 7 │ 8 │ 9 │ 56px   │
│ - Pork Belly                                    │ │ 4 │ 5 │ 6 │ each   │
│ - Pork Liempo                                   │ │ 1 │ 2 │ 3 │        │
│                                                 │ │ C │ 0 │ ⌫ │        │
│ [Raw Weight tap-to-target button]               │ └───┴───┴───┘         │
│ │ Raw Weight │         1200g │ ← active ring    │                       │
│                                                 │ [  .  ] decimal btn   │
│ [Trimmed Weight tap-to-target button]           │                       │
│ │ Trimmed Weight │      960g │                  │                       │
│                                                 │                       │
│ ┌───────────────────────────────────────────┐   │                       │
│ │       Yield Percentage                    │   │                       │
│ │         80.0%  ← text-5xl green           │   │                       │
│ └───────────────────────────────────────────┘   │                       │
│                                                 │                       │
│ [       Log Yield        ] green full-width btn │                       │
├─────────────────────────────────────────────────┴────────────────────── │

Dark theme (bg-gray-900) inconsistency with rest of WTFPOS (light theme).
No yield history is shown — Benny cannot see his previous recordings.
The modal closes and resets state after logging; no confirmation shown.
```

---

## B. Principle-by-Principle Table

| Principle | Verdict | Finding |
|---|---|---|
| **Hick's Law** | CONCERN | Weigh station idle state: excellent — only 1 decision (select a meat from list). Active state: 6-7 simultaneous decisions required — which item (done), understand suggested weight, read current stock, choose input mode (if BT connected), enter weight, tap dispatch. The mode toggle appearing conditionally (only when BT connected) introduces inconsistent choice count: sometimes Benny sees 5 decisions, sometimes 6. This unpredictability is a Hick's violation. Inventory view: 5 filter/view controls in toolbar (search, Expand All, Collapse All, List, Grid) is acceptable for Benny who primarily reads; but since all adjustment actions are hidden (readonly), the toolbar is even simpler in practice — he can only search and toggle view, which is good. StockHealthStrip filter buttons (4 options) are well within Hick's range. |
| **Miller's Law** | CONCERN | Weigh station center panel at active state presents 7 distinct information chunks: (1) contextual label "Weighing for", (2) item + table identity heading, (3) pax count + suggested weight, (4) current stock level, (5) mode toggle (if BT), (6) weight display box, (7) numpad grid. This is at the exact 7±2 limit. Adding the current stock indicator (chunk 4) was a P1-17 feature that pushed the panel to its cognitive limit. On a busy Saturday rush with 6 orders queued, Benny must hold the chunk count steady while also tracking physical meat on the counter. Inventory protein grouping (Beef / Pork / Chicken / Other) is a strong application of Miller's — 4 groups, well within range. Dispatched log shows each entry as a minimal 2-field row (table + name / weight + time) — excellent. |
| **Fitts's Law** | FAIL | Two distinct failures: **(1) DISPATCH below fold.** Pixel budget analysis shows the DISPATCH button (primary action, 64px height, full-width ~340px) is pushed below the 768px viewport fold by approximately 14px in a clean browser, and more in typical tablet OS environments with status bars and browser chrome. Every dispatch requires Benny to scroll down with one hand, defeating the purpose of a large, prominent button. The button's size (full-width, 64px) is excellent — its position is the fatal flaw. **(2) Yield % button.** Styled `rounded-lg bg-gray-100 px-3 py-2 text-xs` with no explicit min-height. Rendered height is approximately 30-32px — below the 44px touch target minimum. On a greasy butcher's hands during service, this is a guaranteed miss-tap. |
| **Jakob's Law** | PASS | Three-panel layout (pending queue left / work area center / history right) follows established KDS and weighing station patterns familiar from Toast, Square for Restaurants, and similar systems. The numpad layout (7-8-9, 4-5-6, 1-2-3, C/0/DEL) matches the standard calculator convention. Status color coding (green=adequate, yellow=low, red=critical) is industry-standard. The 86 button uses genuine restaurant jargon that Alta Citta staff will immediately recognize. LocationBanner at top matches the mental model of "always know where you are" from multi-location retail systems. Sub-nav tabs (All Orders, Order Queue, Weigh Station) follow standard tab bar patterns. |
| **Doherty Threshold** | PASS | RxDB (IndexedDB) operations are measured in microseconds for local reads and <10ms for writes. `dispatchMeatWeight()` calls `incrementalPatch` on the KDS ticket and triggers an RxDB observable that propagates to the pending list immediately — the selected item disappears from the left panel without any perceptible delay. Numpad button `active:scale-95` provides <16ms tactile feedback on press. Dispatched log updates synchronously in local state with localStorage persistence. BT scale live weight display updates as fast as the GATT characteristic notification rate (typically 100-200ms). No network dependencies in the butcher flow — fully offline. |
| **Visibility of Status** | CONCERN | **Positive:** BT connection status is accessible from the sub-nav header Bluetooth button. Current stock level for the selected meat is shown in the center panel (a P1-17 addition). Dispatched log shows running total weight. LocationBanner always shows branch context. **Concerns:** (1) When BT scale is disconnected mid-session, there is no persistent warning. Benny may not notice the Bluetooth icon has changed state if he is focused on the numpad. (2) The Bluetooth button uses an icon only — no text label indicating "connected" vs "disconnected" state. The only affordance is color change (blue when connected), but this is not announced anywhere explicitly. (3) The pending list showing "0 items waiting" has no timestamp — Benny cannot determine if this is live data or stale KDS data. (4) No visual indication of how many items are queued in the KDS for other stations (not his concern, but awareness of total kitchen load would help pacing). |
| **Gestalt: Proximity** | PASS | Per-table grouping in the left panel is a strong application of proximity — all meats for T3 live in one card, separated from T5's card by gap-3 spacing. The amber suggested weight strip is immediately adjacent (border-b) to the table header, grouping pax context with the hint. The numpad digits 7-8-9/4-5-6/1-2-3 are correctly proximate with gap-3 (12px), separated from C/0/DEL by the same gap (no size differentiation needed — the color/bg change handles that). In the dispatched log, table/name and weight/time are correctly grouped by row with consistent internal spacing. |
| **Gestalt: Similarity** | CONCERN | **Positive:** All numpad digit buttons share identical styling (bg-white, border-border, shadow-sm, text-2xl). C and DEL differ in color — appropriate functional differentiation. Status badges in inventory use consistent `rounded-full border px-2.5 py-0.5 text-xs font-semibold` shape across all status types. **Concern:** The `86` button in inventory rows uses `text-[10px]` — dramatically smaller than every other interactive element on the page, violating visual similarity for actionable elements. The edit (✏) icon uses `w-4 h-4` (16px) icon inside a borderless button — a different visual language than the bordered `86` button despite both being row-level actions. The Yield Calculator modal's dark theme creates a strong similarity break with all other WTFPOS modals. |
| **Visual Hierarchy** | CONCERN | **Weigh station — correct hierarchy:** Item name heading at `text-3xl font-extrabold` is the most prominent text element in the center panel. The DISPATCH button at `text-xl font-extrabold bg-status-green py-5` is the most visually dominant interactive element — when visible. The weight display at `text-6xl font-extrabold font-mono` dominates the weight entry zone. **Concerns:** (1) The DISPATCH button's position below the fold effectively removes it from the visual hierarchy during the critical decision moment (after entering weight). (2) In the dispatched log, timestamps at `text-[10px]` are below the hierarchy floor — they become noise rather than information. (3) The "Yield %" button in the dispatched panel header reads as a tertiary action (small, gray background) but it opens a critical kitchen workflow modal — it deserves at least secondary hierarchy treatment. |
| **WCAG: Contrast** | CONCERN | Using Design Bible pre-computed ratios: (1) **Amber suggested weight strip:** `text-amber-700` (#B45309) on `bg-amber-50` — approximately 5.2:1, passes AA for normal text. The `text-amber-600` (#D97706) variant seen in the center panel suggested weight is approximately 3.8:1 on white — fails AA for small text below 18px (it's rendered at `text-sm font-semibold` ≈ 14px bold, which qualifies as large text at 14px bold but the amber-600 shade fails AA at 3.8:1). (2) **Status yellow badges:** `text-status-yellow` (#F59E0B) on any white/near-white background = 2.1:1 — catastrophically fails WCAG AA. The StockHealthStrip LOW STOCK badge uses this combination. Per Design Bible: "Status yellow is NEVER accessible as standalone text." (3) **Status green text:** `text-status-green` (#10B981) on white = 3.5:1 — fails AA for small text. Used in dispatched log weight values at `text-sm font-bold`. (4) `text-[10px]` dispatched timestamps at `text-gray-400` (#9CA3AF) on white = approximately 2.5:1 — fails below minimum size AND fails contrast. |
| **WCAG: Touch Targets** | FAIL | Explicit measurements from source code: (1) **Yield % button:** `rounded-lg bg-gray-100 px-3 py-2 text-xs` — rendered height ≈ 12px line-height + 16px padding = ~28px. Below 44px minimum. (2) **Edit (✏) icon button in inventory rows:** `text-gray-400 hover:text-accent` wrapping `<Edit3 class="w-4 h-4" />` — no explicit padding or min-height on the button wrapper. Touch area is approximately the 16×16px icon box plus any inherited padding. Below 44px minimum both width and height. (3) **86 button:** `rounded px-2 py-0.5 text-[10px] font-bold border` — rendered height ≈ 10px line-height + 4px padding = ~14px. Critically below 44px minimum. (4) **Manual/Scale mode toggle buttons:** explicitly set `style="min-height: unset"` — this removes the base CSS `min-height: 44px` rule, resulting in `py-2.5` (≈36px total). Below 44px minimum. (5) The "remove image" overlay button in InventoryEditModal: `w-6 h-6` (24px × 24px) — below 44×44 minimum. |
| **Consistency** | CONCERN | **Positive:** Numpad button style is consistent between weigh station and yield calculator (same grid, same font size, same C/DEL behavior). Status badge shapes are consistent across the app. Primary action button style (full-width, extrabold, py-5, active:scale-95) is used consistently for Dispatch and Log Yield. **Concerns:** (1) The Yield Calculator modal uses `bg-gray-900` dark theme — every other modal in WTFPOS (PaxModal, CheckoutModal, SplitBillModal, InventoryActionModal, InventoryEditModal, ManagerPinModal) uses `bg-white` light theme. This is the only dark modal in the system. (2) The center panel empty state uses large emoji (⚖️) while the left panel empty state uses emoji ✅ — inconsistent icon language (should both use lucide-svelte icons or both emoji, not mixed). (3) The `C` key on the weigh station numpad clears the weight input; in the yield calculator, `C` clears the active field. Behavior is consistent. |
| **Error Prevention** | CONCERN | **Good:** Dispatch is disabled (`disabled:opacity-30 disabled:pointer-events-none`) when `weightInput` is empty or `parseInt(weightInput) <= 0`. Log Yield is disabled when `rawWeight <= 0 || trimmedWeight <= 0 || trimmedWeight > rawWeight`. Inventory action modal requires reason for deduct/set actions. The InventoryActionModal `confirmDisabled` logic correctly validates all edge cases. **Concerns:** (1) **No maximum weight guard on dispatch:** Benny can type 99999 grams and dispatch without any warning. At 150g/pax suggested, dispatching 99999g for a 2-pax table is an obvious error. A soft warning (not blocking) when weight exceeds `suggestedPerMeat × 5` or exceeds `selectedCurrentStock` would catch mistakes. (2) **No dispatch confirmation:** Per Design Bible, dispatch is a low-cost reversible action (no confirmation needed) — but there is no "undo" mechanism either. An incorrect dispatch permanently removes from stock and marks the KDS item as weighed. A 10-second undo window would prevent costly mistakes. (3) **Mode toggle state persists:** If Benny is in Scale mode and the scale disconnects mid-session, the center panel silently falls back to manual mode (correct), but there's no notification that the mode changed. He may not realize he needs to re-enter the weight manually. |
| **Shift Endurance** | CONCERN | **Good:** `bg-surface-secondary` (#F9FAFB) as panel backgrounds — warm white, not harsh. Numpad button contrast is 16.8:1 (`text-gray-900` on white) — excellent for long shifts. Weight display at `text-6xl font-extrabold` is readable from arm's length. `active:scale-95` on buttons provides tactile confirmation without visual strain. **Concerns:** (1) `text-[10px]` timestamps in the dispatched log will cause eye strain during 8-12 hour shifts — the Design Bible specifies minimum 12px for captions. (2) Emoji used as primary status indicators (✅ for "all clear") can be blurry or inconsistent on different Android/ChromeOS tablet hardware used in kitchens. (3) The dispatched log header has `h2 font-extrabold` and summary text on the same line as the Yield % button — the visual density in this 288px panel feels cramped under kitchen lighting conditions. (4) No "quiet hours" or reduced-animation mode. The `slide` transition in inventory (300ms) is above the 200ms threshold set in Design Bible's Speed Over Beauty rule. |

---

## C. Best Day Ever — Benny's Saturday Dinner Rush (Empathy Narrative)

### 18:00 — Prep Begins

Benny is on at 6pm. He taps his tablet, and the Weigh Station loads instantly — the screen
he lives on for the next five hours. The three-panel layout is familiar: left is his queue,
center is his workbench, right is his record. Alta Citta is stitched into the location banner
at the top in teal — he barely registers it anymore, but it's there. Subconsciously it anchors
him. He's home.

The queue is empty. "All clear" with its green checkmark centers in the left panel. Benny
takes this as his signal to get the prep station ready — cutting boards out, first batch of
Beef Bone-In pulled from the walk-in. He glances at the right panel: "0 items · 0.0kg
total". Clean slate. Good.

He wonders, not for the first time, if that "0 items waiting" is current. The KDS feeds
this list — but there's no timestamp, no "last updated at 18:02". He has to trust it.

### 18:45 — First Rush

T2 drops a package order: 3 pax, Pork Belly, Sliced Beef, Beef Bone-In. The left panel
lights up. Three items in the T2 card, each on its own tappable row. He taps "Beef Bone-In"
first — the center panel activates with a sharp "T2 — Beef Bone-In" in big bold type. 3 pax,
suggested 450g in amber mono. He glances at the counter: current stock shows 9,200g in green.
Plenty.

He grabs the meat, places it on the scale — but today he's manual mode (the Bluetooth scale
died last week, waiting for parts). He enters 4-8-0 on the numpad. Each key click is satisfying
— the large 72px buttons are forgiving even with gloves on, and the `active:scale-95` gives
him a tiny bounce that confirms the press. The weight display updates: "480 g" in the box.

Now he needs to dispatch. He reaches for the big green button and — it's not there. The screen
cuts off. He scrolls down with his thumb and the DISPATCH button appears from below the fold.
He taps it. The item disappears from the left panel; a new entry appears in the right:
"T2 Beef Bone-In 480g 18:46". Good. But that scroll happens every single dispatch. By the end
of the night, he'll have dispatched 40+ items. Forty scrolls. Forty small frustrations.

### 19:30 — The Pork Surge

Tables 1, 4, 6, and a takeout order all want Pork Belly simultaneously. The left panel shows
four table cards stacked, each with one or two items. Benny works systematically: T1 first
(lowest number), then the takeout (purple TO badge), then T4, T6. The per-table grouping is
his map. He never gets confused about whose meat belongs to whom — the table header is always
visible at the top of each card.

What trips him up: between T4 and T6, a new item appears in T4's card as he's about to dispatch
T6's pork. The list updates in real time, which is correct, but the sudden appearance of a new
row causes him to pause and re-read the left panel. A small animation would help signal "new item
added to T4" without being disruptive. He makes a mental note to process T4's new item next.

The dispatched log builds up: 8 entries, then 12, then 18. The running total shows 5.4kg.
Benny can tell his yield is good tonight — the weights he's dispatching are close to the suggested
amounts, not wildly over or under.

### 20:15 — The Weight Mistake

In the chaos, Benny accidentally types 4800 instead of 480 for a Sliced Beef. He hits Dispatch.
The item disappears. A second later, he realizes: he just told the system that T7 got 4.8kg of
sliced beef for a 2-pax table. There's no undo. The dispatched log shows "T7 Sliced Beef 4800g
20:15" staring at him in green text. He'll need to find the manager after the rush to manually
correct the stock count. Tonight's meat yield report will be wrong. He accepts it. This happens
once every few weeks — not catastrophic, just annoying and correctable. But an undo button would
have saved him the hassle.

### 21:30 — Yield Check

Service winding down. Benny has leftover trim and bones from the Beef Bone-In batch. He taps
"Yield %" in the dispatched panel. The yield calculator opens — jarring dark theme against the
light kitchen tablet, but he's used to it. He enters raw weight (1,400g), taps over to trimmed
weight, enters 1,120g. The yield percentage reads 80.0% in green — a clean cut. He taps
"Log Yield" and it saves instantly, no PIN needed (kitchen role has permission). The modal closes.

He wishes he could see his yield history. Was this batch better than last Saturday? Worse? The
modal just records and closes — no historical context. He'll have to ask the manager to pull
the audit log. For a butcher who cares about his craft, this is a missed opportunity.

---

## D. Recommendations

| Priority | Issue | Fix | Effort | Impact |
|---|---|---|---|---|
| **P0** | DISPATCH button below fold at 1024×768. Pixel analysis shows the button sits approximately 14px below the viewport after stacking: location banner (32px) + sub-nav (52px) + item info + mode toggle + weight display (120px) + numpad (324px) + margins (~30px). Every single dispatch requires a scroll. This is Benny's highest-frequency action — 30-60 times per service. | Restructure the center panel layout. Option A: Reduce numpad key height from `min-height: 72px` to `min-height: 56px` (still comfortably above 44px minimum) — saves 64px, bringing everything above fold. Option B: Make the weight display box and numpad section `overflow-y: auto` with a max height, and make the Dispatch button sticky at the bottom of the center panel. Option A is lower effort and avoids the scroll-within-scroll feel. | M | High |
| **P0** | Benny (kitchen / butcher role) cannot adjust stock. The `isReadonly = session.role === 'kitchen'` check removes all stock adjustment capability from Benny's inventory view. Yet Benny physically handles the meat and is the first to notice waste, spoilage, or weight discrepancies. He has no way to log these at his own station without finding a manager. | Introduce a `canAdjustStock` capability separate from role. Assign it to kitchen users tagged as 'butcher' (session tag field). In InventoryItemRow, gate the 86 button and action modal on `canAdjustStock` rather than `!readonly`. This preserves the safety of Set Level (which should still require manager PIN) while giving butchers the Add/Deduct capability they need for day-to-day waste and correction logging. | L | High |
| **P0** | `Yield %` button rendered at approximately 30px height — well below 44px minimum. As the gateway to a critical kitchen workflow tool, this button fails both touch target and hierarchy requirements. | Add `min-h-[44px]` to the Yield % button. Upgrade its visual treatment to at least match the `.btn-secondary` class (`border-border bg-white text-accent`). Consider renaming it "Log Yield %" to signal it's an action, not just a display. | S | Med |
| **P0** | `86` button in inventory rows rendered at ~14px height (`py-0.5 text-[10px]`). Edit (✏) icon button has no explicit touch target size. Both fail WCAG touch target minimums by a wide margin. | For the 86 button: change to `py-2 text-xs min-h-[36px] min-w-[36px]` at minimum, ideally `py-2.5 min-h-[44px]`. For the edit button: wrap the icon in a div with `class="flex items-center justify-center min-h-[44px] min-w-[44px]"` or use a padding of `p-3` on the button element. | S | Med |
| **P1** | No maximum weight validation on Dispatch. Benny can enter 99999g and dispatch without any warning, permanently corrupting stock counts. | Add a soft warning (non-blocking) when `parseInt(weightInput) > selectedGroup.suggestedPerMeat * 4` or `parseInt(weightInput) > selectedCurrentStock`. Show a yellow dismissable inline banner: "⚠ This weight is unusually high. Double check before dispatching." The Dispatch button remains enabled — this is a warning, not a block. | S | Med |
| **P1** | No undo mechanism after dispatch. A mis-keyed weight (e.g., 4800 instead of 480) permanently records the error in KDS and stock. Only a manager can correct it via a manual stock adjustment. | Add a 10-second "Undo" toast after dispatch: "T2 Beef Bone-In 480g dispatched. [Undo]". If Benny taps Undo within 10 seconds, reverse the `dispatchMeatWeight` call (restore KDS item to pending, remove from dispatched log). After 10 seconds, the action is committed. This follows the Design Bible's Low Cost error tier (no confirmation needed, but reversal should be easy). | M | High |
| **P1** | Status yellow fails WCAG AA contrast (2.1:1). `text-status-yellow` (#F59E0B) on white/near-white backgrounds is used in the LOW STOCK badge in StockHealthStrip and in amber warning contexts. Per Design Bible: "Status yellow is NEVER accessible as standalone text." | Replace `text-status-yellow` on white backgrounds with `text-amber-700` (#B45309) — approximately 4.7:1 on white, passing AA. For the suggested weight display in amber-50 background: already uses `text-amber-700` (correct). Audit all `text-status-yellow` and `text-amber-600` usages against their backgrounds and apply the darker amber-700/amber-800 where needed. | S | Med |
| **P1** | `text-[10px]` timestamps in dispatched log are below the 12px minimum readable size specified in the Design Bible. At 10px under kitchen lighting (ambient, sometimes dim for ambiance), these are illegible during a busy shift. | Increase dispatched log timestamps from `text-[10px]` to `text-xs` (12px). The layout has room — the dispatched log rows have enough padding to accommodate the slightly taller text. | S | Low |
| **P1** | No "create new stock item" UI exists for any role. Stock items are seeded via `src/lib/db/seed.ts` and can only be added by a developer. When WTF! Samgyupsal introduces a new seasonal cut (e.g., "Wagyu Belly" for a special event), the owner or admin has no way to add it through the UI. | Add a "New Stock Item" modal accessible from the Admin → Menu page (Admin role only). Required fields: name, category (Meats/Other), protein type (beef/pork/chicken/other for Meats), unit (g/kg/pc), min level, link to existing menu item (select from menu_items). Use `nanoid()` for the ID, auto-set `locationId` from session. This is a Phase 1 capability gap — operators need this before go-live. | L | High |
| **P1** | Yield Calculator uses dark theme (bg-gray-900) inconsistently with all other WTFPOS modals which use bg-white light theme. The jarring shift disorients in a light kitchen environment. | Migrate Yield Calculator to the standard light modal shell: `rounded-2xl bg-white border border-gray-200 shadow-xl`. Update numpad button colors to the standard light-theme numpad style (used in weigh station): `bg-white text-gray-900 border-border shadow-sm`. The yield percentage display (green/yellow/red) will stand out more on white than on gray-900. Retain the layout structure (left panel: meat selector + weights + result; right panel: numpad). | M | Low |
| **P1** | Manual/Scale mode toggle buttons explicitly set `style="min-height: unset"` — this removes the base CSS `min-height: 44px` rule, leaving the toggle at approximately 36px height. | Remove `style="min-height: unset"` from both toggle buttons. Increase padding from `py-2.5` to `py-3` to compensate visually while allowing the min-height rule to apply. | S | Low |
| **P2** | No timestamp on the "pending" count — Benny cannot verify if "0 items waiting" is live or stale data. | Add a reactive "as of HH:MM" subtitle using `new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })` computed each time the `pendingMeatItems` derived value updates. Display as: "0 items waiting · as of 18:31" in the `text-xs text-gray-500` style. | S | Low |
| **P2** | Emoji used as primary visual indicators in empty states (✅ for "all clear", ⚖️ for "select a meat order"). Emoji rendering is platform-dependent — on some Android/ChromeOS tablets used in restaurant environments, emoji appear blurry or incorrectly sized. | Replace with `lucide-svelte` icons: `CheckCircle2` (stroke: status-green) for "all clear", `Scale` (or `Weight`) for the scale prompt. The "Butcher Station" badge in the sub-nav already uses a lucide icon — this would be consistent. | S | Low |
| **P2** | `InventoryEditModal` only exposes name, description, and image. Critical operational properties (minLevel, unit, proteinType, category, menuItemId linkage) cannot be changed through any UI. | Extend `InventoryEditModal` (or create an `InventoryConfigModal` for admin role only) to include: min stock level (numeric input, required), unit (select: g/kg/pc), protein type (select for Meats: beef/pork/chicken/other). These are the most likely fields to need correction during operations. Category and menuItemId linkage can remain developer-only changes. | M | Med |
| **P2** | Inventory list view `transition:slide` animation is 300ms — above the Design Bible's 200ms threshold for POS animations. During rapid stock updates, this creates stuttering. | Reduce slide duration from `duration: 300` to `duration: 150`, or gate on `prefers-reduced-motion`: `duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150`. | S | Low |
| **P2** | No yield history in the YieldCalculatorModal. Benny records yield but cannot see his previous recordings to track trends across shifts. | Add a collapsible "Recent Yields" section at the bottom of the Yield Calculator modal showing the last 5 yield recordings from `audit_logs` filtered by `action: 'yield_recorded'` and `locationId`. Show date, meat cut, and yield %. This leverages the existing audit log infrastructure at zero schema cost. | M | Med |

---

## E. Additional Observations

### Navigation Context for Benny (Kitchen Role)

The sidebar shows only Kitchen and Stock icons. No POS, no Reports, no Admin. This is correct
role-scoping. However, within the Stock section, Benny has access to Deliveries, Transfers,
Counts, and Waste Log — which are all **write** operations. Yet in the main Inventory view, he
is read-only. This creates a jarring inconsistency: Benny can log waste in the Waste Log tab
but he cannot log the same waste via the inventory row's Deduct button. The user journey forces
an unnecessary navigation detour.

### "Butcher Station" Badge

The sub-nav header displays "⚖️ Butcher Station" — this is Benny's station tag, a nice personal
touch that acknowledges his specific role within the kitchen team. It follows the real-world
language convention (Design Bible Heuristic 2: Match between system and real world). This badge
could be extended to show other station tags (🔥 Grill, 🥗 Sides) when kitchen users from those
roles access the KDS.

### Bluetooth Scale Integration

The BT scale integration is architecturally sound. The `btScale` store provides `connectionStatus`,
`stability`, `currentWeight`, and `lastStableWeight` — all the signals needed for a reliable
weigh station. The auto-fill behavior (when scale reading stabilizes, auto-populate weightInput)
is well-designed. The stability indicator (green "stable" / yellow "unstable" / gray "idle")
communicates clearly to Benny whether to trust the reading.

The remaining gap is the connection notification: when the scale goes from connected to disconnected
mid-session, Benny gets no visual alert. A banner ("Scale disconnected — switching to manual mode")
would prevent the confusion of "why isn't the scale auto-filling anymore?"

### Suggested Weight Logic

`SUGGESTED_GRAMS_PER_PAX = 150` is hardcoded. For different packages or meat types, this
suggestion may be incorrect (a pork belly AYCE might suggest 200g/pax; a premium package
might suggest 250g/pax). The suggestion ignores package type and meat cut. A manager-configurable
suggestion weight per stock item would make this feature genuinely useful rather than a rough
heuristic.

---

## Summary Dashboard

### Verdict Counts

| Verdict | Count | Principles |
|---|---|---|
| **PASS** | 3 | Jakob's Law, Doherty Threshold, Gestalt: Proximity |
| **CONCERN** | 9 | Hick's Law, Miller's Law, Visibility of Status, Gestalt: Similarity, Visual Hierarchy, WCAG: Contrast, Consistency, Error Prevention, Shift Endurance |
| **FAIL** | 2 | Fitts's Law, WCAG: Touch Targets |
| **TOTAL** | **14** | All 14 principles evaluated |

### P0 Issues — Must Fix Before Go-Live

| # | Issue | Screen | Effort |
|---|---|---|---|
| 1 | DISPATCH button below fold — requires scroll on most frequent action | `/kitchen/weigh-station` | M |
| 2 | Kitchen role (butcher) cannot adjust stock despite physically handling meat | `/stock/inventory` | L |
| 3 | Yield % button at ~30px height — below 44px minimum touch target | `/kitchen/weigh-station` | S |
| 4 | 86 button (~14px) and Edit icon (~16px) buttons below minimum touch targets | `/stock/inventory` | S |

### Strengths to Preserve

- Three-panel weigh station architecture is conceptually correct for the butcher workflow
- Per-table grouping with pax + suggested weight is outstanding contextual support
- RxDB local-first makes all interactions feel instant (Doherty threshold exceeded positively)
- Dispatched log with running kg total provides session-level accountability
- Protein-type grouping (Beef/Pork/Chicken) in inventory is excellent Miller's application
- Manager PIN bypass for kitchen role in Yield Calculator is correctly implemented
- `active:scale-95` tactile feedback on numpad is retained correctly — do not remove
- Status color coding across the inventory is consistent and immediately readable
- LocationBanner persistence across all authenticated pages grounds Benny in his branch context

---

*Report generated by: Claude Sonnet 4.6 UX Audit Agent*
*Design Bible reference: `/Users/arjomagno/Documents/GitHub/midcodes/apps/WTFPOS/skills/ux-audit/references/DESIGN_BIBLE.md`*
*Source files reviewed: `src/routes/kitchen/weigh-station/+page.svelte`, `src/lib/components/stock/InventoryTable.svelte`, `src/lib/components/stock/InventoryItemRow.svelte`, `src/lib/components/stock/InventoryActionModal.svelte`, `src/lib/components/stock/InventoryEditModal.svelte`, `src/lib/components/stock/InventoryToolbar.svelte`, `src/lib/components/BluetoothWeightInput.svelte`, `src/lib/components/kitchen/YieldCalculatorModal.svelte`*
*Live browser sessions: Login, `/kitchen/weigh-station` (idle), `/stock/inventory` (Benny session)*
*Session: Benny Flores · Kitchen · ⚖️ Butcher · Alta Citta (tag)*
