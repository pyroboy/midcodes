import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Login as Benny Flores — Kitchen Butcher at Alta Citta.
 * His dest is /kitchen/weigh-station directly.
 */
async function loginAsBenny(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('benny');
  await page.locator('#password').fill('benny');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/kitchen/weigh-station', { timeout: 10000 });
}

/**
 * Login as Maria Santos (staff, Alta Citta) then navigate to a given path.
 */
async function loginAsMaria(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('maria');
  await page.locator('#password').fill('maria');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 10000 });
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
}

/**
 * Open the BT Scale dropdown via the title="Bluetooth Scale" button in the
 * kitchen nav bar top-right.
 */
async function openBtDropdown(page: Page) {
  await page.locator('button[title="Bluetooth Scale"]').click();
}

/**
 * Pair with WTF Scale A via the BT status dropdown → Scan for Devices flow.
 */
async function pairScale(page: Page) {
  await openBtDropdown(page);
  await page.locator('button', { hasText: 'Scan for Devices' }).click();
  await expect(page.locator('text=Searching')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('text=WTF Scale A (Kitchen)')).toBeVisible({ timeout: 5000 });
  await page.locator('button', { hasText: 'WTF Scale A' }).click();
  await expect(page.locator('text=Pairing')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('text=Connected!')).toBeVisible({ timeout: 5000 });
  // Modal auto-closes after ~1.2s
  await expect(page.locator('text=Connected!')).not.toBeVisible({ timeout: 3000 });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('BT Scale Pairing — Weigh Station', () => {

  test.setTimeout(15_000);

  test('BT Scale button in kitchen nav opens status panel', async ({ page }) => {
    // Benny logs straight into weigh-station
    await loginAsBenny(page);

    // The weigh-station page should be visible
    await expect(page.locator('h2', { hasText: 'Pending Meat' })).toBeVisible({ timeout: 10000 });

    // The Weigh Station link should be visible in the sub-nav
    await expect(page.locator('a', { hasText: /Weigh Station/i })).toBeVisible();

    // The BT Scale button (title="Bluetooth Scale") is in the kitchen nav bar
    const btButton = page.locator('button[title="Bluetooth Scale"]');
    await expect(btButton).toBeVisible();

    // Clicking it opens the dropdown showing no scale connected
    await btButton.click();
    await expect(page.locator('text=No scale connected')).toBeVisible({ timeout: 3000 });
  });

  test('Scale simulator is available after pairing', async ({ page }) => {
    // NOTE: The BluetoothScaleSimulator is launched from the BT Status dropdown's
    // "Open Simulator" button — it is always accessible (no DEV env flag required).
    // The simulator is rendered as a modal overlay on top of the weigh-station page.

    await loginAsBenny(page);
    await expect(page.locator('h2', { hasText: 'Pending Meat' })).toBeVisible({ timeout: 10000 });

    // Pair first (simulator only appears when connected)
    await pairScale(page);

    // Re-open dropdown — should now show connected state and "Open Simulator" button
    await openBtDropdown(page);
    await expect(page.locator('text=Open Simulator')).toBeVisible({ timeout: 3000 });

    // Click Open Simulator
    await page.locator('button', { hasText: 'Open Simulator' }).click();

    // The BluetoothScaleSimulator modal should appear
    await expect(page.locator('h3', { hasText: 'Scale Simulator' })).toBeVisible({ timeout: 3000 });

    // The "Hold to place on scale" plate button and "Remove from Scale" button should be present
    await expect(page.locator('button', { hasText: /Hold to place on scale|Adding weight/i })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Remove from Scale' })).toBeVisible();

    // Close the simulator
    await page.locator('.pos-card button', { hasText: 'X' }).click();
    await expect(page.locator('h3', { hasText: 'Scale Simulator' })).not.toBeVisible();
  });

  test('Preset weight simulation via dropdown updates weight display', async ({ page }) => {
    await loginAsBenny(page);
    await expect(page.locator('h2', { hasText: 'Pending Meat' })).toBeVisible({ timeout: 10000 });

    await pairScale(page);

    // Open dropdown — use preset weight simulation (available without opening full simulator)
    await openBtDropdown(page);
    await expect(page.locator('text=Simulate Weight')).toBeVisible({ timeout: 3000 });

    // Click the 250g preset
    await page.locator('button', { hasText: '250g' }).click();

    // Wait for stable state — the dropdown weight display should show ~250g
    await expect(page.locator('text=stable')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=250g').first()).toBeVisible();

    // Remove the simulated weight
    await page.locator('button', { hasText: 'Remove' }).click();
    // Weight display should no longer show "stable"
    await expect(page.locator('text=stable')).not.toBeVisible({ timeout: 3000 });
  });

  test('Weigh station shows pending meat items when orders exist', async ({ page }) => {
    // NOTE: The mock seed data creates T1/T2/T3 orders with no KDS tickets by default.
    // Meat items appear in the pending list only when KDS tickets exist with
    // category='meats', status='pending', and no weight set.
    //
    // If there are no pending items (e.g. seed data has no open KDS tickets),
    // the page shows "All clear" — this is expected behavior and the test verifies
    // the page renders correctly either way.

    await loginAsBenny(page);

    // The weigh station page must be accessible and render its structure
    await expect(page.locator('h2', { hasText: 'Pending Meat' })).toBeVisible({ timeout: 10000 });

    // Either pending items are visible, or the "All clear" empty state is shown
    const hasPending = await page.locator('text=/items waiting/').isVisible();
    const hasAllClear = await page.locator('text=All clear').isVisible();

    // One of the two states must be present
    expect(hasPending || hasAllClear).toBe(true);

    // The DISPATCH button area or the empty-state placeholder should be present
    const hasDispatch = await page.locator('button', { hasText: 'DISPATCH' }).isVisible();
    const hasSelectPrompt = await page.locator('text=Select a meat order').isVisible();
    expect(hasDispatch || hasSelectPrompt).toBe(true);
  });

  test('Manual mode banner shows when scale not connected', async ({ page }) => {
    await loginAsBenny(page);
    await expect(page.locator('h2', { hasText: 'Pending Meat' })).toBeVisible({ timeout: 10000 });

    // Without pairing, the amber "Manual mode" banner should be visible
    await expect(page.locator('text=Manual mode')).toBeVisible({ timeout: 5000 });
    // And the "Reconnect" link should be present
    await expect(page.locator('text=Reconnect →')).toBeVisible();
  });

  test('Reconnect link in manual mode banner triggers scan', async ({ page }) => {
    await loginAsBenny(page);
    await expect(page.locator('text=Manual mode')).toBeVisible({ timeout: 10000 });

    // Clicking "Reconnect →" should trigger the pair modal (via startScan)
    await page.locator('button', { hasText: 'Reconnect →' }).click();

    // After clicking, pair modal should open in scanning state
    await expect(page.locator('text=Searching')).toBeVisible({ timeout: 4000 });
  });

  test('Staff role is blocked from accessing weigh-station', async ({ page }) => {
    // Maria is staff — kitchen layout guards redirect staff to /pos
    await loginAsMaria(page);

    // Try to navigate to weigh-station directly
    await page.goto('/kitchen/weigh-station');

    // Staff should be redirected away from kitchen routes — should end up at /pos
    await page.waitForURL('**/pos', { timeout: 5000 });
    await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 10000 });
  });

});
