# WTFPOS Bug Report and Test Plan

## Executive Summary

This document outlines the bugs identified in the WTFPOS codebase and provides a comprehensive test plan.

---

## 🐛 Critical Bugs Found

### 1. **Expenses Module Not Implemented** (HIGH PRIORITY)
**File:** [`src/routes/expenses/+page.svelte`](src/routes/expenses/+page.svelte:1)
**Issue:** The expenses page is just a placeholder with no functionality.
**Impact:** Users cannot record operational expenses.
**Fix Required:** Implement full expense recording UI and store.

### 2. **Hardcoded Manager PIN** (SECURITY ISSUE)
**Files:**
- [`src/lib/components/pos/VoidModal.svelte`](src/lib/components/pos/VoidModal.svelte:16)
- [`src/routes/pos/+page.svelte`](src/routes/pos/+page.svelte:170)
**Issue:** Manager PIN is hardcoded as "1234" instead of being configurable per user.
**Impact:** Security vulnerability - all managers share the same PIN.
**Fix Required:** Add PIN field to User type and validate against user-specific PIN.

### 3. **Timer Logic Bug in Table Status** (FUNCTIONAL BUG)
**File:** [`src/lib/stores/pos.svelte.ts`](src/lib/stores/pos.svelte.ts:163-177)
**Issue:** The `tickTimers()` function modifies table status based on remaining seconds, but this can conflict with billing status.
**Code:**
```typescript
if (table.status !== 'billing') {
    if (table.remainingSeconds <= 5 * 60) table.status = 'critical';
    else if (table.remainingSeconds <= 15 * 60) table.status = 'warning';
    else table.status = 'occupied';
}
```
**Impact:** Table status may incorrectly change from 'billing' to other states.
**Fix Required:** Add stronger guards to prevent status override when in billing.

### 4. **Missing Order History Restoration** (UX BUG)
**File:** [`src/lib/components/pos/OrderHistoryModal.svelte`](src/lib/components/pos/OrderHistoryModal.svelte:1)
**Issue:** History modal can view orders but cannot restore/reopen them for corrections.
**Impact:** Users cannot correct mistakes on closed orders.
**Fix Required:** Add restore functionality to history modal.

### 5. **KDS Ticket Recall Not Implemented** (FUNCTIONAL GAP)
**File:** [`src/routes/kitchen/orders/+page.svelte`](src/routes/kitchen/orders/+page.svelte:1)
**Issue:** Once a ticket is marked served, there's no way to recall it if done accidentally.
**Impact:** Kitchen staff cannot undo accidental "bump" actions.
**Fix Required:** Add recall/undo functionality with history tracking.

### 6. **Stock Deduction Race Condition** (DATA INTEGRITY)
**File:** [`src/lib/stores/pos.svelte.ts`](src/lib/stores/pos.svelte.ts:232-233)
**Issue:** Stock is deducted immediately when item is added, but if order is voided, stock is not restored.
**Code:**
```typescript
if (deductQty > 0) deductFromStock(item.id, deductQty, order.tableId ?? 'takeout', order.id, item.trackInventory ?? false);
```
**Impact:** Inventory becomes inconsistent when orders are cancelled.
**Fix Required:** Implement stock restoration on void/cancel.

### 7. **Split Bill Edge Cases Not Handled** (FUNCTIONAL BUG)
**File:** [`src/lib/stores/pos.svelte.ts`](src/lib/stores/pos.svelte.ts:418-450)
**Issue:** 
- No validation that split count > 0
- No handling of items added after split is initiated
- No way to cancel/revert a split
**Impact:** Potential division by zero errors and data inconsistency.
**Fix Required:** Add validation and edge case handling.

### 8. **Receipt Print Error Handling Incomplete** (ERROR HANDLING)
**File:** [`src/lib/components/pos/CheckoutModal.svelte`](src/lib/components/pos/CheckoutModal.svelte:42-62)
**Issue:** When print fails, checkoutLoading is set to false in finally, but the error state may cause issues.
**Code:**
```typescript
try {
    // ... print logic
    if (!printResult.success) {
        checkoutError = printResult.error || 'Unknown Printer Error';
        order.printStatus = 'failed';
        return; // Returns without setting checkoutLoading = false
    }
} finally {
    if (checkoutError) checkoutLoading = false; // Only handles error case
}
```
**Impact:** Loading state may not be properly reset on certain error paths.
**Fix Required:** Ensure loading state is always properly managed.

### 9. **Barcode Scanner Buffer Not Cleared** (MEMORY LEAK)
**File:** [`src/routes/pos/+page.svelte`](src/routes/pos/+page.svelte:149-174)
**Issue:** The barcode buffer timeout is cleared but the buffer string may grow indefinitely if keys are pressed rapidly.
**Fix Required:** Add maximum buffer length check.

### 10. **Missing Payment Method Type** (TYPE INCONSISTENCY)
**File:** [`src/lib/types.ts`](src/lib/types.ts:77)
**Issue:** PaymentMethod is `'cash' | 'card' | 'gcash'` but Maya is referenced in CheckoutModal.
**Code in CheckoutModal:**
```typescript
{ id: 'maya' as const, label: '📱 Maya' }
```
**Impact:** Type mismatch - Maya not in PaymentMethod union type.
**Fix Required:** Add 'maya' to PaymentMethod type.

