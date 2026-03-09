# UX Audit — POS Order Flow (Staff @ Alta Citta)

**Date:** 2026-03-08
**Page/Flow:** `/pos` — full service cycle: table open → pax → package → refills × 6 → checkout → receipt
**Role:** Staff (Maria Santos)
**Branch:** Alta Citta (Tagbilaran)
**Viewport:** 1024 × 768 (tablet)
**Auditor:** Claude (automated via playwright-cli)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 4 of 12 issues resolved (P0: 2/3 · P1: 2/5 · P2: 0/4)

---

## A. Text Layout Map

```
┌──────────────────────────────────────────────────────────────────┐
│ [W!] ← sidebar rail (collapsed)                                 │
│  🛒                                                              │
│                                                                  │
│  ┌─ TOP BAR ─────────────────────────────────────────────┐       │
│  │ ☰ POS  [1 occ] [7 free]  (i)  [📦 New Takeout] [🧾 History 72] │
│  └───────────────────────────────────────────────────────┘       │
│                                                                  │
│  ┌─ FLOOR PLAN (SVG) ─────────────┐  ┌─ ORDER SIDEBAR ────────┐ │
│  │                                 │  │ T1  4 pax ✎  5m    ✕   │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐       │  │ Beef + Pork Unlimited  │ │
│  │  │ P&B │ │ T2  │ │ T3  │       │  │ 🔄 6 refills            │ │
│  │  │05:24│ │ 4p  │ │ 4p  │       │  │ [▓▓ Refill ▓▓] [Add]  │ │
│  │  │ T1  │ │     │ │     │       │  │                        │ │
│  │  │4 pax│ │     │ │     │       │  │ B+P Unlim REQUESTING   │ │
│  │  │₱1996│ │     │ │     │       │  │         ₱1,996.00 PKG  │ │
│  │  │ [22]│ │     │ │     │       │  │ ┌ MEATS ─────────────┐ │ │
│  │  └─────┘ └─────┘ └─────┘       │  │ │ Samgyupsal  WEIGHING│ │ │
│  │                                 │  │ │             WEIGHING│ │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐       │  │ │             WEIGHING│ │ │
│  │  │ T5  │ │ T6  │ │ T7  │       │  │ │             WEIGHING│ │ │
│  │  │ 4p  │ │ 4p  │ │ 2p  │       │  │ │ Pork Sliced WEIGHING│ │ │
│  │  └─────┘ └─────┘ └─────┘       │  │ │ Prem Beef   WEIGHING│ │ │
│  │                                 │  │ │             WEIGHING│ │ │
│  └─────────────────────────────────┘  │ │             WEIGHING│ │ │
│                                       │ │             WEIGHING│ │ │
│                                       │ │ Sliced Beef WEIGHING│ │ │
│                                       │ │ Sides               │ │ │
│                                       │ │ 11 requesting ▼show │ │ │
│                                       │ └─────────────────────┘ │ │
│                                       │ BILL  22 items ₱1,996  │ │
│                                       │ [Void] [Checkout] [Print]│ │
│                                       │ [More Options]          │ │
│                                       │ Transfer | Pax | ChgPkg │ │
│                                       │ Split Bill | Merge      │ │
│                                       └─────────────────────────┘ │
│  M ← user avatar                                                │
│  → ← logout                                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment (14 Principles)

| # | Principle | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | **Hick's Law** (choice overload) | CONCERN | Package selection has only 3 options (good), but refill panel shows all 4 meats + 9 sides simultaneously. After package select, 14 pending items appear at once. |
| 2 | **Miller's Law** (7±2 chunks) | FAIL | Receipt shows 22 flat line items. Table card shows 6 data points (P&B, timer, name, pax, total, "22"). Sidebar meats section stacks 4× WEIGHING badges vertically per item. |
| 3 | **Fitts's Law** (target size) | PASS | All buttons meet 44px minimum. Refill meat cards are large image buttons. Denomination buttons in checkout are generously sized. |
| 4 | **Jakob's Law** (expectations) | CONCERN | "22" on table card is unlabeled — violates expectation that numbers have context. "P&B" abbreviation may confuse new staff. "FREE" label on receipt is unusual for AYCE (customers expect included items to just not appear on bill). |
| 5 | **Doherty Threshold** (<400ms) | PASS | RxDB local-first writes are instant. Refill sends are immediate. No perceivable lag in any interaction tested. |
| 6 | **Visibility of System Status** | CONCERN | "🔄 6 refills" header badge is good. But stacked WEIGHING badges don't show *which* refill round each came from. Timer on floor (05:24 mm:ss) vs sidebar (5m) is inconsistent. "REQUESTING" status on package is clear. |
| 7 | **Gestalt — Proximity** | CONCERN | Refill meat badges stack vertically without separation — 4× "WEIGHING" looks like a rendering bug rather than intentional grouping. Sides collapse well ("11 requesting ▼ show"). |
| 8 | **Gestalt — Similarity** | FAIL | Every FREE item has identical green "FREE" badge — no visual distinction between initial package items, included sides, and refill items. On receipt, all 21 FREE items look identical. |
| 9 | **Visual Hierarchy** | CONCERN | Package line (₱1,996.00 PKG) stands out well. But the 13 initial FREE items and 8 refill FREE items have equal visual weight. The "22" on table card has no label or visual hierarchy — it's just a bare number in the corner. |
| 10 | **Information Density** | FAIL | Table card packs 6 data points into a small square. Receipt is a wall of 22+ line items where only 1 line (the package) carries billing meaning. "Subtotal (22 items)" inflates perception of order complexity. |
| 11 | **WCAG — Color Contrast** | PASS | Green FREE badges on white background meet AA. Orange WEIGHING badges are legible. Status colors (green/orange/red) are distinct. |
| 12 | **WCAG — Touch/Motor** | PASS | All touch targets ≥44px. Refill "Repeat Last" button is well-sized and labeled. Checkout denomination buttons are generously spaced. |
| 13 | **Internal Consistency** | CONCERN | Timer shows "05:24" (mm:ss) on floor but "5m" (rounded) in sidebar. Item count shows "22" on table card but "22 items" in bill section. "4 pax" on occupied table but "4p" on empty tables — inconsistent abbreviation. |
| 14 | **External Consistency** | CONCERN | Most POS systems for AYCE restaurants don't itemize FREE included items on customer receipts. Stacked status badges per refill is non-standard — most systems show "× 4" quantity instead. |

**Verdict Summary:** 2 FAIL, 7 CONCERN, 5 PASS

---

## C. Best Day Ever — Maria's Thursday Lunch Rush

> Maria arrives at 10:45 AM and logs in with one tap. The floor plan loads instantly — all 8 tables green. Easy. A family of 4 walks in, she taps T1, sees "How many guests?" with the big number grid. She taps 4.
>
> The Add to Order modal opens with package cards — nice photos, prices per pax, clear. She taps "Beef + Pork Unlimited" and... suddenly 14 items appear in the Pending Items panel. The PKG line makes sense, but why are Kimchi, Rice, Cheese, Lettuce, Egg, Cucumber, Chinese Cabbage, Pork Bulgogi, and Fish Cake all listed individually? She knows they're included. The customer didn't order them. She hits CHARGE (14) anyway because the total is right.
>
> Twenty minutes in, the table asks for more meat. She taps Refill — nice panel, big meat photos. She taps Premium USDA Beef and Samgyupsal. Done. Easy. They ask again 10 minutes later. "Repeat Last" — one tap, instant. She loves this.
>
> But when she glances at T1 on the floor, she sees: P&B, 05:24, T1, 4 pax, ₱1,996.00, and a tiny "22" in the corner. She knows what it all means because she set it up. But when her trainee asks "what's the 22?", she hesitates. Is it items? Servings? Refills? It's the total item count including every FREE side and refill. Not useful.
>
> The sidebar shows the order, but Samgyupsal has FOUR stacked "WEIGHING" badges. It looks broken. She can't tell "this is the original plus 3 refills" — it's just a tower of identical green pills.
>
> At checkout, ₱1,996. The family pays ₱2,000 cash. She confirms. The receipt prints: 22 line items. Samgyupsal appears FOUR times with "FREE". Premium USDA Beef appears FOUR times with "FREE". Kimchi, Rice, Cheese, Lettuce, Egg, Cucumber, Chinese Cabbage, Pork Bulgogi, Fish Cake — all FREE. The customer squints: "Why does it say FREE everywhere? We ordered the unlimited package." Maria smiles politely but thinks: "good question."
>
> The worst moment? Earlier, when she accidentally set up T3 with 2 pax but the customers changed their mind and left. The table was occupied with 0 items, ₱0.00 balance. She couldn't void (disabled), couldn't checkout (disabled), couldn't find "Cancel Table" anywhere. Transfer? Merge? Those move the problem. She had to ask the manager.

---

## D. Bugs Found (Functional)

| # | Bug | Severity | Location | Status |
|---|-----|----------|----------|--------|
| B1 | **Receipt shows wrong Tendered amount** — entered ₱2,000 but receipt shows "Tendered ₱1,996.00", Change ₱0.00 | **P0-Critical** | `ReceiptModal.svelte` line ~75: recalculates `order.total + change` instead of using actual cashTendered | 🔴 OPEN |
| B2 | **"Invalid Date" on receipt** — `closedAt` is null/undefined when receipt renders | **P0-Critical** | `ReceiptModal.svelte` line ~88: `new Date(order.closedAt ?? '')` → empty string creates Invalid Date | 🟢 FIXED |
| B3 | **No way to cancel a 0-balance table** — table opened with pax but no items cannot be closed by staff | **P0-Critical** | `OrderSidebar.svelte`: no "Cancel Table" or "Close Table" action. Void/Checkout/Print all disabled with 0 items. More Options only shows Transfer/Pax/Merge. | 🟢 FIXED |

---

## E. Recommendations

### P0 — Must Fix (Blocks daily operations)

| # | Issue | Fix | Effort | Impact | Status |
|---|-------|-----|--------|--------|--------|
| P0-1 | **Receipt Tendered/Change bug** | Pass `cashTendered` prop to ReceiptModal instead of recalculating | S | High | 🔴 OPEN |
| P0-2 | **"Invalid Date" on receipt** | Set `closedAt` at checkout confirm time before rendering receipt, or guard with `closedAt ? ... : 'Just now'` | S | High | 🟢 FIXED |
| P0-3 | **Cannot cancel 0-balance table** | Add "Cancel Table" button to OrderSidebar when `items.length === 0` (or to More Options). Should reset table to available without requiring manager PIN for 0-balance. | S | High | 🟢 FIXED |

### P1 — Should Fix (Degrades daily experience)

| # | Issue | Fix | Effort | Impact | Status |
|---|-------|-----|--------|--------|--------|
| P1-1 | **Receipt itemizes all FREE items** | Hide package-included items from receipt. Show only: "4× Beef + Pork Unlimited ₱1,996.00" and any paid add-ons. Optionally show "6 refills served" as a summary line. | M | High | 🟢 FIXED |
| P1-2 | **Stacked WEIGHING badges per refill** | Aggregate duplicate items: show "Samgyupsal × 4" with single WEIGHING badge instead of 4 stacked badges | M | High | 🟢 FIXED |
| P1-3 | **"22" unlabeled number on table card** | Either remove it (low value for AYCE), or replace with refill count badge (e.g., "🔄 6") which is actually actionable info | S | Med | 🔴 OPEN |
| P1-4 | **"Subtotal (22 items)" inflated count** | Count only paid items in checkout subtotal. For AYCE: "Subtotal (4 pax)" instead of "Subtotal (22 items)" | S | Med | 🔴 OPEN |
| P1-5 | **Pending items panel overwhelm** | After package select, collapse included items under package: "Beef + Pork Unlimited (includes 4 meats, 9 sides)" with expand toggle. Only show the PKG line in pending by default. | M | Med | 🔴 OPEN |

### P2 — Nice to Have (Polish)

| # | Issue | Fix | Effort | Impact | Status |
|---|-------|-----|--------|--------|--------|
| P2-1 | **Timer format inconsistency** | Unify: floor shows "05:24" (mm:ss), sidebar shows "5m". Pick one format for both — recommend "5m" for quick glance | S | Low | 🔴 OPEN |
| P2-2 | **"P&B" abbreviation unclear** | Use full "Beef+Pork" or a color-coded package icon instead of text abbreviation | S | Low | 🔴 OPEN |
| P2-3 | **"4p" vs "4 pax" inconsistency** | Empty tables show "4p" (capacity), occupied show "4 pax" (actual guests). Consider "cap: 4" for empty tables to distinguish from guest count | S | Low | 🔴 OPEN |
| P2-4 | **Pax modal highlights even numbers** | Numbers 2, 4, 6 have orange borders suggesting "recommended" — but this is actually the capacity of the table, not a recommendation. Confusing visual signal. | S | Low | 🔴 OPEN |

---

## F. What Works Well

- **Refill flow** is fast and intuitive — "Repeat Last" button is excellent for the 3rd, 4th, 5th refill
- **"🔄 6 refills" badge** in sidebar header gives at-a-glance refill count
- **Sides collapse** in sidebar ("11 requesting ▼ show") reduces visual noise
- **Package cards** with photos and clear pricing make selection easy
- **Denomination buttons** in checkout (₱20 → ₱2,000) eliminate mental math
- **Leftover Penalty** flow is clean and skippable
- **Instant writes** — no loading spinners anywhere, everything feels local-speed
- **More Options** drawer keeps secondary actions accessible but hidden by default

---

## G. Summary

**Overall verdict: FUNCTIONAL BUT NEEDS P0 FIXES**

3 critical bugs (receipt tendered/change, Invalid Date, 0-balance table cancel) block basic operations. The receipt redundancy (21 FREE items) and stacked WEIGHING badges are the biggest daily-use friction points. The core interactions (table open → package → refill → checkout) work well and feel fast, but the information architecture needs pruning — the system tracks everything internally but doesn't need to surface it all to the user or customer.
