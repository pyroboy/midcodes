# WTFPOS Order Scenarios Assessment

**Assessment Date:** 2026-03-04  
**Assessor:** KIMI  
**App Version:** Current Main Branch

---

## Executive Summary

The WTFPOS app currently supports **20 out of 29 scenarios** fully or partially, with **9 scenarios requiring significant development** to meet the documented requirements. The app has a solid foundation for core POS operations (dine-in, takeout, billing, inventory tracking) but lacks sophisticated demographic pricing, complex discount stacking logic, and advanced operational exception handling.

---

## Scenario-by-Scenario Assessment

### 🍽️ DINE-IN SCENARIOS (1-10)

| # | Scenario | Status | Viability | Notes |
|---|----------|--------|-----------|-------|
| 1 | **Solo Diner (1 Person)** | ✅ SUPPORTED | Viable | Table opening supports 1 pax. No solo surcharge prompt implemented. |
| 2 | **Standard Couple (2 Persons)** | ✅ SUPPORTED | Viable | Standard flow works perfectly. Session timer auto-starts. |
| 3 | **Small Family with Child (3 Persons)** | ⚠️ PARTIAL | Partially Viable | App tracks pax count but has **no kid-specific pricing tiers**. Kid is charged as adult. Height/age bracket prompts not implemented. |
| 4 | **Multi-Generational Family (4 Persons)** | ⚠️ PARTIAL | Partially Viable | Senior discount applies to **entire bill** (20% + VAT exempt), not just the senior's portion. No Senior ID input field. |
| 5 | **Group of Friends (5 Adults)** | ✅ SUPPORTED | Viable | Standard unlimited sets. KDS auto-routes based on order. |
| 6 | **Extended Family (6 Persons, 2 Seniors)** | ⚠️ PARTIAL | Not Viable | System only supports **one discount type per order**. Cannot apply senior discount to only 2/6 of the bill. Multiple senior IDs not tracked. |
| 7 | **Kids' Birthday (7 Persons, 5 Kids)** | ⚠️ PARTIAL | Not Viable | No kid pricing tiers implemented. All 7 would be charged at adult rate or same package rate. |
| 8 | **Office Team Building (8 Persons)** | ✅ SUPPORTED | Viable | Large tables supported. "Merged Table" status not explicit but can use table transfer. |
| 9 | **Big Family Gathering (9 Persons, Mixed)** | ❌ NOT SUPPORTED | Not Viable | Complex pricing logic fails: cannot handle mix of adult/kid/senior rates on same table. |
| 10 | **Full Party/Max Capacity (10 Persons)** | ⚠️ PARTIAL | Partially Viable | Table supports 10 pax. **Auto-gratuity for 8+ not implemented**. |

**Key Gaps for Dine-In:**
- No per-person demographic tracking (kid/senior/adult breakdown)
- No kid-specific pricing tiers (free/half-price based on height/age)
- Senior discount applies to entire order, not per-person
- No auto-service charge trigger for large parties

---

### 🥡 TAKE-OUT SCENARIOS (11-12)

