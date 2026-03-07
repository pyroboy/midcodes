import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsOwner(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('chris');
  await page.locator('#password').fill('chris');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 10000 });
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
}

// ─── Users ────────────────────────────────────────────────────────────────────

test.describe('Admin — Users', () => {
  test('users page loads with seeded user list', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/users');
    // Seeded users should appear
    await expect(page.locator('text=Juan Reyes')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Maria Santos')).toBeVisible();
  });

  test('Add User modal opens and closes', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/users');
    await expect(page.locator('text=Juan Reyes')).toBeVisible({ timeout: 10000 });

    await page.locator('button', { hasText: '+ Add User' }).click();
    await expect(page.locator('h2', { hasText: 'Add New User' })).toBeVisible();

    // Cancel closes the modal
    await page.locator('button', { hasText: /Cancel|✕/ }).click();
    await expect(page.locator('h2', { hasText: 'Add New User' })).not.toBeVisible();
  });

  test('Add User: fill form and create user', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/users');
    await expect(page.locator('text=Juan Reyes')).toBeVisible({ timeout: 10000 });

    await page.locator('button', { hasText: '+ Add User' }).click();
    await expect(page.locator('h2', { hasText: 'Add New User' })).toBeVisible();

    // Fill form
    await page.locator('#displayName').fill('Test User E2E');
    await page.locator('#username').fill('testuser_e2e');
    await page.locator('#role').selectOption('staff');
    await page.locator('#branch').selectOption('tag');
    await page.locator('#tempPass').fill('testpass');

    await page.locator('button', { hasText: 'Create User' }).click();
    await expect(page.locator('h2', { hasText: 'Add New User' })).not.toBeVisible();
    // User should now appear in the table
    await expect(page.locator('text=Test User E2E')).toBeVisible({ timeout: 5000 });
  });

  test('Deactivate / Activate user toggles status', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/users');
    await expect(page.locator('text=Maria Santos')).toBeVisible({ timeout: 10000 });

    // Click Deactivate for Maria
    const mariaRow = page.locator('tr', { hasText: 'Maria Santos' });
    await mariaRow.locator('button', { hasText: /Deactivate|Activate/ }).click();

    // Status badge should change
    await expect(page.locator('body')).not.toContainText('Error');

    // Click again to re-activate
    await mariaRow.locator('button', { hasText: /Deactivate|Activate/ }).click();
  });

  test('users table shows role badges', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/users');
    await expect(page.locator('text=Juan Reyes')).toBeVisible({ timeout: 10000 });
    // Role badges visible
    await expect(page.locator('text=/Manager|Staff|Kitchen/i').first()).toBeVisible();
  });
});

// ─── Menu Management ──────────────────────────────────────────────────────────

