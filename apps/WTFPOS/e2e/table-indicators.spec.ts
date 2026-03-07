/**
 * table-indicators.spec.ts
 *
 * Tests for the pending (orange) and fully-served (green) badges on the floor plan.
 *
 * Orange badge: appears on a table when unservedCount > 0 (items with status pending|cooking)
 * Green badge:  appears on a table when all active items are served (isFullyServed)
 *
 * Scenarios:
 *  1. After charging items → orange badge appears with correct count
 *  2. Kitchen serves ALL → orange gone, green appears
 *  3. Refill request after fully served → orange reappears
 *  4. Kitchen serves refill → green returns
 *  5. Weigh-station items (meats) keep orange until served
 *  6. Table with no items yet → no badge (edge case)
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.setTimeout(15_000);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAs(page: Page, username: string) {
  await page.goto('/');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(username);
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 10_000 });
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15_000 });
}

async function openTableWithPax(page: Page, tableLabel: string, pax: number) {
  await page.locator(`[aria-label="Table ${tableLabel}"]`).click({ force: true });
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible({ timeout: 6_000 });
  await page.locator('.pos-card button', { hasText: new RegExp(`^${pax}$`) }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8_000 });
}

/**
 * Orange animated badge: circle[fill="#f97316"] inside the table SVG group.
 * Only rendered when unservedCount > 0.
 */
function orangeBadge(page: Page, tableLabel: string) {
  return page.locator(`[aria-label="Table ${tableLabel}"] circle[fill="#f97316"]`);
}

/**
 * Green checkmark badge: circle[fill="#10b981"] inside the table SVG group.
 * Only rendered when isFullyServed (all active items served, none pending/cooking).
 */
function greenBadge(page: Page, tableLabel: string) {
  return page.locator(`[aria-label="Table ${tableLabel}"] circle[fill="#10b981"]`);
}

/**
 * Navigate to kitchen/orders, wait for a T{n} ticket, click "ALL DONE".
 */
async function serveAllInKitchen(page: Page, tableNumber: number) {
  await page.goto('/kitchen/orders');
  await expect(page.locator(`text=T${tableNumber}`).first()).toBeVisible({ timeout: 10_000 });
  await page.locator('button', { hasText: 'ALL DONE' }).first().click();
  // Wait briefly for RxDB writes to propagate
  await page.waitForTimeout(600);
}

async function backToPOS(page: Page) {
  await page.goto('/pos');
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 10_000 });
}

// ─── Test 1: Orange badge appears after items are charged ─────────────────────

test('1 — orange badge appears on table after items are charged', async ({ page }) => {
  await loginAs(page, 'maria');
  await openTableWithPax(page, 'T1', 2);

  // Select Pork Unlimited (exact match — avoids hitting "Beef + Pork Unlimited")
  await page.locator('button', { hasText: /^Pork Unlimited$/ }).first().click();

  // Add a drink
  await page.locator('button', { hasText: 'Drinks' }).first().click();
  await page.locator('button', { hasText: 'Iced Tea' }).first().click();

  // CHARGE closes the modal and writes items to order with status: 'pending'
  await page.locator('button', { hasText: 'CHARGE' }).click();

  // Floor plan is now visible again — orange badge must appear
  await expect(orangeBadge(page, 'T1')).toBeVisible({ timeout: 5_000 });

  // Green badge must NOT be visible yet
  await expect(greenBadge(page, 'T1')).not.toBeVisible();
});

// ─── Test 2: Green badge after kitchen serves all items ───────────────────────

