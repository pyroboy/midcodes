#!/bin/bash
set -e

echo ""
echo "============================================================"
echo "  WTFPOS E2E Test Suite — 4-Phase Run"
echo "============================================================"
echo ""

echo "=== PHASE 1: Smoke (auth, routing, RxDB, session) ==="
pnpm exec playwright test \
  e2e/auth.spec.ts \
  e2e/navigation.spec.ts \
  e2e/session.spec.ts \
  e2e/warehouse-access-guard.spec.ts \
  e2e/test-db-persistence.spec.ts \
  e2e/test-expenses-rxdb.spec.ts \
  --reporter=line
echo "✓ Phase 1 PASSED"
echo ""

echo "=== PHASE 2: POS Core (cashier flows, discounts, payments, receipts) ==="
pnpm exec playwright test \
  e2e/order.spec.ts \
  e2e/pos-register.spec.ts \
  e2e/pos-payments.spec.ts \
  e2e/pos-discounts.spec.ts \
  e2e/pos-discounts-combined.spec.ts \
  e2e/pos-child-pax-receipt.spec.ts \
  e2e/pos-pending-payment.spec.ts \
  e2e/pos-receipt-sc-pwdline.spec.ts \
  e2e/pos-order-history.spec.ts \
  e2e/table-indicators.spec.ts \
  --reporter=line
echo "✓ Phase 2 PASSED"
echo ""

echo "=== PHASE 3: Kitchen + Stock + Hardware ==="
pnpm exec playwright test \
  e2e/kds.spec.ts \
  e2e/pos-kitchen-refill.spec.ts \
  e2e/kitchen-refuse-recall.spec.ts \
  e2e/kitchen-harmony-audit.spec.ts \
  e2e/stock.spec.ts \
  e2e/stock-advanced.spec.ts \
  e2e/stock-edge-cases.spec.ts \
  e2e/bluetooth-scale.spec.ts \
  e2e/bt-scale-pairing.spec.ts \
  --reporter=line
echo "✓ Phase 3 PASSED"
echo ""

echo "=== PHASE 4: Integration + Admin + Reports ==="
pnpm exec playwright test \
  e2e/advanced.spec.ts \
  e2e/order-lifecycle.spec.ts \
  e2e/pos-parallel.spec.ts \
  e2e/multi-user-concurrent.spec.ts \
  e2e/admin.spec.ts \
  e2e/admin-floor.spec.ts \
  e2e/admin-floor-allview.spec.ts \
  e2e/admin-devices.spec.ts \
  e2e/reports.spec.ts \
  e2e/ux-audit-staff-ordering.spec.ts \
  e2e/ux-audit-kitchen-harmony-light.spec.ts \
  e2e/ux-audit-multiuser-tag.spec.ts \
  --reporter=line
echo "✓ Phase 4 PASSED"
echo ""

echo "============================================================"
echo "  ALL PHASES COMPLETE"
echo "============================================================"
