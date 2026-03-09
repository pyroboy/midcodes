# UX Audit — Refill Flow
**Role:** Staff (Maria Santos) · **Branch:** Alta Citta (tag) · **Viewport:** 1024×768 tablet landscape
**Date:** 2026-03-08 · **Auditor:** Claude Code (ux-audit skill)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 5 of 11 issues resolved (P0: 3/3 · P1: 2/4 · P2: 0/4)

---

## A. Text Layout Map

### State 1 — Order Sidebar (AYCE order open, T1)
```
┌─ Sidebar (left 240px) ──┬─ Floor Plan (380px) ──┬─ Order Sidebar (380px) ─────────┐
│ WTF! SAMGYUP            │  [T1●] [T2] [T3] [T4] │ T1  4 pax  4m             [×]   │
│ Alta Citta (Tagbilaran) │  [T5]  [T6] [T7] [T8] │ Pork Unlimited                   │
│ 06:27 PM                │                        │                                  │
│─────────────────────────│                        │ ╔══════════════╗ ╔═══════════╗  │
│ 🛒 POS [active]         │                        │ ║    REFILL    ║ ║ Add Item  ║  │
│─────────────────────────│                        │ ╚══════════════╝ ╚═══════════╝  │
│                         │  TAKEOUT ORDERS [1]    │ ← 56px height, orange primary   │
│                         │  [#T001 Carmen PREP]   │                                  │
│                         │                        │ Pork Unlimited  REQUESTING ₱1,596│
│ M  Maria Santos         │                        │ Samgyupsal      WEIGHING   FREE  │
│    STAFF                │                        │ Pork Sliced     WEIGHING   FREE  │
│ → Logout                │                        │ Kimchi          REQUESTING FREE  │
└─────────────────────────┴────────────────────────│ Rice            REQUESTING FREE  │
                                                   │ Cheese          REQUESTING FREE  │
                                                   │ Lettuce         REQUESTING FREE  │
                                                   │ Egg             REQUESTING FREE  │
                                                   │ Cucumber        REQUESTING FREE  │
                                                   │ Chinese Cabbage REQUESTING FREE  │
                                                   │ Pork Bulgogi    REQUESTING FREE  │
                                                   │ Fish Cake       REQUESTING FREE  │
                                                   │                                  │
                                                   │ [Pork Sliced  WEIGHING  FREE] ←refill│
                                                   │ [Pork Sliced  WEIGHING  FREE] ←refill│
                                                   │                ↑ below fold      │
                                                   │ BILL                    ₱1,596   │
                                                   │ 15 items                         │
                                                   │ [Void] [    Checkout   ] [Print]  │
                                                   └──────────────────────────────────┘
```

