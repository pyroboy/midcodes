# Trace Templates — Common WTFPOS Flows

Pre-built trace patterns for the most common scenario actions. Use these as starting points
when tracing a scenario — they tell you exactly which files to read and what to verify.

---

## T1 — Staff Opens Table

**Actions:** Tap table on floor plan → PaxModal → enter pax → select package → CHARGE

**Trace:**
```
FloorPlan.svelte
  └─ SVG table click → handler calls tablesStore function
      └─ tables.svelte.ts → openTable() or equivalent
          └─ RxDB: tables.incrementalPatch({ status: 'occupied', pax, ... })
          └─ Verify: updatedAt ✅, locationId ✅
  └─ Triggers: PaxModal opens (state var in pos/+page.svelte)

PaxModal.svelte
  └─ Pax input → package select
  └─ On confirm: orders.svelte.ts → createOrder()
      └─ RxDB: orders collection insert
      └─ Verify: orderId via nanoid(), locationId, tableId, packageType

pos/+page.svelte
  └─ Verify PaxModal is imported and mounted
  └─ Verify state var for PaxModal visibility
  └─ Verify OrderSidebar receives active order
```

**Files to read:** `pos/+page.svelte`, `FloorPlan.svelte`, `PaxModal.svelte`, `tables.svelte.ts`, `orders.svelte.ts`

---

## T2 — Staff Adds Items

**Actions:** Tap "Add Item" → AddItemModal → browse/search → tap item → set quantity → confirm

**Trace:**
```
OrderSidebar.svelte
  └─ "Add Item" button → opens AddItemModal (state var)

AddItemModal.svelte
  └─ Reads menu items from menu.svelte.ts
  └─ Category filter → item grid → quantity selector
  └─ On confirm: orders.svelte.ts → addItemToOrder()
      └─ RxDB: orders.incrementalModify (push to items array)
      └─ Verify: item has menuItemId, name, price, quantity
      └─ Verify: updatedAt on the order doc

menu.svelte.ts
  └─ Verify: reads from menu_items collection
  └─ Verify: availability filter (isAvailable flag)
  └─ Note: menu_items are global (no locationId filter)
```

**Files to read:** `OrderSidebar.svelte`, `AddItemModal.svelte`, `menu.svelte.ts`, `orders.svelte.ts`

---

## T3 — Staff Checkout

**Actions:** Tap "Checkout" → CheckoutModal → select payment method → enter amount → confirm

**Trace:**
```
OrderSidebar.svelte
  └─ "Checkout" button → opens CheckoutModal
  └─ Prerequisite: order must have items, table should be served

CheckoutModal.svelte
  └─ Reads order from orders.svelte.ts (active order)
  └─ Displays totals via utils.ts → calculateOrderTotals()
  └─ Payment method selection (Cash, GCash, Maya)
  └─ Discount section (SC/PWD)
  └─ Amount entry → change calculation
  └─ On confirm: orders.svelte.ts → checkoutOrder() or equivalent
      └─ RxDB: orders.incrementalPatch({ status: 'closed', paymentMethod, ... })
      └─ RxDB: tables.incrementalPatch({ status: 'idle', ... })
      └─ Verify: updatedAt on both docs

payment.utils.ts
  └─ calculateLeftoverPenalty()
  └─ VAT calculations
  └─ Discount calculations (pro-rata for AYCE)
```

**Files to read:** `OrderSidebar.svelte`, `CheckoutModal.svelte`, `orders.svelte.ts`, `tables.svelte.ts`, `pos/utils.ts`, `payment.utils.ts`

---

## T4 — Kitchen Receives Ticket (Cross-Role)

**Actions:** Staff fires order → KDS ticket appears on kitchen display

**Trace (Write side — Staff):**
```
orders.svelte.ts → createOrder() or addItemToOrder()
  └─ RxDB: orders collection write
  └─ kds.svelte.ts → createKdsTicket() or auto-creation
      └─ RxDB: kds_tickets collection insert
      └─ Verify: ticket includes orderId, tableId, items, status
```

**Trace (Read side — Kitchen):**
```
kitchen/dispatch/+page.svelte OR kitchen/orders/+page.svelte
  └─ Reads from kds.svelte.ts (KDS store)
      └─ RxDB subscription: kds_tickets.find({ status: 'pending' })
      └─ Verify: filtered by locationId
  └─ Renders ticket cards
  └─ Verify: reactive — new ticket appears without manual refresh
```

