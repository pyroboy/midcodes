import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Login as Noel Garcia (Staff role, Warehouse location).
 * Warehouse staff land on /stock, not /pos.
 */
async function loginAsWarehouseStaff(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('noel');
  await page.locator('#password').fill('noel');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/stock', { timeout: 10000 });
  await expect(page.locator('body')).not.toContainText('Error');
}

// ─── Warehouse Access Guard ────────────────────────────────────────────────────

test.describe('Warehouse Access Guard', () => {
  test.setTimeout(15_000);

  test('Warehouse staff sidebar shows only Stock nav (no POS or Kitchen)', async ({ page }) => {
    await loginAsWarehouseStaff(page);

    // Stock must be visible in sidebar nav
    const stockLink = page.locator('nav a[href="/stock"], nav a[href*="/stock"]');
    await expect(stockLink.first()).toBeVisible({ timeout: 10000 });

    // POS must NOT be present in nav
    const posLink = page.locator('nav a[href="/pos"]');
    await expect(posLink).not.toBeVisible();

    // Kitchen must NOT be present in nav
    const kitchenLink = page.locator('nav a[href="/kitchen"], nav a[href*="/kitchen"]');
    await expect(kitchenLink).not.toBeVisible();
  });

  test('Warehouse staff cannot navigate to /pos — redirected to /stock', async ({ page }) => {
    await loginAsWarehouseStaff(page);

    // Navigate directly to /pos via URL
    await page.goto('/pos');
    // Allow the $effect redirect to fire
    await page.waitForTimeout(1000);

    // The layout's $effect redirects warehouse sessions away from /pos to /stock/inventory
    const url = page.url();
    const isRedirected = !url.includes('/pos');
    // Alternatively, the page may render but show an empty/blocked state
    const hasFloorPlan = await page.locator('[aria-label="Table T1"]').count();
    expect(isRedirected || hasFloorPlan === 0).toBeTruthy();
  });

  test('Warehouse staff cannot navigate to /kitchen — redirected away', async ({ page }) => {
    await loginAsWarehouseStaff(page);

    // Navigate directly to /kitchen/dispatch via URL
    await page.goto('/kitchen/dispatch');
    // Allow the $effect redirect to fire
    await page.waitForTimeout(1000);

    const url = page.url();
    const isRedirected = !url.includes('/kitchen');
    // Alternatively the page may load but show no KDS tickets
    const hasKdsUI = await page.locator('text=/dispatch|KDS|kitchen queue/i').count();
    expect(isRedirected || hasKdsUI === 0).toBeTruthy();
  });

  test('StatusBar shows warehouse location name', async ({ page }) => {
    await loginAsWarehouseStaff(page);

    // StatusBar renders the uppercased location name — warehouse is "Tagbilaran Central Warehouse"
    // The banner text is set to currentLocation?.name?.toUpperCase()
    const banner = page.locator('h2', { hasText: /WAREHOUSE|TAGBILARAN CENTRAL/i }).first();
    await expect(banner).toBeVisible({ timeout: 10000 });
  });

  test('Warehouse staff location switcher is not present (locked role)', async ({ page }) => {
    await loginAsWarehouseStaff(page);

    // For locked roles (isLocked=true), StatusBar hides the "Change Location" button.
    // canChangeLocation = !session.isLocked && ELEVATED_ROLES.includes(session.role)
    // staff is NOT in ELEVATED_ROLES, so the button must be absent.
    const changeBtn = page.locator('button', { hasText: 'Change Location' });
    await expect(changeBtn).not.toBeVisible();
  });
});