### State 2 — RefillPanel Modal (open)
```
┌──────────────────────────────────────────────────────────────────┐
│ (backdrop black/50 blur)                                         │
│         ┌──── RefillPanel max-w-sm (384px) ────────────────┐    │
│         │ Refill                                        [✕] │    │
│         │ Pork Unlimited                        ← 32px ✕ ⚠ │    │
│         │────────────────────────────────────────────────── │    │
│         │ MEATS  ← 10px uppercase gray                      │    │
│         │ ┌──────────────┐ ┌──────────────┐                │    │
│         │ │  [img ~64px] │ │  [img ~64px] │                │    │
│         │ │  Pork Sliced │ │  Samgyupsal  │                │    │
│         │ └──────────────┘ └──────────────┘                │    │
│         │                                                   │    │
│         │ FREE SIDES  ← 10px uppercase gray                 │    │
│         │ ┌────────┐ ┌──────────────┐ ┌──────────┐        │    │
│         │ │ Cheese │ │Chinese Cabbage│ │ Cucumber │        │    │
│         │ │(no img)│ │   (no img)   │ │ (no img) │        │    │
│         │ └────────┘ └──────────────┘ └──────────┘        │    │
│         │ ┌────────┐ ┌──────────────┐ ┌──────────┐        │    │
│         │ │  Egg   │ │  Fish Cake   │ │  Kimchi  │        │    │
│         │ │(no img)│ │   (no img)   │ │ [image]  │        │    │
│         │ └────────┘ └──────────────┘ └──────────┘        │    │
│         │ ┌────────┐ ┌──────────────┐ ┌──────────┐        │    │
│         │ │Lettuce │ │ Pork Bulgogi │ │   Rice   │        │    │
│         │ │(no img)│ │   (no img)   │ │ [image]  │        │    │
│         │ └────────┘ └──────────────┘ └──────────┘        │    │
│         │ ↑ max-h-[55vh] scroll zone ─────────────────────│    │
│         │────────────────────────────────────────────────── │    │
│         │ [Repeat Last — Pork Sliced] ← dashed orange      │    │
│         │          40px height ⚠                            │    │
│         │         [       Done       ] ← 36px ⚠            │    │
│         └───────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Finding |
|---|-----------|---------|---------|
| 1 | **Hick's Law** | CONCERN | 11 items in Refill panel (2 meats + 9 sides). Meats are the primary choice — they should be separated more aggressively from free sides. Staff cognitive load increases when frequently-used (meats) and infrequently-varied (sides) choices share equal visual weight. |
| 2 | **Miller's Law** | CONCERN | 9 free sides items in a 3-col grid = 3 rows of 3. Within working memory limits, but combined with 2 meats and a footer, the panel shows 13 interactive elements simultaneously. No visual hierarchy separates "what staff taps every refill" (meats) vs "occasional add" (sides). |
| 3 | **Fitts's Law** | FAIL | ✕ close button: `h-8 w-8` (32px) with `min-height: unset` — below 44px minimum. "Done" button: `min-height: 36px` — below 44px. "Repeat Last" button: `min-height: 40px` — below 44px. 3 of 4 footer/header controls miss the touch target minimum. |
| 4 | **Jakob's Law** | PASS | Modal pattern (backdrop + centered card + header/content/footer) matches common POS modal conventions. Meat cards with image + name follows standard restaurant menu patterns (GrabFood, Foodpanda). |
| 5 | **Doherty Threshold** | FAIL | No confirmation feedback when a meat or side is tapped. The button's `active:scale-95` fires for ~100ms, then the panel visually returns to unchanged state. Staff has no way to know if the refill was queued without scrolling down in the order sidebar — which takes 2–3 seconds in a busy shift. "Repeat Last" tap is completely silent: no flash, no badge increment, no toast. |
| 6 | **Visibility of System Status** | FAIL | After tapping Pork Sliced: no confirmation inside the panel. After closing panel: the refill item appears at the bottom of a 13-item list, requiring scroll to verify. No refill round counter anywhere. No "you've ordered Pork Sliced 2× this session" indicator on the meat cards. |
| 7 | **Gestalt — Proximity** | CONCERN | "MEATS" section label is 10px at `mb-1.5` (6px) from the grid — proximity is correct. But "FREE SIDES" section sits only ~16px below the meat grid with no divider — visual separation between the two groups (which have fundamentally different ordering logic) is weak. |
| 8 | **Gestalt — Similarity** | CONCERN | Meat cards all have images (consistent). Free sides cards have inconsistent image coverage: Kimchi and Rice have images, 7 others don't. This creates two visual patterns within the same grid, breaking the "similarity = related" signal. |
| 9 | **Visual Hierarchy — Scale** | CONCERN | Section labels ("MEATS", "FREE SIDES") at `text-[10px]` are barely readable at arm's length in dim restaurant lighting. Item names at `text-[11px]` in meat cards are also very small — borderline at 50cm reading distance. |
| 10 | **Visual Hierarchy — Weight** | PASS | The Refill button in the sidebar is correctly the dominant primary CTA (full-width, 56px, orange). "Add Item" is correctly secondary (bordered, same height, accent-light bg). Within the modal, "Repeat Last" dashed button and "Done" ghost button are appropriately de-emphasized. |
| 11 | **WCAG — Contrast** | CONCERN | Item names in meat cards: `text-[11px] font-bold text-gray-900` on `bg-surface` — AAA contrast (16.8:1) but 11px is below 14px body minimum. Free sides section label `text-[10px] text-gray-400` on white = ~3.7:1 (fails AA for small text). "FREE SIDES" and "MEATS" section headers are accessibility violations. |
| 12 | **WCAG — Touch Targets** | FAIL | ✕ button: 32px (–12px under min). "Done": 36px (–8px). "Repeat Last": 40px (–4px). Free side cards without images: effectively ~40-45px tall (borderline). 3 out of 4 primary interactive controls in the footer/header are below spec. |
| 13 | **Consistency — Internal** | CONCERN | Meat cards use `border-l-[3px]` protein color (pork=orange, beef=red). Free side cards use `border-status-green/30`. This green border on free sides is the same hue as `status-green` used for "available" table status — mild semantic confusion if staff notices it. |
| 14 | **Consistency — Platform** | PASS | Modal structure, backdrop blur, grid layout, image-first cards, and the dashed "quick repeat" button all follow patterns established elsewhere in WTFPOS (AddItemModal, CheckoutModal). No surprises. |

**Verdict summary:** 4 FAIL · 6 CONCERN · 4 PASS

---

## C. Best Day Ever — Staff Empathy Narrative

> It's Saturday night at Alta Citta. The restaurant is at 90% capacity — T1 through T6 all occupied. Maria is the sole cashier on the floor tonight. T4 just called her over: "Ate, pork sliced refill please!" She's in the middle of adding drinks to T3's order on the POS.
>
> She taps T1 in the floor plan, the sidebar slides in, and she immediately sees the big orange **Refill** button — that's the right move, easy to find.
>
> The RefillPanel pops up. She sees "Pork Sliced" and taps it. The button bounces briefly (scale-95). She waits half a second... nothing changes. She taps it again just to be sure. The modal looks the same. She can't tell if it went through. She closes the panel with "Done" and scrolls all the way down in the 15-item order list to find two identical "Pork Sliced WEIGHING" entries — she double-ordered.
>
> At round 3, T2 wants the same thing they had last time. Maria taps Refill, hits "Repeat Last — Pork Sliced." Same silence. Same uncertainty. She closes, scrolls, confirms. 4 seconds lost per refill. On a busy Saturday with 6 AYCE tables, she'll do ~20 refill interactions per shift. That's 80 seconds of scroll-checking, in a restaurant where every second of eye contact with customers matters.

---

## D. Recommendations

### P0 — Critical (fix before next shift)

| ID | Issue | Fix | Effort | Impact | Status |
|----|-------|-----|--------|--------|--------|
| P0-1 | **Zero feedback on meat tap** — No visual state change after tapping a refill item. Staff doesn't know if it registered. | Add a transient "added" state on the button: brief green flash + a `+1` badge that fades in for 800ms. Or: show a persistent count badge (like `×2`) on repeated taps instead of adding duplicate line items silently. | S | High | 🟢 FIXED |
| P0-2 | **"Repeat Last" gives no confirmation** — Tapping the dashed button is silent. | Brief background flash (accent-light → white over 400ms) on the "Repeat Last" button. Show a transient toast or inline confirmation: "Repeat sent ✓" that fades in 1.5s. | S | High | 🟢 FIXED |
| P0-3 | **✕ close button at 32px** — Explicitly below 44px minimum with `min-height: unset`. On a busy shift, staff will miss this target and accidentally tap behind it. | Remove `style="min-height: unset"` and change `h-8 w-8` to `h-11 w-11` (44px) to meet minimum. | XS | High | 🟢 FIXED |

### P1 — Important (fix this week)

| ID | Issue | Fix | Effort | Impact | Status |
|----|-------|-----|--------|--------|--------|
| P1-1 | **"Done" at 36px and "Repeat Last" at 40px** — Both footer buttons miss touch target minimums. | Change "Done" to `min-height: 44px`. Change "Repeat Last" to `min-height: 44px`. | XS | Med | 🟢 FIXED |
| P1-2 | **Refill items buried at bottom of long order list** — After 12 initial items, refill items appear at positions 13+, requiring scroll to verify. | Two options: (a) Sort refill items to appear just below the package line at top of list; or (b) Add a "🔄 2 refills this session" summary badge near the top of the sidebar, below the package name. | M | High | 🔴 OPEN |
| P1-3 | **No round counter / refill history in panel** — Staff has no quick way to know "we've done 2 rounds of Pork Sliced" without scrolling the order list. | Add a small round indicator below the package name in the modal header: e.g., "Round 2" or "Refills: Pork Sliced ×2". Derive from order items with REFILL_NOTE. | M | Med | 🟢 FIXED |
| P1-4 | **Inconsistent image coverage in Free Sides** — 7 of 9 sides lack images, creating uneven card heights (~40px no-img vs ~85px with-img). | Either add placeholder images for all sides, or remove images from the sides grid entirely and use a compact list style (text-only chip buttons at 44px height, 2-col layout for side items). | M | Med | 🔴 OPEN |

### P2 — Polish (backlog)

| ID | Issue | Fix | Effort | Impact | Status |
|----|-------|-----|--------|--------|--------|
| P2-1 | **Section labels at 10px** — "MEATS" and "FREE SIDES" labels (`text-[10px]`) fail WCAG AA at small text sizes. | Increase to `text-xs` (12px) minimum. | XS | Low | 🔴 OPEN |
| P2-2 | **Meats section needs stronger visual separation from Sides** — The two sections have fundamentally different ordering logic (meats = kitchen queue, sides = add to bill), but are separated only by a 16px gap and a weak 10px label. | Add a horizontal divider `<hr>` between Meats and Free Sides sections, or use a card background (`bg-surface-secondary rounded-lg p-3`) to visually contain each section. | S | Med | 🔴 OPEN |
| P2-3 | **Meat card item names at 11px** — `text-[11px]` is below 12px minimum for restaurant reading distance. | Change to `text-xs` (12px) for meat card labels. | XS | Low | 🔴 OPEN |
| P2-4 | **Free sides section green border conflicts with "available" table status color** — `border-status-green/30` on side buttons uses the same hue as available table cards. | Use a neutral `border-gray-200` or `border-accent/20` for free side cards to decouple from status semantics. | XS | Low | 🔴 OPEN |

---

## Overall Verdict

The refill flow has **correct structural instincts** — the Refill button placement (primary orange, full-width, 56px) is the right call, the "Repeat Last Round" shortcut is a genuinely useful power feature for AYCE staff, and the modal structure follows established WTFPOS patterns.

**The critical gap is feedback.** Every action in the RefillPanel is silent: tap a meat → nothing changes. Tap "Repeat Last" → nothing changes. In a noisy, busy samgyupsal shift, silent taps = uncertainty = double-orders and re-taps. The fix is small (a transient animation + brief state change per tap) but the impact on staff confidence is high.

The secondary gap is **confirmation after close** — refill items appearing 13+ items down in the order list forces a scroll-to-verify ritual that breaks flow.

Fix P0-1 and P0-2 (tap feedback) plus P1-2 (refill visibility) and this flow becomes genuinely fast.
