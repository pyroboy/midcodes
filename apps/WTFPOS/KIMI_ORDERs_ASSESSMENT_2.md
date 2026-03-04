# WTFPOS - Order Scenarios Viability Assessment

**Assessment Date:** 2026-03-04  
**Assessor:** Kimi K2.5  
**App Version:** Current codebase analysis

---

## Executive Summary

| Category | Viable | Partial | Not Viable | Total |
|----------|--------|---------|------------|-------|
| Dine-In Scenarios | 5 | 5 | 0 | 10 |
| Take-Out Scenarios | 1 | 1 | 0 | 2 |
| Failed Orders | 3 | 2 | 0 | 5 |
| Mid-Service Modifications | 5 | 1 | 0 | 6 |
| Complex Payment & Promos | 0 | 3 | 0 | 3 |
| Operational Interruptions | 1 | 2 | 0 | 3 |
| **TOTAL** | **15** | **14** | **0** | **29** |

**Overall Assessment:** The WTFPOS app covers approximately **52% fully** of the scenarios and **48% partially**. No scenarios are completely unviable, indicating a solid foundation with room for enhancement in complex discount logic, per-person pricing tiers, and advanced operational features.

---

## 🍽️ Dine-In Scenarios (1-10)

### Scenario 1: The Solo Diner (1 Person)
**Status:** ✅ VIABLE (with gap)

| Aspect | Support | Notes |
|--------|---------|-------|
| Table assignment | ✅ Full | [`openTable()`](src/lib/stores/pos.svelte.ts:104) supports 1 pax |
| Order creation | ✅ Full | Standard unlimited package flow |
| Solo surcharge prompt | ⚠️ Missing | No validation for minimum party size or solo surcharge warning |

**Gap:** The system allows solo diners but doesn't prompt for solo diner protocols or surcharges that some K-BBQ establishments require.

---

### Scenario 2: The Date / Standard Couple (2 Persons)
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Table assignment | ✅ Full | Standard 2-4 person tables available |
| Package ordering | ✅ Full | [`addItemToOrder()`](src/lib/stores/pos.svelte.ts:266) handles packages |
| Session timer | ✅ Full | [`tickTimers()`](src/lib/stores/pos.svelte.ts:178) tracks 90-min session |
| KDS routing | ✅ Full | Auto-created KDS tickets on order |

---

### Scenario 3: Small Family with a Child (3 Persons)
**Status:** ⚠️ PARTIALLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Pax entry | ✅ Full | [`PaxModal`](src/lib/components/pos/PaxModal.svelte:1) supports 3 pax |
| Adult packages | ✅ Full | Standard unlimited rates apply |
| **Kid pricing tiers** | ❌ Missing | No height/age bracket prompts ("Below 3ft - Free", "3ft-4ft - Half Price") |
| Inventory tracking | ✅ Full | [`deductFromStock()`](src/lib/stores/stock.svelte.ts:1) tracks consumption |

**Gap:** The system treats all pax equally. There's no per-person demographic pricing (kid rates based on height/age).

---

### Scenario 4: Multi-Generational Family (4 Persons)
**Status:** ⚠️ PARTIALLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Mixed demographics | ✅ Partial | System has pax count but no per-person demographic tracking |
| Senior Citizen discount | ⚠️ Limitation | [`discountType`](src/lib/types.ts:75) supports 'senior' but applies to **entire bill**, not per-person |
| SC ID input | ❌ Missing | No field for Senior Citizen ID number |
| VAT exemption | ✅ Full | [`recalcOrder()`](src/lib/stores/pos.svelte.ts:298) handles VAT-exempt for SC/PWD |

**Gap:** Current implementation applies senior discount to the entire bill. Scenario requires per-person discount application (20% on 1/4 of bill only).

---

### Scenario 5: Group of Friends (5 Persons)
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Large party handling | ✅ Full | Tables support up to 10 capacity |
| Initial meat drop | ✅ Full | Package `meats` array auto-adds initial meats |
| KDS batching | ✅ Partial | Initial meats added as single ticket |

