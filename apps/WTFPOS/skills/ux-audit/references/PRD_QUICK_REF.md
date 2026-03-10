# PRD Quick Reference — Feature Status Map

Extracted from `PRD.md` (project root). Use this during audits to distinguish between
"bug" (feature specced and should work), "not yet built" (feature specced but deferred),
and "not specced" (feature not in PRD — don't flag as missing).

Last updated: 2026-03-10

---

## Module 1: Core Samgyup POS & System Foundation

### Cashiering & Table Management

| Feature | PRD spec | Current status | Audit note |
|---|---|---|---|
| Visual table floor map with live statuses | ✅ Specced | ✅ Built | Audit layout, status colors, glanceability |
| 90-minute countdown timer with color alerts | ✅ Specced | ✅ Built | Audit color transitions, urgency visibility |
| Table Reset Time tracking | ✅ Specced | ⚠️ Partial | Timer exists but "reset time" metric not surfaced in reports |
| Pax-first seating (pax → package → open) | ✅ Specced | ✅ Built | Audit flow speed, pax entry UX |
| Pax modification requires Manager PIN | ✅ Specced | ✅ Built | Audit PIN modal usability |
| Per-table order entry with categorized menu | ✅ Specced | ✅ Built | Audit AddItemModal density, search |
| Mid-session add-ons without interruption | ✅ Specced | ✅ Built | Audit refill flow, round separation |
| Package upgrades (pro-rated) | ✅ Specced | ✅ Built | Audit upgrade flow, price recalculation visibility |
| 30-second grace period voids | ✅ Specced | ✅ Built | Audit void timer visibility, grace vs. PIN void distinction |

### Discounts & Payments

| Feature | PRD spec | Current status | Audit note |
|---|---|---|---|
| Senior/PWD 20% discount + VAT exempt | ✅ Specced | ✅ Built | Audit pro-rata calculation accuracy, ID logging |
| Pro-rata AYCE discounts | ✅ Specced | ✅ Built | Audit UI showing partial discount breakdown |
| Cash + GCash + Maya (single or combined) | ✅ Specced | ✅ Built | Audit split payment flow |
| Manager PIN for cancellations/refunds | ✅ Specced | ✅ Built | Audit PIN modal, action logging |
| Cash drawer float management | ✅ Specced | ❌ Not built | Do NOT flag as bug — it's a deferred feature |

### Kitchen Routing

| Feature | PRD spec | Current status | Audit note |
|---|---|---|---|
| Master KDS screen (consolidated orders) | ✅ Specced | ✅ Built | Audit ticket readability, bump flow |
| Bluetooth weigh station (exact deductions) | ✅ Specced | ⚠️ Partial | BT connection works, auto-read partial. Manual weight entry is fallback |
| KDS bump flow (mark complete) | ✅ Specced | ✅ Built | Audit bump touch target, undo toast |
| Thermal receipt printing (BIR) | ✅ Specced | ❌ Not built | Phase 2+ — do NOT flag as missing |
| Manual weight entry fallback | ✅ Specced | ✅ Built | Audit entry speed, accuracy |

### Compliance

| Feature | PRD spec | Current status | Audit note |
|---|---|---|---|
| BIR X-Readings (shift reports) | ✅ Specced | ✅ Built | See BIR_REQUIREMENTS.md for field compliance |
| BIR Z-Readings (end-of-day) | ✅ Specced | ✅ Built | See BIR_REQUIREMENTS.md for field compliance |

---

## Module 2: Stock Management

| Feature | PRD spec | Current status | Audit note |
|---|---|---|---|
| Delivery → deboning → slicing → weigh-out tracking | ✅ Specced | ⚠️ Partial | Delivery receiving built. Full conversion chain (bone-in → deboned → sliced) exists but UX for butcher workflow needs audit |
| Exact-gram deduction from KDS weigh-out | ✅ Specced | ⚠️ Partial | Deduction records created but depends on weigh station being used |
| Role-based access (butcher vs. server) | ✅ Specced | ✅ Built | Kitchen role sees stock, staff does not |
| Preparation waste logging (not customer leftovers) | ✅ Specced | ✅ Built | Audit waste form UX, category clarity |
| 3 daily stock counts (10am, 4pm, 10pm) | ✅ Specced | ✅ Built | Audit count entry speed, variance display |
| Dynamic stock reconciliation (time-based expected) | ✅ Specced | ⚠️ Partial | Variance calculation exists, live reconciliation accuracy TBD |
| Variance and accuracy reports | ✅ Specced | ⚠️ Partial | Basic variance shown, detailed per-cut accuracy not fully surfaced |
| Inter-branch stock transfers | ✅ Specced | ✅ Built | Audit transfer form, confirmation flow |

---

## Module 3: Analytics & Reporting

| Feature | PRD spec | Current status | Audit note |
|---|---|---|---|
| Centralized owner view (cross-branch) | ✅ Specced | ✅ Built | `locationId: 'all'` aggregation |
| Branch-level data isolation | ✅ Specced | ✅ Built | Each branch sees only its data |
| Manager sees only own branch | ✅ Specced | ⚠️ Concern | Managers CAN switch branches — PRD says they shouldn't see other branches |
| Consolidated EOD / Daily Reports | ✅ Specced | ✅ Built | Audit data completeness |
| Missing Inventory (Drift) tracking | ✅ Specced | ⚠️ Partial | Variance exists, explicit "drift" flag not prominent |
| Expense entry (within reporting) | ✅ Specced | ✅ Built | Audit form UX, category picker |
| Daily expense breakdown | ✅ Specced | ✅ Built | Audit category grouping, COGS accuracy |
| Monthly expense trend | ✅ Specced | ✅ Built | Audit MoM comparison, spike flagging |
| Sales Summary & Revenue Trend | ✅ Specced | ✅ Built | Audit metric accuracy, trend visibility |
| Best-Selling Items & Meat Consumption | ✅ Specced | ⚠️ Partial | Shows deduction-based data, not order-based. "Today" filter doesn't work (KP-06) |
| Peak Service Hours & Turnovers | ✅ Specced | ✅ Built | Audit heatmap readability |
| Gross Profit Summary | ✅ Specced | ✅ Built | Audit COGS calculation accuracy |
| Net Profit Summary | ✅ Specced | ✅ Built | Audit expense inclusion completeness |
| Branch Comparison (side-by-side) | ✅ Specced | ✅ Built | Audit empty state when no data |
| Staff Performance (per-cashier sales) | ✅ Specced | ✅ Built | |
| Table Sales (per-table revenue) | ✅ Specced | ✅ Built | |
| Voids & Discounts audit report | ✅ Specced | ✅ Built | |

---

## Module 4: Administration & System Logs

| Feature | PRD spec | Current status | Audit note |
|---|---|---|---|
| Branch selection (owner/admin only) | ✅ Specced | ⚠️ Concern | Managers also switch — PRD restricts to owner/admin |
| User management (CRUD) | ✅ Specced | ✅ Built | Audit form UX |
| Global app logs | ✅ Specced | ✅ Built | Audit log viewer usability, search/filter |
| Floor plan editor | ✅ Specced | ✅ Built | Audit editor UX, table placement |
| Device management | ✅ Specced | ✅ Built | Audit pairing flow |
| Menu management (pricing, items) | ✅ Specced | ✅ Built | |
| Menu changes outside business hours only | ✅ Specced | ❌ Not enforced | No time-gate on menu edits — do NOT flag as bug unless explicitly asked |

---

## UI/UX Requirements From PRD

These are explicitly stated in the PRD and should be treated as **hard requirements** during audits:

| Requirement | PRD section | Audit check |
|---|---|---|
| Touch-optimized hit areas for tablets | §4 UI/UX | ≥44px POS, ≥56px kitchen (ENVIRONMENT.md) |
| Persistent internet sync status indicator | §4 UI/UX | ConnectionStatus pill in root layout |
| KITCHEN OFFLINE full-screen alert | §4 UI/UX | Not built — deferred to Phase 2 (LAN) |
| Numeric keypad for PIN entry | §4 UI/UX | Built — ManagerPinModal |
| Floor plan with countdown timer | §4 UI/UX | Built — TableCard with countdown |
| Split panes (menu nav + active ticket) | §4 UI/UX | Built — POS floor + OrderSidebar |
| High-contrast KDS grid | §4 UI/UX | Built — audit contrast in kitchen environment |
| "Knuckle-sized buttons" for butcher | §4 UI/UX | ⚠️ Current weigh station targets < 56px |
| "Wet-environment" butcher interface | §4 UI/UX | ⚠️ Not specifically designed for wet hands |

---

## Status Legend

| Symbol | Meaning | Audit action |
|---|---|---|
| ✅ Built | Feature exists and functions | Audit UX quality normally |
| ⚠️ Partial | Feature partially built or has known gaps | Audit what exists, note gaps, do NOT flag missing parts as bugs unless they cause UX harm |
| ❌ Not built | Feature specced but deferred | Do NOT flag as a finding. Mention in context only if it creates confusion (ghost UI, misleading empty state) |
| ⚠️ Concern | Feature built but may not match PRD intent | Flag if it causes user confusion, otherwise note as observation |

---

## How to Use During Audit

1. **Before auditing a page:** Check this reference for the features on that route. Know what
   should work, what's partial, and what's not built.
2. **When finding an issue:** Cross-reference with this table. If the feature is "❌ Not built,"
   don't write it up as a UX issue — unless the absence creates ghost UI or misleading state.
3. **When something seems broken:** Check if it's "⚠️ Partial" — the gap may be known and
   intentional for this phase.
4. **PRD mismatches:** If something works differently from what the PRD specifies (e.g.,
   managers can switch branches but PRD says they shouldn't), note it as a
   PRD-alignment observation, not a UX failure.
