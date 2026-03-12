import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsOwner(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('maria');
  await page.locator('#password').fill('maria');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 10000 });
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
}

async function selectPackageAndCharge(page: Page) {
  await page.locator('button', { hasText: /Unli|Unlimited/i }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();
}

async function skipLeftoverPenalty(page: Page) {
  await expect(page.locator('h2', { hasText: 'Leftover Check' })).toBeVisible();
  await page.locator('button', { hasText: 'No Leftovers' }).click();
}

// ─── Test 1: Child pax modal allows adding children and infants ───────────────

test.setTimeout(15_000);

test('Child pax modal allows adding children and infants', async ({ page }) => {
  await loginAsOwner(page);

  // Open T4
  await page.locator('[aria-label="Table T4"]').click();
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible({ timeout: 8000 });

  // Scope all interactions to the PaxModal card
  const paxModal = page.locator('.pos-card', { hasText: 'How many guests' });

  // Add 2 adults (first + button row)
  const adultsPlus = paxModal.locator('button', { hasText: '+' }).nth(0);
  await adultsPlus.click();
  await adultsPlus.click();

  // Add 1 child (second + button row: "ages 6–9 · reduced price")
  const childrenPlus = paxModal.locator('button', { hasText: '+' }).nth(1);
  await childrenPlus.click();

  // Add 1 infant (third + button row: "under 5 · free")
  const infantsPlus = paxModal.locator('button', { hasText: '+' }).nth(2);
  await infantsPlus.click();

  // Total badge: adults(2) + children(1) + infants(1) = 4
  const totalBadge = paxModal.locator('.font-mono.font-bold.text-xl').first();
  await expect(totalBadge).toHaveText('4');

  // Confirm pax
  await paxModal.locator('button', { hasText: 'Confirm' }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8000 });

  // Add package and clean up
  await selectPackageAndCharge(page);
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);

  await page.locator('button', { hasText: 'Exact' }).click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });
  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
});

// ─── Test 2: Checkout shows adult vs child pricing breakdown ─────────────────

test('Checkout shows adult vs child pricing breakdown', async ({ page }) => {
  await loginAsOwner(page);

  // Open T4 with 2 adults + 1 child + 1 infant
  await page.locator('[aria-label="Table T4"]').click();
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible({ timeout: 8000 });

  const paxModal = page.locator('.pos-card', { hasText: 'How many guests' });

  const adultsPlus = paxModal.locator('button', { hasText: '+' }).nth(0);
  await adultsPlus.click();
  await adultsPlus.click();
  await paxModal.locator('button', { hasText: '+' }).nth(1).click(); // 1 child
  await paxModal.locator('button', { hasText: '+' }).nth(2).click(); // 1 infant

  await paxModal.locator('button', { hasText: 'Confirm' }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8000 });

  await selectPackageAndCharge(page);

  // Open checkout
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);

  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await expect(checkout).toBeVisible();

  // CheckoutModal renders breakdown in bg-surface-secondary div when childPax > 0 or freePax > 0.
  // Adult count × full price line: e.g. "2 adults × ₱499"
  await expect(checkout.locator('text=/adult.*×/i').first()).toBeVisible({ timeout: 5000 });

  // Child count × reduced price line: e.g. "1 child × ₱299" (or childUnitPrice)
  await expect(checkout.locator('text=/child.*×/i').first()).toBeVisible({ timeout: 5000 });

  // Free infant line: e.g. "1 free (<5)" with ₱0
  await expect(checkout.locator('text=/free/i').first()).toBeVisible({ timeout: 5000 });

  // Clean up with exact cash
  await page.locator('button', { hasText: 'Exact' }).click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });
  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
});

// ─── Test 3: Receipt shows mixed pax pricing breakdown ───────────────────────

test('Receipt shows mixed pax pricing breakdown', async ({ page }) => {
  await loginAsOwner(page);

  // Open T4 with 2 adults + 1 child + 1 infant
  await page.locator('[aria-label="Table T4"]').click();
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible({ timeout: 8000 });

  const paxModal = page.locator('.pos-card', { hasText: 'How many guests' });

  const adultsPlus = paxModal.locator('button', { hasText: '+' }).nth(0);
  await adultsPlus.click();
  await adultsPlus.click();
  await paxModal.locator('button', { hasText: '+' }).nth(1).click(); // 1 child
  await paxModal.locator('button', { hasText: '+' }).nth(2).click(); // 1 infant

  await paxModal.locator('button', { hasText: 'Confirm' }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8000 });

  await selectPackageAndCharge(page);

  // Checkout with exact cash
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);

  await page.locator('button', { hasText: 'Exact' }).click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });

  // Receipt modal appears
  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });

  const receipt = page.locator('.pos-card', { hasText: 'Payment Successful' });
  await expect(receipt).toBeVisible();

  // ReceiptModal renders packageBreakdownLines() for PKG items when childPax > 0 or freePax > 0.
  // These produce lines like: "  2 adults × ₱499" and "  1 child × ₱299"
  await expect(receipt.locator('text=/adult/i').first()).toBeVisible({ timeout: 5000 });
  await expect(receipt.locator('text=/child/i').first()).toBeVisible({ timeout: 5000 });

  await page.locator('button', { hasText: 'Done' }).click();
});

// ─── Test 4: FREE-tagged items not shown on receipt ──────────────────────────

test('Free items (FREE tag) not shown on receipt', async ({ page }) => {
  await loginAsOwner(page);

  // Open T4 with 2 adults (simple pax — focus on FREE tag filtering)
  await page.locator('[aria-label="Table T4"]').click();
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible({ timeout: 8000 });

  const paxModal = page.locator('.pos-card', { hasText: 'How many guests' });
  const adultsPlus = paxModal.locator('button', { hasText: '+' }).nth(0);
  await adultsPlus.click();
  await adultsPlus.click();
  await paxModal.locator('button', { hasText: 'Confirm' }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8000 });

  // Add package — creates PKG item and FREE included items (sides, refill markers)
  await selectPackageAndCharge(page);

  // Checkout
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);

  await page.locator('button', { hasText: 'Exact' }).click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });
  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });

  const receipt = page.locator('.pos-card', { hasText: 'Payment Successful' });
  await expect(receipt).toBeVisible();

  // ReceiptModal filters receiptItems.paid = active.filter(i => i.tag !== 'FREE').
  // The raw string "FREE" must not appear in the rendered receipt body —
  // that value would only be visible if the filter broke and tag was rendered as text.
  const receiptBodyText = await receipt.locator('div.font-mono').first().innerText();
  expect(receiptBodyText).not.toContain('FREE');

  await page.locator('button', { hasText: 'Done' }).click();
});
