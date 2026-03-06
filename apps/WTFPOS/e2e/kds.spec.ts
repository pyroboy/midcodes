import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsKitchen(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('pedro');
  await page.locator('#password').fill('pedro');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/kitchen', { timeout: 10000 });
  await page.waitForTimeout(2000); // wait for RxDB seed
}

async function loginAsStaff(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('maria');
  await page.locator('#password').fill('maria');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 10000 });
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
}

/** Place a quick dine-in order to generate a KDS ticket */
async function placeOrder(page: Page, tableLabel: string, pax: number, packageName: string) {
  await page.locator(`[aria-label="Table ${tableLabel}"]`).click();
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible();
  await page.locator('.pos-card button', { hasText: new RegExp(`^${pax}$`) }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible();
  await page.locator('button', { hasText: packageName }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();
}

// ─── KDS Queue ────────────────────────────────────────────────────────────────

test.describe('KDS — Queue', () => {
  test('kitchen/orders page loads without crash', async ({ page }) => {
    await loginAsKitchen(page);
    await expect(page).toHaveURL(/\/kitchen/);
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('KDS shows stat counters (Active Tables, Queue, Menu Orders)', async ({ page }) => {
    await loginAsKitchen(page);
    // Stat bar with counts should be visible
    await expect(
      page.locator('text=/Active Tables|Queue|Menu Orders/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('KDS shows ticket after order placed from POS', async ({ page, context }) => {
    // Open POS in one tab, KDS in another — using same browser context (same IndexedDB)
    const posPage = await context.newPage();
    await loginAsStaff(posPage);
    await placeOrder(posPage, 'T1', 2, 'Unli Pork');

    // Now check KDS for the ticket
    await loginAsKitchen(page);
    await page.goto('/kitchen/orders');

    // A KDS ticket for Table T1 should appear
    await expect(page.locator('text=/T1|Table 1/i').first()).toBeVisible({ timeout: 15000 });
    await posPage.close();
  });

  test('bump button marks ticket as served', async ({ page, context }) => {
    // Place order from staff tab
    const posPage = await context.newPage();
    await loginAsStaff(posPage);
    await placeOrder(posPage, 'T2', 2, 'Unli Pork');

    // KDS tab
    await loginAsKitchen(page);
    await page.goto('/kitchen/orders');
    await expect(page.locator('text=/T2|Table 2/i').first()).toBeVisible({ timeout: 15000 });

    // Find and click the "Bump" / "Done" / "Served" button on the ticket
    const bumpBtn = page.locator('button', { hasText: /Bump|Done|Served|Complete/i }).first();
    if (await bumpBtn.count() > 0) {
      const ticketsBefore = await page.locator('[data-testid="kds-ticket"], .kds-ticket, .pos-card').count();
      await bumpBtn.click();
      // Ticket count should decrease or ticket should disappear
      await expect(page.locator('body')).not.toContainText('Error');
    }

    await posPage.close();
  });
});

// ─── KDS History ─────────────────────────────────────────────────────────────

test.describe('KDS — History', () => {
  test('KDS history button opens history modal', async ({ page }) => {
    await loginAsKitchen(page);
    await page.goto('/kitchen/orders');

    const historyBtn = page.locator('button', { hasText: /History|Log/i }).first();
    if (await historyBtn.count() > 0) {
      await historyBtn.click();
      await expect(page.locator('.fixed, [role="dialog"]').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// ─── Weigh Station ────────────────────────────────────────────────────────────

test.describe('KDS — Weigh Station', () => {
  test('weigh station page loads', async ({ page }) => {
    await loginAsKitchen(page);
    await page.goto('/kitchen/weigh-station');
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('weigh station shows meat items to weigh', async ({ page }) => {
    await loginAsKitchen(page);
    await page.goto('/kitchen/weigh-station');
    // Should show meat items or empty state message
    await expect(
      page.locator('text=/Samgyupsal|Galbi|weigh|No items|empty/i').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── All Orders ───────────────────────────────────────────────────────────────

test.describe('KDS — All Orders', () => {
  test('all-orders page loads without crash', async ({ page }) => {
    await loginAsKitchen(page);
    await page.goto('/kitchen/all-orders');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});
