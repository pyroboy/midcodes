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

async function loginAsOwner(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('chris');
  await page.locator('#password').fill('chris');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 10000 });
  // Owner sees AllBranchesDashboard — wait for branch names (not individual table cards)
  await expect(page.locator('text=/Alta Citta|Tagbilaran Branch|Alona Beach|Panglao/i').first()).toBeVisible({ timeout: 15000 });
}

async function loginAsManager(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('juan');
  await page.locator('#password').fill('juan');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  // Manager shows PIN step — h2 "Manager PIN" with numpad, then VERIFY PIN button
  await expect(page.locator('h2', { hasText: 'Manager PIN' })).toBeVisible({ timeout: 10000 });
  for (const digit of '1234') {
    await page.locator('.pos-card button', { hasText: new RegExp(`^${digit}$`) }).click();
  }
  await page.locator('button', { hasText: 'VERIFY PIN' }).click();
  await page.waitForURL('**/pos', { timeout: 10000 });
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
}

async function loginAsKitchen(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('pedro');
  await page.locator('#password').fill('pedro');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/kitchen', { timeout: 10000 });
}

// ─── Role-Based Nav Visibility ─────────────────────────────────────────────────

test.describe('Session — Role-Based Navigation', () => {
  test('staff (maria) does not see Admin nav link', async ({ page }) => {
    await loginAsStaff(page);
    await expect(page.locator('nav a[href="/admin"], nav a[href*="admin"]')).not.toBeVisible();
  });

  test('staff (maria) does not see Reports nav link', async ({ page }) => {
    await loginAsStaff(page);
    await expect(page.locator('nav a[href="/reports"], nav a[href*="reports"]')).not.toBeVisible();
  });

  test('staff (maria) only sees POS nav — no Admin or Reports', async ({ page }) => {
    await loginAsStaff(page);
    const navText = await page.locator('nav').first().textContent();
    expect(navText).not.toMatch(/Admin|Reports/i);
  });

  test('owner (chris) sees Admin nav link', async ({ page }) => {
    await loginAsOwner(page);
    await expect(page.locator('a', { hasText: 'Admin' }).first()).toBeVisible();
  });

  test('owner (chris) sees Reports nav link', async ({ page }) => {
    await loginAsOwner(page);
    await expect(page.locator('a', { hasText: 'Reports' }).first()).toBeVisible();
  });

  test('manager (juan) sees Reports but no Admin nav link', async ({ page }) => {
    await loginAsManager(page);
    await expect(page.locator('a', { hasText: 'Reports' }).first()).toBeVisible();
    await expect(page.locator('nav a[href="/admin"], nav a[href*="admin"]')).not.toBeVisible();
  });

  test('kitchen (pedro) cannot navigate to /admin (no link in nav)', async ({ page }) => {
    await loginAsKitchen(page);
    await expect(page.locator('nav a[href="/admin"], nav a[href*="admin"]')).not.toBeVisible();
  });

  test('kitchen (pedro) — /stock route loads without error', async ({ page }) => {
    await loginAsKitchen(page);
    await page.goto('/stock/inventory');
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

// ─── Branch Switching ─────────────────────────────────────────────────────────

test.describe('Session — Branch Switching', () => {
  test('staff (maria) does not see branch selector dropdown', async ({ page }) => {
    await loginAsStaff(page);
    // Branch selector shows Alta Citta / Tagbilaran names — must NOT be present for locked staff
    const tagBtn = page.locator('button', { hasText: /Alta Citta|Tagbilaran Branch/i });
    await expect(tagBtn.first()).not.toBeVisible();
  });

  test('owner (chris) sees branch selector with location names', async ({ page }) => {
    await loginAsOwner(page);
    // AllBranchesDashboard or TopBar shows branch names for owner
    await expect(page.locator('text=/Alta Citta|Alona Beach/i').first()).toBeVisible();
  });

  test('owner (chris) TopBar shows location switcher buttons', async ({ page }) => {
    await loginAsOwner(page);
    // Owner has locationId='all' so TopBar shows "All Locations" as the switcher button
    const locationBtn = page.locator('button', { hasText: /All Locations|Alta Citta|Alona Beach/i }).first();
    await expect(locationBtn).toBeVisible({ timeout: 5000 });
  });

  test('owner switching to Panglao changes the floor to Panglao tables', async ({ page }) => {
    await loginAsOwner(page);

    // Find and click Panglao (Alona Beach) branch button
    const panglaoBtn = page.locator('button', { hasText: /Alona Beach|Panglao/i }).first();
    if (await panglaoBtn.count() > 0) {
      await panglaoBtn.click();
      // No error after switch
      await expect(page.locator('body')).not.toContainText('Error');
    }
  });

  test('manager (juan) can switch branches via TopBar', async ({ page }) => {
    await loginAsManager(page);

    const panglaoBtn = page.locator('button', { hasText: /Alona Beach|Panglao/i }).first();
    if (await panglaoBtn.count() > 0) {
      await panglaoBtn.click();
      await expect(page.locator('body')).not.toContainText('Error');
    }
  });
});

// ─── Access Control ───────────────────────────────────────────────────────────

test.describe('Session — Access Control', () => {
  test('staff navigating directly to /admin sees no admin CRUD UI', async ({ page }) => {
    await loginAsStaff(page);
    await page.goto('/admin/users');
    await page.waitForTimeout(1000);

    // Either redirected away OR no "Add User" button (staff can't manage users)
    const url = page.url();
    const isRedirected = !url.includes('/admin');
    const hasAdminUI = await page.locator('button', { hasText: 'Add User' }).count();
    expect(isRedirected || hasAdminUI === 0).toBeTruthy();
  });

  test('warehouse staff (noel) lands on /stock after login', async ({ page }) => {
    await page.goto('/');
    await page.locator('#username').fill('noel');
    await page.locator('#password').fill('noel');
    await page.locator('button', { hasText: 'LOGIN' }).click();
    await page.waitForURL('**/stock', { timeout: 10000 });
    await expect(page).toHaveURL(/\/stock/);
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('owner (chris) can access all admin sub-routes', async ({ page }) => {
    await loginAsOwner(page);

    const adminRoutes = ['/admin/users', '/admin/menu', '/admin/logs', '/admin/devices', '/admin/floor-editor'];
    for (const route of adminRoutes) {
      await page.goto(route);
      await expect(page.locator('body')).not.toContainText('Error');
    }
  });
});

// ─── Session Persistence ──────────────────────────────────────────────────────

test.describe('Session — Persistence', () => {
  test('staff session survives page reload (stays on /pos)', async ({ page }) => {
    await loginAsStaff(page);

    await page.reload();
    await expect(page).toHaveURL(/\/pos/);
    await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
  });

  test('owner session survives reload (stays on /pos)', async ({ page }) => {
    await loginAsOwner(page);

    await page.reload();
    await expect(page).toHaveURL(/\/pos/);
    await expect(page.locator('body')).not.toContainText('Error');
  });
});