test.describe('Admin — Menu', () => {
  test('menu page loads with all seeded items', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/menu');
    await expect(page.locator('text=Samgyupsal')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Soju (Original)')).toBeVisible();
  });

  test('menu items show placeholder images', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/menu');
    await expect(page.locator('text=Samgyupsal')).toBeVisible({ timeout: 10000 });
    // Images should be visible (placeholder URLs)
    const imgs = page.locator('tbody img, td img');
    await expect(imgs.first()).toBeVisible({ timeout: 5000 });
  });

  test('category filter tabs work', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/menu');
    await expect(page.locator('text=Samgyupsal')).toBeVisible({ timeout: 10000 });

    // Click Drinks tab
    await page.locator('button', { hasText: /Drinks/ }).click();
    await expect(page.locator('text=Soju')).toBeVisible();
    await expect(page.locator('text=Samgyupsal')).not.toBeVisible();

    // Click Meats tab
    await page.locator('button', { hasText: /Meats/ }).click();
    await expect(page.locator('text=Samgyupsal')).toBeVisible();
    await expect(page.locator('text=Soju')).not.toBeVisible();
  });

  test('Add Item modal opens and closes', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/menu');
    await expect(page.locator('text=Samgyupsal')).toBeVisible({ timeout: 10000 });

    await page.locator('button', { hasText: '+ Add Item' }).click();
    await expect(page.locator('h3', { hasText: /Add.*Menu Item/i })).toBeVisible();

    await page.locator('button', { hasText: 'Cancel' }).click();
    await expect(page.locator('h3', { hasText: /Add.*Menu Item/i })).not.toBeVisible();
  });

  test('Add Item: create new menu item and verify it appears', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/menu');
    await expect(page.locator('text=Samgyupsal')).toBeVisible({ timeout: 10000 });

    await page.locator('button', { hasText: '+ Add Item' }).click();
    await expect(page.locator('h3', { hasText: /Add.*Menu Item/i })).toBeVisible();

    // Fill form
    await page.locator('input[placeholder*="Samgyupsal"]').fill('E2E Test Drink');
    await page.locator('select').first().selectOption('drinks');
    await page.locator('input[type="number"]').first().fill('55');

    await page.locator('button', { hasText: /Create Item|Add Item/ }).click();
    await expect(page.locator('h3', { hasText: /Add.*Menu Item/i })).not.toBeVisible();
    await expect(page.locator('text=E2E Test Drink')).toBeVisible({ timeout: 5000 });
  });

  test('toggle menu item availability (86)', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/menu');
    await expect(page.locator('text=Iced Tea')).toBeVisible({ timeout: 10000 });

    // Toggle availability for Iced Tea
    const icedTeaRow = page.locator('tr', { hasText: 'Iced Tea' });
    const toggle = icedTeaRow.locator('button[aria-label*="availability" i], button[role="switch"]').first();
    await toggle.click();
    await expect(page.locator('body')).not.toContainText('Error');

    // Toggle back
    await toggle.click();
  });

  test('Edit Item modal opens with existing data', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/menu');
    await expect(page.locator('text=Iced Tea')).toBeVisible({ timeout: 10000 });

    const icedTeaRow = page.locator('tr', { hasText: 'Iced Tea' });
    await icedTeaRow.locator('button', { hasText: 'Edit' }).click();
    await expect(page.locator('h3', { hasText: /Edit.*Menu Item/i })).toBeVisible();

    // Form should be pre-filled with the item's name
    await expect(page.locator('input[placeholder*="Samgyupsal"]')).toHaveValue('Iced Tea');
    await page.locator('button', { hasText: 'Cancel' }).click();
  });

  test('Delete Item: delete confirmation modal and confirm', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/menu');
    // First create a throwaway item to delete
    await page.locator('button', { hasText: '+ Add Item' }).click();
    await page.locator('input[placeholder*="Samgyupsal"]').fill('DELETE ME E2E');
    await page.locator('select').first().selectOption('drinks');
    await page.locator('input[type="number"]').first().fill('1');
    await page.locator('button', { hasText: /Create Item|Add Item/ }).click();
    await expect(page.locator('text=DELETE ME E2E')).toBeVisible({ timeout: 5000 });

    // Delete it
    const row = page.locator('tr', { hasText: 'DELETE ME E2E' });
    await row.locator('button', { hasText: 'Delete' }).click();
    await expect(page.locator('h3', { hasText: 'Delete Menu Item' })).toBeVisible();
    await page.locator('button', { hasText: 'Delete' }).last().click();
    await expect(page.locator('text=DELETE ME E2E')).not.toBeVisible({ timeout: 5000 });
  });
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────

test.describe('Admin — Audit Logs', () => {
  test('logs page loads with entries', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/admin/logs');
    await expect(page.locator('body')).not.toContainText('Error');
    // Should have some log entries from login activity
    await expect(page.locator('tbody tr, .log-entry, [data-testid="log-row"]').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Access Control ───────────────────────────────────────────────────────────

test.describe('Admin — Access Control', () => {
  test('staff cannot access /admin routes (redirected or empty)', async ({ page }) => {
    await page.goto('/');
    await page.locator('#username').fill('maria');
    await page.locator('#password').fill('maria');
    await page.locator('button', { hasText: 'LOGIN' }).click();
    await page.waitForURL('**/pos', { timeout: 10000 });

    // Staff navigating to /admin should be blocked
    await page.goto('/admin/users');
    // Should either redirect away or show access denied — not show user CRUD controls
    await expect(page.locator('button', { hasText: '+ Add User' })).not.toBeVisible({ timeout: 5000 });
  });
});