---

### Scenario 6: Extended Family Dinner (6 Persons)
**Status:** ⚠️ PARTIALLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Multiple SC/PWD | ⚠️ Limitation | Same as Scenario 4 - discount applies to whole bill |
| Per-person calculation | ❌ Missing | Cannot apply 20% to 2/6ths of bill only |
| Separate ID inputs | ❌ Missing | No multi-SC ID capture |

**Gap:** Complex proportional discount math not supported. Need per-person demographic tracking.

---

### Scenario 7: Kids' Birthday Celebration (7 Persons)
**Status:** ⚠️ PARTIALLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| High kid count | ✅ Full | Pax supports 7 |
| **Individual kid pricing** | ❌ Missing | No per-child height/age tier entry |
| Table aggregation | ✅ Full | Single order groups all items |

**Gap:** Same as Scenario 3 - no individual kid pricing tiers.

---

### Scenario 8: Office Team Building (8 Persons)
**Status:** ✅ VIABLE (with gap)

| Aspect | Support | Notes |
|--------|---------|-------|
| Large table | ✅ Full | Tables support up to 10 capacity |
| "Merged Table" status | ⚠️ Manual | No explicit merged table flag, but [`MergeTablesModal`](src/lib/components/pos/MergeTablesModal.svelte:1) exists |
| Multiple grills logic | ❌ Missing | No automatic doubling of sides/initial meats for large parties |
| KDS load handling | ✅ Full | All items routed to KDS |

**Gap:** No automatic multiplier logic for large parties (e.g., auto-double initial drops for parties 8+).

---

### Scenario 9: The Big Family Gathering (9 Persons)
**Status:** ⚠️ PARTIALLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Complex pricing mix | ⚠️ Limitation | Standard + Kid + Senior mixing not fully supported per-person |
| Split billing | ✅ Full | [`SplitBillModal`](src/lib/components/pos/SplitBillModal.svelte:1) supports complex splits |
| Multiple payment methods | ✅ Full | Sub-bills can use different payment types |

**Gap:** Ultimate test of per-person pricing logic - requires Scenarios 3, 4, 6 gaps resolved.

---

### Scenario 10: Full Party / Max Capacity Table (10 Persons)
**Status:** ⚠️ PARTIALLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Max capacity | ✅ Full | Table capacity supports 10 |
| **Auto service charge** | ❌ Missing | No automatic gratuity trigger for parties 8+ |
| KDS heavy load | ✅ Full | All items sent to KDS |

**Gap:** No configurable auto-service charge threshold in [`recalcOrder()`](src/lib/stores/pos.svelte.ts:298).

---

## 🥡 Take-Out Scenarios (11-12)

### Scenario 11: Standard Solo Take-Out
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Order creation | ✅ Full | [`createTakeoutOrder()`](src/lib/stores/pos.svelte.ts:120) |
| No table assignment | ✅ Full | `tableId: null` for takeout |
| Customer name | ✅ Full | [`NewTakeoutModal`](src/lib/components/pos/NewTakeoutModal.svelte:1) captures name |
| Pickup time | ⚠️ Manual | No scheduled pickup - immediate only |
| KDS routing | ✅ Full | Takeout orders create KDS tickets |
| Active takeout lane | ✅ Full | [`TakeoutQueue`](src/lib/components/pos/TakeoutQueue.svelte:1) tracks status |

---

### Scenario 12: Family Bundle Take-Out
**Status:** ⚠️ PARTIALLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Bundle concept | ❌ Missing | No pre-packaged bundle items defined |
| Senior discount on bundle | ❌ Missing | Cannot apply partial discount to bundle portion |
| Manager override | ✅ Full | Manager PIN modal available |

**Gap:** Bundle items with partitioned discounts not implemented. Would need bundle menu items with discount-applicable portions.

