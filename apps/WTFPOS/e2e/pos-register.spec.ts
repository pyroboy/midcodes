import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsStaff(page: Page) {
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

/** Scope all interactions to the PackageChangeModal overlay */
function pkgModal(page: Page) {
  return page.locator('.fixed.inset-0').filter({ has: page.locator('h3', { hasText: 'Change Package' }) });
}

/** Scope all interactions to the PIN step inside the PackageChangeModal */
function pinModal(page: Page) {
  return page.locator('.fixed.inset-0').filter({ has: page.locator('h3', { hasText: 'Manager PIN Required' }) });
}

/** Opens "More Options" in the order sidebar and waits for action buttons */
async function openMoreOptions(page: Page) {
  const btn = page.locator('button', { hasText: 'More Options' });
  // Sidebar is overflow-y-auto; scroll the button into view before clicking
  await btn.scrollIntoViewIfNeeded({ timeout: 10000 });
  await btn.click();
  await expect(page.locator('button', { hasText: 'Change Pkg' })).toBeVisible({ timeout: 5000 });
}

// ─── Package Downgrade ────────────────────────────────────────────────────────

test.describe('POS Register — Package Downgrade', () => {
  test('downgrade Unli Beef → Unli Pork requires manager PIN', async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithPax(page, 'T5', 2);

    // Select Unli Beef
    await page.locator('button', { hasText: 'Unli Beef' }).first().click();
    await page.locator('button', { hasText: 'CHARGE' }).click();

    // Open "Change Pkg" from More Options
    await openMoreOptions(page);
    await page.locator('button', { hasText: 'Change Pkg' }).click();

    // PackageChangeModal opens — scope to the fixed overlay
    const modal = pkgModal(page);
    await expect(modal).toBeVisible({ timeout: 5000 });

    // downgrade badge text visible (contains "PIN")
    await expect(modal.locator('text=/PIN/')).toBeVisible({ timeout: 3000 });

    // Click Unli Pork inside the modal (use first() to avoid strict mode with "Unli Pork & Beef")
    await modal.locator('button', { hasText: /Unli Pork/ }).first().click();

    // PIN step appears inside the same overlay
    await expect(page.locator('h3', { hasText: 'Manager PIN Required' })).toBeVisible({ timeout: 5000 });

    // Enter correct PIN
    for (const digit of '1234') {
      await pinModal(page).locator('button', { hasText: new RegExp(`^${digit}$`) }).click();
    }
    await page.locator('button', { hasText: 'Confirm Change' }).click();

    // Package updated — sidebar shows Unli Pork
    await expect(page.locator('text=Unli Pork')).toBeVisible({ timeout: 5000 });
  });

  test('wrong PIN on downgrade shows error', async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithPax(page, 'T6', 2);

    await page.locator('button', { hasText: 'Unli Beef' }).first().click();
    await page.locator('button', { hasText: 'CHARGE' }).click();

    await openMoreOptions(page);
    await page.locator('button', { hasText: 'Change Pkg' }).click();

    const modal = pkgModal(page);
    await expect(modal).toBeVisible({ timeout: 5000 });
    await modal.locator('button', { hasText: /Unli Pork/ }).first().click();

    await expect(page.locator('h3', { hasText: 'Manager PIN Required' })).toBeVisible({ timeout: 5000 });

    // Enter wrong PIN
    for (const digit of '0000') {
      await pinModal(page).locator('button', { hasText: new RegExp(`^${digit}$`) }).click();
    }
    await page.locator('button', { hasText: 'Confirm Change' }).click();

    // Error message
    await expect(page.locator('text=Incorrect PIN')).toBeVisible({ timeout: 5000 });
  });

  test('upgrade Unli Pork → Unli Beef does not require PIN', async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithPax(page, 'T7', 2);

    await page.locator('button', { hasText: 'Unli Pork' }).first().click();
    await page.locator('button', { hasText: 'CHARGE' }).click();

    await openMoreOptions(page);
    await page.locator('button', { hasText: 'Change Pkg' }).click();

    const modal = pkgModal(page);
    await expect(modal).toBeVisible({ timeout: 5000 });

    // "upgrade" text visible for Unli Beef option
    await expect(modal.locator('text=upgrade').first()).toBeVisible();

    // Click Unli Beef — no PIN required
    await modal.locator('button', { hasText: /Unli Beef/ }).click();

    // PIN modal must NOT appear
    await expect(page.locator('h3', { hasText: 'Manager PIN Required' })).not.toBeVisible();
    // Package updated
    await expect(page.locator('text=Unli Beef')).toBeVisible({ timeout: 5000 });
  });

  test('Change Package modal shows CURRENT badge on active package', async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithPax(page, 'T8', 2);

    await page.locator('button', { hasText: 'Unli Pork' }).first().click();
    await page.locator('button', { hasText: 'CHARGE' }).click();

    await openMoreOptions(page);
    await page.locator('button', { hasText: 'Change Pkg' }).click();

    const modal = pkgModal(page);
    await expect(modal).toBeVisible({ timeout: 5000 });

    // CURRENT badge on the active package button
    await expect(modal.locator('text=CURRENT').first()).toBeVisible();
  });
});