| # | Scenario | Status | Viability | Notes |
|---|----------|--------|-----------|-------|
| 11 | **Standard Solo Take-Out** | ✅ SUPPORTED | Viable | Full takeout lifecycle implemented (new → preparing → ready → picked_up). No table assigned. Customer name captured. |
| 12 | **Family Bundle Take-Out** | ⚠️ PARTIAL | Partially Viable | Senior discount can be applied to entire takeout order, but **partitioned bundle discount** (applying only to senior's portion) not supported. |

**Key Gaps for Takeout:**
- Cannot split bundled items for partial discounts
- No scheduled pickup time field (only status tracking)

---

### ⚠️ FAILED ORDERS & EXCEPTIONS (13-17)

| # | Scenario | Status | Viability | Notes |
|---|----------|--------|-----------|-------|
| 13 | **Walk-Out Before Ordering** | ✅ SUPPORTED | Viable | Handled via [`VoidModal`](src/lib/components/pos/VoidModal.svelte:1) with reason `'walkout'`. Table can be cleared without payment. |
| 14 | **Failed Payment / No Show** | ✅ SUPPORTED | Viable | Void with `'mistake'` or `'write_off'` reason. Waste logging available via [`WasteLog`](src/lib/components/stock/WasteLog.svelte:1). |
| 15 | **Dine & Dash / Medical Emergency** | ⚠️ PARTIAL | Partially Viable | Can void with `'walkout'` reason, but **no incident report attachment** or distinct "Comp/Emergency" payment method. Inventory is correctly deducted. |
| 16 | **Kitchen Rejection (Out of Stock)** | ❌ NOT SUPPORTED | Not Viable | **No KDS → POS notification mechanism**. Kitchen cannot reject items back to POS. Inventory sync is one-way (POS → Stock). |
| 17 | **Wrong Table Punched** | ✅ SUPPORTED | Viable | [`TransferTableModal`](src/lib/components/pos/TransferTableModal.svelte:1) allows moving order to correct table. Manager PIN required. |

**Key Gaps for Failed Orders:**
- No two-way KDS communication for stock rejections
- No incident report logging for emergency walkouts
- No "Comp" payment type for emergencies (only void available)

---

### 🔄 MID-SERVICE MODIFICATIONS (18-23)

| # | Scenario | Status | Viability | Notes |
|---|----------|--------|-----------|-------|
| 18 | **Mid-Service Takeout Request** | ⚠️ PARTIAL | Partially Viable | Can add items to order with `[TAKEOUT]` notes flag, but **no automatic packaging instruction** to kitchen. Bill consolidates correctly. |
| 19 | **Latecomer (Adding Pax)** | ✅ SUPPORTED | Viable | [`PaxChangeModal`](src/lib/components/pos/PaxChangeModal.svelte:1) + [`changePax()`](src/lib/stores/pos.svelte.ts:403) fully implemented. Manager PIN required. Package quantity auto-updates. |
| 20 | **Free Add-Ons (Zero Dollar)** | ✅ SUPPORTED | Viable | Free items (rice, package meats) automatically priced at ₱0.00 with `tag: 'FREE'`. Inventory deducts correctly. |
| 21 | **Package Upgrade** | ✅ SUPPORTED | Viable | [`PackageChangeModal`](src/lib/components/pos/PackageChangeModal.svelte:1) + [`changePackage()`](src/lib/stores/pos.svelte.ts:531) fully implemented. Upgrade (no PIN) / Downgrade (PIN) logic works. |
| 22 | **Leftover Charge** | ✅ SUPPORTED | Viable | [`LeftoverPenaltyModal`](src/lib/components/pos/LeftoverPenaltyModal.svelte:1) + [`applyLeftoverPenalty()`](src/lib/stores/pos.svelte.ts:430) fully implemented. Waive option requires Manager PIN. |
| 23 | **Merging Tables** | ❌ NOT SUPPORTED | Not Viable | **No merge table functionality**. Can transfer Table A → Table B only if Table B is empty. Cannot combine two active bills. |

**Key Gaps for Mid-Service:**
- No table merging (combining two active orders)
- No dedicated takeout packaging flag for kitchen
- Timer extension logic for latecomers not explicit (pax updates but timer continues)

---

### 💸 COMPLEX PAYMENT & PROMOTIONS (24-26)

| # | Scenario | Status | Viability | Notes |
|---|----------|--------|-----------|-------|
| 24 | **Complex Split Billing** | ✅ SUPPORTED | Viable | [`SplitBillModal`](src/lib/components/pos/SplitBillModal.svelte:1) supports both **equal split** and **by-item split**. Multiple payment methods per sub-bill supported. |
| 25 | **Promo vs Mandated Discount Stacking** | ❌ NOT SUPPORTED | Not Viable | **No discount stacking logic**. Only one discount type allowed per order. No conflict detection or "best savings" auto-selection. |
| 26 | **Post-Payment Partial Refund** | ❌ NOT SUPPORTED | Not Viable | **No post-settlement void flow**. Once order status is `'paid'`, cannot modify. No "Refund Owed" logging mechanism. |

**Key Gaps for Payments:**
- Single discount type per order (cannot combine promo + senior)
- No post-payment modification capability
- No automatic "best discount" calculation

---

### 🛑 OPERATIONAL INTERRUPTIONS (27-29)

| # | Scenario | Status | Viability | Notes |
|---|----------|--------|-----------|-------|
| 27 | **Table Transfer (Physical Move)** | ✅ SUPPORTED | Viable | [`TransferTableModal`](src/lib/components/pos/TransferTableModal.svelte:1) + [`transferTable()`](src/lib/stores/pos.svelte.ts:492) fully implemented. Preserves timer, items, KDS routing. |
| 28 | **Pausing Session Timer** | ❌ NOT SUPPORTED | Not Viable | **No pause timer functionality**. [`tickTimers()`](src/lib/stores/pos.svelte.ts:178) runs continuously. No manager PIN override for grill malfunction scenarios. |
| 29 | **Staff Meal / Owner Comp** | ⚠️ PARTIAL | Partially Viable | Can apply `'comp'` discount (100% off), but **no dedicated payment type** that logs as "Cost of Goods". Logs as discount rather than expense. |

**Key Gaps for Operations:**
- No session timer pause for equipment failures
- No distinct "Staff Meal" payment type in reporting

---

## Summary Matrix

| Category | Total | ✅ Supported | ⚠️ Partial | ❌ Not Supported |
|----------|-------|--------------|------------|------------------|
| Dine-In (1-10) | 10 | 4 | 5 | 1 |
| Take-Out (11-12) | 2 | 1 | 1 | 0 |
| Failed Orders (13-17) | 5 | 2 | 2 | 1 |
| Mid-Service (18-23) | 6 | 4 | 1 | 1 |
| Payment/Promo (24-26) | 3 | 1 | 0 | 2 |
| Operations (27-29) | 3 | 1 | 1 | 1 |
| **TOTAL** | **29** | **13 (45%)** | **10 (34%)** | **6 (21%)** |

---

## Critical Missing Features (Blocking)

1. **Per-Person Demographics** - Cannot handle kid/senior/adult mix on same table with different rates
2. **Multiple Senior Discounts** - Only one discount type per order; cannot pro-rate discounts
3. **Table Merging** - Cannot combine two active bills mid-service
4. **Timer Pause** - No way to handle equipment failures affecting dining time
5. **KDS Bidirectional** - Kitchen cannot reject out-of-stock items back to POS
6. **Post-Payment Refunds** - Cannot modify paid orders for partial refunds
7. **Discount Stacking Logic** - No conflict resolution for multiple discounts

---

## Recommended Priority Order

### P0 (Critical - Blocking Major Scenarios)
- Per-person demographic tracking with tiered pricing
- Multiple discount handling per order
- Table merging functionality

### P1 (High - Common Operational Needs)
- Session timer pause for emergencies
- Post-payment partial refund flow
- KDS bidirectional communication

### P2 (Medium - Nice to Have)
- Auto-gratuity for large parties
- Incident report attachments
- Scheduled takeout pickup times

---

## Files Referenced

- [`src/lib/stores/pos.svelte.ts`](src/lib/stores/pos.svelte.ts) - Core POS logic
- [`src/lib/components/pos/CheckoutModal.svelte`](src/lib/components/pos/CheckoutModal.svelte) - Discount application
- [`src/lib/components/pos/SplitBillModal.svelte`](src/lib/components/pos/SplitBillModal.svelte) - Bill splitting
- [`src/lib/components/pos/TransferTableModal.svelte`](src/lib/components/pos/TransferTableModal.svelte) - Table transfers
- [`src/lib/components/pos/PackageChangeModal.svelte`](src/lib/components/pos/PackageChangeModal.svelte) - Package upgrades
- [`src/lib/components/pos/PaxChangeModal.svelte`](src/lib/components/pos/PaxChangeModal.svelte) - Adding pax
- [`src/lib/components/pos/LeftoverPenaltyModal.svelte`](src/lib/components/pos/LeftoverPenaltyModal.svelte) - Leftover charges
- [`src/lib/components/pos/VoidModal.svelte`](src/lib/components/pos/VoidModal.svelte) - Order cancellation
- [`src/lib/types.ts`](src/lib/types.ts) - Data models

---

*End of Assessment*
