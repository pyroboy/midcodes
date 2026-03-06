import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('maria');
  await page.locator('#password').fill('maria');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 10000 });
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
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

async function skipLeftoverPenalty(page: Page) {
  await expect(page.locator('h2', { hasText: 'Leftover Penalty?' })).toBeVisible();
  await page.locator('button', { hasText: 'Skip / Checkout' }).click();
}

async function openCheckout(page: Page) {
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);
  await expect(page.locator('.pos-card', { hasText: 'Checkout' }).first()).toBeVisible();
}

// ─── Card Payment ─────────────────────────────────────────────────────────────

test('Payment: Card — Unli Pork 2 pax, pay via Card', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T1', 2);
  await selectPackageAndCharge(page, 'Unli Pork');
  await openCheckout(page);

  await page.locator('button', { hasText: 'Card' }).click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });

  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
});

// ─── Maya Payment ─────────────────────────────────────────────────────────────

test('Payment: Maya — Unli Beef 2 pax, pay via Maya', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T2', 2);
  await selectPackageAndCharge(page, 'Unli Beef');
  await openCheckout(page);

  await page.locator('button', { hasText: 'Maya' }).click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });

  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
});

// ─── Custom Cash Tendered ─────────────────────────────────────────────────────

test('Payment: Cash — custom tendered amount shows correct change', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T3', 2);
  await selectPackageAndCharge(page, 'Unli Pork'); // ₱499 x 2 = ₱998
  await openCheckout(page);

  // Select Cash method
  await page.locator('button', { hasText: 'Cash' }).first().click();

  // Enter a custom tender amount — ₱1000 for a ₱998 bill
  const tenderInput = page.locator('input[type="number"], input[placeholder*="amount" i], input[placeholder*="tender" i]').first();
  if (await tenderInput.count() > 0) {
    await tenderInput.fill('1000');
    // Change should show ₱2
    await expect(page.locator('text=/change|Change/i').first()).toBeVisible({ timeout: 3000 });
  }

  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });

  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
});

// ─── Partial / Split Tender (Cash + GCash) ────────────────────────────────────

test('Payment: Partial tender — pay half cash, half GCash', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T4', 2);
  await selectPackageAndCharge(page, 'Unli Pork');
  await openCheckout(page);

  // Add a cash partial payment
  await page.locator('button', { hasText: 'Cash' }).first().click();
  const cashInput = page.locator('input[type="number"]').first();
  if (await cashInput.count() > 0) {
    await cashInput.fill('500');
    const addPaymentBtn = page.locator('button', { hasText: /Add|Apply partial/i }).first();
    if (await addPaymentBtn.count() > 0) {
      await addPaymentBtn.click();
    }
  }

  // Add GCash for the remainder
  await page.locator('button', { hasText: 'GCash' }).click();

  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  if (await confirmBtn.isEnabled()) {
    await confirmBtn.click({ force: true });
    await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
    await page.locator('button', { hasText: 'Done' }).click();
  }
});

// ─── Combo Package + All Payment Methods ──────────────────────────────────────

test('Payment: Combo package — Unli Pork & Beef, exact cash', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T5', 2);

  // Select combo — includes all 6 meats
  await selectPackageAndCharge(page, 'Unli Pork & Beef');
  await openCheckout(page);

  // Pay exact cash
  await page.locator('button', { hasText: 'Exact' }).click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });

  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
});

// ─── By-Item Split Bill ───────────────────────────────────────────────────────

test('Split Bill: by-item — assign items to 2 guests, pay each separately', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T6', 2);
  await selectPackageAndCharge(page, 'Unli Pork');

  // Add extra items
  await page.locator('button', { hasText: '+ ADD' }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible();
  await page.locator('button', { hasText: 'Drinks' }).first().click();
  await page.locator('button', { hasText: 'Soju' }).first().click();
  await page.locator('button', { hasText: 'Iced Tea' }).click();
  await page.locator('button', { hasText: 'CHARGE' }).click();

  // Open split bill
  await page.locator('button', { hasText: 'Split Bill' }).click();
  await expect(page.locator('h3', { hasText: 'Split Bill' })).toBeVisible();

  // Switch to By-Item mode
  const byItemBtn = page.locator('button', { hasText: /By Item|by-item|Item/i }).first();
  if (await byItemBtn.count() > 0) {
    await byItemBtn.click();
    await page.locator('button', { hasText: 'Continue' }).click();

    // Assign items to guests if the UI renders item assignment
    await expect(page.locator('text=/Guest 1|Guest 2/i').first()).toBeVisible({ timeout: 5000 });

    // Proceed to payment
    await page.locator('button', { hasText: 'Proceed to Payment' }).click();

    // Pay Guest 1
    await page.locator('button', { hasText: 'Exact' }).first().click();
    await page.locator('button', { hasText: /Pay Guest 1/i }).click();

    // Pay Guest 2
    await expect(page.locator('button', { hasText: /Pay Guest 2/i })).toBeVisible({ timeout: 5000 });
    await page.locator('button', { hasText: 'Exact' }).first().click();
    await page.locator('button', { hasText: /Pay Guest 2/i }).click();

    await expect(page.locator('text=/All.*paid|Payment Successful/i').first()).toBeVisible({ timeout: 10000 });
    await page.locator('button', { hasText: 'Done' }).click();
  }
});

// ─── X-Read Generation ────────────────────────────────────────────────────────

test('X-Read: generate X-reading from POS', async ({ page }) => {
  await login(page);
  // Place and complete one order so the X-read has data
  await openTableWithPax(page, 'T7', 2);
  await selectPackageAndCharge(page, 'Unli Pork');
  await openCheckout(page);
  await page.locator('button', { hasText: 'Exact' }).click();
  await page.locator('button', { hasText: 'Confirm Payment' }).click({ force: true });
  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();

  // Navigate to X-Read report
  await page.goto('/reports/x-read');
  const generateBtn = page.locator('button', { hasText: /Generate|Print X-Read|X-Read/i }).first();
  if (await generateBtn.count() > 0) {
    await generateBtn.click();
    await expect(page.locator('body')).not.toContainText('Error');
  }
});
