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
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible({ timeout: 8000 });
  // New PaxModal uses stepper — click + for Adults pax times
  const adultPlusBtn = page.locator('.pos-card button').filter({ hasText: /^\+$/ }).first();
  for (let i = 0; i < pax; i++) {
    await adultPlusBtn.click();
  }
  await page.locator('.pos-card button', { hasText: 'Confirm' }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8000 });
}

/** Scope all interactions to the PackageChangeModal overlay */
function pkgModal(page: Page) {
  return page.locator('.fixed.inset-0').filter({ has: page.locator('h3', { hasText: 'Change Package' }) });
}

/** Scope all interactions to the PIN step inside the PackageChangeModal */
function pinModal(page: Page) {
  return page.locator('.fixed.inset-0').filter({ has: page.locator('h3', { hasText: 'Manager PIN Required' }) });
}

/** Click the 'More ▼' button to expand the secondary actions section in OrderSidebar */
async function openMoreOptions(page: Page) {
  const moreBtn = page.locator('button', { hasText: /^More/ });
  await expect(moreBtn).toBeVisible({ timeout: 5000 });
  await moreBtn.click();
  await expect(page.locator('button', { hasText: 'Change Pkg' })).toBeVisible({ timeout: 5000 });
}

// ─── Package Downgrade ────────────────────────────────────────────────────────

test.describe('POS Register — Package Downgrade', () => {
  test('downgrade Beef Unlimited → Pork Unlimited requires manager PIN', async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithPax(page, 'T5', 2);

    // Select Beef Unlimited
    await page.locator('button', { hasText: 'Beef Unlimited' }).first().click();
    await page.locator('button', { hasText: 'CHARGE' }).click();

    // Open "Change Pkg" from More Options
    await openMoreOptions(page);
    await page.locator('button', { hasText: 'Change Pkg' }).click();

    // PackageChangeModal opens — scope to the fixed overlay
    const modal = pkgModal(page);
    await expect(modal).toBeVisible({ timeout: 5000 });

    // downgrade badge text visible (contains "PIN")
    await expect(modal.locator('text=/PIN/').first()).toBeVisible({ timeout: 3000 });

    // Click Pork Unlimited inside the modal (use first() to avoid strict mode with "Beef + Pork Unlimited")
    await modal.locator('button', { hasText: /Pork Unlimited/ }).first().click();

    // PIN step appears inside the same overlay
    await expect(page.locator('h3', { hasText: 'Manager PIN Required' })).toBeVisible({ timeout: 5000 });

    // Enter correct PIN
    for (const digit of '1234') {
      await pinModal(page).locator('button', { hasText: new RegExp(`^${digit}$`) }).click();
    }
    await page.locator('button', { hasText: 'Confirm Change' }).click();

    // Package updated — sidebar shows Pork Unlimited
    await expect(page.locator('text=Pork Unlimited')).toBeVisible({ timeout: 5000 });
  });

  test('wrong PIN on downgrade shows error', async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithPax(page, 'T6', 2);

    await page.locator('button', { hasText: 'Beef Unlimited' }).first().click();
    await page.locator('button', { hasText: 'CHARGE' }).click();

    await openMoreOptions(page);
    await page.locator('button', { hasText: 'Change Pkg' }).click();

    const modal = pkgModal(page);
    await expect(modal).toBeVisible({ timeout: 5000 });
    await modal.locator('button', { hasText: /Pork Unlimited/ }).first().click();

    await expect(page.locator('h3', { hasText: 'Manager PIN Required' })).toBeVisible({ timeout: 5000 });

    // Enter wrong PIN
    for (const digit of '0000') {
      await pinModal(page).locator('button', { hasText: new RegExp(`^${digit}$`) }).click();
    }
    await page.locator('button', { hasText: 'Confirm Change' }).click();

    // Error message
    await expect(page.locator('text=Incorrect PIN')).toBeVisible({ timeout: 5000 });
  });

  test('upgrade Pork Unlimited → Beef Unlimited does not require PIN', async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithPax(page, 'T7', 2);

    await page.locator('button', { hasText: 'Pork Unlimited' }).first().click();
    await page.locator('button', { hasText: 'CHARGE' }).click();

    await openMoreOptions(page);
    await page.locator('button', { hasText: 'Change Pkg' }).click();

    const modal = pkgModal(page);
    await expect(modal).toBeVisible({ timeout: 5000 });

    // "upgrade" text visible for Beef Unlimited option
    await expect(modal.locator('text=upgrade').first()).toBeVisible();

    // Click Beef Unlimited — no PIN required
    await modal.locator('button', { hasText: /Beef Unlimited/ }).click();

    // PIN modal must NOT appear
    await expect(page.locator('h3', { hasText: 'Manager PIN Required' })).not.toBeVisible();
    // Package updated
    await expect(page.locator('text=Beef Unlimited').first()).toBeVisible({ timeout: 5000 });
  });

  test('Change Package modal shows CURRENT badge on active package', async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithPax(page, 'T8', 2);

    await page.locator('button', { hasText: 'Pork Unlimited' }).first().click();
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

test.describe('POS Register — Weigh Station', () => {
  // Weight-based meat items (Pork Sliced, Sliced Beef) are handled at the weigh station KDS,
  // not through AddItemModal tabs. These tests verify the weigh station page loads for kitchen users.

  test('weigh station page loads without crash for kitchen user', async ({ page }) => {
    await page.goto('/');
    await page.locator('#username').fill('corazon');
    await page.locator('#password').fill('corazon');
    await page.locator('button', { hasText: 'LOGIN' }).click();
    await page.waitForURL('**/kitchen/**', { timeout: 10000 });
    await page.goto('/kitchen/weigh-station');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});