// ─── Weight-Based Meat Input ──────────────────────────────────────────────────

test.describe('POS Register — Weight-Based Meat', () => {
  test('clicking a weight-based meat opens weight entry screen with presets', async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithPax(page, 'T1', 2);

    // Switch to Meats tab
    await page.locator('button', { hasText: 'Meats' }).first().click();

    // Click Samgyupsal (weight-based)
    await page.locator('button', { hasText: 'Samgyupsal' }).first().click();

    // Weight screen appears
    await expect(page.locator('text=Enter weight from scale (grams)')).toBeVisible({ timeout: 5000 });

    // Preset buttons visible
    await expect(page.locator('button', { hasText: '200g' })).toBeVisible();
    await expect(page.locator('button', { hasText: '300g' })).toBeVisible();
    await expect(page.locator('button', { hasText: '150g' })).toBeVisible();
  });

  test('select weight via preset adds meat to pending list', async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithPax(page, 'T2', 2);

    await page.locator('button', { hasText: 'Meats' }).first().click();
    await page.locator('button', { hasText: 'Samgyupsal' }).first().click();
    await expect(page.locator('text=Enter weight from scale (grams)')).toBeVisible({ timeout: 5000 });

    // Click 200g preset
    await page.locator('button', { hasText: '200g' }).click();

    // Weight screen dismissed, 200g appears in pending list
    await expect(page.locator('text=Enter weight from scale (grams)')).not.toBeVisible();
    await expect(page.locator('text=200g')).toBeVisible({ timeout: 5000 });
  });

  test('enter custom weight via input and add meat', async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithPax(page, 'T3', 2);

    await page.locator('button', { hasText: 'Meats' }).first().click();
    await page.locator('button', { hasText: 'Galbi' }).first().click();
    await expect(page.locator('text=Enter weight from scale (grams)')).toBeVisible({ timeout: 5000 });

    // Fill custom weight (BluetoothWeightInput doesn't forward id to <input>, use placeholder)
    await page.locator('input[placeholder="e.g. 235"]').fill('235');
    await page.locator('button', { hasText: 'Add' }).click();

    // 235g in pending list
    await expect(page.locator('text=Enter weight from scale (grams)')).not.toBeVisible();
    await expect(page.locator('text=235g')).toBeVisible({ timeout: 5000 });
  });

  test('back button on weight screen returns to item grid', async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithPax(page, 'T4', 2);

    await page.locator('button', { hasText: 'Meats' }).first().click();
    await page.locator('button', { hasText: 'Samgyupsal' }).first().click();
    await expect(page.locator('text=Enter weight from scale (grams)')).toBeVisible({ timeout: 5000 });

    // Back / Cancel button
    await page.locator('button', { hasText: /← Back|Back|Cancel/ }).first().click();

    await expect(page.locator('text=Enter weight from scale (grams)')).not.toBeVisible();
    await expect(page.locator('button', { hasText: 'Samgyupsal' })).toBeVisible({ timeout: 5000 });
  });
});