---

## ⚠️ Failed Orders & Exceptions (13-17)

### Scenario 13: The "Change of Heart" (Walk-Out Before Ordering)
**Status:** ⚠️ PARTIALLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Clear table | ✅ Full | Table can be set to 'available' |
| **Zero-Value Cancellation** | ❌ Missing | No explicit "Zero-Value Cancellation" log type |
| Turnover metrics | ⚠️ Manual | Would need custom tracking metric |

**Gap:** [`VoidModal`](src/lib/components/pos/VoidModal.svelte:1) supports 'walkout' reason but expects active order. No pre-order clearing with specific logging.

---

### Scenario 14: Failed Payment on Take-Out / No Show
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Void transaction | ✅ Full | [`voidOrder()`](src/lib/stores/pos.svelte.ts:315) with 'walkout' reason |
| Waste logging | ✅ Full | [`WasteLog`](src/lib/components/stock/WasteLog.svelte:1) + [`restoreStock()`](src/lib/stores/stock.svelte.ts:1) handles inventory |
| Stock restoration | ✅ Full | Stock can be marked as waste/spoilage |

---

### Scenario 15: The "Dine & Dash" or Medical Emergency
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Comp/Emergency payment type | ✅ Full | [`discountType`](src/lib/types.ts:75) includes 'comp' and 'service_recovery' |
| Manager authorization | ✅ Full | PIN required for comp/service_recovery in [`CheckoutModal`](src/lib/components/pos/CheckoutModal.svelte:40) |
| Inventory deduction | ✅ Full | Items remain in order, stock already deducted |
| Incident report | ⚠️ Partial | [`log`](src/lib/stores/audit.svelte.ts:1) records but no structured incident report attachment |

**Implementation:** Use comp discount (100% off) for walk-outs/emergencies.

---

### Scenario 16: Kitchen Rejection (Out of Stock Post-Order)
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Kitchen rejection | ✅ Full | [`refuseItem()`](src/lib/stores/alert.svelte.ts:44) in alert store |
| POS notification | ✅ Full | [`KitchenAlert`](src/lib/stores/alert.svelte.ts:11) displays on POS |
| Stock restoration | ✅ Full | [`restoreStock()`](src/lib/stores/stock.svelte.ts:1) called automatically |
| Order modification | ✅ Full | [`rejectOrderItem()`](src/lib/stores/pos.svelte.ts:378) cancels item and recalculates |

**Implementation:** Kitchen uses refuseItem → POS shows alert → Waiter acknowledges → Order auto-updates.

---

### Scenario 17: User Error (Wrong Table Punched)
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Transfer order | ✅ Full | [`TransferTableModal`](src/lib/components/pos/TransferTableModal.svelte:1) + [`transferTable()`](src/lib/stores/pos.svelte.ts:518) |
| Manager PIN | ✅ Full | Required for transfer confirmation |
| KDS update | ✅ Full | Ticket tableNumber auto-updates |
| Item detachment | ⚠️ Workaround | Full transfer only, no partial item moves |

---

## 🔄 Mid-Service Modifications (18-23)

### Scenario 18: Mid-Service Takeout Request
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Add takeout item | ✅ Full | [`AddItemModal`](src/lib/components/pos/AddItemModal.svelte:94) supports `isTakeout` flag |
| Kitchen flag | ✅ Full | Notes field can pass "[TAKEOUT]" to kitchen |
| Bill consolidation | ✅ Full | Item added to same order, single bill |

---

### Scenario 19: The Latecomer (Adding Pax Mid-Session)
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Add pax | ✅ Full | [`PaxChangeModal`](src/lib/components/pos/PaxChangeModal.svelte:1) + [`changePax()`](src/lib/stores/pos.svelte.ts:429) |
| Manager PIN | ✅ Full | Required for pax change |
| Package price update | ✅ Full | Auto-recalculates if package exists |
| Timer logic | ⚠️ Partial | Latecomer tied to original table deadline (no extension logic) |

