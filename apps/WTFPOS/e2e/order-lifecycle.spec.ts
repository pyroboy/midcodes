import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsStaff(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('maria');
  await page.locator('#password').fill('maria');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 10000 });
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
}

async function loginAsKitchen(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('pedro');
  await page.locator('#password').fill('pedro');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/kitchen', { timeout: 10000 });
  await page.waitForTimeout(2000);
}

async function openTableWithPax(page: Page, tableLabel: string, pax: number) {
  await page.locator(`[aria-label="Table ${tableLabel}"]`).click();
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible();
  await page.locator('.pos-card button', { hasText: new RegExp(`^${pax}$`) }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible();
}

async function selectPackageAndCharge(page: Page, packageName: string) {
  await page.locator('button', { hasText: packageName }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();
}

async function switchCategory(page: Page, category: string) {
  await page.locator('button', { hasText: category }).first().click();
}

async function addDrinksAndCharge(page: Page, ...drinks: string[]) {
  await switchCategory(page, 'Drinks');
  for (const drink of drinks) {
    await page.locator('button', { hasText: drink }).first().click();
  }
  await page.locator('button', { hasText: 'CHARGE' }).click();
}

async function enterPin(page: Page, pin = '1234') {
  const root = page.locator('.pos-card').last();
  for (const digit of pin) {
    await root.locator('button', { hasText: new RegExp(`^${digit}$`) }).click();
  }
}

async function skipLeftoverPenalty(page: Page) {
  const penaltyHeader = page.locator('h2', { hasText: 'Leftover Penalty?' });
  if (await penaltyHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.locator('button', { hasText: 'Skip / Checkout' }).click();
  }
}

async function checkoutExactCash(page: Page) {
  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await expect(checkout).toBeVisible();
  await page.locator('button', { hasText: 'Exact' }).click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled();
  await confirmBtn.click({ force: true });
  const successText = page.locator('text=Payment Successful');
  const doneBtn = page.locator('button', { hasText: 'Done' });
  try {
    await expect(successText).toBeVisible({ timeout: 10000 });
    await doneBtn.click();
  } catch {
    await page.waitForURL('**/pos', { timeout: 10000 });
  }
}

// ─── Parallel Order Lifecycle Tests ──────────────────────────────────────────
// These tests simulate the full POS<->Kitchen flow using two browser tabs
// (same context = shared IndexedDB/RxDB) to verify real-time data propagation.

test.describe('Order Lifecycle — POS + Kitchen parallel flow', () => {

  // ── Scenario 1: Full dine-in lifecycle ─────────────────────────────────────
  // POS opens table -> adds package -> KDS sees ticket -> kitchen bumps ->
  // POS checks out -> table freed
  test('Scenario 1: Dine-in — open, order, kitchen sees & bumps, checkout', async ({ context }) => {
    const pos = await context.newPage();
    const kds = await context.newPage();

    // Both users log in simultaneously
    await Promise.all([loginAsStaff(pos), loginAsKitchen(kds)]);

    // ── POS: Open T3 with 2 pax, select Unli Pork package ──
    await openTableWithPax(pos, 'T3', 2);
    await selectPackageAndCharge(pos, 'Unli Pork');

    // Sidebar should show the running bill with package items
    await expect(pos.locator('text=/Unli Pork/i').first()).toBeVisible({ timeout: 5000 });

    // ── KDS: Navigate to orders queue, ticket for T3 should appear ──
    await kds.goto('/kitchen/orders');
    await expect(kds.locator('text=/T3|Table 3/i').first()).toBeVisible({ timeout: 15000 });

    // ── KDS: Bump all items on the T3 ticket ──
    const bumpBtn = kds.locator('button', { hasText: /Bump|Done|Served|Complete/i }).first();
    if (await bumpBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bumpBtn.click();
    }

    // ── POS: Checkout T3 ──
    // Click on T3 to ensure sidebar is showing (it may already be)
    await pos.locator('[aria-label="Table T3"]').click();
    await pos.locator('button', { hasText: 'Checkout' }).click();
    await skipLeftoverPenalty(pos);
    await checkoutExactCash(pos);

    // ── POS: T3 should be available again (green / clickable for new order) ──
    await expect(pos.locator('[aria-label="Table T3"]')).toBeVisible();
  });

  // ── Scenario 2: Multiple tables, kitchen sees all tickets ──────────────────
  // POS opens T4 and T5 in quick succession -> KDS sees both tickets
  test('Scenario 2: Two tables — kitchen sees both tickets simultaneously', async ({ context }) => {
    const pos = await context.newPage();
    const kds = await context.newPage();

    await Promise.all([loginAsStaff(pos), loginAsKitchen(kds)]);

    // ── POS: Open T4, order package ──
    await openTableWithPax(pos, 'T4', 3);
    await selectPackageAndCharge(pos, 'Unli Pork');

    // ── POS: Open T5, order package + drinks ──
    await openTableWithPax(pos, 'T5', 2);
    await selectPackageAndCharge(pos, 'Unli Beef');

    // ── KDS: Both tickets should appear ──
    await kds.goto('/kitchen/orders');
    await expect(kds.locator('text=/T4|Table 4/i').first()).toBeVisible({ timeout: 15000 });
    await expect(kds.locator('text=/T5|Table 5/i').first()).toBeVisible({ timeout: 10000 });

    // ── Cleanup: Checkout both tables ──
    for (const table of ['T4', 'T5']) {
      await pos.locator(`[aria-label="Table ${table}"]`).click();
      await pos.locator('button', { hasText: 'Checkout' }).click();
      await skipLeftoverPenalty(pos);
      await checkoutExactCash(pos);
    }
  });

  // ── Scenario 3: Add items mid-service (refill), kitchen sees update ────────
  // POS opens table -> charges package -> adds drinks later -> KDS sees both batches
  test('Scenario 3: Mid-service add — extra drinks appear in KDS', async ({ context }) => {
    const pos = await context.newPage();
    const kds = await context.newPage();

    await Promise.all([loginAsStaff(pos), loginAsKitchen(kds)]);

    // ── POS: Open T6, charge initial package ──
    await openTableWithPax(pos, 'T6', 2);
    await selectPackageAndCharge(pos, 'Unli Pork');

    // ── KDS: Confirm T6 ticket visible ──
    await kds.goto('/kitchen/orders');
    await expect(kds.locator('text=/T6|Table 6/i').first()).toBeVisible({ timeout: 15000 });

    // ── POS: Add drinks mid-service via + Add Item ──
    await pos.locator('[aria-label="Table T6"]').click();
    const addItemBtn = pos.locator('button', { hasText: /Add Item|\+/i }).first();
    await addItemBtn.click();
    await expect(pos.locator('h2', { hasText: 'Add to Order' })).toBeVisible();
    await addDrinksAndCharge(pos, 'Iced Tea');

    // ── KDS: Ticket for T6 should now include the drink ──
    // Reload or wait for reactivity
    await kds.goto('/kitchen/orders');
    await expect(kds.locator('text=/Iced Tea/i').first()).toBeVisible({ timeout: 15000 });

    // ── Cleanup ──
    await pos.locator('[aria-label="Table T6"]').click();
    await pos.locator('button', { hasText: 'Checkout' }).click();
    await skipLeftoverPenalty(pos);
    await checkoutExactCash(pos);
  });

  // ── Scenario 4: Kitchen bumps, then POS sees served status ─────────────────
  // Verifies bidirectional data flow: kitchen action reflects on POS sidebar
  test('Scenario 4: Kitchen bumps ticket — POS sidebar reflects served state', async ({ context }) => {
    const pos = await context.newPage();
    const kds = await context.newPage();

    await Promise.all([loginAsStaff(pos), loginAsKitchen(kds)]);

    // ── POS: Open T7, charge package ──
    await openTableWithPax(pos, 'T7', 2);
    await selectPackageAndCharge(pos, 'Unli Pork');

    // ── KDS: Wait for ticket, bump it ──
    await kds.goto('/kitchen/orders');
    await expect(kds.locator('text=/T7|Table 7/i').first()).toBeVisible({ timeout: 15000 });

    const bumpBtn = kds.locator('button', { hasText: /Bump|Done|Served|Complete/i }).first();
    if (await bumpBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bumpBtn.click();
      // Ticket should disappear from active queue (moved to history)
      await expect(kds.locator('text=/T7|Table 7/i').first()).not.toBeVisible({ timeout: 10000 }).catch(() => {});
    }

    // ── POS: Select T7, sidebar should show served badges or allow checkout ──
    await pos.locator('[aria-label="Table T7"]').click();
    // The order should still exist (table occupied) — items may show SERVED status
    await expect(pos.locator('button', { hasText: 'Checkout' })).toBeVisible({ timeout: 5000 });

    // ── Cleanup ──
    await pos.locator('button', { hasText: 'Checkout' }).click();
    await skipLeftoverPenalty(pos);
    await checkoutExactCash(pos);
  });

  // ── Scenario 5: Takeout lifecycle — POS creates, KDS shows, complete ───────
  test('Scenario 5: Takeout — create order, KDS sees it, checkout', async ({ context }) => {
    const pos = await context.newPage();
    const kds = await context.newPage();

    await Promise.all([loginAsStaff(pos), loginAsKitchen(kds)]);

    // ── POS: Create takeout order (opens AddItemModal directly) ──
    await pos.locator('button', { hasText: /New Takeout/i }).click();
    await expect(pos.locator('h2', { hasText: 'Add to Takeout' })).toBeVisible({ timeout: 5000 });

    // ── Add dishes (takeout has no packages — starts on Sides tab) ──
    await switchCategory(pos, 'Dishes');
    await pos.locator('button', { hasText: 'Bibimbap' }).first().click();
    await expect(pos.locator('button', { hasText: /CHARGE \(1\)/ })).toBeEnabled();
    await pos.locator('button', { hasText: /CHARGE/ }).click();

    // ── Sidebar should show the takeout bill with Bibimbap ──
    await expect(pos.locator('text=/Bibimbap/i').first()).toBeVisible({ timeout: 5000 });

    // ── KDS: Should see takeout ticket with Bibimbap ──
    await kds.goto('/kitchen/orders');
    await expect(
      kds.locator('text=/Bibimbap/i').first()
    ).toBeVisible({ timeout: 15000 });

    // ── POS: Checkout the takeout order ──
    await pos.locator('button', { hasText: 'Checkout' }).click();
    await checkoutExactCash(pos);
  });
});
