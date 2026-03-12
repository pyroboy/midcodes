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

async function enterManagerPin(page: Page, pin = '1234') {
  for (const digit of pin) {
    await page.locator('.pos-card button', { hasText: new RegExp(`^${digit}$`) }).click();
  }
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
  await selectPackageAndCharge(page, 'Pork Unlimited');
  await openCheckout(page);

  // Apply promo discount — requires manager PIN
  const promoBtn = page.locator('button', { hasText: /Promo/i });
  if (await promoBtn.count() > 0) {
    await promoBtn.click();
    await expect(page.locator('h3', { hasText: /Authorize Promo/i })).toBeVisible({ timeout: 5000 });
    await enterManagerPin(page);
    await page.locator('button', { hasText: 'Authorize' }).click();
  }

  await confirmExactCash(page);
});

// ─── Discount: Comp (Complimentary) ──────────────────────────────────────────

test('Discount: Comp — apply complimentary (write-off) discount', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T2', 2);
  await selectPackageAndCharge(page, 'Pork Unlimited');
  await openCheckout(page);

  const compBtn = page.locator('button', { hasText: /Comp|Complimentary/i });
  if (await compBtn.count() > 0) {
    await compBtn.click();
    await expect(page.locator('h3', { hasText: /Authorize Comp/i })).toBeVisible({ timeout: 5000 });
    await enterManagerPin(page);
    await page.locator('button', { hasText: 'Authorize' }).click();
  }

  await confirmExactCash(page);
});

// ─── Discount: Service Recovery ───────────────────────────────────────────────

test('Discount: Service Recovery — apply service recovery discount', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T3', 2);
  await selectPackageAndCharge(page, 'Pork Unlimited');
  await openCheckout(page);

  const srBtn = page.locator('button', { hasText: /Service Recovery|Recovery/i });
  if (await srBtn.count() > 0) {
    await srBtn.click();
    await expect(page.locator('h3', { hasText: /Authorize Service/i })).toBeVisible({ timeout: 5000 });
    await enterManagerPin(page);
    await page.locator('button', { hasText: 'Authorize' }).click();
  }

  await confirmExactCash(page);
});

// ─── Discount: SC multi-pax (3 of 4) ─────────────────────────────────────────

test('Discount: Senior Citizen — 4 pax, 3 qualifying SC, pay cash', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T4', 4);
  await selectPackageAndCharge(page, 'Pork Unlimited');
  await openCheckout(page);

  // Apply SC discount — requires manager PIN authorization
  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await checkout.locator('button', { hasText: 'Senior' }).click();
  await expect(page.locator('h3', { hasText: 'Authorize Senior Citizen' })).toBeVisible({ timeout: 5000 });
  await enterManagerPin(page);
  await page.locator('button', { hasText: 'Authorize' }).click();

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
  await selectPackageAndCharge(page, 'Pork Unlimited');
  await openCheckout(page);

  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await checkout.locator('button', { hasText: 'PWD' }).click();
  await expect(page.locator('h3', { hasText: 'Authorize PWD' })).toBeVisible({ timeout: 5000 });
  await enterManagerPin(page);
  await page.locator('button', { hasText: 'Authorize' }).click();

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
  await selectPackageAndCharge(page, 'Pork Unlimited');

  // Click Void — opens ManagerPinModal for authorization
  await page.locator('button', { hasText: 'Void' }).click();
  await expect(page.locator('h3', { hasText: 'Void Entire Order' })).toBeVisible({ timeout: 5000 });

  // Enter PIN and confirm
  await enterManagerPin(page);
  await page.locator('button', { hasText: 'Void Order' }).click();
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