**Gap:** No automatic extension option for latecomers - they must finish with original table's time.

---

### Scenario 20: Free Add-Ons (Zero Dollar Items)
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Zero-dollar items | ✅ Full | [`isFree`](src/lib/types.ts:47) flag on MenuItem |
| KDS routing | ✅ Full | Free items still create KDS tickets |
| Inventory tracking | ✅ Full | [`deductFromStock()`](src/lib/stores/stock.svelte.ts:1) runs for all items |

**Implementation:** Rice has `isFree: true` in menu - rings up at ₱0.00, goes to KDS, deducts inventory.

---

### Scenario 21: Mid-Meal Package Upgrade
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Upgrade flow | ✅ Full | [`PackageChangeModal`](src/lib/components/pos/PackageChangeModal.svelte:1) |
| Price adjustment | ✅ Full | Retroactive price update for all pax |
| No PIN for upgrade | ✅ Full | Free upgrades, PIN only for downgrade |
| Menu unlocking | ⚠️ Manual | Premium items must be manually added - no automatic menu filter unlock |

**Implementation:** [`changePackage()`](src/lib/stores/pos.svelte.ts:679) handles upgrade/downgrade logic.

---

### Scenario 22: Leftover Charge (The "No Waste" Policy)
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Penalty calculation | ✅ Full | [`LeftoverPenaltyModal`](src/lib/components/pos/LeftoverPenaltyModal.svelte:1) |
| Weight input | ✅ Full | Gram-based calculation with configurable rate |
| Manager waive | ✅ Full | PIN required to waive penalty |
| Distinct revenue stream | ⚠️ Partial | Logged as line item, not separate revenue category |

---

### Scenario 23: Merging Tables Mid-Service
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Merge command | ✅ Full | [`MergeTablesModal`](src/lib/components/pos/MergeTablesModal.svelte:1) + [`mergeTables()`](src/lib/stores/pos.svelte.ts:557) |
| Item consolidation | ✅ Full | All items moved to primary table |
| Timer handling | ⚠️ Partial | Uses earliest expiration (hardcoded logic gap) |
| Package conflict | ✅ Full | Warns if different packages, handles gracefully |
| Secondary table clear | ✅ Full | Reset to available |

---

## 💸 Complex Payment & Promotion Scenarios (24-26)

### Scenario 24: Complex Split Billing
**Status:** ⚠️ PARTIALLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Equal split | ✅ Full | [`initEqualSplit()`](src/lib/stores/pos.svelte.ts:726) |
| By-item split | ✅ Full | [`initItemSplit()`](src/lib/stores/pos.svelte.ts:750) |
| Multiple payment methods | ✅ Full | Each sub-bill can use different method |
| **Itemized to guest** | ⚠️ Limitation | Can assign items to guests, but no "alcohol to Person A" specific tracking |
| **Fractional splits** | ⚠️ Limitation | Equal split divides total, not specific item categories |

**Gap:** Cannot specify "Person A pays for all alcohol" - would need category-based assignment.

---

### Scenario 25: Promo Code vs. Mandated Discount Stacking
**Status:** ⚠️ PARTIALLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Discount types | ✅ Full | 'senior', 'pwd', 'promo', 'comp' in [`DiscountType`](src/lib/types.ts:75) |
| **Conflict detection** | ❌ Missing | No automatic stacking prevention logic |
| **Auto-best-discount** | ❌ Missing | Doesn't auto-calculate best option |
| Manager override | ✅ Full | Manual discount selection with PIN |

**Gap:** No discount conflict resolution engine. Manual policy enforcement required.

---

### Scenario 26: Post-Payment Partial Refund
**Status:** ⚠️ PARTIALLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| **Post-settlement void** | ❌ Missing | No "reopen closed ticket" functionality |
| Refund owed tracking | ❌ Missing | No "Refund Owed" amount field |
| Item removal from paid | ❌ Missing | Cannot modify paid orders |
| Revenue preservation | ⚠️ Partial | Would need manual adjustment entries |