**Files to read:** `orders.svelte.ts`, `kds.svelte.ts`, `kitchen/dispatch/+page.svelte`, `kitchen/orders/+page.svelte`

---

## T5 — Kitchen Bumps Ticket

**Actions:** Kitchen taps "DONE" on individual item or "All DONE" on ticket

**Trace:**
```
kitchen/dispatch/+page.svelte (or kitchen/orders/+page.svelte)
  └─ DONE button per item → kds.svelte.ts → bumpItem()
  └─ ALL DONE button → kds.svelte.ts → bumpTicket()
      └─ RxDB: kds_tickets.incrementalPatch({ bumpedAt, status: 'done' })
      └─ Verify: updatedAt ✅

Cross-role effect:
  └─ Staff's OrderSidebar should reflect served status
  └─ orders.svelte.ts reads → $derived reacts to bumped items
```

**Files to read:** `kitchen/dispatch/+page.svelte`, `kds.svelte.ts`, `OrderSidebar.svelte`, `orders.svelte.ts`

---

## T6 — Manager Receives Delivery

**Actions:** Navigate to /stock/deliveries → fill form → submit

**Trace:**
```
stock/deliveries/+page.svelte
  └─ ReceiveDelivery.svelte component mounted
  └─ Form fields: item, quantity, batch, expiry
  └─ On submit: stock.svelte.ts → receiveDelivery()
      └─ RxDB: deliveries collection insert
      └─ RxDB: stock_items.incrementalModify (increase quantity)
      └─ Verify: updatedAt on both, locationId on both
```

**Files to read:** `stock/deliveries/+page.svelte`, `ReceiveDelivery.svelte`, `stock.svelte.ts`

---

## T7 — Takeout Order

**Actions:** Staff opens NewTakeoutModal → adds items → processes payment

**Trace:**
```
pos/+page.svelte
  └─ Takeout button → NewTakeoutModal opens

NewTakeoutModal.svelte
  └─ Creates order with type: 'takeout' (no table assignment)
  └─ orders.svelte.ts → createTakeoutOrder()
      └─ RxDB: orders insert with isTakeout flag
      └─ Verify: no tableId required, nanoid for orderId

TakeoutQueue.svelte
  └─ Lists open takeout orders
  └─ Checkout triggers same CheckoutModal flow
```

**Files to read:** `pos/+page.svelte`, `NewTakeoutModal.svelte`, `TakeoutQueue.svelte`, `orders.svelte.ts`

---

## T8 — Split Bill

**Actions:** Staff opens SplitBillModal → divides items into sub-bills → checkouts each

**Trace:**
```
OrderSidebar.svelte
  └─ Split bill button → SplitBillModal opens

SplitBillModal.svelte
  └─ Reads order items from active order
  └─ Allows assigning items to sub-bills
  └─ payments.svelte.ts → createSubBills() or splitBill()
      └─ RxDB: orders.incrementalModify (add subBills array)
      └─ Verify: sub-bill totals add up to order total

CheckoutModal.svelte
  └─ Can checkout individual sub-bills
  └─ payments.svelte.ts → checkoutSubBill()
```

**Files to read:** `SplitBillModal.svelte`, `payments.svelte.ts`, `orders.svelte.ts`, `CheckoutModal.svelte`

---

## T9 — Void Item

**Actions:** Staff taps item → VoidModal → selects reason → manager PIN → item voided

**Trace:**
```
OrderSidebar.svelte
  └─ Item tap → void action
  └─ VoidModal opens with itemId

VoidModal.svelte
  └─ Reason selection
  └─ Manager PIN gate → ManagerPinModal
  └─ On confirm: orders.svelte.ts → voidItem()
      └─ RxDB: orders.incrementalModify (mark item as voided)
      └─ Verify: voidReason, voidedBy, voidedAt fields

Cross-role effect:
  └─ Kitchen KDS should show void overlay on the item
  └─ kds.svelte.ts reacts to voided item status
```

**Files to read:** `VoidModal.svelte`, `ManagerPinModal.svelte`, `orders.svelte.ts`, `kds.svelte.ts`

---

## How to Use

1. Identify which trace templates match your scenario actions
2. Read the listed files in order
3. At each trace point, verify the condition described
4. If any verification fails → flag as BLOCKER
5. If verification passes but patterns from KNOWN_PATTERNS.md apply → flag as WARNING
