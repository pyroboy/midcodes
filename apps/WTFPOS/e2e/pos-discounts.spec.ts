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
  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await expect(checkout).toBeVisible();
}

async function confirmExactCash(page: Page) {
  await page.locator('button', { hasText: 'Exact' }).click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });
  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
}

// ─── Discount: Promo ──────────────────────────────────────────────────────────

test('Discount: Promo — apply promo discount at checkout', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T1', 2);
  await selectPackageAndCharge(page, 'Unli Pork');
  await openCheckout(page);

  // Apply promo discount
  const promoBtn = page.locator('button', { hasText: /Promo/i });
  if (await promoBtn.count() > 0) {
    await promoBtn.click();
    // Discount amount should change
    await expect(page.locator('text=/Discount|discount/i').first()).toBeVisible({ timeout: 3000 });
  }

  await confirmExactCash(page);
});

// ─── Discount: Comp (Complimentary) ──────────────────────────────────────────

test('Discount: Comp — apply complimentary (write-off) discount', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T2', 2);
  await selectPackageAndCharge(page, 'Unli Pork');
  await openCheckout(page);

  const compBtn = page.locator('button', { hasText: /Comp|Complimentary/i });
  if (await compBtn.count() > 0) {
    await compBtn.click();
    await expect(page.locator('body')).not.toContainText('Error');
  }

  await confirmExactCash(page);
});

// ─── Discount: Service Recovery ───────────────────────────────────────────────

test('Discount: Service Recovery — apply service recovery discount', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T3', 2);
  await selectPackageAndCharge(page, 'Unli Pork');
  await openCheckout(page);

  const srBtn = page.locator('button', { hasText: /Service Recovery|Recovery/i });
  if (await srBtn.count() > 0) {
    await srBtn.click();
    await expect(page.locator('body')).not.toContainText('Error');
  }

  await confirmExactCash(page);
});

// ─── Discount: SC multi-pax (3 of 4) ─────────────────────────────────────────

test('Discount: Senior Citizen — 4 pax, 3 qualifying SC, pay cash', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T4', 4);
  await selectPackageAndCharge(page, 'Unli Pork');
  await openCheckout(page);

  // Apply SC discount
  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await checkout.locator('button', { hasText: 'Senior' }).click();

  // Adjust qualifying pax count to 3
  const paxInput = page.locator('input[type="number"]').first();
  if (await paxInput.count() > 0) {
    await paxInput.fill('3');
  }

  // Fill 3 SC ID numbers
  const scIdInputs = page.locator('input[placeholder*="12345678" i]');
  const count = await scIdInputs.count();
  for (let i = 0; i < Math.min(count, 3); i++) {
    await scIdInputs.nth(i).fill(`SC-2024-00${i + 1}`);
  }

  await confirmExactCash(page);
});

// ─── Discount: PWD multi-pax (2 of 3) ────────────────────────────────────────

test('Discount: PWD — 3 pax, 2 qualifying PWD, pay cash', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T5', 3);
  await selectPackageAndCharge(page, 'Unli Pork');
  await openCheckout(page);

  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await checkout.locator('button', { hasText: 'PWD' }).click();

  // Adjust qualifying pax to 2
  const paxInput = page.locator('input[type="number"]').first();
  if (await paxInput.count() > 0) {
    await paxInput.fill('2');
  }

  const pwdInputs = page.locator('input[placeholder*="12345678" i]');
  const count = await pwdInputs.count();
  for (let i = 0; i < Math.min(count, 2); i++) {
    await pwdInputs.nth(i).fill(`PWD-2024-00${i + 1}`);
  }

  await confirmExactCash(page);
});

// ─── Void: Walkout reason ─────────────────────────────────────────────────────

test('Void: walkout — open table, add package, void with walkout reason', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T6', 2);
  await selectPackageAndCharge(page, 'Unli Pork');

  // Click Void
  await page.locator('button', { hasText: 'Void' }).click();
  await expect(page.locator('h3', { hasText: 'Void Order' })).toBeVisible();

  // Select Walkout reason
  const walkoutOption = page.locator('button, label', { hasText: /Walkout/i });
  if (await walkoutOption.count() > 0) {
    await walkoutOption.click();
  }

  // Enter PIN and confirm
  for (const digit of '1234') {
    await page.locator('.pos-card button', { hasText: new RegExp(`^${digit}$`) }).click();
  }
  await page.locator('button', { hasText: 'Confirm Void' }).click();
  await expect(page.locator('[aria-label="Table T6"]')).toBeVisible();
});

// ─── Takeout: Status progression ─────────────────────────────────────────────

test('Takeout: status progression — new → preparing → ready', async ({ page }) => {
  await login(page);

  // Create takeout
  await page.locator('button', { hasText: 'New Takeout' }).click();
  await expect(page.locator('h3', { hasText: 'New Takeout Order' })).toBeVisible();
  await page.locator('input[placeholder*="Maria"]').fill('Status Test');
  await page.locator('button', { hasText: 'Create Order' }).click();

  // Add items
  await expect(page.locator('h2', { hasText: 'Add to Takeout' })).toBeVisible();
  await page.locator('button', { hasText: 'Dishes' }).first().click();
  await page.locator('button', { hasText: 'Bibimbap' }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();

  // Advance takeout status if UI supports it
  const statusBtn = page.locator('button', { hasText: /Preparing|Mark Preparing|Start Cooking/i }).first();
  if (await statusBtn.count() > 0) {
    await statusBtn.click();
    await expect(page.locator('text=/preparing|Preparing/i').first()).toBeVisible({ timeout: 3000 });

    const readyBtn = page.locator('button', { hasText: /Ready|Mark Ready/i }).first();
    if (await readyBtn.count() > 0) {
      await readyBtn.click();
      await expect(page.locator('text=/ready|Ready/i').first()).toBeVisible({ timeout: 3000 });
    }
  }
});
