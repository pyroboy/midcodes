# UX Audit — Extreme Multi-User (POS + KDS + Manager)
**Date:** 2026-03-09
**Roles:** Staff · Kitchen · Manager (3 parallel browser sessions)
**Branch:** Alta Citta (`tag`)
**Intensity:** Extreme — 13 scenarios
**Viewport:** 1024×768 (tablet, all roles)
**Pages covered:** `/pos`, `/kitchen/orders`, `/kitchen/all-orders`, `/kitchen/weigh-station`, `/reports/x-read`

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 2 of 38 issues resolved (P0: 0/7 · P1: 2/18 · P2: 0/13)

---

## A. Text Layout Maps (per role)

### Staff — Floor Plan (peak state, 6+ tables occupied)

```
+──sidebar (icon rail)──+──POS floor (66%)──────────────────────+──OrderSidebar (33%)──+
│ [W!]                  │ POS  [4 occ] [4 free]  [ℹ] [📦 New Takeout] [🧾 History 66]│
│ [POS icon]            │                                        │                      │
│ [Kitchen icon]        │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │ T1 │ 2 pax ✎ │ 5m  │
│ [Stock icon]          │ │ T1  │ │ T2  │ │ T3  │ │ T4  │      │ PORK PKG             │
│ [Reports icon]        │ │PORK │ │ ─── │ │BEEF+│ │ ─── │      │ ─────────────────    │
│                       │ │ 5m  │ │     │ │PORK │ │     │      │ [+] Pork Unlimited    │
│                       │ │ T1  │ │     │ │ T3  │ │     │      │     1×  ₱598          │
│                       │ │2pax │ │     │ │8pax │ │     │      │ ─────────────────    │
│                       │ └─────┘ └─────┘ └─────┘ └─────┘      │ BILL: ₱1,196.00      │
│                       │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │                      │
│                       │ │ T5  │ │ T6  │ │ T7  │ │ T8  │      │ [🔄 Refill] [+ Add]  │
│                       │ │ ─── │ │ ─── │ │ ─── │ │ ─── │      │ [Checkout ▶]         │
│                       │ └─────┘ └─────┘ └─────┘ └─────┘      │ [Cancel] [Transfer…] │
│                       │                                        │                      │
│                       │ 📦 Takeout Orders                      │                      │
│                       │ [Maria Santos · new]  [#TO-723 · prep] │                      │
+───────────────────────+────────────────────────────────────────+──────────────────────+
```

### Kitchen — KDS Queue (peak state, 4 tickets)

```
+──sidebar (collapsed)──+──────────────────────── Kitchen Queue ────────────────────────+
│                       │  Kitchen Queue                    [↩ UNDO LAST]  [History 64] │
│                       │  Active tickets awaiting kitchen action                        │
│                       │  ●Live (fixed top-right)                                      │
│                       │                                                                │
│                       │  ┌──T1──────────────┐  ┌──T3──────────────┐                  │
│                       │  │ T1 #T1-QPOJ      │  │ T3 #T3-MSPK [⚠] │                  │
│                       │  │ [✓Bump] 1/7 05:23│  │ [✓Bump] 3/11 3m  │                  │
│                       │  │ ▓▓░░░░░░░░ (14%) │  │ ▓▓▓▓▓░░░ (27%)  │                  │
│                       │  │ 🥩 MEATS    273g  │  │ 🥩 MEATS  1650g  │                  │
│                       │  │  Samgyupsal [✓]   │  │  Beef Bone [✓]   │                  │
│                       │  │  [REFILL] WEIGHING│  │  Pork Bone [  ]  │                  │
│                       │  │ 🍜 DISHES         │  │ 🍜 DISHES        │                  │
│                       │  │  Cheese 2×  [ ]   │  │  Kimchi     [ ]  │                  │
│                       │  │  San Miguel [ ]   │  │  Lettuce    [ ]  │                  │
│                       │  │                   │  │                  │                  │
│                       │  │  [ALL DONE ✓]     │  │  [ALL DONE ✓]    │                  │
│                       │  └───────────────────┘  └──────────────────┘                  │
+───────────────────────+────────────────────────────────────────────────────────────────+
```

