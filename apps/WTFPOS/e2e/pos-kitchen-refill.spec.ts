/**
 * pos-kitchen-refill.spec.ts
 *
 * End-to-end tests for the cashier ↔ kitchen meat-weighing tandem:
 *
 *  1. Cashier opens a dine-in table, selects a package, adds a drink, charges.
 *  2. Cashier requests a meat refill via the Refill panel.
 *  3. Kitchen (KDS) sees the REFILL badge on the pending meat — NOT "ON GRILL".
 *  4. Drinks / dishes section has NO cooking / grill badge.
 *  5. Kitchen meat-scaler uses the weigh station's MANUAL numpad (Bluetooth failsafe).
 *  6. After DISPATCH the KDS shows weight + "ON GRILL" on the meat; REFILL badge gone.
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loginAs(page: Page, username: string) {
  await page.goto('/');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(username); // password === username in test accounts
  await page.locator('button', { hasText: 'LOGIN' }).click();
}

async function waitForFloor(page: Page) {
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
}

/**
 * Open a table, select pax count. Uses exact regex to avoid "2" matching "12".
 */
async function openTableWithPax(page: Page, tableLabel: string, pax: number) {
  await page.locator(`[aria-label="Table ${tableLabel}"]`).click();
  await expect(page.locator('h3', { hasText: `How many guests for ${tableLabel}` })).toBeVisible({ timeout: 6000 });
  // Exact regex prevents "2" from matching "12"
  await page.locator('.pos-card button', { hasText: new RegExp(`^${pax}$`) }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8000 });
}

/**
 * Switch category tab in AddItemModal.
 */
async function switchCategory(page: Page, name: string) {
  await page.locator('button', { hasText: name }).first().click();
}

/**
 * Open Refill panel, click a meat by name, then close the panel.
 */
async function requestRefill(page: Page, meatName: string) {
  await page.locator('button', { hasText: 'Refill' }).click();
  await expect(page.locator('h2', { hasText: 'Refill' })).toBeVisible();
  // The meat buttons are inside a "Meats" section — click the button by text
  await page.locator('button', { hasText: meatName }).first().click();
  // Close via the Done button in the RefillPanel footer
  await page.locator('button', { hasText: 'Done' }).first().click();
}

/**
 * Press a key on the weigh-station numpad (72px height, inside .grid.grid-cols-3).
 */
async function numpadPress(page: Page, key: string) {
  await page.locator('.grid.grid-cols-3').getByRole('button', { name: new RegExp(`^${key}$`) }).click();
}

// ── Test 1: Label correctness — REFILL vs ON GRILL ───────────────────────────

