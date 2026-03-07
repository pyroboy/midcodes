import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fillLogin(page: Page, username: string, password: string) {
  await page.goto('/');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
}

async function submitLogin(page: Page) {
  await page.locator('button', { hasText: 'LOGIN' }).click();
}

async function enterPin(page: Page, pin = '1234') {
  for (const digit of pin) {
    await page.locator('.pos-card button', { hasText: new RegExp(`^${digit}$`) }).click();
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Auth — Login', () => {
  test('wrong password shows error message', async ({ page }) => {
    await fillLogin(page, 'maria', 'wrongpass');
    await submitLogin(page);
    await expect(page.locator('text=Incorrect password.')).toBeVisible();
    // Should still be on login page
    await expect(page).toHaveURL('/');
  });

  test('unknown username shows error message', async ({ page }) => {
    await fillLogin(page, 'nobody', 'nobody');
    await submitLogin(page);
    await expect(page.locator('text=Username not found.')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('LOGIN button disabled when fields empty', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button', { hasText: 'LOGIN' })).toBeDisabled();
  });

  test('staff (maria) logs in and lands on /pos', async ({ page }) => {
    await fillLogin(page, 'maria', 'maria');
    await submitLogin(page);
    await page.waitForURL('**/pos', { timeout: 10000 });
    await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
  });

  test('kitchen (pedro) logs in and lands on /kitchen', async ({ page }) => {
    await fillLogin(page, 'pedro', 'pedro');
    await submitLogin(page);
    await page.waitForURL('**/kitchen', { timeout: 10000 });
    await expect(page).toHaveURL(/\/kitchen/);
  });

  test('owner (chris) logs in and lands on /pos with branch dropdown visible', async ({ page }) => {
    await fillLogin(page, 'chris', 'chris');
    await submitLogin(page);
    await page.waitForURL('**/pos', { timeout: 10000 });
    // Owner sees the location picker button in TopBar (MapPin + ChevronDown)
    // The button shows location name: "All Locations", "Alta Citta", etc.
    await expect(
      page.locator('button', { hasText: /All Locations|Alta Citta|Alona Beach \(Panglao\)/i }).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('manager (juan) requires PIN after credentials', async ({ page }) => {
    await fillLogin(page, 'juan', 'juan');
    await submitLogin(page);
    // PIN modal appears instead of redirect
    await expect(page.locator('h2', { hasText: 'Manager PIN' })).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL('/');
  });

  test('manager (juan) enters correct PIN and lands on /pos', async ({ page }) => {
    await fillLogin(page, 'juan', 'juan');
    await submitLogin(page);
    await expect(page.locator('h2', { hasText: 'Manager PIN' })).toBeVisible({ timeout: 5000 });
    await enterPin(page, '1234');
    await page.locator('button', { hasText: 'VERIFY PIN' }).click();
    await page.waitForURL('**/pos', { timeout: 10000 });
    await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
  });

  test('manager enters wrong PIN gets error', async ({ page }) => {
    await fillLogin(page, 'juan', 'juan');
    await submitLogin(page);
    await expect(page.locator('h2', { hasText: 'Manager PIN' })).toBeVisible({ timeout: 5000 });
    await enterPin(page, '9999');
    await page.locator('button', { hasText: 'VERIFY PIN' }).click();
    await expect(page.locator('text=Incorrect PIN')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('warehouse staff (noel) lands on /stock', async ({ page }) => {
    await fillLogin(page, 'noel', 'noel');
    await submitLogin(page);
    await page.waitForURL('**/stock', { timeout: 10000 });
    await expect(page).toHaveURL(/\/stock/);
  });
});

test.describe('Auth — Branch Scoping', () => {
  test('staff (maria, Tagbilaran) does not see branch selector', async ({ page }) => {
    await fillLogin(page, 'maria', 'maria');
    await submitLogin(page);
    await page.waitForURL('**/pos', { timeout: 10000 });
    await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
    // Staff should NOT see a branch switcher
    await expect(page.locator('[data-testid="branch-select"]')).not.toBeVisible();
  });

  test('owner (chris) can switch between branches', async ({ page }) => {
    await fillLogin(page, 'chris', 'chris');
    await submitLogin(page);
    await page.waitForURL('**/pos', { timeout: 10000 });
    // Owner's location picker button is visible in TopBar
    const locBtn = page.locator('button', { hasText: /All Locations|Alta Citta|Alona Beach \(Panglao\)/i }).first();
    await expect(locBtn).toBeVisible({ timeout: 15000 });
    // Click it to open the dropdown
    await locBtn.click();
    // Dropdown shows other locations
    await expect(page.locator('text=Alta Citta (Tagbilaran)')).toBeVisible({ timeout: 3000 });
    // Switch to Alta Citta (Tagbilaran)
    await page.locator('button', { hasText: 'Alta Citta (Tagbilaran)' }).last().click();
    // Now tables from Tagbilaran should be visible
    await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
  });
});
