# UX Audit — Stock Deliveries (Receive Flow)
**Date:** 2026-03-09
**Role:** Kitchen (`Pedro Cruz` — Alta Citta)
**Page:** `/stock/deliveries`
**Branch:** Alta Citta (`tag`)
**Intensity:** Light (single-user)
**Viewport:** 1024×768 (tablet)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 2 of 7 issues resolved (P0: 1/3 · P1: 1/2 · P2: 0/2)

---

## A. Text Layout Map

### State 1 — Page Load (no form open)

```
+─sidebar (52px)──+──main─────────────────────────────────────────────────────+
│ [W!] brand      │  [Stock Management — h1]                                   │
│ ─────────────── │  [Inventory] [Deliveries ①] [Transfers] [Counts ①] [Waste]│
│ [🍳 Kitchen]   │  ─────────────────────────────────────────────────────────  │
│ [📦 Stock]     │  ┌──────────────────────────────────────────────────────┐  │
│                 │  │ Delivery History & Batches     [Receive Delivery ▶]  │  │
│                 │  ├──────────────────────────────────────────────────────┤  │
│                 │  │ [🔍 Search...] [All Dates ▼] [All Items ▼] [Show ☐] │  │
│                 │  ├──────────────────────────────────────────────────────┤  │
│                 │  │ Time │ Item / Supplier │ Qty │ Batch & Expiry │ FIFO │  │
│                 │  │ ─────┼─────────────────┼─────┼───────────────┼───── │  │
│                 │  │ "No deliveries found matching the filters."          │  │
│                 │  └──────────────────────────────────────────────────────┘  │
│ ─────────────── │                                                            │
│ [P] avatar      │                                                            │
│ [Logout]        │                                                            │
+─────────────────+────────────────────────────────────────────────────────────+
```

> ⚠ Note: The table shows "No deliveries found" on first load — but clicking "Receive Delivery"
> reveals there ARE existing deliveries in the history. The filter defaults show zero until
> the form is opened (which refreshes data). This creates a false empty state.

### State 2 — Receive Delivery form open (side panel)

```
+─sidebar─+──history table (≈620px)──────────────+──form panel (≈350px)────────+
│         │ [Expiring Soon ⚠] Kimchi B-243 · 2d  │ Receive Delivery / Batch [✕]│
│         │ ────────────────────────────────────   │ ─────────────────────────── │
│         │ Time │ Item/Supplier │ Qty │ Batch│FIFO│ Item *  [Pork Bone-In ▼]   │
│         │ 12:03│ Pork Bone-In  │+5kg │B-241 │████│ Current stock: 7500 g      │
│         │ 11:03│ Soju Original │+6bt │B-242 │████│ Quantity *  [_____] Unit: g │
│         │ 10:03│ Kimchi        │+10p │B-243 │░░░░│ Supplier *  [__________]   │
│         │ 06:03│ Pork Bone-In  │+8kg │TRF   │████│ Batch No    [__________]   │
│         │ 06:03│ Pork Bone-Out │+6kg │TRF   │████│ Expiry      [__________]   │
│         │ 06:03│ Beef Bone-In  │+5kg │TRF   │████│ Delivery Photos [Add 📷]   │
│         │ ...  │ ...           │     │      │    │ Notes       [__________]   │
│         │                                        │ [Cancel]  [Receive Stock ▶]│
+─────────+────────────────────────────────────────+────────────────────────────+
```

> Key observation: The "Expiring Soon (1)" warning banner for Kimchi appears only after
> the form is opened — it was absent on initial page load.

### State 3 — Form filled (active, ready to submit)

Form shows:
- Item: Pork Bone-In (g) — pre-selected, first in list
- Quantity: 5000 [entered]
- Supplier: Metro Meat Co. [entered]
- "Receive Stock" button becomes **enabled** after both required fields are filled
- Optional fields (Batch No, Expiry, Photos, Notes) still empty

### State 4 — Post-submit (completion)

