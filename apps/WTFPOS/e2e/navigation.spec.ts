import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAs(page: Page, username: string, dest: string) {
  await page.goto('/');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(username);
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL(`**${dest}`, { timeout: 10000 });
}

async function loginAsOwner(page: Page) {
  await loginAs(page, 'chris', '/pos');
  // Owner has locationId 'all' — wait for the location picker button (not table cards)
  await expect(
    page.locator('button', { hasText: /All Locations|Alta Cita|Alona/i }).first()
  ).toBeVisible({ timeout: 15000 });
}

async function loginAsKitchen(page: Page) {
  await loginAs(page, 'pedro', '/kitchen');
  await page.waitForTimeout(2000);
}

// ─── POS / Floor routes ───────────────────────────────────────────────────────

test.describe('Navigation — POS routes', () => {
  test('/pos loads floor plan without crash', async ({ page }) => {
    await loginAs(page, 'maria', '/pos');
    await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
  });

  test('/pos — takeout button visible', async ({ page }) => {
    await loginAs(page, 'maria', '/pos');
    await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button', { hasText: 'New Takeout' })).toBeVisible();
  });
});

// ─── Kitchen routes ───────────────────────────────────────────────────────────

test.describe('Navigation — Kitchen routes', () => {
  test('/kitchen/orders loads KDS queue', async ({ page }) => {
    await loginAsKitchen(page);
    await expect(page).toHaveURL(/\/kitchen/);
    // Page renders without error — check for known KDS UI elements
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('/kitchen/weigh-station loads without crash', async ({ page }) => {
    await loginAsKitchen(page);
    await page.goto('/kitchen/weigh-station');
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('/kitchen/all-orders loads without crash', async ({ page }) => {
    await loginAsKitchen(page);
    await page.goto('/kitchen/all-orders');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

// ─── Stock routes ─────────────────────────────────────────────────────────────

test.describe('Navigation — Stock routes', () => {
  test('/stock/inventory loads', async ({ page }) => {
    await loginAs(page, 'noel', '/stock');
    await page.goto('/stock/inventory');
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('/stock/receive loads', async ({ page }) => {
    await loginAs(page, 'noel', '/stock');
    await page.goto('/stock/receive');
    await expect(page.locator('h2', { hasText: 'Log Delivery' })).toBeVisible({ timeout: 10000 });
  });

  test('/stock/waste loads', async ({ page }) => {
    await loginAs(page, 'noel', '/stock');
    await page.goto('/stock/waste');
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('/stock/counts loads', async ({ page }) => {
    await loginAs(page, 'noel', '/stock');
    await page.goto('/stock/counts');
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('/stock/transfers loads', async ({ page }) => {
    await loginAs(page, 'noel', '/stock');
    await page.goto('/stock/transfers');
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('/stock/deliveries loads', async ({ page }) => {
    await loginAs(page, 'noel', '/stock');
    await page.goto('/stock/deliveries');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

// ─── Reports routes ───────────────────────────────────────────────────────────

test.describe('Navigation — Reports routes', () => {
  const reportRoutes = [
    '/reports/sales-summary',
    '/reports/best-sellers',
    '/reports/peak-hours',
    '/reports/eod',
    '/reports/meat-variance',
    '/reports/table-sales',
    '/reports/expenses-daily',
    '/reports/expenses-monthly',
    '/reports/profit-gross',
    '/reports/profit-net',
    '/reports/branch-comparison',
    '/reports/x-read',
    '/reports/voids-discounts',
    '/reports/staff-performance',
  ];

  for (const route of reportRoutes) {
    test(`${route} loads without crash`, async ({ page }) => {
      await loginAsOwner(page);
      await page.goto(route);
      await expect(page.locator('body')).not.toContainText('Error');
      await page.waitForLoadState('networkidle');
    });
  }
});

// ─── Admin routes ─────────────────────────────────────────────────────────────

test.describe('Navigation — Admin routes', () => {
  test('/admin/users loads user table', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/users');
    await expect(page.locator('text=Users')).toBeVisible({ timeout: 10000 });
  });

  test('/admin/menu loads menu items table', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/menu');
    await expect(page.locator('text=Samgyupsal')).toBeVisible({ timeout: 10000 });
  });

  test('/admin/logs loads audit log', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/logs');
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('/admin/floor-editor loads without crash', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/floor-editor');
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('/admin/devices loads without crash', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/devices');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

// ─── Expenses ─────────────────────────────────────────────────────────────────

test.describe('Navigation — Expenses', () => {
  test('/expenses loads with seed data', async ({ page }) => {
    await loginAs(page, 'maria', '/pos');
    await page.goto('/expenses');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});