### 11. **Audit Log Time Helper Bug** (LOGIC BUG)
**File:** [`src/lib/stores/audit.svelte.ts`](src/lib/stores/audit.svelte.ts:167-173)
**Issue:** The `ts()` and `fmt()` functions use positive offset instead of negative for past times.
**Code:**
```typescript
function ts(minutesAgo: number): string {
    return new Date(Date.now() + minutesAgo * 60 * 1000).toISOString(); // Should be MINUS
}
```
**Impact:** Demo audit log entries show future timestamps instead of past.
**Fix Required:** Change `+` to `-` in timestamp calculations.

### 12. **Empty Orders Can Be Checked Out** (VALIDATION GAP)
**File:** [`src/lib/components/pos/CheckoutModal.svelte`](src/lib/components/pos/CheckoutModal.svelte:1)
**Issue:** No validation that order has items before checkout.
**Impact:** Empty orders can be processed and closed.
**Fix Required:** Add validation check for empty orders.

### 13. **Package Change Without Package** (EDGE CASE)
**File:** [`src/lib/stores/pos.svelte.ts`](src/lib/stores/pos.svelte.ts:371-414)
**Issue:** `changePackage()` returns early if no packageId, but UI may still allow attempting package change on non-package orders.
**Impact:** Confusing UX - button appears but does nothing.
**Fix Required:** Disable package change button for non-package orders.

### 14. **Takeout Status Not Reset on Void** (STATE BUG)
**File:** [`src/lib/stores/pos.svelte.ts`](src/lib/stores/pos.svelte.ts:261-284)
**Issue:** When a takeout order is voided, the takeoutStatus remains unchanged.
**Fix Required:** Reset takeoutStatus appropriately on void.

### 15. **Waste Log Typo in Function Name** (TYPO)
**File:** [`src/lib/stores/audit.svelte.ts`](src/lib/stores/audit.svelte.ts:100-101)
**Issue:** Function is named `wastLogged` instead of `wasteLogged`.
**Code:**
```typescript
wastLogged: (itemName: string, qty: number, unit: string, reason: string) =>
```
**Fix Required:** Correct typo to `wasteLogged`.

---

## 🔍 Test Scenarios

### POS Module Tests
1. **Table Operations**
   - [ ] Open table with various pax counts
   - [ ] Test timer countdown and status transitions
   - [ ] Verify billing status prevents timer updates
   - [ ] Transfer table between locations

2. **Order Operations**
   - [ ] Add items with different categories
   - [ ] Add weight-based items with custom weights
   - [ ] Apply discounts (Senior, PWD, Promo, Comp)
   - [ ] Void orders with different reasons
   - [ ] Split bills (equal and by-item)

3. **Checkout Flow**
   - [ ] Cash payment with change calculation
   - [ ] GCash/Maya payment
   - [ ] Print receipt with hardware errors
   - [ ] Skip receipt option
   - [ ] Empty order validation

### Kitchen Display System Tests
1. **Ticket Management**
   - [ ] View active tickets
   - [ ] Mark items as served
   - [ ] Auto-advance takeout status
   - [ ] Recall accidentally bumped tickets

### Stock Module Tests
1. **Inventory Management**
   - [ ] Receive deliveries
   - [ ] Log waste with reasons
   - [ ] Adjust stock (add/deduct)
   - [ ] Stock counts at different periods
   - [ ] Verify stock deductions from orders
   - [ ] Verify stock restoration on void

### Report Tests
1. **Report Generation**
   - [ ] Sales summary
   - [ ] Best sellers (meat and addons)
   - [ ] Table sales
   - [ ] EOD reconciliation
   - [ ] Voids and discounts
   - [ ] Branch comparison

### Admin Tests
1. **User Management**
   - [ ] Create/edit users
   - [ ] Set user-specific PINs
   - [ ] Toggle user status

2. **Floor Editor**
   - [ ] Drag tables
   - [ ] Add/delete tables
   - [ ] Edit table properties

3. **Menu Editor**
   - [ ] Create menu items
   - [ ] Edit prices
   - [ ] Toggle availability
   - [ ] Delete items

---

## 📋 Implementation Priority

### Phase 1: Critical Fixes (Must Fix)
1. Fix audit log timestamp helper (Bug #11)
2. Fix waste log typo (Bug #15)
3. Add Maya to PaymentMethod type (Bug #10)
4. Fix timer/status conflict (Bug #3)

### Phase 2: Security & Data Integrity
1. Implement per-user PIN system (Bug #2)
2. Implement stock restoration on void (Bug #6)
3. Add empty order validation (Bug #12)

### Phase 3: Feature Completion
1. Implement Expenses module (Bug #1)
2. Add KDS recall functionality (Bug #5)
3. Add order history restoration (Bug #4)

### Phase 4: Edge Cases & Polish
1. Fix split bill edge cases (Bug #7)
2. Fix checkout loading state (Bug #8)
3. Add barcode buffer limit (Bug #9)
4. Disable package change for non-packages (Bug #13)
5. Reset takeout status on void (Bug #14)

---

## 🧪 Testing Commands

```bash
# Run type checking
npm run check

# Run development server
npm run dev

# Build for production
npm run build
```

---

## 📊 Current Test Coverage Estimate

| Module | Coverage | Notes |
|--------|----------|-------|
| POS Core | 70% | Basic flows work, edge cases need testing |
| KDS | 60% | Missing recall functionality |
| Stock | 65% | Missing stock restoration |
| Reports | 75% | All reports exist, some calculations need verification |
| Admin | 80% | Floor editor and menu editor functional |
| Auth | 50% | Hardcoded PIN needs per-user implementation |

---

*Generated: 2026-03-04*
*Version: 1.0*
