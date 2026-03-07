# WTFPOS — E2E Test Coverage Assessment

## Current Coverage (12 POS Scenarios + 2 DB Tests)

| # | File | Scenario | Status |
|---|------|----------|--------|
| 1 | order.spec.ts | Dine-in: Unli Pork + Iced Tea, exact cash | COVERED |
| 2 | order.spec.ts | Takeout: Bibimbap + Soju, GCash | COVERED |
| 3 | order.spec.ts | 4 pax, Senior Citizen discount (1 pax), cash | COVERED |
| 4 | order.spec.ts | Void order with manager PIN | COVERED |
| 5 | order.spec.ts | Add extras to existing open order | COVERED |
| 6 | advanced.spec.ts | Transfer table T1 → T5, manager PIN | COVERED |
| 7 | advanced.spec.ts | Package upgrade: Unli Pork → Unli Beef | COVERED |
| 8 | advanced.spec.ts | Change pax 2 → 4, manager PIN | COVERED |
| 9 | advanced.spec.ts | Equal 2-way split bill, cash each | COVERED |
| 10 | advanced.spec.ts | Leftover penalty 200g, cash | COVERED |
| 11 | advanced.spec.ts | Merge tables T6 + T7, manager PIN | COVERED |
| 12 | advanced.spec.ts | PWD discount (1 pax), Maya payment | COVERED |
| 13 | test-db-persistence.spec.ts | RxDB IndexedDB persistence across reload | COVERED |
| 14 | test-expenses-rxdb.spec.ts | Expenses: add, persist, delete | COVERED |

---

## Coverage Gaps by Module

### MODULE 1 — Auth & Session

| Gap | Priority | Notes |
|-----|----------|-------|
| Login with invalid credentials (wrong password) | HIGH | Should show error, not redirect |
| Login as `owner` role → redirects to `/dashboard` | HIGH | Different landing per role |
| Login as `kitchen` role → goes to `/kitchen/orders` | HIGH | |
| Login as `manager` role → lands on `/pos` with branch dropdown visible | HIGH | |
| `staff` role: branch dropdown hidden, locked to assigned branch | HIGH | |
| Branch switch (Tagbilaran ↔ Panglao) as owner/manager | MEDIUM | Tables/data filter by branch |
| Lock screen (session timeout or manual lock) | MEDIUM | |
| Already logged-in user navigating to `/` redirects to active route | LOW | |

---

### MODULE 2 — POS Register (Uncovered Flows)

| Gap | Priority | Notes |
|-----|----------|-------|
| Combo package: Unli Pork & Beef (all 6 meats auto-added) | HIGH | Most expensive pkg |
| Weight-based meat via custom input (not preset buttons) | HIGH | e.g. type 235g |
| Item notes on an order item | MEDIUM | Notes field in AddItemModal |
| Downgrade package (Unli Beef → Unli Pork): requires PIN | HIGH | Opposite of Scenario 7 |
| Card payment method | HIGH | Not tested at all |
| Custom cash tendered (e.g. ₱1000 for ₱499 bill, verify change) | HIGH | Change calculation |
| By-item split bill (assign items to specific guests) | HIGH | Scenario 9 only covers equal split |
| Promo discount type | MEDIUM | Not tested |
| Comp discount (write-off) | MEDIUM | |
| Service recovery discount | MEDIUM | |
| SC/PWD discount with multiple qualifying pax (e.g. 3 of 4) | MEDIUM | discountPax field |
| Partial payment (cash + GCash combined) | HIGH | Split tender |
| Print bill button (receipt modal) | LOW | No printer in CI but can assert modal opens |
| X-Read generation from POS | HIGH | BIR compliance |
| Table notes/remarks before checkout | LOW | |
| Walkout void reason | MEDIUM | Different from Mistake |
| Write-off void reason | MEDIUM | |
| Re-open a paid table (if supported) | LOW | |
| Takeout status progression: new → preparing → ready → picked up | HIGH | TakeoutStatus flow |

---

### MODULE 3 — Kitchen Display System (KDS)

| Gap | Priority | Notes |
|-----|----------|-------|
| KDS page loads and shows pending tickets after order is placed | HIGH | Core kitchen flow |
| Ticket grouping: meats / dishes & drinks / side requests | HIGH | Visual grouping assertion |
| Bump (complete) a KDS ticket with manager action | HIGH | |
| KDS history tab shows bumped tickets | MEDIUM | |
| Weigh Station: select meat, enter weight, mark weighed | HIGH | Separate route |
| All-orders view: shows all active tickets across tables | MEDIUM | |
| Kitchen alert appears when order item is cancelled mid-service | MEDIUM | |
| KDS auto-refreshes when new items are added from POS | HIGH | Real-time reactivity |

---

### MODULE 4 — Stock Management

| Gap | Priority | Notes |
|-----|----------|-------|
| Inventory page loads with seeded items (list view) | HIGH | Smoke test |
| Inventory page: grid view toggle works | MEDIUM | |
| Inventory search filters results | MEDIUM | |
| Inventory status filter: Low / Critical / OK | MEDIUM | |
| Edit stock item (name, minLevel) via Edit Info | HIGH | InventoryEditModal |
| Receive Delivery: fill form, submit, item appears in deliveries list | HIGH | Core stock-in flow |
| Deliveries list page: shows recorded deliveries | MEDIUM | |
| Log Waste: select item, enter qty, reason, submit | HIGH | Core waste tracking |
| Waste log list: persists after reload | MEDIUM | |
| Stock Count: enter am10 / pm4 / pm10 values and save | HIGH | Timed count form |
| Stock Transfer: move stock from Tagbilaran to Panglao | HIGH | Requires owner/manager |
| Stock levels update after a delivery is received | HIGH | Derived stock calc |
| Low stock / critical status badge updates after waste log | HIGH | |
| Branch filter on inventory (owner sees all, staff sees own) | MEDIUM | |