test('Refill meat shows REFILL badge on KDS, not ON GRILL; drinks show no cooking badge', async ({ page }) => {
  // ── CASHIER SIDE (maria · staff · tag) ──────────────────────────────────
  await loginAs(page, 'maria');
  await page.waitForURL('**/pos', { timeout: 10000 });
  await waitForFloor(page);

  await openTableWithPax(page, 'T5', 2);

  // Select Pork Unlimited → meats are available for refill
  await page.locator('button', { hasText: 'Pork Unlimited' }).first().click();

  // Add Iced Tea (category: drinks) — must NOT show cooking badge on KDS
  await switchCategory(page, 'Drinks');
  await page.locator('button', { hasText: 'Iced Tea' }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();

  // Request Samgyupsal refill — addRefillRequest() called:
  // status: 'pending', weight: null, notes: 'refill'  → REFILL badge on KDS
  await expect(page.locator('button', { hasText: 'Refill' })).toBeVisible({ timeout: 8000 });
  await requestRefill(page, 'Samgyupsal');

  // ── KITCHEN SIDE (pedro · kitchen · tag) ────────────────────────────────
  await loginAs(page, 'pedro');
  await page.waitForURL('**/kitchen', { timeout: 10000 });

  await page.goto('/kitchen/orders');
  await page.waitForTimeout(1500); // RxDB hydration

  // 1. Samgyupsal refill shows "REFILL" amber badge (pending + no weight)
  await expect(page.locator('text=REFILL').first()).toBeVisible({ timeout: 10000 });

  // 2. "ON GRILL" must NOT appear — meat hasn't been dispatched yet
  await expect(page.locator('text=ON GRILL')).not.toBeVisible();

  // 3. Iced Tea is visible in DISHES & DRINKS section
  await expect(page.locator('text=Iced Tea')).toBeVisible();

  // 4. "COOKING" badge must NOT appear (drinks don't cook, and nothing is dispatched)
  await expect(page.locator('text=COOKING')).not.toBeVisible();
});

// ── Test 2: Weigh station manual failsafe dispatches correctly ────────────────

test('Weigh station manual input (BT failsafe) dispatches meat → KDS shows weight + ON GRILL', async ({ page }) => {
  // ── CASHIER SIDE ─────────────────────────────────────────────────────────
  await loginAs(page, 'maria');
  await page.waitForURL('**/pos', { timeout: 10000 });
  await waitForFloor(page);

  await openTableWithPax(page, 'T6', 2);
  await page.locator('button', { hasText: 'Pork Unlimited' }).first().click();
  await switchCategory(page, 'Drinks');
  await page.locator('button', { hasText: 'Iced Tea' }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();

  await expect(page.locator('button', { hasText: 'Refill' })).toBeVisible({ timeout: 8000 });
  await requestRefill(page, 'Samgyupsal');

  // ── KITCHEN SIDE — WEIGH STATION ─────────────────────────────────────────
  await loginAs(page, 'pedro');
  await page.waitForURL('**/kitchen', { timeout: 10000 });

  await page.goto('/kitchen/weigh-station');
  await page.waitForTimeout(1500);

  // Find T6's pending group in the left panel.
  // Items are grouped by table; each group card has .rounded-xl.overflow-hidden with T6 header.
  // NOTE: Other tests may leave pending items from T5 — scope to T6's group.
  const t6WeighGroup = page.locator('.rounded-xl.border.border-border').filter({
    has: page.locator('span', { hasText: /^T6$/ })
  });
  await expect(t6WeighGroup).toBeVisible({ timeout: 10000 });

  // Pork Unlimited adds 2 meats (Samgyupsal + Pork Sliced) + the refill Samgyupsal.
  // The REFILL Samgyupsal is the last one in T6's group (added after charge).
  await t6WeighGroup.locator('button', { hasText: 'Samgyupsal' }).last().click();

  // Manual numpad must be visible (no BT scale in test environment)
  await expect(page.locator('text=Weight (grams)')).toBeVisible();

  // Type 250g using numpad (2, 5, 0)
  await numpadPress(page, '2');
  await numpadPress(page, '5');
  await numpadPress(page, '0');

  // The large weight display should show "250"
  const weightDisplay = page.locator('.font-mono.text-6xl');
  await expect(weightDisplay).toContainText('250');

  // DISPATCH
  await page.locator('button', { hasText: 'DISPATCH' }).click();

  // Dispatched log (right panel) confirms 250g was sent
  await expect(page.locator('text=250g')).toBeVisible({ timeout: 8000 });

  // ── BACK TO KDS — verify post-dispatch labels scoped to T6 ──────────────
  await page.goto('/kitchen/orders');
  await page.waitForTimeout(1500);

  // Find T6's ticket card (previous tests may have left other tickets on screen)
  const t6Card = page.locator('.overflow-hidden.rounded-xl').filter({
    has: page.locator('span', { hasText: /^T6$/ })
  });
  await expect(t6Card).toBeVisible({ timeout: 10000 });

  // Weight "250g" appears in T6's card (section total + item badge)
  await expect(t6Card.locator('text=250g').first()).toBeVisible();

  // "ON GRILL" badge appears — meat is now status: 'cooking' with weight set
  await expect(t6Card.locator('text=ON GRILL')).toBeVisible();

  // The dispatched row (Samgyupsal + 250g) must NOT also show REFILL.
  // isRefill = (notes === 'refill' && !weight) → false once weight is set.
  // We scope to the row that contains "250g" (the dispatched item, not T6's package Samgyupsal).
  const dispatchedRow = t6Card.locator('.flex-1.flex.items-center').filter({ has: page.locator('text=250g') }).first();
  await expect(dispatchedRow.locator('text=REFILL')).not.toBeVisible();

  // Iced Tea still in T6's DISHES & DRINKS section — no cooking badge
  await expect(t6Card.locator('text=Iced Tea')).toBeVisible();
  await expect(t6Card.locator('text=COOKING')).not.toBeVisible();
});

// ── Test 3: Menu item category routing — judge each item type ─────────────────

test('KDS routes items to correct sections: meats→MEATS, drinks→DISHES & DRINKS, package→SIDE REQUESTS', async ({ page }) => {
  await loginAs(page, 'maria');
  await page.waitForURL('**/pos', { timeout: 10000 });
  await waitForFloor(page);

  await openTableWithPax(page, 'T7', 2);

  // Package (category: 'packages' → SIDE REQUESTS on KDS)
  await page.locator('button', { hasText: 'Pork Unlimited' }).first().click();

  // Dish (category: 'dishes' → DISHES & DRINKS; can say COOKING if cooking, NOT ON GRILL)
  await switchCategory(page, 'Dishes');
  await page.locator('button', { hasText: 'Bibimbap' }).first().click();

  // Drink (category: 'drinks' → DISHES & DRINKS; never shows any cooking badge)
  await switchCategory(page, 'Drinks');
  await page.locator('button', { hasText: 'Soju' }).first().click();

  await page.locator('button', { hasText: 'CHARGE' }).click();

  // Meat refill (category: 'meats' → MEATS section with REFILL badge)
  await expect(page.locator('button', { hasText: 'Refill' })).toBeVisible({ timeout: 8000 });
  await requestRefill(page, 'Samgyupsal');

  // ── Kitchen verification ──────────────────────────────────────────────────
  await loginAs(page, 'pedro');
  await page.waitForURL('**/kitchen', { timeout: 10000 });
  await page.goto('/kitchen/orders');
  await page.waitForTimeout(1500);

  // 🥩 MEATS section shows Samgyupsal with REFILL badge
  await expect(page.locator('text=MEATS')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=Samgyupsal').first()).toBeVisible();
  await expect(page.locator('text=REFILL').first()).toBeVisible();

  // 🍽 DISHES & DRINKS section shows Bibimbap AND Soju
  await expect(page.locator('text=DISHES & DRINKS')).toBeVisible();
  await expect(page.locator('text=Bibimbap')).toBeVisible();
  await expect(page.locator('text=Soju')).toBeVisible();

  // No "ON GRILL" badge for any item — nothing dispatched yet
  await expect(page.locator('text=ON GRILL')).not.toBeVisible();

  // Soju (drink) must NOT have any cooking-type badge
  // Verify: "COOKING" doesn't appear anywhere (drinks/sides never cook)
  await expect(page.locator('text=COOKING')).not.toBeVisible();

  // 🎯 SIDE REQUESTS section shows the Pork Unlimited package
  await expect(page.locator('text=SIDE REQUESTS')).toBeVisible();
  await expect(page.locator('text=Pork Unlimited')).toBeVisible();
});