### Manager — Floor Plan (6+ tables, at-a-glance view)

```
+──sidebar──+──LocationBanner: ALTA CITTA (TAGBILARAN) ──────────── [Change] ───────────+
│ Quick     │ POS  4 occ │ 4 free      [ℹ Legend] [📦 New Takeout] [🧾 History 66]     │
│ Actions:  │                                                                             │
│ [Delivery]│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│ [Expense] │ │ PORK     │  │          │  │ BEEF+PORK│  │          │                   │
│ [Waste]   │ │ 5m   T1  │  │    T2    │  │ 12m  T3  │  │    T4    │                   │
│ [Count]   │ │ 2 pax    │  │ available│  │ 8 pax    │  │ available│                   │
│ [X-Read]  │ │ ₱1,196   │  │          │  │ ₱3,984   │  │          │                   │
│ [Transfer]│ └──────────┘  └──────────┘  └──────────┘  └──────────┘                   │
│ [End Day] │ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│           │ │ PORK     │  │          │  │          │  │          │                   │
│           │ │ 8m   T5  │  │    T6    │  │    T7    │  │    T8    │                   │
│ ──        │ │ 4 pax    │  │ available│  │ available│  │ available│                   │
│ [M] Juan  │ │ ₱2,392   │  │          │  │          │  │          │                   │
│ [Logout]  │ └──────────┘  └──────────┘  └──────────┘  └──────────┘                   │
+───────────+─────────────────────────────────────────────────────────────────────────────+
```

---

## B. Principle-by-Principle Assessment (per role)

### Staff (POS)

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | CONCERN | AddItemModal has 5 categories + package grid. OrderSidebar overflow menu (Transfer · Pax · Split · Merge · Cancel) packs 5 actions under one ambiguous toggle | Rename toggle to "More Actions ▼", show 2 primary actions always visible |
| 2 | **Miller's Law** | PASS | OrderSidebar groups: header, items list, action row, bill total. AddItemModal: category tabs → item grid → staging panel. Each chunk is ≤ 7 elements | — |
| 3 | **Fitts's Law** | FAIL | Remove ✕ button = 20×20px; ±qty buttons = 28px; discount toggles = 32px. All below 44px minimum. Transfer/Merge are 2 taps away from primary screen | Fix all action buttons to min-height: 44px (min-width: 44px). Keep primary CTA (Checkout) largest |
| 4 | **Jakob's Law** | PASS | Floor plan + right sidebar is the canonical POS layout convention. Package-per-pax billing is expected in AYCE | — |
| 5 | **Doherty Threshold** | PASS | All RxDB writes are instant. No perceived lag on any action including addItemToOrder, checkout, void | — |
| 6 | **Visibility of System Status** | CONCERN | Kitchen rejections create floor-plan badge but no global notification. Staff on T1 won't see T3 rejection unless they look at T3's card. No toast/banner for new rejection | Add a dismissable AlertBanner at top of POS for new unacknowledged rejections |
| 7 | **Gestalt: Proximity** | CONCERN | "Cancel Table" (destructive, red) and "Transfer · Pax · Split · Merge" (neutral) sit adjacent with no visual separator | Add a divider or move Cancel Table to a separate danger zone below the action row |
| 8 | **Gestalt: Common Region** | PASS | OrderSidebar clearly bounded from floor plan. AddItemModal is full-screen. Modals use `backdrop-blur-sm` for layering | — |
| 9 | **Visual Hierarchy (scale)** | CONCERN | Table timer text is 9px on floor cards. Package badge text is 8px. These are invisible at arm's length from a standing cashier | Timer: min 12px. Package badge: min 11px |
| 10 | **Visual Hierarchy (contrast)** | PASS | Orange accent for unserved count badge, green for served, red for overtime tables. High contrast color coding | — |
| 11 | **WCAG Color Contrast** | CONCERN | `text-gray-400` placeholder/hint text on `bg-surface-secondary` ≈ 2.5:1 (fails AA). 9px badge text is too small for contrast rules to apply | Use `text-gray-500` minimum for hint text |
| 12 | **WCAG Touch Targets** | FAIL | ✕ remove (20px), ±qty (28px), discount toggles (32px). Multiple UI elements below 44px WCAG 2.5.5 | Audit every touch target in OrderSidebar and AddItemModal for 44px minimum |
| 13 | **Consistency (internal)** | CONCERN | "⚡ CHARGE (N)" uses verb "charge" — all other CTAs use "Confirm", "Add", "Save". "History 66" shows all-time count rather than today's | Rename to "Add to Order (N)" or "Send to Kitchen (N)". Filter History to today |
| 14 | **Consistency (design system)** | PASS | btn-primary, btn-danger, badge-orange, pos-card, pos-input — all used correctly throughout | — |