---

### MODULE 5 — Reports (11 Report Pages)

| Gap | Priority | Notes |
|-----|----------|-------|
| Sales Summary: page loads, shows table with date filter | HIGH | Most used report |
| Best Sellers: chart/table renders with item data | MEDIUM | |
| Peak Hours: heatmap/chart renders | MEDIUM | |
| EOD Report: shows today's transactions summary | HIGH | Daily close procedure |
| Meat Variance: compares ordered vs counted vs wasted | HIGH | Key operational report |
| Table Sales: per-table revenue breakdown | MEDIUM | |
| Expenses Daily: shows today's expenses | MEDIUM | |
| Expenses Monthly: grouped by month | MEDIUM | |
| Gross Profit: revenue vs COGS calculation visible | MEDIUM | |
| Net Profit: gross minus expenses | MEDIUM | |
| Branch Comparison: side-by-side Tagbilaran vs Panglao (owner only) | MEDIUM | Role-gated |
| X-Read: generate and display X-reading | HIGH | BIR compliance |
| Voids & Discounts: shows voided orders and discount records | HIGH | Audit trail |
| Staff Performance: per-user transaction counts | LOW | |
| Reports subNav: all 11+ tabs navigate without crashing | HIGH | Smoke test |
| Date range filter changes report data | MEDIUM | |

---

### MODULE 6 — Admin

| Gap | Priority | Notes |
|-----|----------|-------|
| Users list: shows seeded users with roles and branches | HIGH | Smoke test |
| Add new user (name, role, branch, PIN) | HIGH | CRUD |
| Edit existing user role/branch | HIGH | CRUD |
| Delete user (with confirmation) | MEDIUM | CRUD |
| Menu Management: all items visible with thumbnails | HIGH | Now has images |
| Add new menu item (name, category, price) | HIGH | CRUD |
| Edit menu item (change price) | HIGH | CRUD |
| Toggle menu item availability (86'd) | HIGH | Operational |
| Delete menu item with confirmation | MEDIUM | CRUD |
| Menu item image upload in form | LOW | Placeholder URLs only in seed |
| Audit Logs: page loads, shows recent entries | HIGH | |
| Audit log filter by action type | MEDIUM | |
| Floor Editor: load floor plan, move/add table | MEDIUM | |
| Devices page: shows current device entry | LOW | |
| Admin routes: blocked for staff/kitchen role | HIGH | Role-gated |

---

### MODULE 7 — Cross-cutting / Infrastructure

| Gap | Priority | Notes |
|-----|----------|-------|
| TopBar navigation works on all main routes | HIGH | Smoke test all routes |
| Stock subnav: Inventory / Receive / Waste / Counts / Transfers / Deliveries | HIGH | |
| Reports subnav: all tabs work | HIGH | |
| Admin subnav: Users / Logs / Menu / Floor / Devices | HIGH | |
| Kitchen subnav: Queue / Weigh Station / All Orders | HIGH | |
| RxDB schema migration auto-resets on COL12 | MEDIUM | Auto-recovery |
| App loads on fresh IndexedDB (no existing data) | HIGH | First-run experience |
| App recovers after DB reset | HIGH | Emergency reset flow |
| Branch-scoped data: switching branches changes displayed data | HIGH | |
| Data persists across hard reload for stock and orders | HIGH | Core RxDB guarantee |

---

## Recommended New Test Files

```
e2e/
├── auth.spec.ts           # Login flows, roles, branch switching, access control
├── kds.spec.ts            # Kitchen display: tickets, bumping, weigh station
├── stock.spec.ts          # Inventory, receive, waste, counts, transfers
├── reports.spec.ts        # All 11 report pages (smoke + filter tests)
├── admin.spec.ts          # Users CRUD, menu CRUD, audit logs, floor editor
├── pos-payments.spec.ts   # Card, custom cash, partial split-tender
├── pos-discounts.spec.ts  # Promo, Comp, Service Recovery, multi-pax SC/PWD
├── pos-takeout.spec.ts    # Takeout status flow, edge cases
└── navigation.spec.ts     # SubNav smoke tests for all modules
```

---

## Priority Implementation Order

1. `auth.spec.ts` — blocks everything; roles determine what's visible
2. `navigation.spec.ts` — smoke test that no route crashes on load
3. `stock.spec.ts` — core business ops (receive, waste, count)
4. `kds.spec.ts` — kitchen staff's primary interface
5. `pos-payments.spec.ts` — card + partial tender are real production gaps
6. `admin.spec.ts` — menu CRUD (now with images), user management
7. `reports.spec.ts` — report pages are mostly read-only, quick to add
8. `pos-discounts.spec.ts` — promo/comp are secondary discount types

---

## Estimated Scenarios to Write: ~60 new test cases

| File | Est. scenarios |
|------|---------------|
| auth.spec.ts | 8 |
| navigation.spec.ts | 10 |
| stock.spec.ts | 10 |
| kds.spec.ts | 8 |
| pos-payments.spec.ts | 7 |
| pos-discounts.spec.ts | 6 |
| pos-takeout.spec.ts | 5 |
| admin.spec.ts | 10 |
| reports.spec.ts | 11 (one per report) |
| **Total new** | **~75** |
| **Already covered** | 14 |
| **Grand total** | **~89** |
