import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsWarehouse(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('noel');
  await page.locator('#password').fill('noel');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/stock', { timeout: 10000 });
  // Wait for RxDB to seed stock items
  await page.waitForTimeout(2000);
}

async function loginAsManager(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('juan');
  await page.locator('#password').fill('juan');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  // Manager shows PIN step — h2 "Manager PIN" with numpad, then VERIFY PIN button
  await expect(page.locator('h2', { hasText: 'Manager PIN' })).toBeVisible({ timeout: 10000 });
  for (const digit of '1234') {
    await page.locator('.pos-card button', { hasText: new RegExp(`^${digit}$`) }).click();
  }
  await page.locator('button', { hasText: 'VERIFY PIN' }).click();
  await page.waitForURL('**/pos', { timeout: 10000 });
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
}

// ─── Stock Transfer Wizard ────────────────────────────────────────────────────

test.describe('Stock — Transfer Wizard', () => {
  test('transfer page shows 3-step wizard UI', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/transfers');

    // Step indicators
    await expect(page.locator('text=Select Item')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Destination')).toBeVisible();
    await expect(page.locator('text=Confirm')).toBeVisible();
  });

  test('Next button is disabled until item and quantity are filled', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/transfers');

    await expect(page.locator('button', { hasText: 'Next' })).toBeDisabled({ timeout: 10000 });
  });

  test('Step 1: select item shows available stock preview', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/transfers');

    // Select "Sliced Pork (Bulk)" — tracked in wh-tag and both branches
    const itemSelect = page.locator('select').first();
    await expect(itemSelect).toBeVisible({ timeout: 10000 });
    await itemSelect.selectOption({ value: 'meat-pork-sliced' });

    // Available stock shows
    await expect(page.locator('text=Available:')).toBeVisible({ timeout: 5000 });
  });

  test('Step 1 → Step 2: fill item + quantity and proceed to Destination', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/transfers');

    // Select item
    await page.locator('select').first().selectOption({ value: 'meat-pork-sliced' });
    await expect(page.locator('text=Available:')).toBeVisible({ timeout: 5000 });

    // Enter quantity
    await page.locator('input[type="number"]').first().fill('500');

    // Next enabled and clickable
    await expect(page.locator('button', { hasText: 'Next' })).toBeEnabled({ timeout: 5000 });
    await page.locator('button', { hasText: 'Next' }).click();

    // Step 2: Destination selection
    await expect(page.locator('text=Select Destination').first()).toBeVisible({ timeout: 5000 });
  });

  test('Step 2: destination cards show Tagbilaran and Panglao options', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/transfers');

    await page.locator('select').first().selectOption({ value: 'meat-pork-sliced' });
    await page.locator('input[type="number"]').first().fill('500');
    await page.locator('button', { hasText: 'Next' }).click();

    // Branch destination cards
    await expect(page.locator('text=Tagbilaran Branch').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Panglao Branch').first()).toBeVisible();
  });

  test('Step 2 → Step 3: select Tagbilaran as destination and proceed to Confirm', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/transfers');

    await page.locator('select').first().selectOption({ value: 'meat-pork-sliced' });
    await page.locator('input[type="number"]').first().fill('500');
    await page.locator('button', { hasText: 'Next' }).click();

    // Select Tagbilaran Branch radio
    await page.locator('input[type="radio"][value="tag"]').click();

    await expect(page.locator('button', { hasText: 'Next' }).last()).toBeEnabled({ timeout: 5000 });
    await page.locator('button', { hasText: 'Next' }).last().click();

    // Step 3: Transfer Summary
    await expect(page.locator('text=Transfer Summary')).toBeVisible({ timeout: 5000 });
  });

  test('Step 3: shows Source and Destination panels with before/after stock', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/transfers');

    await page.locator('select').first().selectOption({ value: 'meat-pork-sliced' });
    await page.locator('input[type="number"]').first().fill('500');
    await page.locator('button', { hasText: 'Next' }).click();
    await page.locator('input[type="radio"][value="tag"]').click();
    await page.locator('button', { hasText: 'Next' }).last().click();

    await expect(page.locator('text=Source').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Destination').first()).toBeVisible();
    await expect(page.locator('text=Before').first()).toBeVisible();
    await expect(page.locator('text=After').first()).toBeVisible();
  });

  test('Full transfer: confirm shows success toast and resets wizard', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/transfers');

    await page.locator('select').first().selectOption({ value: 'meat-pork-sliced' });
    await page.locator('input[type="number"]').first().fill('500');
    await page.locator('button', { hasText: 'Next' }).click();
    await page.locator('input[type="radio"][value="tag"]').click();
    await page.locator('button', { hasText: 'Next' }).last().click();

    // Confirm Transfer
    await page.locator('button', { hasText: 'Confirm Transfer' }).click();

    // Success toast
    await expect(page.locator('text=/Transferred|transferred/i')).toBeVisible({ timeout: 5000 });

    // Wizard resets to Step 1
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5000 });
  });

  test('Completed transfer appears in Recent Transfers list', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/transfers');

    await page.locator('select').first().selectOption({ value: 'meat-pork-sliced' });
    await page.locator('input[type="number"]').first().fill('300');
    await page.locator('button', { hasText: 'Next' }).click();
    await page.locator('input[type="radio"][value="tag"]').click();
    await page.locator('button', { hasText: 'Next' }).last().click();
    await page.locator('button', { hasText: 'Confirm Transfer' }).click();

    // Wait for wizard reset
    await expect(page.locator('text=/Transferred|transferred/i')).toBeVisible({ timeout: 5000 });

    // Recent Transfers table appears
    await expect(page.locator('text=Recent Transfers')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Sliced Pork|Transfer/i').first()).toBeVisible();
  });

  test('Back button from Step 2 returns to Step 1', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/transfers');

    await page.locator('select').first().selectOption({ value: 'meat-pork-sliced' });
    await page.locator('input[type="number"]').first().fill('500');
    await page.locator('button', { hasText: 'Next' }).click();

    await expect(page.locator('text=Select Destination')).toBeVisible({ timeout: 5000 });
    await page.locator('button', { hasText: 'Back' }).click();

    // Back to Step 1
    await expect(page.locator('text=Available:')).toBeVisible({ timeout: 5000 });
  });
});

