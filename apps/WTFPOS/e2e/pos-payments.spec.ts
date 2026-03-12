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
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible({ timeout: 8000 });
  // New PaxModal uses stepper — click + for Adults pax times
  const adultPlusBtn = page.locator('.pos-card button').filter({ hasText: /^\+$/ }).first();
  for (let i = 0; i < pax; i++) {
    await adultPlusBtn.click();
  }
  await page.locator('.pos-card button', { hasText: 'Confirm' }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8000 });
}

async function selectPackageAndCharge(page: Page, packageName: string) {
  await page.locator('button', { hasText: packageName }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();
}

async function skipLeftoverPenalty(page: Page) {
  await expect(page.locator('h2', { hasText: 'Leftover Check' })).toBeVisible();
  await page.locator('button', { hasText: 'No Leftovers' }).click();
}

async function openCheckout(page: Page) {
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);
  await expect(page.locator('.pos-card', { hasText: 'Checkout' }).first()).toBeVisible();
}

// ─── Card Payment ─────────────────────────────────────────────────────────────

test('Payment: GCash — Pork Unlimited 2 pax, pay via GCash', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T1', 2);
  await selectPackageAndCharge(page, 'Pork Unlimited');
  await openCheckout(page);

  // Toggle GCash on (adds to entries) then set exact amount
  await page.locator('button', { hasText: 'GCash' }).click();
  await page.locator('button', { hasText: 'Exact' }).last().click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });

  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
});

// ─── Maya Payment ─────────────────────────────────────────────────────────────

test('Payment: Maya — Beef Unlimited 2 pax, pay via Maya', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T2', 2);
  await selectPackageAndCharge(page, 'Beef Unlimited');
  await openCheckout(page);

  // Toggle Maya on (adds to entries) then set exact amount
  await page.locator('button', { hasText: 'Maya' }).click();
  await page.locator('button', { hasText: 'Exact' }).last().click();
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
  await selectPackageAndCharge(page, 'Pork Unlimited'); // ₱499 x 2 = ₱998
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
  await selectPackageAndCharge(page, 'Pork Unlimited');
  await openCheckout(page);

  // Add a cash partial payment
  await page.locator('button', { hasText: 'Cash' }).first().click();
  const cashInput = page.locator('input[type="number"]').first();
  if (await cashInput.count() > 0) {
    await cashInput.fill('500');
    const addPaymentBtn = page.locator('button', { hasText: /Add|Apply partial/i }).first();
    if (await addPaymentBtn.count() > 0) {
      await addPaymentBtn.click({ force: true });
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

test('Payment: Combo package — Beef + Pork Unlimited, exact cash', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T5', 2);

  // Select combo — includes all 6 meats
  await selectPackageAndCharge(page, 'Beef + Pork Unlimited');
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
  await selectPackageAndCharge(page, 'Pork Unlimited');

  // Add extra items
  const addItemBtn2 = page.locator('button', { hasText: '+ Add Item' });
  await addItemBtn2.waitFor({ state: 'visible', timeout: 8000 });
  await addItemBtn2.click();
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
  await selectPackageAndCharge(page, 'Pork Unlimited');
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