test('2 — green badge appears after kitchen serves all items', async ({ page }) => {
  await loginAs(page, 'maria');
  await openTableWithPax(page, 'T1', 2);

  await page.locator('button', { hasText: /^Pork Unlimited$/ }).first().click();
  await page.locator('button', { hasText: 'Drinks' }).first().click();
  await page.locator('button', { hasText: 'Iced Tea' }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();

  // Confirm orange badge before going to kitchen
  await expect(orangeBadge(page, 'T1')).toBeVisible({ timeout: 5_000 });

  await serveAllInKitchen(page, 1);
  await backToPOS(page);

  // Orange must be gone
  await expect(orangeBadge(page, 'T1')).not.toBeVisible();

  // Green (fully-served) must appear
  await expect(greenBadge(page, 'T1')).toBeVisible({ timeout: 5_000 });
});

// ─── Test 3: Orange reappears after a refill request ──────────────────────────

test('3 — orange badge reappears after refill request on a fully-served table', async ({ page }) => {
  await loginAs(page, 'maria');
  await openTableWithPax(page, 'T2', 2);

  await page.locator('button', { hasText: /^Pork Unlimited$/ }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();

  // Kitchen serves all
  await serveAllInKitchen(page, 2);
  await backToPOS(page);

  // Confirm green badge is showing
  await expect(greenBadge(page, 'T2')).toBeVisible({ timeout: 5_000 });

  // Click T2 to open order sidebar
  await page.locator('[aria-label="Table T2"]').click({ force: true });
  await expect(page.locator('button', { hasText: 'Refill' })).toBeVisible({ timeout: 5_000 });

  // Open refill panel
  await page.locator('button', { hasText: 'Refill' }).click();
  await expect(page.locator('h2', { hasText: 'Refill' })).toBeVisible({ timeout: 5_000 });

  // Click the first meat button inside the RefillPanel grid
  // (.grid.grid-cols-3 is the meat grid; refill modal is the only overlay open at this point)
  await page.locator('.grid.grid-cols-3 button').first().click();

  // Close refill panel
  await page.locator('button', { hasText: 'Done' }).first().click();

  // Orange badge must reappear (refill item is pending)
  await expect(orangeBadge(page, 'T2')).toBeVisible({ timeout: 5_000 });

  // Green badge must be gone
  await expect(greenBadge(page, 'T2')).not.toBeVisible();
});

// ─── Test 4: Green returns after kitchen serves the refill ────────────────────

test('4 — green badge returns after kitchen serves the refill', async ({ page }) => {
  await loginAs(page, 'maria');
  await openTableWithPax(page, 'T3', 2);

  await page.locator('button', { hasText: /^Pork Unlimited$/ }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();

  // First round: serve all
  await serveAllInKitchen(page, 3);
  await backToPOS(page);
  await expect(greenBadge(page, 'T3')).toBeVisible({ timeout: 5_000 });

  // Request a refill
  await page.locator('[aria-label="Table T3"]').click({ force: true });
  await page.locator('button', { hasText: 'Refill' }).click();
  await expect(page.locator('h2', { hasText: 'Refill' })).toBeVisible();
  await page.locator('.grid.grid-cols-3 button').first().click();
  await page.locator('button', { hasText: 'Done' }).first().click();

  // Orange reappears
  await expect(orangeBadge(page, 'T3')).toBeVisible({ timeout: 5_000 });

  // Kitchen serves the refill
  await serveAllInKitchen(page, 3);
  await backToPOS(page);

  // Green returns
  await expect(greenBadge(page, 'T3')).toBeVisible({ timeout: 5_000 });
  await expect(orangeBadge(page, 'T3')).not.toBeVisible();
});

// ─── Test 5: Weigh-station meat — orange stays until KDS bump ─────────────────

test('5 — orange badge persists while meat is at weigh station (pending, no weight)', async ({ page }) => {
  await loginAs(page, 'maria');
  await openTableWithPax(page, 'T4', 2);

  await page.locator('button', { hasText: /^Pork Unlimited$/ }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();

  // Orange must appear — meat items are pending (unweighed in weigh station)
  await expect(orangeBadge(page, 'T4')).toBeVisible({ timeout: 5_000 });

  // Verify weigh station shows the pending meat (status=pending, no weight)
  await page.goto('/kitchen/weigh-station');
  // At least one pending meat row should exist — use exact text to avoid matching order IDs
  await expect(page.getByText('T4', { exact: true }).first()).toBeVisible({ timeout: 8_000 });

  // Back to POS — orange must still be there (meat not served yet)
  await backToPOS(page);
  await expect(orangeBadge(page, 'T4')).toBeVisible({ timeout: 3_000 });
  await expect(greenBadge(page, 'T4')).not.toBeVisible();
});

// ─── Test 6: No badge on table with empty order (no items charged yet) ─────────

test('6 — no badge on occupied table with no charged items', async ({ page }) => {
  await loginAs(page, 'maria');
  // Open T5 and immediately close AddItemModal without charging anything
  await page.locator('[aria-label="Table T5"]').click({ force: true });
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible({ timeout: 6_000 });
  await page.locator('.pos-card button', { hasText: /^2$/ }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8_000 });

  // Close without adding any items
  await page.keyboard.press('Escape');
  await expect(page.locator('h2', { hasText: 'Add to Order' })).not.toBeVisible({ timeout: 3_000 });

  // Table is occupied but has 0 items — neither badge should appear
  await expect(orangeBadge(page, 'T5')).not.toBeVisible();
  await expect(greenBadge(page, 'T5')).not.toBeVisible();
});