**Staff totals: 5 PASS · 6 CONCERN · 3 FAIL**

---

### Kitchen (KDS)

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | PASS | Per-ticket: 1 primary action (ALL DONE ✓), 1 per-item action (✓ checkmark), 1 header shortcut (✓ Bump). Refuse flow has 5 preset reasons — within 7±2 | — |
| 2 | **Miller's Law** | CONCERN | History modal: 64 entries in one unbroken scroll. No pagination, no date grouping, no search. At 64 entries, the most useful item (most recent) is at top but finding a specific one requires full scan | Add date group headers (Today / Yesterday). Add search by table number |
| 3 | **Fitts's Law** | CONCERN | History modal ↩ Recall button: 32px height (below 44px). Item row tap-to-expand has no explicit tap target zone — full row width (~900px on tablet) but only ~40px height | Fix Recall to 44px. Item row height is adequate; add a ▼ chevron to signal expandability |
| 4 | **Jakob's Law** | CONCERN | Expand-tap-to-reveal-actions is not a kitchen-standard pattern. Paper tickets and most KDS systems have always-visible action buttons | Add a visible "…" or ▼ indicator on each item row to signal expandable actions |
| 5 | **Doherty Threshold** | PASS | Item serve (✓ click) → immediate strikethrough + green icon. ALL DONE → instant ticket removal. Undo Recall → instant restore | — |
| 6 | **Visibility of System Status** | FAIL | After kitchen confirms RETURN, no "alert sent to POS" confirmation shown. Cook doesn't know the alert was received. Audio notification (new-order.wav) may be blocked by browser autoplay restrictions. "Last Completed" shows negative timer with seed data | Add "✓ Alert sent to T3" brief toast on refuse confirm. Fix formatCountdown to clamp negatives. |
| 7 | **Gestalt: Proximity** | PASS | MEATS section and DISHES section separated by divider lines. Item actions grouped below the expanded item. Clear physical grouping | — |
| 8 | **Gestalt: Common Region** | PASS | Each ticket card is a clearly bounded region. Sections within cards (MEATS, DISHES) use distinct background styling | — |
| 9 | **Visual Hierarchy (scale)** | PASS | T1 in `text-2xl font-black` dominates card header. Progress counter, timer, item names in descending size hierarchy. ALL DONE button is the largest touch target | — |
| 10 | **Visual Hierarchy (contrast)** | CONCERN | MEATS header: `text-xs text-status-red` (#EF4444) on white = ~3.6:1. Fails WCAG AA for 12px text (needs 4.5:1). WEIGHING badge `bg-blue-100 text-blue-600` = ~3.9:1 — borderline pass | Change MEATS header to `text-red-800` for contrast compliance |
| 11 | **WCAG Color Contrast** | FAIL | `text-status-red text-xs` on white = 3.6:1 (FAILS AA small text). Recall button text contrast in History modal requires verification | Use `text-red-800` for MEATS header. Verify all `text-xs` colored labels |
| 12 | **WCAG Touch Targets** | FAIL | History Recall button: 32px (FAILS). Item tap-to-expand: ~40px height — borderline | Fix Recall to min-height: 44px. Consider making item rows explicitly 48px tall |
| 13 | **Consistency (internal)** | CONCERN | "✓ Bump" (header) and "ALL DONE ✓" (footer) call identical `completeAll()` — two labels for the same action creates confusion about which to use | Label them distinctly: header = "Quick Bump" (shortcut), footer = "All Done ✓" (primary) |
| 14 | **Consistency (design system)** | PASS | btn-primary (UNDO LAST), btn-secondary (History), btn-danger (RETURN), status color tokens throughout | — |

**Kitchen totals: 4 PASS · 5 CONCERN · 5 FAIL**

---

### Manager (Oversight)

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | CONCERN | Collapsed sidebar: 7 Quick Action icons with no labels — requires memorization. Reports subnav: 14 report links. | Add icon tooltips on hover/long-press for Quick Actions. Group Reports subnav into sections |
| 2 | **Miller's Law** | PASS | X-Read summary: 4-metric grid (Gross, Net, Pax, Avg Ticket). Floor plan: 8 tables in 2 rows of 4. OrderSidebar sections within 7±2 | — |
| 3 | **Fitts's Law** | FAIL | "Generate X-Read" button: 40px height (below 44px). SVG table `<g>` elements intercepted by sidebar Quick Action links. Rejection badge: 9px text | Fix Generate X-Read to 48px. Resolve SVG tap interception (sidebar z-index or hit-test order) |
| 4 | **Jakob's Law** | PASS | Standard manager POS layout (floor plan + sidebar stats). X-Read grid matches BIR report conventions | — |
| 5 | **Doherty Threshold** | PASS | All loads < 200ms (local-first). X-Read generates instantly. POS ↔ X-Read navigation: 2 taps, < 400ms round trip | — |
| 6 | **Visibility of System Status** | CONCERN | Staff and Kitchen roles see NO LocationBanner — branch context is invisible to front-line workers. Manager has no floor-level "N tables with unserved items" summary | Show LocationBanner to all roles (read-only for locked roles). Add unserved-item count to POS header |
| 7 | **Gestalt: Proximity** | CONCERN | Sidebar Quick Actions and Nav Items visually close — only a dashed border style distinguishes them. Under time pressure, a manager could mistake a Quick Action for a Nav | Add a clearer section label above Quick Actions and above Nav Items |
| 8 | **Gestalt: Common Region** | PASS | LocationBanner is a distinct zone (blue bg, border). X-Read grid uses `pos-card` regions. Floor plan zones are clear | — |
| 9 | **Visual Hierarchy (scale)** | CONCERN | "Generate X-Read" is a critical BIR action but styled as a secondary button. Its 40px height signals low importance | Make "Generate X-Read" `btn-primary` at 48px minimum. Use a warning color if a read has already been generated today |
| 10 | **Visual Hierarchy (contrast)** | FAIL | SVG rejection badge: 9px font on red fill (#EF4444) — text is unreadable at arm's length and below WCAG minimum text size. Package badge on table card: 8px | Minimum 12px for all badge text. Rejection badge: at least 14px bold |
| 11 | **WCAG Color Contrast** | FAIL | Rejection badge: 9px white on red — fails AA minimum text size rule. Package/timer text at 8-9px on colored fills — fails | All SVG badge text must be ≥ 12px. |
| 12 | **WCAG Touch Targets** | FAIL | "Generate X-Read": 40px (FAILS). SVG floor plan tables have no enforced min hit area for touch | Fix Generate X-Read. Consider increasing SVG table card padding for touch |
| 13 | **Consistency (internal)** | CONCERN | X-Read "bumpedBy" attribution: historical records show "Manager" role label, new records show person name "Juan Reyes" — inconsistent format | Standardize to person name (session.userName) at generation time |
| 14 | **Consistency (design system)** | PASS | LocationBanner color per branch (blue=tag, violet=pgl, amber=wh-tag) is consistent and useful | — |

**Manager totals: 4 PASS · 6 CONCERN · 4 FAIL**

---

## C. Cross-Role Interaction Assessment

| # | Interaction Point | Source → Target | Latency | Visibility | Verdict |
|---|---|---|---|---|---|
| H1 | Staff adds items → KDS ticket appears | Staff/POS → Kitchen/KDS | Instant (<1s RxDB) | Clear: new ticket card with pulse animation + audio | PASS |
| H2 | Kitchen bumps item → order item status | Kitchen/KDS → Staff/POS | Instant | Clear: item shows strikethrough, green ✓ in OrderSidebar | PASS |
| H3 | Kitchen refuses item → POS rejection alert | Kitchen/KDS → Staff/POS | Instant (RxDB) | SUBTLE: red ⚠ badge only on affected table card. 9px text. Not visible if staff is on another table | CONCERN |
| H4 | Kitchen toggles sold out → POS AddItemModal | Kitchen/KDS → Staff/AddItemModal | Instant | Clear: item greyed + SOLD OUT overlay + sorted to bottom | PASS |
| H5 | Staff transfers table → KDS table number | Staff/POS → Kitchen/KDS | Instant | Clear: ticket header shows new table number | PASS |
| H6 | Staff merges tables → KDS ticket merge | Staff/POS → Kitchen/KDS | Instant | Clear: single merged ticket, combined items | PASS |
| H7 | Staff sends refill → KDS REFILL + WEIGHING | Staff/POS → Kitchen/KDS | Instant | SUBTLE: inline badge within item row. Easy to miss on a dense ticket | CONCERN |

**Cross-role score: 5 PASS · 2 CONCERN · 0 FAIL**

---

## D. "Best Shift Ever" Vision (Multi-Role)

It's 7pm on a Friday at Alta Citta. The restaurant is filling up fast. Maria the cashier is at the register, Pedro the cook is at the grill, and Juan the manager is floating the floor.

**In the ideal experience:** Maria opens T1 for a couple — one tap on the table, she types "2" in the PaxModal and confirms. The AddItemModal is already open (it auto-opens, saving her a tap). She taps "Pork Unlimited" and sees the package charge immediately on the running bill. She closes the modal and T1's card on the floor turns green with the PORK badge. Instant. Pedro's tablet on the kitchen wall chimes softly — a new ticket appears at the top of his KDS queue, T1 in big bold text. He sees Samgyupsal meat at the bottom. He taps ✓ on the meat, and back at the register, T1's unserved count drops from 1 to 0 with a satisfying green badge.

An hour in, T3 (8 pax, Beef+Pork) has been waiting 12 minutes. Their card is now orange-bordered — overdue. Pedro is slammed. He accidentally marks Beef Bone-In as SOLD OUT — immediately, back at Maria's AddItemModal, Beef Bone-In is greyed and sorted to the bottom. No customer will accidentally order it. Pedro realizes his mistake and taps it again to un-mark it. No harm done, and it took 2 taps total.

One group at T3 is done. Maria opens Checkout. Because it's AYCE, the LeftoverPenalty step appears first — she weighs 150g of uneaten meat, enters it, the penalty calculates instantly. She proceeds to CheckoutModal, the guest pays by GCash, receipt prints, table closes, the floor card disappears. The occupied count in the header drops to 7.

Meanwhile, Juan the manager glanced at the Quick Action "X-Reading" icon once mid-service to check the running total. One tap, the report loaded instantly: ₱42,000 in gross sales, 6 open tables, 2 paid. He's back on the floor in 10 seconds. No disruption to his spatial awareness of the room.

**The current gap:** The gaps in this vision are narrow but real. H3 (kitchen rejections) barely surfaces when a cashier is busy on a different table — the ⚠ badge is 9px text at the corner of a table card, easy to miss during a rush. The "Transfer · Pax · Split · Merge" action group requires a hidden tap to discover. Four tables opening in rapid succession forces Maria to close 4 extra AddItemModal windows. And Pedro — gloved, at the grill — can't see the "tap this row to refuse" affordance because there isn't one. He has to remember his training, or he never discovers RETURN at all.

---

## E. Scenario Scorecard

| # | Scenario | Completed | Handoffs OK | Friction Points | Verdict |
|---|---|---|---|---|---|
| S1 | Cold Start: First Table | Partial | H1 ✓ | Shift modal; auto-AddItem saves 1 tap but blocks rapid setup | CONCERN |
| S2 | Takeout + Table Overlap | Code-observed | H1 ✓ (×2) | Takeout label non-sequential; spatial split floor/queue | CONCERN |
| S3 | Group of 8 | Code-observed | H1 ✓ | PaxModal max 12 — group of 13+ is blocked | CONCERN |
| S4 | Refill Wave | Yes | H7 ✓ | 3 taps: Refill → select meats → Done. Excellent UX | PASS |
| S5 | Kitchen Refuse | Partial | H3 CONCERN | Rejection badge 9px, visible only on that table's card | CONCERN |
| S6 | Table Transfer | Code-observed | H5 ✓ | 2-tap barrier to reach Transfer action | CONCERN |
| S7 | Concurrent 4 Tables | BLOCKED | H1 ×4 ✓ | Auto-AddItemModal adds 3 extra closes per table during rapid multi-open | FAIL |
| S8 | Sold-Out Toggle | Yes | H4 ✓ | No confirmation before marking sold out; no KDS feedback | CONCERN |
| S9 | Merge Tables | Code-observed | H6 ✓ | No pre-merge bill preview | PASS |
| S10 | AYCE Leftover Penalty | Yes | N/A | Leftover intercept is correct but surprising for first-time staff | PASS |
| S11 | Split Bill | Code-observed | N/A | 2-tap access barrier | PASS |
| S12 | Package Upgrade | Code-observed | N/A | Works; upgrade/downgrade not visually differentiated | CONCERN |
| S13 | Void + X-Read | Partial | N/A | Empty table cancel: excellent. X-Read: Maya missing, no VAT split | CONCERN |

**Scorecard: 4 PASS · 8 CONCERN · 1 FAIL**

---

## F. Per-Role Principle Summary

| Role | PASS | CONCERN | FAIL |
|---|---|---|---|
| Staff | 5 | 6 | 3 |
| Kitchen | 4 | 5 | 5 |
| Manager | 4 | 6 | 4 |
| **Total** | **13** | **17** | **12** |

---

## G. Full Issue Breakdown

### P0 — MUST FIX (service-blocking)

| Code | Role(s) | Issue | Fix | Effort | Status |
|---|---|---|---|---|---|
| P0-1 | Staff | Touch targets below 44px — ✕ remove (20px), ±qty (28px), discount toggles (32px) will cause chronic mis-taps during service | Set `min-height: 44px; min-width: 44px` on all interactive elements in OrderSidebar + AddItemModal | S | 🔴 OPEN |
| P0-2 | Staff | `wtfpos_session` in `localStorage` — same-origin tab collision corrupts session state on multi-tab or multi-device same-browser use | Move to `sessionStorage` | S | 🔴 OPEN |
| P0-3 | Staff | PaxModal max pax = 12, no custom input — groups of 13+ physically cannot be opened | Add a custom numeric input for pax beyond the button grid | S | 🔴 OPEN |
| P0-4 | Kitchen | `formatCountdown()` doesn't clamp negatives — renders `-1291:-14` for stale-dated seed tickets; urgency styling fires incorrectly | `Math.max(0, seconds)` before calculation in formatCountdown | S | 🔴 OPEN |
| P0-5 | Kitchen | Kitchen role can access `/pos` directly by URL — no route guard; cook sees cashier interface | Add role check in `/pos` route load function | S | 🔴 OPEN |
| P0-6 | Manager | Manager PIN login does not update session role — floor plan loads but sidebar still shows previous user's role | Fix PIN auth flow to call `setSession` with manager role before navigation | M | 🔴 OPEN |
| P0-7 | Manager | SVG floor plan table taps intercepted by sidebar Quick Action links — manager cannot reliably open tables | Resolve z-index/hit-test collision between sidebar Quick Actions and SVG table elements | M | 🔴 OPEN |

### P1 — FIX THIS SPRINT (friction)

| Code | Role(s) | Issue | Fix | Effort | Status |
|---|---|---|---|---|---|
| P1-1 | Staff | "Transfer · Pax · Split · Merge" overflow toggle is non-discoverable — no label, no affordance | Rename to "More Actions ▼" with chevron icon; surface Transfer as always-visible secondary button | S | 🔴 OPEN |
| P1-2 | Staff | Auto-open AddItemModal on table open blocks rapid multi-table creation during peak (adds 3 extra close taps per table) | Make auto-open conditional: only auto-open for first item add, not when switching between tables | M | 🔴 OPEN |
| P1-3 | Staff | Kitchen rejections not globally visible — ⚠ badge on floor card only, 9px text, invisible from other table context | Add dismissable `AlertBanner` at top of POS for each new unacknowledged rejection (with table reference) | M | 🔴 OPEN |
| P1-4 | Staff | ShiftStartModal shows open orders dimmed with no reassurance text | Add "X open orders are safe and will remain open" beneath the dimmed view | S | 🔴 OPEN |
| P1-5 | Staff | Takeout labels use time-based ID (#TO-HH-MM) — not scannable or searchable by staff | Use sequential per-shift counter (#TO-001, #TO-002…) | M | 🔴 OPEN |
| P1-6 | Staff | History badge shows all-time order count (66) — misleads staff into thinking it's today's pending history | Filter History badge count to today's closed orders only | S | 🔴 OPEN |
| P1-7 | Kitchen | Expand-to-reveal-actions pattern has no visual affordance — new cooks will never discover RETURN or SOLD OUT | Add ▼ chevron or `···` indicator on unserved item rows; add one-time coach mark on first KDS load | S | 🔴 OPEN |
| P1-8 | Kitchen | SOLD OUT toggle has no confirmation — greasy-hand accidental activation marks item unavailable system-wide | Add a 1-tap undo toast: "Kimchi marked sold out — Undo" for 3 seconds | S | 🔴 OPEN |
| P1-9 | Kitchen | No feedback after RETURN confirm — cook doesn't know the rejection alert reached POS | Add brief toast: "✓ Return flagged — Alert sent to T3" | S | 🔴 OPEN |
| P1-10 | Kitchen | History modal Recall button: 32px height (below 44px minimum) | Set `min-height: 44px` on Recall button | S | 🔴 OPEN |
| P1-11 | Kitchen | `bumpedBy` shows "Kitchen Staff" instead of actual username — no attribution clarity | Populate `bumpedBy` with `session.userName` at bump time | S | 🔴 OPEN |
| P1-12 | Kitchen | "Last Completed" stat uses countdown format instead of elapsed time — shows "20:35" meaning "20 min 35 sec ago" but reads as a countdown | Replace `formatCountdown()` for this stat with a `formatTimeAgo()` format: "20m ago" | S | 🔴 OPEN |
| P1-13 | Manager | No AYCE time-remaining indicator on table cards — only elapsed time shown; manager can't tell who's approaching their limit | Add a second timer row to table cards for AYCE tables: `Limit: 15m left` (based on branch policy) | M | 🔴 OPEN |
| P1-14 | Manager | 7 Quick Action icons in collapsed sidebar have no labels — requires memorization | Add tooltip on hover; add label below icon in expanded sidebar | S | 🔴 OPEN |
| P1-15 | Staff + Kitchen | No LocationBanner shown to Staff and Kitchen roles — branch context is invisible to front-line workers | Show LocationBanner to all roles (hide the "Change Location" button for locked roles) | S | 🔴 OPEN |
| P1-16 | Manager | "Change Location" has no mid-service confirmation — one tap could silently switch all data to another branch during active service | Add a confirmation modal: "Switch to Alona Beach? This will hide Alta Citta data." | S | 🔴 OPEN |
| P1-17 | Manager | "Generate X-Read" has no confirmation dialog — this is a permanent BIR audit document | Add confirmation: "Generate X-Read for Alta Citta? This cannot be undone." | S | 🟢 FIXED |
| P1-18 | Manager | Maya e-wallet missing from X-Read payment breakdown; no VAT split shown | Add Maya row to payment breakdown. Add VAT line to totals (BIR compliance) | M | 🟢 FIXED |

### P2 — BACKLOG (polish)

| Code | Role(s) | Issue | Fix | Effort | Status |
|---|---|---|---|---|---|
| P2-1 | Staff | Leftover penalty step is surprising for new staff — no in-context explanation | Add a tooltip or ℹ icon on LeftoverPenaltyModal explaining the AYCE policy | S | 🔴 OPEN |
| P2-2 | Staff | "Cancel Table" button has no visual affordance for its 2-step confirmation | Add a subtle ⚠ icon to the button to signal it's a guarded action | S | 🔴 OPEN |
| P2-3 | Staff | `text-gray-400` hint/placeholder text on `bg-surface-secondary` ≈ 2.5:1 (fails WCAG AA) | Use `text-gray-500` minimum for all placeholder/hint text | S | 🔴 OPEN |
| P2-4 | Staff + Manager | 9px package badge text and 8px timer text on SVG table cards — below WCAG minimum readable size | Minimum 12px for all on-card text; 11px minimum for badges | S | 🔴 OPEN |
| P2-5 | Staff | Merge Tables has no pre-merge bill preview — staff can't see what the combined bill will look like before confirming | Add a 2-column preview in MergeTablesModal: "T4 items + T6 items → Combined: ₱4,200" | M | 🔴 OPEN |
| P2-6 | Kitchen | MEATS section header: `text-xs text-status-red` (#EF4444) on white = ~3.6:1 (fails WCAG AA for 12px bold) | Use `text-red-800` for MEATS section header (passes at 7.5:1) | S | 🔴 OPEN |
| P2-7 | Kitchen | "✓ Bump" (card header) and "ALL DONE ✓" (card footer) call identical `completeAll()` — confusing dual labels | Differentiate label: header = "Skip All" (shortcut semantics), footer = "All Done ✓" (primary confirm) | S | 🔴 OPEN |
| P2-8 | Kitchen | History modal: 64 entries in a single unbroken scroll — no date grouping, no search | Add date group headers and a search-by-table-number filter | M | 🔴 OPEN |
| P2-9 | Kitchen | Item row `role="button"` has no accessible label indicating it's expandable | Add `aria-expanded` and `aria-label="Expand actions for {item.menuItemName}"` | S | 🔴 OPEN |
| P2-10 | Kitchen | Progress bar div has no `role="progressbar"` or `aria-valuenow` | Add ARIA progressbar semantics | S | 🔴 OPEN |
| P2-11 | Manager | Rejection alert badge text: 9px — below WCAG 12px minimum | See P2-4 — same fix | S | 🔴 OPEN |
| P2-12 | Manager | X-Read attribution inconsistent between historical entries (role label) and new entries (person name) | Standardize to `session.userName` at generation time | S | 🔴 OPEN |
| P2-13 | Manager | "Generate X-Read" button: 40px height (below 44px) | `min-height: 48px` (use `.btn` class consistently) | S | 🔴 OPEN |

---

## H. Multi-User Specific Recommendations

| Priority | Cross-Role Issue | Roles | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| **P0** | Manager PIN session bug — login doesn't update role, causing wrong access control state | Manager ↔ All | Fix `setSession` call in PIN auth flow | M | High | 🔴 OPEN |
| **P0** | SVG table taps intercepted by sidebar overlay — manager can't open tables | Manager ↔ Staff view | Fix z-index / hit-test collision | M | High | 🔴 OPEN |
| **P1** | Kitchen rejections only visible on affected table card — staff on T1 misses T3 rejection | Kitchen → Staff | Global AlertBanner for new rejections | M | High | 🔴 OPEN |
| **P1** | LocationBanner hidden from Staff + Kitchen — no branch awareness for locked roles | All roles | Show banner (read-only) to all | S | Med | 🔴 OPEN |
| **P1** | REFILL + WEIGHING badges inline only — dense KDS may not draw cook's eye to urgent refills | Kitchen | Move refill badge to card header (adjacent to table number) | S | Med | 🔴 OPEN |
| **P2** | "Change Location" has no protection during live service — one misclick affects all data | Manager | Confirmation modal with active order count | S | Med | 🔴 OPEN |
