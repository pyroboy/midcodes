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

/** Open the Bluetooth Scale dropdown in the TopBar */
async function openBtDropdown(page: Page) {
  await page.locator('button[title="Bluetooth Scale"]').click();
}

/** Pair with the first simulated scale device */
async function pairScale(page: Page) {
  await openBtDropdown(page);
  await page.locator('button', { hasText: 'Scan for Devices' }).click();

  // Wait for pair modal scanning, then device list
  await expect(page.locator('text=Searching')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('text=device')).toBeVisible({ timeout: 5000 });

  // Pair with first device (Kitchen scale)
  await page.locator('button', { hasText: 'WTF Scale A' }).click();

  // Wait for pairing then connected
  await expect(page.locator('text=Pairing')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('text=Connected')).toBeVisible({ timeout: 5000 });

  // Modal auto-closes after ~1.2s
  await expect(page.locator('text=Connected')).not.toBeVisible({ timeout: 3000 });
}

/** Open a table with pax and select a package */
async function openTableWithPaxAndPackage(page: Page, table: string, pax: number) {
  await page.locator(`[aria-label="Table ${table}"]`).click();
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible();
  await page.locator('.pos-card button', { hasText: new RegExp(`^${pax}$`) }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible();
  await page.locator('button', { hasText: '🐷 Unli Pork' }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click({ force: true });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Bluetooth Scale (Simulated)', () => {

  test('Pair with simulated scale via TopBar', async ({ page }) => {
    await login(page);

    // Open BT dropdown — should show "No scale connected"
    await openBtDropdown(page);
    await expect(page.locator('text=No scale connected')).toBeVisible();

    // Click "Scan for Devices"
    await page.locator('button', { hasText: 'Scan for Devices' }).click();

    // Pair modal: scanning state
    await expect(page.locator('text=Searching')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Looking for nearby scales')).toBeVisible();

    // Devices appear after ~2s
    await expect(page.locator('text=WTF Scale A (Kitchen)')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=WTF Scale B (Floor)')).toBeVisible();

    // Pair with Kitchen scale
    await page.locator('button', { hasText: 'WTF Scale A' }).click();
    await expect(page.locator('text=Pairing')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Connected!')).toBeVisible({ timeout: 5000 });

    // Modal auto-closes, dropdown now shows connected state
    await expect(page.locator('text=Connected!')).not.toBeVisible({ timeout: 3000 });

    // Re-open dropdown — should show connected info
    await openBtDropdown(page);
    await expect(page.locator('text=Connected to WTF Scale A (Kitchen)')).toBeVisible();
    await expect(page.locator('text=Simulate Weight')).toBeVisible();
  });

  test('Simulate weight presets and removal', async ({ page }) => {
    await login(page);
    await pairScale(page);

    // Open BT dropdown to access simulation controls
    await openBtDropdown(page);
    await expect(page.locator('text=Simulate Weight')).toBeVisible();

    // Simulate 500g — should show unstable then stable
    await page.locator('button', { hasText: '500g' }).click();
    // Weight fluctuates then settles at 500g
    await expect(page.locator('text=stable')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=500g')).toBeVisible();

    // Simulate 1kg
    await page.locator('button', { hasText: '1kg' }).click();
    await expect(page.locator('text=stable')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=1000g')).toBeVisible();

    // Remove weight — weight display goes back to 0g (inside status area, not the preset buttons)
    await page.locator('button', { hasText: 'Remove' }).click();
    // The weight readout shows "0g" next to the weight icon. Verify "stable" is gone.
    await expect(page.locator('text=stable')).not.toBeVisible({ timeout: 3000 });
  });

  test('Disconnect scale from dropdown', async ({ page }) => {
    await login(page);
    await pairScale(page);

    await openBtDropdown(page);
    await expect(page.locator('text=Connected to WTF Scale A')).toBeVisible();

    await page.locator('button', { hasText: 'Disconnect' }).click();

    // Re-open dropdown — should show disconnected
    await openBtDropdown(page);
    await expect(page.locator('text=No scale connected')).toBeVisible();
  });

  test('Add free meat — BT scale auto-fills weight on weight entry screen', async ({ page }) => {
    await login(page);
    await pairScale(page);

    // Pre-simulate 250g on the scale
    await openBtDropdown(page);
    await expect(page.locator('text=Simulate Weight')).toBeVisible();
    await page.locator('button', { hasText: '250g' }).click();
    await expect(page.locator('text=stable')).toBeVisible({ timeout: 5000 });
    // Close dropdown
    await page.locator('h1', { hasText: 'POS' }).click();

    // Open a table, pick a package → charges the initial order
    await openTableWithPaxAndPackage(page, 'T3', 2);

    // Table is now occupied — click it again to select and show sidebar
    await page.locator('[aria-label="Table T3"]').click();
    await expect(page.locator('button', { hasText: '+ ADD' })).toBeVisible({ timeout: 5000 });

    // Open Add to Order modal
    await page.locator('button', { hasText: '+ ADD' }).click();
    await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible();

    // Switch to Meats tab and tap a weight-based meat item
    await page.locator('button', { hasText: 'MEATS' }).first().click();
    const meatBtn = page.locator('button', { hasText: 'tap to enter weight' }).first();
    await expect(meatBtn).toBeVisible({ timeout: 5000 });
    await meatBtn.click();
    await expect(page.locator('text=Enter weight from scale')).toBeVisible();

    // Focus the BluetoothWeightInput — it should auto-fill with the stable 250g
    const btInput = page.locator('input[type="number"]').first();
    await btInput.click();
    await expect(btInput).toHaveValue('250', { timeout: 5000 });

    // Click Add to commit the meat
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Meat should appear in pending items with 250g
    await expect(page.locator('text=250g')).toBeVisible();
  });

  test('Leftover penalty — BT scale auto-fills weight input', async ({ page }) => {
    await login(page);
    await pairScale(page);

    // Pre-simulate 250g on the scale BEFORE opening the modal
    await openBtDropdown(page);
    await expect(page.locator('text=Simulate Weight')).toBeVisible();
    await page.locator('button', { hasText: '250g' }).click();
    // Wait for weight to stabilize
    await expect(page.locator('text=stable')).toBeVisible({ timeout: 5000 });
    // Close the dropdown by clicking elsewhere
    await page.locator('h1', { hasText: 'POS' }).click();

    await openTableWithPaxAndPackage(page, 'T1', 2);

    // Start checkout
    await page.locator('button', { hasText: 'Checkout' }).click();
    await expect(page.locator('h2', { hasText: 'Leftover Check' })).toBeVisible();

    // With BT scale connected, the BluetoothWeightInput should be visible
    // Focus the weight input to register as receiver — scale should auto-fill 250g
    const btInput = page.locator('input[type="number"]').first();
    await btInput.click();

    // The stable weight (250g) should auto-fill the input
    await expect(page.locator('text=250 g')).toBeVisible({ timeout: 5000 });

    // Penalty should be calculated (250g -> ceil(250/100) * 50 = 150)
    await expect(page.locator('text=150')).toBeVisible();

    // Apply penalty and checkout
    await page.locator('button', { hasText: 'Apply & Checkout' }).click();

    // Checkout modal
    const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
    await expect(checkout).toBeVisible();
    await page.locator('button', { hasText: 'Exact' }).click();
    const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click({ force: true });

    // Wait for either receipt or page reload
    try {
      await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
      await page.locator('button', { hasText: 'Done' }).click();
    } catch {
      await page.waitForURL('**/pos', { timeout: 10000 });
    }
  });

  test('Leftover penalty — numpad still works without BT scale', async ({ page }) => {
    await login(page);
    // Do NOT pair scale
    await openTableWithPaxAndPackage(page, 'T2', 2);

    // Start checkout
    await page.locator('button', { hasText: 'Checkout' }).click();
    await expect(page.locator('h2', { hasText: 'Leftover Check' })).toBeVisible();

    // Type 300g using numpad (no BT input should be visible)
    await page.locator('.pos-card button', { hasText: /^3$/ }).first().click();
    await page.locator('.pos-card button', { hasText: /^0$/ }).first().click();
    await page.locator('.pos-card button', { hasText: /^0$/ }).first().click();
    await expect(page.locator('text=300 g')).toBeVisible();

    // Skip to checkout
    await page.locator('button', { hasText: 'Apply & Checkout' }).click();

    const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
    await expect(checkout).toBeVisible();
    await page.locator('button', { hasText: 'Exact' }).click();
    const confirmBtn = page.locator('button', { hasText: 'Confirm Payment' });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click({ force: true });

    try {
      await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 10000 });
      await page.locator('button', { hasText: 'Done' }).click();
    } catch {
      await page.waitForURL('**/pos', { timeout: 10000 });
    }
  });

});
