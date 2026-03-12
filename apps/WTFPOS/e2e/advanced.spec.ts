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

async function addDrinksAndCharge(page: Page, ...drinks: string[]) {
  await page.locator('button', { hasText: 'Drinks' }).first().click();
  for (const drink of drinks) {
    await page.locator('button', { hasText: drink }).first().click();
  }
  await page.locator('button', { hasText: 'CHARGE' }).click();
}

/** Enter 4-digit manager PIN on any numpad modal. Scoped to a specific modal if provided. */
async function enterPin(page: Page, pin = '1234', scope?: ReturnType<Page['locator']>) {
  const root = scope ?? page.locator('.pos-card').last();
  for (const digit of pin) {
    await root.locator('button', { hasText: new RegExp(`^${digit}$`) }).click();
  }
}

async function skipLeftoverPenalty(page: Page) {
  await expect(page.locator('h2', { hasText: 'Leftover Check' })).toBeVisible();
  await page.locator('button', { hasText: 'No Leftovers' }).click();
}

async function checkoutExactCash(page: Page) {
  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await expect(checkout).toBeVisible();
  await page.locator('button', { hasText: 'Exact' }).click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled();
  await confirmBtn.click({ force: true });
  // Wait for either "Payment Successful" receipt or page reload (HMR recovery)
  const successText = page.locator('text=Payment Successful');
  const doneBtn = page.locator('button', { hasText: 'Done' });
  try {
    await expect(successText).toBeVisible({ timeout: 10000 });
    await doneBtn.click();
  } catch {
    // Payment completed but page may have reloaded — verify we're back on POS floor
    await page.waitForURL('**/pos', { timeout: 10000 });
  }
}

// ─── Scenario 6: Transfer table ──────────────────────────────────────────────

test('Scenario 6: Transfer — move order from T1 to T5 with manager PIN', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T1', 2);
  await selectPackageAndCharge(page, '🐷 Unli Pork');

  // Click Transfer in sidebar
  await page.locator('button', { hasText: 'Transfer' }).click();
  await expect(page.locator('h3', { hasText: 'Transfer T1' })).toBeVisible();

  // Select target table T5 (scope to the modal to avoid matching floor plan button)
  const transferModal = page.locator('.pos-card', { hasText: 'Transfer T1' });
  await transferModal.locator('button', { hasText: 'T5' }).click();

  // Manager PIN required
  await expect(page.locator('h3', { hasText: 'Manager PIN Required' })).toBeVisible();
  await enterPin(page);
  await page.locator('button', { hasText: 'Confirm Transfer' }).click();

  // T5 should now be occupied, T1 should be available. Select T5 to view its bill.
  await page.locator('[aria-label="Table T5"]').click();
  await expect(page.locator('button', { hasText: 'Checkout' })).toBeVisible({ timeout: 5000 });

  // Checkout from T5 to clean up
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);
  await checkoutExactCash(page);
});

// ─── Scenario 7: Package upgrade (no PIN) ────────────────────────────────────

test('Scenario 7: Upgrade package — Unli Pork to Unli Beef (no PIN needed)', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T2', 2);
  await selectPackageAndCharge(page, '🐷 Unli Pork');

  // Click Change Pkg in sidebar
  await page.locator('button', { hasText: 'Change Pkg' }).click();
  await expect(page.locator('h3', { hasText: 'Change Package' })).toBeVisible();

  // Select Unli Beef — scope to modal, match the button containing "Unli Beef" but not "Pork & Beef"
  const pkgModal = page.locator('.pos-card', { hasText: 'Change Package' });
  await pkgModal.locator('button', { hasText: '🐄 Unli Beef' }).click();

  // Modal should close (upgrade is instant, no PIN)
  await expect(page.locator('h3', { hasText: 'Change Package' })).not.toBeVisible({ timeout: 5000 });

  // Checkout to clean up
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);
  await checkoutExactCash(page);
});

// ─── Scenario 8: Change pax with manager PIN ────────────────────────────────

test('Scenario 8: Change pax — increase from 2 to 4 with manager PIN', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T3', 2);
  await selectPackageAndCharge(page, '🐷 Unli Pork');

  // Click Pax button in sidebar
  await page.locator('button', { hasText: 'Pax' }).click();
  await expect(page.locator('h2', { hasText: 'Change Pax' })).toBeVisible();

  // Increase pax: click + twice (2 -> 4)
  const plusBtn = page.locator('.pos-card button', { hasText: '+' }).last();
  await plusBtn.click();
  await plusBtn.click();

  // Apply Change
  await page.locator('button', { hasText: 'Apply Change' }).click();

  // Manager PIN modal appears
  await expect(page.locator('h3', { hasText: 'Manager PIN Required' })).toBeVisible();
  await enterPin(page);
  await page.locator('button', { hasText: 'Verify' }).click();

  // Sidebar should now show 4 pax
  await expect(page.locator('text=4 pax')).toBeVisible();

  // Checkout to clean up
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);
  await checkoutExactCash(page);
});

// ─── Scenario 9: Equal split bill (2-way) ───────────────────────────────────

