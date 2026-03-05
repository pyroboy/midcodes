import { test, expect } from '@playwright/test';

test('create an order for a table, 4 pax with SC discount, package + drink, and checkout', async ({ page }) => {
  // 1. Login as staff (Maria Santos, QC branch)
  await page.goto('/');
  await page.locator('#username').fill('maria');
  await page.locator('#password').fill('maria');
  await page.locator('button', { hasText: 'LOGIN' }).click();

  // 2. Wait for redirect to /pos
  await page.waitForURL('**/pos', { timeout: 10000 });

  // 3. Click an available table (T1)
  await page.locator('[aria-label="Table T1"]').click();

  // 4. PaxModal — select 4 guests
  const paxModal = page.locator('.pos-card', { hasText: 'How many guests' });
  await expect(paxModal).toBeVisible();
  await paxModal.locator('button', { hasText: /^4$/ }).click();

  // 5. AddItemModal opens automatically
  await expect(page.locator('h2', { hasText: '➕ Add to Order' })).toBeVisible();

  // Choose Package category and pick Unli Pork
  await page.locator('button', { hasText: 'Package' }).first().click();
  await page.locator('button', { hasText: 'Unli Pork' }).first().click();
  // (auto-switches to Meats tab after package selection)

  // Add a drink
  await page.locator('button', { hasText: 'Drinks' }).first().click();
  await page.locator('button', { hasText: 'Iced Tea' }).click();

  // Charge all pending items to the order
  await page.locator('button', { hasText: 'CHARGE' }).click();

  // 6. Click Checkout in the order sidebar
  await page.locator('button', { hasText: '💳 Checkout' }).click();

  // 7. LeftoverPenaltyModal — skip (no unconsumed meat)
  await expect(page.locator('h2', { hasText: 'Leftover Penalty?' })).toBeVisible();
  await page.locator('button', { hasText: 'Skip / Checkout' }).click();

  // 8. CheckoutModal
  const checkoutModal = page.locator('.pos-card', { hasText: 'Checkout' });
  await expect(checkoutModal).toBeVisible();

  // Apply Senior Citizen discount
  await checkoutModal.locator('button', { hasText: '👴 Senior' }).click();

  // Fill the SC ID (1 pax qualifies by default)
  const scIdInput = page.locator('input[placeholder="e.g. 12345678"]').first();
  await scIdInput.fill('SC-9999');

  // Set cash tendered to exact amount
  await checkoutModal.locator('button', { hasText: 'Exact' }).click();

  // Confirm Payment (button becomes enabled once cash + SC ID are filled)
  const confirmBtn = page.locator('button', { hasText: '✓ Confirm Payment' });
  await expect(confirmBtn).toBeEnabled();
  await confirmBtn.click({ force: true }); // modal card can overflow viewport height

  // Wait for receipt print (1.2s simulated) and modal to close
  await expect(checkoutModal).not.toBeVisible({ timeout: 10000 });
});
