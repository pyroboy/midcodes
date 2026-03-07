import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function login(page: Page, username: string) {
  await page.goto('/');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(username); // password === username for test accounts
  await page.getByRole('button', { name: /LOGIN/i }).click();
  await page.waitForURL('**/pos', { timeout: 10000 });
  await page.waitForSelector('h1', { timeout: 15000 });
}

async function openFreeTable(page: Page, tableRef: string) {
  const table = page.getByRole('button', { name: tableRef }).first();
  await expect(table).toBeVisible({ timeout: 10000 });
  await table.click();
}

async function pickPax(page: Page, count: number) {
  await expect(page.getByText('How many guests')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: String(count), exact: true }).first().click();
}

async function selectPackage(page: Page, name: string) {
  await expect(page.getByRole('heading', { name: /Add to Order/i })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: new RegExp(name) }).first().click();
}

async function switchTab(page: Page, tabName: string) {
  await page.getByRole('button', { name: new RegExp(tabName, 'i') }).first().click();
}

async function addItem(page: Page, itemName: string) {
  await page.getByRole('button', { name: new RegExp(itemName, 'i') }).first().click();
}

async function chargeItems(page: Page) {
  await page.getByRole('button', { name: /CHARGE/i }).click();
}

async function checkout(page: Page) {
  await page.getByRole('button', { name: /Checkout/i }).click();
}

async function skipLeftover(page: Page) {
  const modal = page.getByText('Leftover Penalty?');
  if (await modal.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /Skip/i }).click();
  }
}

async function payExactCash(page: Page) {
  await page.getByRole('button', { name: /Exact/i }).click();
  const confirm = page.getByRole('button', { name: /Confirm Payment/i });
  await expect(confirm).toBeEnabled({ timeout: 5000 });
  await confirm.click({ force: true });
  await expect(page.getByText('Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /Done/i }).click();
}

async function payGcash(page: Page) {
  await page.getByRole('button', { name: /GCash/i }).click();
  const confirm = page.getByRole('button', { name: /Confirm Payment/i });
  await expect(confirm).toBeEnabled({ timeout: 5000 });
  await confirm.click({ force: true });
  await expect(page.getByText('Payment Successful')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /Done/i }).click();
}

// ─── Browser 1: Maria Santos (Tagbilaran) — Dine-in + Pay Cash ───────────────────────

test('Browser 1 — Tagbilaran: Open T4, Unli Pork + Iced Tea + San Miguel, pay cash', async ({ page }) => {
  await login(page, 'maria');

  // Verify branch
  await expect(page.getByRole('heading', { name: /ALTA CITTA/i })).toBeVisible({ timeout: 10000 });

  // Open a free table
  await openFreeTable(page, 'Table T4');
  await pickPax(page, 3);

  // Add package
  await selectPackage(page, 'Unli Pork');

  // Add drinks
  await switchTab(page, 'Drinks');
  await addItem(page, 'Iced Tea');
  await addItem(page, 'San Miguel');
  await chargeItems(page);

  // Verify items in sidebar
  await expect(page.getByText('Unli Pork').first()).toBeVisible();
  await expect(page.getByText('Iced Tea').first()).toBeVisible();

  // Checkout
  await checkout(page);
  await skipLeftover(page);
  await payExactCash(page);

  // Table should be free again
  await expect(page.getByRole('button', { name: 'Table T4' }).first()).toBeVisible();
});

// ─── Browser 2: Ana Lim (Panglao) — New Takeout + GCash ───────────────────────

test('Browser 2 — Panglao: New Takeout order, Bibimbap + Soju, pay GCash', async ({ page }) => {
  await login(page, 'ana');

  // Verify branch
  await expect(page.getByRole('heading', { name: /ALONA BEACH/i })).toBeVisible({ timeout: 10000 });

  // Create takeout
  await page.getByRole('button', { name: /New Takeout/i }).click();
  await expect(page.getByText('New Takeout Order')).toBeVisible({ timeout: 5000 });
  await page.locator('input[placeholder*="Maria"]').fill('Test Customer');
  await page.getByRole('button', { name: /Create Order/i }).click();

  // Add items
  await expect(page.getByRole('heading', { name: /Add to Takeout/i })).toBeVisible({ timeout: 5000 });
  await switchTab(page, 'Dishes');
  await addItem(page, 'Bibimbap');
  await switchTab(page, 'Drinks');
  await addItem(page, 'Soju');
  await chargeItems(page);

  // Checkout via GCash
  await checkout(page);
  await payGcash(page);
});