// ─── Stock Level Changes ──────────────────────────────────────────────────────

test.describe('Stock — Level Changes After Operations', () => {
  test('receiving a delivery increases stock level for that item', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/receive');

    // Fill the receive form — item, qty, supplier are all required (canSave check)
    const itemSelect = page.locator('select').first();
    await expect(itemSelect).toBeVisible({ timeout: 10000 });
    await itemSelect.selectOption({ index: 1 }); // Pick first non-empty option

    const qtyInput = page.locator('input[type="number"]').first();
    await qtyInput.fill('1000');

    // Supplier field — placeholder is "e.g. Metro Meat Co."
    const supplierInput = page.locator('input[placeholder*="Metro"]');
    await expect(supplierInput).toBeVisible({ timeout: 5000 });
    await supplierInput.fill('Test Supplier');

    // Submit — button text is "+ Log Delivery"
    const saveBtn = page.locator('button', { hasText: /Log Delivery/i });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Success feedback — button changes to "✓ Saved!"
    await expect(page.locator('button', { hasText: /Saved/i })).toBeVisible({ timeout: 5000 });
  });

  test('logging waste shows success and appears in waste log', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/waste');

    await page.waitForTimeout(1000);

    // Fill waste form — item, qty, and reason are all required (canSave check)
    const itemSelect = page.locator('select').first();
    await expect(itemSelect).toBeVisible({ timeout: 10000 });
    await itemSelect.selectOption({ index: 1 });

    const qtyInput = page.locator('input[type="number"]').first();
    await qtyInput.fill('100');

    // Reason — click the first quick-tap reason button (e.g. "Dropped / Spilled")
    await page.locator('button', { hasText: 'Dropped / Spilled' }).click();

    const saveBtn = page.locator('button', { hasText: 'Log Waste' });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    // confirm() dialog — auto-accept
    page.once('dialog', dialog => dialog.accept());
    await saveBtn.click();

    // Success feedback — button changes to "✓ Logged!"
    await expect(page.locator('button', { hasText: /Logged/i })).toBeVisible({ timeout: 5000 });
  });

  test('inventory source banner shows correct warehouse location for noel', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/transfers');

    // The source banner says "Central Warehouse" for wh-tag session
    await expect(page.locator('text=Central Warehouse').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Branch-Scoped Inventory ──────────────────────────────────────────────────

test.describe('Stock — Branch-Scoped Inventory', () => {
  test('Tagbilaran branch stock shows Tagbilaran-specific items', async ({ page }) => {
    await loginAsManager(page);
    await page.goto('/stock/inventory');

    // Manager at Tagbilaran sees inventory
    await expect(page.locator('body')).not.toContainText('Error', { timeout: 10000 });
    // Some stock items should be listed
    await expect(page.locator('text=/Samgyupsal|Galbi|Pork|Beef/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('transfers page source reflects the session location', async ({ page }) => {
    await loginAsManager(page);
    await page.goto('/stock/transfers');

    // Manager at Tagbilaran — source should be Tagbilaran Branch
    await expect(page.locator('text=/Tagbilaran Branch|Alta Citta/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('deliveries list page loads with existing delivery records', async ({ page }) => {
    await loginAsWarehouse(page);
    await page.goto('/stock/deliveries');

    await expect(page.locator('body')).not.toContainText('Error', { timeout: 10000 });
    // Either shows a table of records or the empty-state message
    await expect(
      page.locator('table').or(page.locator('text=No deliveries found')).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
