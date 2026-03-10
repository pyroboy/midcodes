# UX Audit — POS: Table Entry → Checkout (Staff, Light Mode)

**Date:** 2026-03-10
**Role:** Staff (Maria Santos, Alta Citta)
**Flow:** Login → Start Shift → Floor Plan → Open Table → Add Items → Order Sidebar → Checkout → Payment Success
**Viewport:** 1024×768 (tablet landscape)
**Theme:** Light
**Branch:** Alta Citta (Tagbilaran) — `tag`
**Auditor:** Claude (UX Audit Skill v4.0)

---

## A. Text Layout Map

### State 1 — Login Page (/)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [LEFT PANEL — 55%]                  [RIGHT PANEL — 45%]                │
│                                                                          │
│     🔥 WTF! SAMGYUP                  ┌──────────────────────┐           │
│     RESTAURANT POS                   │ 🧪 Dev Test Accounts  │           │
│     ─────────────                    │                        │           │
│                                      │ 🏠 Alta Citta POS/Mgmt │           │
│  USERNAME                            │ • Maria Santos  Staff  │           │
│  [e.g. staff          ]              │ • Juan Reyes  Manager  │           │
│                                      │                        │           │
│  PASSWORD                            │ 🔥 Alta Citta Kitchen  │           │
│  [Enter password    👁]              │ • Pedro Cruz           │           │
│                                      │ • Lito Paglinawan      │           │
│  [       LOGIN →     ] ← disabled   │                        │           │
│                                      │ 🏠 Alona Beach         │           │
│  v0.1-alpha  [System Admin]          │ • Ana Lim  Staff       │           │
│                                      │ • Carlo Ramos  Manager │           │
│                                      └──────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
```

### State 2 — Start Your Shift Modal

```
┌──────────────────────────────────────────────────────┐
│ [blurred POS floor plan behind]                       │
│      ┌────────────────────────────────┐              │
│      │         🏦                      │              │
│      │    Start Your Shift             │              │
│      │  Declare opening cash float     │              │
│      │  Logged as Maria Santos         │              │
│      │                                 │              │
│      │  Quick Select                   │              │
│      │  [₱1,000][₱2,000][₱3,000][₱5k] │              │
│      │                                 │              │
│      │  Opening Cash Float (₱)         │              │
│      │  [          0          ]         │              │
│      │                                 │              │
│      │  [    Start Shift →    ]  ← CTA │              │
│      │                                 │              │
│      │  You can enter ₱0 if no float.  │              │
│      │  Existing open orders are safe. │              │
│      │                                 │              │
│      │  Skip — I'll add float later    │              │
│      └────────────────────────────────┘              │
└──────────────────────────────────────────────────────┘
```

### State 3 — POS Floor Plan

```
┌──┬──────────────────────────────────────────┬───────────────────────────┐
│W!│ 📍 ALTA CITTA (TAGBILARAN)                                            │ ← Location banner
├──┤                                                                        │
│🛒│  POS  0occ 8free [ⓘ] [📦 New Takeout▒] [🧾 History 9]               │ ← top bar
│  │                                                                        │
│  │ ┌──────────────────────────────────────┐  ┌─────────────────────────┐│
│  │ │  [T1] [T2] [T3] [T4]                 │  │     🧾                  ││
│  │ │  [T5] [T6] [T7] [T8]                 │  │  No Table Selected      ││ ← fold
│  │ │  ← all ~64×64px cards                │  │  Tap occupied table...  ││
│  │ │                                       │  │                         ││
│  │ └──────────────────────────────────────┘  │ • Green = available     ││
│  │                                            │ • Orange = occupied     ││
│  │ 📦 TAKEOUT ORDERS 1                        └─────────────────────────┘│
│  │ ┌─────────────────────────────────┐                                    │
│M │ │ #TO01 Juan ₱1,442.00 PREP       │                                    │
│→ │ └─────────────────────────────────┘                                    │
└──┴────────────────────────────────────────────────────────────────────────┘
```

### State 4 — Pax Modal

```
                ┌──────────────────────────────────────┐
                │  How many guests for T1?              │
                │  Capacity: 4                          │
                │                                       │
                │  Adults   full price    [−] 2 [+]     │
                │  [1][2●][3][4][5][6][7][8]            │
                │  ─────────────────────────            │
                │  Children  ages 6-9     [−] 0 [+]     │
                │  [0●][1][2][3][4]                     │
                │  ─────────────────────────            │
                │  Free  under 5          [−] 0 [+]     │
                │  [0●][1][2][3][4]                     │
                │                                       │
                │  Total guests                   2     │
                │                                       │
                │  [Cancel]     [     Confirm    ]      │
                └──────────────────────────────────────┘
