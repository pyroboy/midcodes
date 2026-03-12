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

/**
 * Opens a table with N adults only (no children/infants).
 * Waits for AddItemModal to confirm the session is live.
 */
async function openTableWithPax(page: Page, tableLabel: string, pax: number) {
  await page.locator(`[aria-label="Table ${tableLabel}"]`).click();
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible({ timeout: 8000 });

  const paxModal = page.locator('.pos-card', { hasText: 'How many guests' });
  const adultsPlus = paxModal.locator('button', { hasText: '+' }).nth(0);
  for (let i = 0; i < pax; i++) {
    await adultsPlus.click();
  }
  await paxModal.locator('button', { hasText: 'Confirm' }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8000 });
}

async function selectAnyPackageAndCharge(page: Page) {
  await page.locator('button', { hasText: /Unli|Unlimited/i }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();
}

async function skipLeftoverPenalty(page: Page) {
  await expect(page.locator('h2', { hasText: 'Leftover Check' })).toBeVisible();
  await page.locator('button', { hasText: 'No Leftovers' }).click();
}

/**
 * Switches CheckoutModal to a single e-wallet method (gcash or maya).
 * Removes Cash (toggles it off) and toggles the desired method on.
 */
async function switchToEwalletOnly(page: Page, method: 'GCash' | 'Maya') {
  // Add e-wallet method first (now 2 entries: cash + ewallet)
  await page.locator('button', { hasText: `📱 ${method}` }).click();
  // Now remove cash (can remove since there are 2 entries)
  await page.locator('button', { hasText: '💵 Cash' }).click();
}

// ─── Test 1: Pending GCash button appears when GCash is selected ──────────────

test.setTimeout(15_000);

test('Pending GCash button appears when GCash is selected', async ({ page }) => {
  await loginAsOwner(page);

  await openTableWithPax(page, 'T5', 2);
  await selectAnyPackageAndCharge(page);

  // Open checkout
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);

  const checkoutModal = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await expect(checkoutModal).toBeVisible();

  // Switch to single GCash method
  await switchToEwalletOnly(page, 'GCash');

  // "⏸ Pending GCash" button must be visible.
  // CheckoutModal renders this only when paymentEntries.length === 1 && method !== 'cash'.
  const pendingGcashBtn = page.locator('button', { hasText: /Pending GCash/i });
  await expect(pendingGcashBtn).toBeVisible({ timeout: 5000 });

  // Clean up: switch back to Cash and pay normally
  await page.locator('button', { hasText: '📱 GCash' }).click(); // toggle GCash off
  await page.locator('button', { hasText: '💵 Cash' }).click();  // toggle Cash back on
  await page.locator('button', { hasText: 'Exact' }).first().click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });
  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
});

// ─── Test 2: Clicking Pending GCash closes checkout and marks order pending ───

test('Clicking Pending GCash closes checkout and marks order as pending', async ({ page }) => {
  await loginAsOwner(page);

  await openTableWithPax(page, 'T5', 2);
  await selectAnyPackageAndCharge(page);

  // Open checkout
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);

  const checkoutModal = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await expect(checkoutModal).toBeVisible();

  // Switch to GCash only
  await switchToEwalletOnly(page, 'GCash');

  const pendingGcashBtn = page.locator('button', { hasText: /Pending GCash/i });
  await expect(pendingGcashBtn).toBeVisible({ timeout: 5000 });

  // Click the pending hold button.
  // CheckoutModal: onclick={() => { holdPayment(order.id, 'gcash'); onclose(); }}
  await pendingGcashBtn.click();

  // Checkout modal should close
  await expect(checkoutModal).not.toBeVisible({ timeout: 5000 });

  // T5 should still be visible on the floor — the order is NOT completed, just held
  await expect(page.locator('[aria-label="Table T5"]')).toBeVisible({ timeout: 5000 });

  // Click T5 again — it should still show as occupied (pending_payment state).
  // FloorPlan.svelte fills pending_payment tables with cyan (#ecfeff) — still "occupied" visually.
  // Clicking the table should open the sidebar for the held order (not show PaxModal).
  await page.locator('[aria-label="Table T5"]').click({ force: true });

  // The sidebar or order panel should surface the pending/hold state (not PaxModal)
  await expect(page.locator('h3', { hasText: 'How many guests' })).not.toBeVisible({ timeout: 3000 });

  // The pending_payment order is still accessible — sidebar shows GCash/pending status
  await expect(page.locator('text=/Pending|GCash|pending/i').first()).toBeVisible({ timeout: 5000 });
});

// ─── Test 3: Pending Maya button appears for Maya payment ─────────────────────

test('Pending Maya button appears when Maya is selected', async ({ page }) => {
  await loginAsOwner(page);

  await openTableWithPax(page, 'T5', 2);
  await selectAnyPackageAndCharge(page);

  // Open checkout
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);

  const checkoutModal = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await expect(checkoutModal).toBeVisible();

  // Switch to Maya only
  await switchToEwalletOnly(page, 'Maya');

  // "⏸ Pending Maya" must appear
  const pendingMayaBtn = page.locator('button', { hasText: /Pending Maya/i });
  await expect(pendingMayaBtn).toBeVisible({ timeout: 5000 });

  // Clean up: switch back to Cash and pay
  await page.locator('button', { hasText: '📱 Maya' }).click();  // toggle Maya off
  await page.locator('button', { hasText: '💵 Cash' }).click();  // toggle Cash back on
  await page.locator('button', { hasText: 'Exact' }).first().click();
  const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });
  await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Done' }).click();
});

// ─── Test 4: Can complete payment after pending hold ──────────────────────────

test('Can complete payment after pending hold — reopen T5 and confirm', async ({ page }) => {
  await loginAsOwner(page);

  await openTableWithPax(page, 'T5', 2);
  await selectAnyPackageAndCharge(page);

  // Open checkout → set GCash → hold
  await page.locator('button', { hasText: 'Checkout' }).click();
  await skipLeftoverPenalty(page);

  const checkoutModal = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await expect(checkoutModal).toBeVisible();
  await switchToEwalletOnly(page, 'GCash');

  const pendingGcashBtn = page.locator('button', { hasText: /Pending GCash/i });
  await expect(pendingGcashBtn).toBeVisible({ timeout: 5000 });
  await pendingGcashBtn.click();

  // Checkout modal closes
  await expect(checkoutModal).not.toBeVisible({ timeout: 5000 });

  // T5 is still on the floor
  await expect(page.locator('[aria-label="Table T5"]')).toBeVisible({ timeout: 5000 });

  // Reopen T5 — the order is in pending_payment status
  await page.locator('[aria-label="Table T5"]').click({ force: true });

  // OrderSidebar should not show PaxModal — the order already exists
  await expect(page.locator('h3', { hasText: 'How many guests' })).not.toBeVisible({ timeout: 3000 });

  // OrderSidebar shows "Confirm Payment" for pending_payment orders.
  // confirmHeldPayment() closes the order directly — no receipt modal is shown.
  const confirmHeldBtn = page.locator('button', { hasText: /Confirm Payment/i }).first();
  await expect(confirmHeldBtn).toBeVisible({ timeout: 5000 });
  await confirmHeldBtn.click();

  // After confirming, the order is closed and T5 becomes available again.
  // The sidebar clears (no active order) and the table returns to available state.
  await expect(page.locator('[aria-label="Table T5"]')).toBeVisible({ timeout: 8000 });
  // Table should now be available (not showing pending/GCash text)
  await expect(page.locator('text=/Pending|GCash|pending/i').first()).not.toBeVisible({ timeout: 3000 });
});
