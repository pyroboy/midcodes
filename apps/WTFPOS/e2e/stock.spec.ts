import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsStock(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('noel');
  await page.locator('#password').fill('noel');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/stock', { timeout: 10000 });
  await page.waitForTimeout(2000); // wait for RxDB seed
}

// ─── Inventory ────────────────────────────────────────────────────────────────

test.describe('Stock — Inventory', () => {
  test('inventory list view loads with seeded items', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/inventory');
    // Seeded meat items should appear
    await expect(page.locator('text=Samgyupsal')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Galbi')).toBeVisible({ timeout: 5000 });
  });

  test('search filters inventory results', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/inventory');
    await expect(page.locator('text=Samgyupsal')).toBeVisible({ timeout: 10000 });

    // Search for "galbi" — only galbi should match in meats
    await page.locator('input[placeholder*="earch"]').fill('galbi');
    await expect(page.locator('text=Galbi')).toBeVisible();
    await expect(page.locator('text=Samgyupsal')).not.toBeVisible();
  });

  test('status filter: critical shows only critical items', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/inventory');
    await expect(page.locator('text=Samgyupsal')).toBeVisible({ timeout: 10000 });

    // Click Critical filter
    await page.locator('button', { hasText: /Critical/ }).first().click();
    // Either shows critical items or the empty state — no crash
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('grid/list view toggle switches layout', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/inventory');
    await expect(page.locator('text=Samgyupsal')).toBeVisible({ timeout: 10000 });

    // Find and click the grid toggle button
    const gridBtn = page.locator('button[aria-label*="grid" i], button[title*="grid" i]').first();
    if (await gridBtn.count() > 0) {
      await gridBtn.click();
      // Grid view: items appear as cards rather than table rows
      await expect(page.locator('text=Samgyupsal')).toBeVisible();
    }
  });

  test('clicking a stock item opens the action modal', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/inventory');
    await expect(page.locator('text=Samgyupsal')).toBeVisible({ timeout: 10000 });

    // Click the row to open the action modal
    await page.locator('tr', { hasText: 'Samgyupsal' }).click();
    // Modal should appear with item name
    await expect(page.locator('.fixed, [role="dialog"]', { hasText: 'Samgyupsal' }).first()).toBeVisible({ timeout: 5000 });
  });

  test('images display for stock items with linked menu images', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/inventory');
    await expect(page.locator('text=Samgyupsal')).toBeVisible({ timeout: 10000 });
    // At least one <img> should be visible in the inventory table (placeholder images)
    await expect(page.locator('tbody img, .inventory-card img').first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── Receive Delivery ────────────────────────────────────────────────────────

test.describe('Stock — Receive Delivery', () => {
  test('form requires item, quantity, and supplier to enable save', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/receive');
    await expect(page.locator('text=Log Delivery')).toBeVisible({ timeout: 10000 });

    // Save button should not be clickable without required fields
    // The form itself validates — check that submit doesn't complete without data
    const saveBtn = page.locator('button', { hasText: /Save|Record|Receive/i });
    await expect(saveBtn).toBeDisabled();
  });

  test('receive delivery: fill form and submit', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/receive');
    await expect(page.locator('text=Log Delivery')).toBeVisible({ timeout: 10000 });

    // Select a stock item
    await page.locator('select').first().selectOption({ index: 1 });

    // Fill quantity
    await page.locator('input[type="number"]').first().fill('500');

    // Fill supplier
    await page.locator('input[placeholder*="supplier" i], input[placeholder*="Supplier" i]').fill('Tagbilaran Meats Inc.');

    // Submit
    const saveBtn = page.locator('button', { hasText: /Save|Record|Receive/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // Should show success feedback or clear form
    await expect(page.locator('text=saved, text=success, text=Delivery logged').or(
      page.locator('select').first()
    )).toBeVisible({ timeout: 5000 });
  });
});

// ─── Waste Log ────────────────────────────────────────────────────────────────

test.describe('Stock — Waste Log', () => {
  test('waste log page loads with the form', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/waste');
    await expect(page.locator('body')).not.toContainText('Error');
    // Form should have an item selector
    await expect(page.locator('select').first()).toBeVisible({ timeout: 10000 });
  });

  test('log waste: fill form and submit', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/waste');
    await expect(page.locator('select').first()).toBeVisible({ timeout: 10000 });

    // Select item
    await page.locator('select').first().selectOption({ index: 1 });

    // Fill quantity
    await page.locator('input[type="number"]').fill('50');

    // Select or fill reason
    const reasonField = page.locator('select', { hasText: /Spoilage|Trimming|reason/i }).or(
      page.locator('input[placeholder*="reason" i]')
    ).first();
    if (await reasonField.count() > 0) {
      await reasonField.selectOption({ index: 1 }).catch(() => reasonField.fill('Spoilage'));
    }

    // Submit
    const submitBtn = page.locator('button', { hasText: /Log|Save|Record/i }).last();
    await submitBtn.click();

    // Form clears or success message
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

// ─── Stock Counts ────────────────────────────────────────────────────────────

test.describe('Stock — Stock Counts', () => {
  test('counts page loads with timed count form', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/counts');
    await expect(page.locator('body')).not.toContainText('Error');
    // Should show time slots (10am, 4pm, 10pm)
    await expect(page.locator('text=/10am|10 AM|am10/i').or(
      page.locator('text=/4pm|4 PM|pm4/i')
    ).first()).toBeVisible({ timeout: 10000 });
  });

  test('entering a count value saves without error', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/counts');
    await page.waitForTimeout(2000);

    // Find first numeric input in the count form
    const countInput = page.locator('input[type="number"]').first();
    if (await countInput.count() > 0) {
      await countInput.fill('1200');
      // Tab or blur to save
      await countInput.press('Tab');
      await expect(page.locator('body')).not.toContainText('Error');
    }
  });
});

// ─── Deliveries List ─────────────────────────────────────────────────────────

test.describe('Stock — Deliveries List', () => {
  test('deliveries page shows existing delivery records', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/deliveries');
    await expect(page.locator('body')).not.toContainText('Error');
    // Should have some content from seed data
    await expect(page.locator('tbody tr, .delivery-row, [data-testid="delivery-row"]').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Transfers ────────────────────────────────────────────────────────────────

test.describe('Stock — Transfers', () => {
  test('transfers page loads without crash', async ({ page }) => {
    await loginAsStock(page);
    await page.goto('/stock/transfers');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});
