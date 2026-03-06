import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Login as a specific user and wait for redirect + floor plan render */
async function login(page: Page, username: string, dest: string) {
  await page.goto('/');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(username); // password === username for test accounts
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL(`**${dest}`, { timeout: 10000 });
  // Wait for RxDB to seed and floor plan to render
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
}

/** Open an available table by label, pick pax count */
async function openTableWithPax(page: Page, tableLabel: string, pax: number) {
  await page.locator(`[aria-label="Table ${tableLabel}"]`).click();
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible();
  await page.locator('.pos-card button', { hasText: new RegExp(`^${pax}$`) }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible();
}

/** Select a package by name in AddItemModal (auto-switches to Meats tab) */
async function selectPackage(page: Page, packageName: string) {
  await page.locator('button', { hasText: packageName }).first().click();
}

/** Switch to a category tab in AddItemModal by the uppercase label text */
async function switchCategory(page: Page, categoryName: string) {
  await page.locator('button', { hasText: categoryName }).first().click();
}

/** Press CHARGE to push pending items to the bill */
async function chargeItems(page: Page) {
  await page.locator('button', { hasText: 'CHARGE' }).click();
}

/** Skip the leftover penalty modal (no unconsumed meat) */
async function skipLeftoverPenalty(page: Page) {
  await expect(page.locator('h2', { hasText: 'Leftover Penalty?' })).toBeVisible();
  await page.locator('button', { hasText: 'Skip / Checkout' }).click();
}

/** Complete checkout with exact cash and close the receipt modal */
async function checkoutExactCash(page: Page) {
  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await expect(checkout).toBeVisible();
  await page.locator('button', { hasText: 'Exact' }).click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled();
  await confirmBtn.click({ force: true });
  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
}

/** Enter manager PIN via the numpad in any PIN modal */
async function enterManagerPin(page: Page, pin = '1234') {
  for (const digit of pin) {
    await page.locator('.pos-card button', { hasText: new RegExp(`^${digit}$`) }).click();
  }
}

// ─── Scenario 1: Basic dine-in — package + drink, exact cash ─────────────────

test('Scenario 1: Dine-in — open table, pick Unli Pork + Iced Tea, pay exact cash', async ({ page }) => {
  await login(page, 'maria', '/pos');
  await openTableWithPax(page, 'T1', 2);

  // Pick Unli Pork (auto-adds meats + sides as FREE, switches to Meats tab)
  await selectPackage(page, 'Unli Pork');

  // Add a drink
  await switchCategory(page, 'Drinks');
  await page.locator('button', { hasText: 'Iced Tea' }).click();
  await chargeItems(page);

  // Checkout flow
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);
  await checkoutExactCash(page);

  // T1 should be available again on the floor
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible();
});

// ─── Scenario 2: Takeout — dishes + drinks, GCash ───────────────────────────

test('Scenario 2: Takeout — Bibimbap + Soju, pay via GCash', async ({ page }) => {
  await login(page, 'maria', '/pos');

  // Create takeout order
  await page.locator('button', { hasText: 'New Takeout' }).click();
  await expect(page.locator('h3', { hasText: 'New Takeout Order' })).toBeVisible();
  await page.locator('input[placeholder*="Maria"]').fill('Juan Dela Cruz');
  await page.locator('button', { hasText: 'Create Order' }).click();

  // AddItemModal opens for takeout (no Packages/Meats tabs)
  await expect(page.locator('h2', { hasText: 'Add to Takeout' })).toBeVisible();

  // Switch to Dishes tab first (takeout hides Packages/Meats, default tab is empty)
  await switchCategory(page, 'Dishes');
  await page.locator('button', { hasText: 'Bibimbap' }).first().click();
  await switchCategory(page, 'Drinks');
  await page.locator('button', { hasText: 'Soju' }).first().click();
  await chargeItems(page);

  // Checkout — select GCash payment
  await page.locator('button', { hasText: 'Checkout' }).click();
  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await expect(checkout).toBeVisible();
  await page.locator('button', { hasText: 'GCash' }).click();

  // Confirm (no cash tendered needed for e-wallet)
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled();
  await confirmBtn.click({ force: true });

  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
});

// ─── Scenario 3: Senior Citizen discount — 4 pax, SC for 1 ──────────────────

test('Scenario 3: Dine-in — 4 pax Unli Pork, Senior discount 1 pax, pay cash', async ({ page }) => {
  await login(page, 'maria', '/pos');
  await openTableWithPax(page, 'T2', 4);

  // Package + extras
  await selectPackage(page, 'Unli Pork');
  await switchCategory(page, 'Drinks');
  await page.locator('button', { hasText: 'Soju' }).first().click();
  await page.locator('button', { hasText: 'Iced Tea' }).click();
  await chargeItems(page);

  // Checkout
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);

  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await expect(checkout).toBeVisible();

  // Apply Senior Citizen discount (defaults to 1 qualifying pax)
  await checkout.locator('button', { hasText: 'Senior' }).click();

  // Wait for SC/PWD section to render, then fill SC ID
  const scIdInput = page.locator('input[placeholder="e.g. 12345678"]').first();
  await expect(scIdInput).toBeVisible({ timeout: 5000 });
  await scIdInput.fill('SC-2024-001');

  // Pay exact cash (total may exceed preset amounts after discount calc)
  await page.locator('button', { hasText: 'Exact' }).click();

  // Confirm
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });

  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
});

// ─── Scenario 4: Void order with manager PIN ────────────────────────────────

test('Scenario 4: Void — open table, add items, void entire order with manager PIN', async ({ page }) => {
  await login(page, 'maria', '/pos');
  await openTableWithPax(page, 'T3', 2);

  // Add a package and charge
  await selectPackage(page, 'Unli Pork');
  await chargeItems(page);

  // Click Void in the sidebar
  await page.locator('button', { hasText: 'Void' }).click();
  await expect(page.locator('h3', { hasText: 'Void Order' })).toBeVisible();

  // Reason defaults to "Mistake" — enter manager PIN 1234
  await enterManagerPin(page);
  await page.locator('button', { hasText: 'Confirm Void' }).click();

  // T3 should be freed
  await expect(page.locator('[aria-label="Table T3"]')).toBeVisible();
});

// ─── Scenario 5: Add extra items to existing order ──────────────────────────

test('Scenario 5: Add extras — charge initial order, then add more items later', async ({ page }) => {
  await login(page, 'maria', '/pos');
  await openTableWithPax(page, 'T4', 3);

  // Initial order: Unli Beef
  await selectPackage(page, 'Unli Beef');
  await chargeItems(page);

  // Re-open AddItemModal via "+ ADD" button in sidebar
  await page.locator('button', { hasText: '+ ADD' }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible();

  // Add a dish and drinks
  await switchCategory(page, 'Dishes');
  await page.locator('button', { hasText: 'Bibimbap' }).first().click();
  await switchCategory(page, 'Drinks');
  await page.locator('button', { hasText: 'San Miguel Beer' }).first().click();
  await page.locator('button', { hasText: 'Soju' }).first().click();
  await chargeItems(page);

  // Verify extras appear in sidebar
  await expect(page.locator('text=Bibimbap')).toBeVisible();
  await expect(page.locator('text=San Miguel Beer')).toBeVisible();

  // Checkout with exact cash
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);
  await checkoutExactCash(page);
});