- Form panel closes
- Returns to history table view
- New delivery appears at top of history (Pork Bone-In, Metro Meat Co., +5000g)
- No toast / success confirmation visible in snapshot
- Expiring Soon banner remains visible

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | CONCERN | Item dropdown has **80+ items** unsorted/ungrouped — scrolling to find the right item under time pressure is painful | Group by category (Meats, Sides, Drinks, Condiments) or add a search/filter inside the dropdown |
| 2 | **Miller's Law** | PASS | Form is logically chunked: Item → Qty/Unit → Supplier → Batch/Expiry → Photos → Notes. History table uses clear column groupings | — |
| 3 | **Fitts's Law** | CONCERN | "Receive Stock" submit button is at the bottom of a tall side panel — it may be off-screen on smaller tablets without scrolling. "Cancel" and "Receive Stock" are side by side with no size differentiation | Make "Receive Stock" primary (`btn-primary`, full-width) and visually dominant over Cancel |
| 4 | **Jakob's Law** | PASS | Side panel form pattern is standard. Delivery history table with FIFO progress bars is a familiar inventory convention | — |
| 5 | **Doherty Threshold** | PASS | Submit is instant (RxDB local-first). Table updates immediately after. No network latency | — |
| 6 | **Visibility of System Status** | FAIL | **No success feedback after submit.** Form closes, entry appears in table — but there is no toast, banner, or confirmation message. A kitchen worker during a delivery handoff has no explicit confirmation the record was saved | Add a success toast: "✓ Delivery recorded — Pork Bone-In +5000g" |
| 7 | **Gestalt: Proximity** | PASS | Form fields are well grouped with label directly above input. History rows clearly bounded | — |
| 8 | **Gestalt: Common Region** | PASS | Side panel is clearly bounded. Expiring Soon banner sits above the table in its own region | — |
| 9 | **Visual Hierarchy (scale)** | CONCERN | "Receive Delivery" button has equal visual weight to the page heading. The primary action for this page isn't prominently differentiated from page metadata | Make "Receive Delivery" more prominent (`btn-primary` sizing) |
| 10 | **Visual Hierarchy (contrast)** | PASS | FIFO progress bars use color (green = used, gray = remaining). Expiry warning uses amber/red | — |
| 11 | **WCAG: Color Contrast** | CONCERN | "Expiring Soon" banner uses what appears to be amber text on amber-light — needs verified contrast ratio. FIFO usage percentage (small gray text) may be <4.5:1 | Audit amber badge contrast; use `text-amber-800 bg-amber-100` pattern |
| 12 | **WCAG: Touch Targets** | FAIL | The item dropdown (`<select>`) is the only way to pick an item — on touch, a native select with 80+ options is extremely difficult to use. No alternative search-based picker exists | Replace native `<select>` with a searchable combobox or add a type-to-filter input |
| 13 | **Consistency (internal)** | CONCERN | "Expiring Soon" banner only appears AFTER "Receive Delivery" is clicked — not visible on initial page load. This is inconsistent: expiry warnings should surface proactively, not be hidden until the form opens | Show Expiring Soon at page load, not only when form panel is active |
| 14 | **Consistency (design system)** | PASS | Uses `btn-primary` classes, standard form inputs, `pos-card` patterns consistently | — |

**Summary:** 6 PASS · 5 CONCERN · 3 FAIL

---

## C. "Best Day Ever" Vision

It's 8am at Alta Citta — delivery truck from Metro Meat Co. pulls up. Pedro the kitchen staff gets his clipboard and walks to the back. He opens the Stock app on the tablet while the driver unloads.

In the ideal experience, he taps "Receive Delivery", searches "pork" in the item picker and immediately sees "Pork Bone-In" at the top. He taps it, sees the current stock level ("7,500g on hand") so he knows if the delivery count makes sense. He enters 5000g, the supplier auto-fills "Metro Meat Co." from previous entries, he scans or types the batch number from the supplier invoice, taps Expiry, and hits "Receive Stock."

A big green toast appears: **"✓ 5,000g Pork Bone-In received from Metro Meat Co."** He can show this to the driver as confirmation. The history table updates in front of him, the FIFO bar shifts, and he moves on to the next box.

The gap: the current item dropdown requires scrolling through 80+ unsorted items while holding a clipboard. There's no success confirmation — he has to visually check the table updated. And the "Expiring Soon" warning for Kimchi (2 days!) isn't visible until he opens the form — he might have walked away without seeing it.

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|
| **P0** | No success feedback after submitting a delivery | Add a toast notification: "✓ [Item] +[Qty] received from [Supplier]" that persists 3 seconds | S | High | 🟢 FIXED |
| **P0** | Item dropdown is a native `<select>` with 80+ unsorted options — unusable on touch | Replace with a searchable combobox (type-to-filter). Group options by category if not implementing search | M | High | 🔴 OPEN |
| **P0** | "Expiring Soon" banner hidden on initial page load — only appears when form is opened | Move the Expiring Soon warning to always render at page top, independent of form state | S | High | 🔴 OPEN |
| **P1** | "Receive Stock" button not visually dominant — same weight as "Cancel" | Style "Receive Stock" as full-width `btn-primary` at bottom of form. Make Cancel a ghost/text link | S | Med | 🔴 OPEN |
| **P1** | Supplier field is plain text with no autocomplete — repeated manual entry | Add recent suppliers as quick-tap chips below the Supplier field (last 5 used) | M | Med | 🟢 FIXED |
| **P2** | FIFO usage % text contrast may be below 4.5:1 | Verify and darken if needed; use `text-gray-700` minimum | S | Low | 🔴 OPEN |
| **P2** | "Expiring Soon" amber badge contrast unverified | Use `text-amber-800 bg-amber-100` to match confirmed-passing contrast pattern from KDS fixes | S | Low | 🔴 OPEN |