**Gap:** Once [`status`](src/lib/types.ts:111) is 'paid', order is immutable. No post-payment modification flow.

---

## 🛑 Real-World Operational Interruptions (27-29)

### Scenario 27: The Table Transfer (Physical Move)
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Full table transfer | ✅ Full | Same as Scenario 17 - [`transferTable()`](src/lib/stores/pos.svelte.ts:518) |
| Session preservation | ✅ Full | Timer, items, KDS routing all preserved |
| Data integrity | ✅ Full | Order continuity maintained |

---

### Scenario 28: Pausing the Session Timer
**Status:** ⚠️ PARTIALLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| **Pause function** | ❌ Missing | No "Table Pause" feature in [`tickTimers()`](src/lib/stores/pos.svelte.ts:178) |
| Manager PIN | N/A | Would require implementation |
| Duration logging | ❌ Missing | No interruption duration tracking |
| KDS metrics protection | ❌ Missing | No pause exclusion from kitchen metrics |

**Gap:** Timer runs continuously. No pause for equipment failure, bathroom breaks, etc.

---

### Scenario 29: Staff Meal / Owner Comp
**Status:** ✅ FULLY VIABLE

| Aspect | Support | Notes |
|--------|---------|-------|
| Order entry | ✅ Full | Normal order flow |
| KDS preparation | ✅ Full | Items sent to kitchen normally |
| Inventory deduction | ✅ Full | Stock deducted like regular orders |
| **100% comp payment** | ✅ Full | 'comp' [`discountType`](src/lib/types.ts:75) applies 100% discount |
| **Cost tracking** | ⚠️ Partial | Logs as discount, not explicit "Cost of Goods" category |

**Implementation:** Use 'comp' discount type at checkout (requires manager PIN).

---

## Summary of Critical Gaps

### High Priority (Revenue/Legal Impact)

| Gap | Scenarios Affected | Impact |
|-----|-------------------|--------|
| Per-person demographic pricing | 3, 4, 6, 7, 9 | Cannot correctly apply kid/senior discounts per person |
| Post-payment void/refund | 26 | No way to handle post-checkout issues |
| Discount conflict resolution | 25 | Manual enforcement of non-stacking policies |
| Auto service charge | 10 | Missing large party gratuity |

### Medium Priority (Operational Efficiency)

| Gap | Scenarios Affected | Impact |
|-----|-------------------|--------|
| Session pause | 28 | Cannot handle equipment failures fairly |
| Scheduled takeout pickup | 11 | No advance ordering capability |
| Bundle items | 12 | Cannot sell pre-packaged family bundles |
| Solo diner surcharge | 1 | Missed revenue opportunity |

### Low Priority (Nice to Have)

| Gap | Scenarios Affected | Impact |
|-----|-------------------|--------|
| Zero-value cancellation logging | 13 | Metric accuracy for table turnover |
| Incident report attachment | 15 | Documentation for walk-outs |
| Automatic large party multipliers | 8 | Kitchen efficiency for big groups |
| Category-based split billing | 24 | Complex payment scenarios |

---

## Recommendations

### Immediate Actions
1. **Implement per-person pricing model** - Add `guests` array to Order with demographics
2. **Add post-payment void flow** - Allow reopening paid orders with manager PIN
3. **Add discount conflict engine** - Auto-detect and resolve stacking violations

### Short-term Improvements
4. **Add session pause feature** - Manager PIN to pause timer with reason logging
5. **Add service charge configuration** - Auto-apply for parties above threshold
6. **Enhance split billing** - Category-based assignment for alcohol/separates

### Long-term Enhancements
7. **Scheduled orders** - Future pickup time slots for takeout
8. **Bundle menu items** - Pre-configured packages with partial discount rules
9. **Advanced incident tracking** - Structured reports for security/comps