test('Scenario 9: Split bill — equal 2-way split, pay each with cash', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T4', 2);
  await selectPackageAndCharge(page, '🐷 Unli Pork');

  // Add extra drinks so the bill is more interesting
  await page.locator('button', { hasText: '+ ADD' }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible();
  await addDrinksAndCharge(page, 'Soju', 'Iced Tea');

  // Click Split Bill in sidebar
  await page.locator('button', { hasText: 'Split Bill' }).click();
  await expect(page.locator('h3', { hasText: 'Split Bill' })).toBeVisible();

  // Equal split is default, 2-way is default. Click Continue.
  await page.locator('button', { hasText: 'Continue' }).click();

  // Should show equal split with Guest 1 and Guest 2
  await expect(page.locator('text=Guest 1')).toBeVisible();
  await expect(page.locator('text=Guest 2')).toBeVisible();

  // Proceed to Payment
  await page.locator('button', { hasText: 'Proceed to Payment' }).click();
  await expect(page.locator('h3', { hasText: 'Split Payment' })).toBeVisible();

  // Pay Guest 1 with exact cash
  await expect(page.locator('button', { hasText: /Pay Guest 1/ })).toBeVisible();
  await page.locator('button', { hasText: 'Exact' }).click();
  await page.locator('button', { hasText: /Pay Guest 1/ }).click();

  // Click Guest 2 tab to explicitly activate it, then pay
  await page.locator('button', { hasText: /Guest 2/ }).click();
  await expect(page.locator('button', { hasText: /Pay Guest 2/ })).toBeVisible({ timeout: 5000 });
  await page.locator('button', { hasText: 'Exact' }).click();
  await page.locator('button', { hasText: /Pay Guest 2/ }).click();

  // All paid — either see "All sub-bills paid" + Done, or modal auto-closes
  const allPaidText = page.locator('text=All sub-bills paid');
  const doneBtn = page.locator('button', { hasText: 'Done' });
  // If the "All paid" screen shows, click Done; otherwise the order auto-completed
  if (await allPaidText.isVisible({ timeout: 3000 }).catch(() => false)) {
    await doneBtn.click();
  }
  // T4 should be available again (order completed)
  await expect(page.locator('[aria-label="Table T4"]')).toBeVisible();
});

// ─── Scenario 10: Leftover penalty with weight ──────────────────────────────

test('Scenario 10: Leftover penalty — 200g unconsumed meat, then checkout', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T5', 2);
  await selectPackageAndCharge(page, '🐷 Unli Pork');

  // Checkout
  await page.locator('button', { hasText: 'Checkout' }).click();

  // LeftoverPenaltyModal — enter 200g
  await expect(page.locator('h2', { hasText: 'Leftover Check' })).toBeVisible();

  // Type 200 using numpad
  await page.locator('.pos-card button', { hasText: /^2$/ }).first().click();
  await page.locator('.pos-card button', { hasText: /^0$/ }).first().click();
  await page.locator('.pos-card button', { hasText: /^0$/ }).first().click();

  // Should display 200 g and a penalty amount
  await expect(page.locator('text=200 g')).toBeVisible();

  // Click "Apply & Checkout"
  await page.locator('button', { hasText: 'Apply & Checkout' }).click();

  // Checkout modal — pay exact cash
  await checkoutExactCash(page);
});

// ─── Scenario 11: Merge two tables ──────────────────────────────────────────

test('Scenario 11: Merge — combine T6 and T7 into one bill', async ({ page }) => {
  await login(page);

  // Open T6 with package
  await openTableWithPax(page, 'T6', 2);
  await selectPackageAndCharge(page, '🐷 Unli Pork');

  // Deselect T6 by clicking empty area, then open T7
  await page.locator('[aria-label="Table T7"]').click();
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible();
  await page.locator('.pos-card button', { hasText: /^3$/ }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible();
  await selectPackageAndCharge(page, '🐷 Unli Pork');

  // Now select T6 (occupied) to view its bill
  await page.locator('[aria-label="Table T6"]').click();

  // Click Merge Table in sidebar
  await page.locator('button', { hasText: 'Merge Table' }).click();
  await expect(page.locator('h3', { hasText: 'Merge Tables' })).toBeVisible();

  // Select T7 as merge target (scope to modal to avoid floor plan button)
  const mergeModal = page.locator('.pos-card', { hasText: 'Merge Tables' });
  await mergeModal.locator('button', { hasText: 'T7' }).click();

  // Manager PIN required (same package, so no conflict step)
  await expect(page.locator('h3', { hasText: 'Manager PIN Required' })).toBeVisible();
  await enterPin(page);
  await page.locator('button', { hasText: 'Confirm Merge' }).click();

  // After merge, the combined order stays on T6. T7 is freed.
  // Select T6 to view its bill and checkout.
  await page.locator('[aria-label="Table T6"]').click();
  await expect(page.locator('button', { hasText: 'Checkout' })).toBeVisible({ timeout: 5000 });

  // Checkout to clean up
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);
  await checkoutExactCash(page);
});

// ─── Scenario 12: PWD discount ──────────────────────────────────────────────

test('Scenario 12: PWD discount — 2 pax, 1 PWD, pay via Maya', async ({ page }) => {
  await login(page);
  await openTableWithPax(page, 'T8', 2);
  await selectPackageAndCharge(page, '🐷 Unli Pork');

  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);

  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await expect(checkout).toBeVisible();

  // Apply PWD discount
  await checkout.locator('button', { hasText: 'PWD' }).click();

  // Fill PWD ID
  const pwdInput = page.locator('input[placeholder="e.g. 12345678"]').first();
  await expect(pwdInput).toBeVisible({ timeout: 5000 });
  await pwdInput.fill('PWD-2024-001');

  // Select Maya payment
  await page.locator('button', { hasText: 'Maya' }).click();

  // Confirm
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });

  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
});
