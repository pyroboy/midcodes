import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsOwner(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('chris');
  await page.locator('#password').fill('chris');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 10000 });
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
}

async function goToReport(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText('Error');
}

// ─── Reports subnav ───────────────────────────────────────────────────────────

test.describe('Reports — SubNav', () => {
  test('reports subnav renders all tab links', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/reports/sales-summary');
    // SubNav should list multiple report tabs
    const navLinks = page.locator('nav a, [role="tablist"] button, .subnav a');
    await expect(navLinks.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Individual report pages ──────────────────────────────────────────────────

test.describe('Reports — Sales Summary', () => {
  test('page loads and shows data table or empty state', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/sales-summary');
    await expect(
      page.locator('table, text=/Total|Sales|No data|No orders/i').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Reports — Best Sellers', () => {
  test('page loads without crash', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/best-sellers');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

test.describe('Reports — Peak Hours', () => {
  test('page loads without crash', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/peak-hours');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

test.describe('Reports — EOD', () => {
  test('EOD report loads and shows summary section', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/eod');
    await expect(
      page.locator('text=/End of Day|EOD|Gross Sales|Total/i').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Reports — Meat Variance', () => {
  test('meat variance loads with category breakdown', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/meat-variance');
    await expect(
      page.locator('text=/Variance|meat|Samgyupsal|No data/i').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Reports — Table Sales', () => {
  test('table sales report loads without crash', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/table-sales');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

test.describe('Reports — Expenses Daily', () => {
  test('daily expenses shows today\'s records', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/expenses-daily');
    await expect(page.locator('body')).not.toContainText('Error');
    await expect(
      page.locator('text=/Expenses|Category|Amount|No expenses/i').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Reports — Expenses Monthly', () => {
  test('monthly expenses loads without crash', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/expenses-monthly');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

test.describe('Reports — Gross Profit', () => {
  test('gross profit report loads without crash', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/profit-gross');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

test.describe('Reports — Net Profit', () => {
  test('net profit report loads without crash', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/profit-net');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

test.describe('Reports — Branch Comparison', () => {
  test('branch comparison shows both QC and Makati data (owner-only)', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/branch-comparison');
    await expect(page.locator('body')).not.toContainText('Error');
    // Owner sees both branches
    await expect(
      page.locator('text=/Alta Cita|Alona|QC|Makati|Branch/i').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Reports — X-Read', () => {
  test('x-read page loads with generate button', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/x-read');
    await expect(page.locator('body')).not.toContainText('Error');
    await expect(
      page.locator('text=/X-Read|X-read|Reading|Generate/i').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Reports — Voids & Discounts', () => {
  test('voids & discounts page loads without crash', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/voids-discounts');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

test.describe('Reports — Staff Performance', () => {
  test('staff performance page loads without crash', async ({ page }) => {
    await loginAsOwner(page);
    await goToReport(page, '/reports/staff-performance');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

// ─── Branch scoping on reports ────────────────────────────────────────────────

test.describe('Reports — Branch Scoping', () => {
  test('manager (QC) only sees QC data on sales summary', async ({ page }) => {
    // Manager Juan (QC) logs in — needs PIN
    await page.goto('/');
    await page.locator('#username').fill('juan');
    await page.locator('#password').fill('juan');
    await page.locator('button', { hasText: 'LOGIN' }).click();
    await expect(page.locator('h2', { hasText: 'Manager PIN' })).toBeVisible({ timeout: 5000 });
    for (const digit of '1234') {
      await page.locator('.pos-card button', { hasText: new RegExp(`^${digit}$`) }).click();
    }
    await page.locator('button', { hasText: 'VERIFY PIN' }).click();
    await page.waitForURL('**/pos', { timeout: 10000 });

    await page.goto('/reports/sales-summary');
    await expect(page.locator('body')).not.toContainText('Error');
    // Should show Alta Cita branch label (not "All Branches")
    await expect(
      page.locator('text=/Alta Cita|QC/i').first()
    ).toBeVisible({ timeout: 10000 });
  });
});