```

### State 5 — Add Item Modal (Package tab → auto-navigate to Meats)

```
┌──────────────────────────────────────┬────────────────────────────────┐
│  + Add to Order                   ✕  │  Pending Items                  │
│  🔥 Table · 2 pax                    │  Review before pushing to bill  │
│                                       │                                 │
│  [PACKAGE●][MEATS][SIDES][DISHES][🥤] │  Beef + Pork Unlimited  PKG     │
│                                       │  × 2 pax                        │
│  FREE — inventory tracked            │  Includes 5 meats, 10 sides ▼   │
│                                       │                                 │
│  [Beef Unlimited ₱599/pax]           │  San Miguel Beer  Dine-In       │
│  [Beef+Pork ₱499/pax    ]            │  [−] 2 [+]                      │
│  [Pork Unlimited ₱399/pax]           │  Special request... ___         │
│                                       │                                 │
│                                       │                                 │
│                                       │  PENDING TOTAL    ₱1,148.00    │
│  ← Back to Meats (if in weight entry) │  [Undo] [⚡ CHARGE (17)]       │ ← FOLD
└──────────────────────────────────────┴────────────────────────────────┘
```

### State 6 — Order Sidebar (after CHARGE)

```
┌──┬────────────────────────────────────────┬────────────────────────────┐
│  │  📍 ALTA CITTA (TAGBILARAN)            │  T1  2 pax ✎  2m      ✕    │
├──┤                                         │  Beef + Pork Unlimited      │
│  │  POS 1occ 7free                        │  [🔄 Refill] [Add Item]     │
│  │  ┌────────────────────────────────┐    │                             │
│  │  │ T1 Beef+Pork 2m ₱1,148 ▒▒▒   │    │ Beef+Pork Unlimited SENT    │
│  │  │ [T2][T3][T4]                   │    │ ₱998.00 PKG              ✕  │
│  │  │ [T5][T6][T7][T8]               │    │                             │
│  │  └────────────────────────────────┘    │ MEATS (orange header)       │
│  │                                         │  Samgyupsal       WEIGHING  │
│  │  📦 TAKEOUT ORDERS 1                   │  Pork Sliced      WEIGHING  │
│  │  [#TO01 Juan ₱1,442 PREP]             │  Prem USDA Beef×2 WEIGHING  │
│  │                                         │  Sliced Beef      WEIGHING  │
│M │                                         │                             │
│→ │                                         │ SIDES (green header)        │
└──┴────────────────────────────────────────┤  10 requesting        ▼show │
                                             │  Meat dispatched  0.20kg    │
                                             ├─────────────────────────────│ ← FOLD
                                             │ BILL  17 items  ₱1,148.00  │
                                             │ [Void][   Checkout  ][Print]│
                                             │ More ▼ Transfer·Merge·Split │
                                             └─────────────────────────────┘
```

**⚠ NOTE:** On 1024×768, the BILL section (Void/Checkout/Print) sits at the very bottom edge of the viewport. On shorter screens or with more order items, it will scroll out of view.

### State 7 — Leftover Check Modal

```
                ┌─────────────────────────────────────┐
                │  Leftover Check  ℹ                   │
                │  Weigh uneaten meat. >100g charged   │
                │  at ₱50/100g. Enter 0 if clean.      │
                │                                       │
                │  ┌──────────────────────────────┐    │
                │  │          0 g                  │    │
                │  │       No penalty              │    │
                │  └──────────────────────────────┘    │
                │                                       │
                │  [1][2][3]                            │
                │  [4][5][6]                            │
                │  [7][8][9]                            │
                │  [CLR][0][⌫]                         │
                │                                       │
                │  [✓ No Leftovers — Proceed to Chkout]│ ← green CTA
                └─────────────────────────────────────┘
```

### State 8 — Checkout Modal

```
┌──────────────────────────────────────────────────────┐
│  Checkout  T1                                    ✕    │
│  ────────────────────────────────────────────────    │
│  Subtotal (2 pax)                      ₱1,148.00     │
│  VAT (inclusive)                          ₱123.00    │
│  TOTAL                               ₱1,148.00       │
│  ────────────────────────────────────────────────    │
│  Discount:                                           │
│  [🧓 Senior Citizen (20%)] [♿ PWD (20%)]            │ ← FOLD
│  [🎟 Promo] [💯 Comp] [❤️ Service Rec]               │
│  ────────────────────────────────────────────────    │
│  PAYMENT METHOD              Tap to add/remove       │
│  [💵 Cash●] [📱 GCash] [📱 Maya]                    │
│                                                       │
│  💵 Cash                            [Exact▸]         │
│  [          1148          ]                          │
│  [₱20][₱50][₱100][₱200]                             │
│  [₱500][₱1,000][₱1,500][₱2,000]                    │
│                                                       │
│  Total Paid                        ₱1,148.00 ← green │
│  ════════════════════════════════════════════════    │
│  [✓ Confirm Payment]  ← !! BELOW FOLD on 768px !!    │
└──────────────────────────────────────────────────────┘
```

**🚨 P0:** "✓ Confirm Payment" is rendered below 768px viewport height. Requires scroll to reach on 1024×768.

### State 9 — Payment Successful

```
                ┌──────────────────────────────┐
                │         ✓                     │
                │   Payment Successful           │
                │       Table 1                  │
                │   ──────────────────────────   │
                │   2× Beef + Pork Unlimit...    │ ← name truncated
                │                      ₱998.00  │
                │   2× San Miguel Beer  ₱150.00  │
                │   ──────────────────────────   │
                │   Subtotal           ₱1,148.00 │
                │   VAT (inclusive)      ₱123.00 │
                │   TOTAL              ₱1,148.00 │
                │   ──────────────────────────   │
                │   Paid via                Cash  │
                │   ──────────────────────────   │
                │   Mar 10, 2026, 8:05 AM         │
                │   WTF! Samgyupsal — Thank you!  │
                │                                 │
                │   [         Done          ]     │
                └──────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence |
|---|---|---|---|
| 1 | **Hick's Law** | ✅ PASS | Package: 3 options. Meats: 4 items. Drinks: 4 items. Category tabs: 5. All within 7-item threshold. Progressive disclosure (package → meats → weight) is well-structured. |
| 2 | **Miller's Law** | ⚠ CONCERN | Order sidebar shows 17 items in MEATS + SIDES sections. No pagination or collapsing of filled groups. On longer orders, the sidebar becomes a scrollable wall of text before reaching the BILL section. |
| 3 | **Fitts's Law** | ⚠ CONCERN | **Critical path CTA is hidden:** "✓ Confirm Payment" is off-screen at 1024×768 — the most important button in the flow. Table cards are 64×64px (meets 44px minimum but tight). Sidebar toggle button at page left edge created a collision zone with the floor plan click area. |
| 4 | **Jakob's Law** | ✅ PASS | Follows standard tablet POS patterns: left nav rail, content area, right sidebar for active order. Payment modal resembles familiar POS checkout flows. Quick denomination buttons match retail cashier norms. |
| 5 | **Doherty Threshold** | ✅ PASS | RxDB local-first writes are instant. Modal transitions are fast. After clicking CHARGE, the order sidebar updates and the floor plan table state changes with no perceptible delay. |
| 6 | **Visibility of System Status** | ✅ PASS | Location banner always visible at top. Occupied/free count in POS header. Elapsed time visible on table card and in sidebar header. SENT badge on bill items confirms kitchen dispatch. "Meat dispatched: 0.20kg" shows live weight tracking. |
| 7 | **Gestalt — Proximity** | ✅ PASS | Qty stepper (−/+) adjacent to item name in pending panel. Denomination buttons grouped in rows of 4. Discount buttons in a visual cluster. Payment methods grouped in a row. |
| 8 | **Gestalt — Common Region** | ✅ PASS | MEATS and SIDES use distinct colored section headers (orange/green) as visual region dividers. Checkout modal uses dashed dividers between sections. Pending items panel is clearly bounded. |
| 9 | **Visual Hierarchy — Scale** | ⚠ CONCERN | TOTAL (₱1,148.00) is large and bold — good. But the "✓ Confirm Payment" button is the most important action and it's hidden below the fold, making the visual hierarchy misleading. In the order sidebar, BILL section (the completion zone) shares the same visual weight as the item list above it. |
| 10 | **Visual Hierarchy — Levels** | ✅ PASS | Login: brand heading > form labels > placeholder text. POS: header controls > floor plan > takeout queue. Checkout: TOTAL (xl bold) > section labels > body text. Generally follows 5-level hierarchy. |
| 11 | **WCAG — Touch Targets** | ⚠ CONCERN | All buttons meet 44px minimum. However: (a) Floor plan table cards at 64×64px have internal text (~10px) that is too small for arm's-length reading per Design Bible 14px minimum; (b) The sidebar toggle button's hit zone at the left edge creates accidental trigger risk adjacent to the floor plan; (c) "Skip — I'll add float later" in the shift modal is a text link with no visible minimum height guarantee. |
| 12 | **WCAG — Contrast** | ⚠ CONCERN | "Exact" button label in `#EA580C` orange on `#FFFFFF` white = 4.6:1 — bare minimum for large text only. The label appears to be ~13px which falls below the large text threshold (18px or 14px bold). The small gray text "Tap to add/remove" (gray on white) should be verified — likely below 4.5:1. Status badge text (WEIGHING, REQUESTING, SENT) in small colored text on light backgrounds technically fails AA for small text. |
| 13 | **Consistency** | ⚠ CONCERN | The "Checkout" button in the order sidebar is **green** (`#10B981`) while all other primary actions in the app use the brand **orange** (`#EA580C`). While green/success semantics are intentional, this breaks the visual consistency rule — a new staff member may not immediately recognize green as a primary CTA. The Refill and Add Item buttons are both orange outlines with equal weight, making it unclear which is more primary. |
| 14 | **Error Cost** | ✅ PASS | Correct error tiers: (a) adding wrong item = easy remove (no confirmation); (b) Void requires red button — visually dangerous; (c) Leftover check gate before checkout enforces business rule; (d) Confirm Payment disabled until amount entered (error prevention). Separate Confirm Payment step prevents accidental order close. |

**Summary: 9 PASS · 4 CONCERN · 0 FAIL**

---

## C. Best Day Ever — Maria Santos, Table Staff, Alta Citta, Tuesday Dinner Rush

*It's 7:45 PM. Table T3 just got seated — 4 adults. Maria grabs the tablet and taps T3. The pax modal is already on 2 adults (smart), she bumps it to 4 with one tap on the "4" button. Confirm. The menu jumps straight to Packages — she doesn't even have to think about what tab to open. Table 3's regulars always get Beef + Pork, she taps it, the view slides to Meats. Premium USDA Beef, she taps it, hits 200g, it logs and bounces back to the meat list. Back to Drinks — 4 San Miguels, four quick taps. CHARGE — everything is pushed to the bill and the KDS in one shot.*

*Twenty minutes later, the table signals they're done. She opens T3 in the sidebar — total is right there at the bottom. Checkout. Leftover check, 0g, tap Proceed. The checkout modal opens. She selects Cash, the customer hands her ₱1,500. She taps ₱1,500 on the quick denomination — but she can't see the Confirm Payment button. She scrolls the modal and finds it. Tap. Payment Successful.*

*That scroll is the only moment she paused. Everything else: one tap. On a night where she turns 20 tables, that one forced scroll happens 20 times. That's 20 unnecessary hesitations.*

---

## D. Recommendations

### P0 — Fix Immediately (Blocks Service)

| ID | Issue | Location | Effort | Impact |
|---|---|---|---|---|
| P0-1 | **Confirm Payment hidden below fold** — the single most critical action in the checkout flow is not visible at 1024×768. Staff must scroll to find it. Consider: (a) sticky footer with Confirm Payment fixed at bottom of checkout modal; or (b) restructure modal to show payment entry in a compact 2-column layout. | `CheckoutModal.svelte` | M | High |
| P0-2 | **Sidebar toggle collision zone** — the toggle button at the left rail edge is in close proximity to the floor plan tap zone. When clicking table cards near the left edge of the SVG floor plan, the sidebar may expand unexpectedly. This causes mid-service confusion. Increase the toggle button's gap from the floor plan SVG boundary. | `AppSidebar.svelte`, `FloorPlan.svelte` | S | High |

### P1 — Fix Before Launch

| ID | Issue | Location | Effort | Impact |
|---|---|---|---|---|
| P1-1 | **No change-due calculation** — when a customer pays ₱1,500 for a ₱1,148 bill, the cashier must mentally calculate ₱352 change. Show `Change: ₱352.00` prominently after the paid amount exceeds the total. Standard for all POS systems (Jakob's Law). | `CheckoutModal.svelte` | S | High |
| P1-2 | **Item name truncated on Payment Successful receipt** — "2× Beef + Pork Unlimit..." is cut off on the success screen. The receipt is the last thing a guest sees. Full names matter for billing clarity and professional presentation. | `ReceiptModal.svelte` / payment success component | S | Med |
| P1-3 | **Checkout button is green, not orange** — breaks primary CTA consistency. Consider keeping orange for primary brand consistency and using a green checkmark icon or success state change *after* payment (not on the trigger button itself). Alternatively, document the intentional green-as-success pattern in the design system. | `OrderSidebar.svelte` | S | Med |
| P1-4 | **No package quota indicator** — the right panel says "Includes 5 meats, 10 sides" but there's no visual progress bar showing 5/∞ meats ordered (AYCE packages have no hard limit within service, but tracking helps kitchen awareness). A small usage counter (e.g., `5 meats added`) per package line would help staff track service stage. | `AddItemModal.svelte` | M | Med |
| P1-5 | **Table card text too small for arm's length** — T-labels and "cap 4" text inside 64×64px cards appears to be ~10px. Design Bible specifies 14px minimum for body, 12px for captions. At arm's length during service, staff may struggle to read table labels on the floor plan. Increase internal font sizes or card size. | `FloorPlan.svelte` | S | Med |

### P2 — Quality Improvements

| ID | Issue | Location | Effort | Impact |
|---|---|---|---|---|
| P2-1 | **No checkout flow progress indicator** — the flow has 3 gates (Leftover Check → Checkout → Payment Success) with no visible step counter. A "Step 2 of 3" indicator reduces staff anxiety about how many steps remain during a busy close. | All 3 checkout modals | S | Low |
| P2-2 | **Leftover Check modal: no explicit dismiss/back button** — there is a background close (✕ top-right) but it's not obvious. Staff who accidentally triggered checkout should have a visible "← Back" link. | `LeftoverPenaltyModal.svelte` | S | Low |
| P2-3 | **Refill vs Add Item visual weight** — both buttons are orange outlines with equal size in the order sidebar. For AYCE service, "Refill" is used 3-4× more than "Add Item". Make Refill the filled primary button and Add Item the outline secondary. | `OrderSidebar.svelte` | S | Med |
| P2-4 | **Start Shift modal opacity on first load** — the dev test accounts panel is visible through the dimmed backdrop. During production use (no dev panel), this is fine. But consider whether the backdrop dim is sufficient at 60% opacity vs 80% for better focus on the modal. | `+page.svelte` (pos route) | XS | Low |
| P2-5 | **History count badge not yet verified post-payment** — after completing a payment, the History badge count (showed 9 before the test) should increment to 10. Not verified in this audit — check that RxDB reactive store updates the badge immediately after order close. | `pos.svelte.ts` / history store | M | Low |

---

## Overall Take

The staff flow from table entry to checkout is **well-structured and fast**. The progressive disclosure pattern — Package → Meats → Drinks, with auto-navigation between steps — is genuinely excellent UX for a samgyupsal POS. The RxDB local-first architecture makes every interaction feel instant.

The **one P0 issue (Confirm Payment hidden below fold)** is serious enough to cause real service friction on busy nights. Every table close requires a scroll that shouldn't exist. Fix this first.

The rest are polish — the flow is already more coherent than most restaurant POS systems.
