import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.use({ viewport: { width: 1024, height: 768 } });
test.setTimeout(180000);

async function loginAs(page: Page, username: string) {
  await page.goto('http://localhost:5173/');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(username);
  await page.locator('button:has-text("LOGIN")').click();
}

async function waitForFloor(page: Page) {
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
}

async function openTable(page: Page, tableLabel: string) {
  await page.locator(`[aria-label="Table ${tableLabel}"]`).click();
  await expect(page.locator('h3', { hasText: `How many guests` })).toBeVisible({ timeout: 6000 });
}

async function setPax(page: Page, pax: number) {
  // Use the pax modal's button (inside the modal, not the general .pos-card)
  await page.locator('dialog button', { hasText: new RegExp(`^${pax}$`) }).click();
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8000 });
}

async function addItem(page: Page, itemName: string) {
  await page.locator('button', { hasText: itemName }).first().click();
  await page.waitForTimeout(300);
}

async function closeAddItemModal(page: Page) {
  await page.press('Escape');
  await page.waitForTimeout(300);
}

async function fireToKDS(page: Page) {
  await page.locator('button', { hasText: 'Fire' }).click();
  await page.waitForTimeout(500);
}

test('Kitchen harmony flow - hard scenario: Pork Unlimited + Samgyupsal x4 + Ramyun x3 + Soju x4', async ({ page }) => {
  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: LOGIN AS STAFF (MARIA) & OPEN TABLE
  // ═══════════════════════════════════════════════════════════════════
  await loginAs(page, 'maria');
  await page.waitForURL('**/pos', { timeout: 10000 });
  await waitForFloor(page);
  
  await page.screenshot({ path: '.playwright-cli/01_floor_plan_initial.png' });
  
  // Open Table T1
  await openTable(page, 'T1');
  await page.screenshot({ path: '.playwright-cli/02_pax_modal_t1.png' });
  
  // Set 4 guests
  await setPax(page, 4);
  await page.screenshot({ path: '.playwright-cli/03_add_item_modal_open.png' });
  
  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: ADD ITEMS IN SEQUENCE
  // ═══════════════════════════════════════════════════════════════════
  
  // Add Pork Unlimited
  await addItem(page, 'Pork Unlimited');
  await page.screenshot({ path: '.playwright-cli/04_after_pork_unlimited.png' });
  await closeAddItemModal(page);
  
  // Add Samgyupsal x4
  for (let i = 0; i < 4; i++) {
    await page.locator('button', { hasText: 'Add Item' }).first().click();
    await page.waitForTimeout(300);
    await addItem(page, 'Samgyupsal');
    await closeAddItemModal(page);
  }
  await page.screenshot({ path: '.playwright-cli/05_after_samgyupsal_x4.png' });
  
  // Add Ramyun x3
  for (let i = 0; i < 3; i++) {
    await page.locator('button', { hasText: 'Add Item' }).first().click();
    await page.waitForTimeout(300);
    await addItem(page, 'Ramyun');
    await closeAddItemModal(page);
  }
  await page.screenshot({ path: '.playwright-cli/06_after_ramyun_x3.png' });
  
  // Add Soju x4
  for (let i = 0; i < 4; i++) {
    await page.locator('button', { hasText: 'Add Item' }).first().click();
    await page.waitForTimeout(300);
    await addItem(page, 'Soju');
    await closeAddItemModal(page);
  }
  await page.screenshot({ path: '.playwright-cli/07_after_soju_x4_complete_order.png' });
  
  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: FIRE ORDER TO KDS
  // ═══════════════════════════════════════════════════════════════════
  await fireToKDS(page);
  await page.screenshot({ path: '.playwright-cli/08_order_fired_floor_plan.png' });
  
  // ═══════════════════════════════════════════════════════════════════
  // STEP 4: SWITCH TO KITCHEN DISPATCH
  // ═══════════════════════════════════════════════════════════════════
  await loginAs(page, 'corazon');
  await page.waitForURL('**/kitchen', { timeout: 10000 });
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '.playwright-cli/09_kitchen_dispatch_dashboard.png' });
  
  // ═══════════════════════════════════════════════════════════════════
  // STEP 5: EXAMINE TICKET IN DISPATCH
  // ═══════════════════════════════════════════════════════════════════
  
  // Look for T1 ticket card
  const t1Ticket = page.locator('text=T1').first();
  if (await t1Ticket.isVisible()) {
    await t1Ticket.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: '.playwright-cli/10_t1_ticket_expanded.png' });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // STEP 6: NAVIGATE TO STOVE STATION
  // ═══════════════════════════════════════════════════════════════════
  const stoveLink = page.locator('a:has-text("Stove"), button:has-text("Stove")').first();
  if (await stoveLink.isVisible()) {
    await stoveLink.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '.playwright-cli/11_stove_station_view.png' });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // STEP 7: FINAL STATE
  // ═══════════════════════════════════════════════════════════════════
  await page.screenshot({ path: '.playwright-cli/12_final_kitchen_state.png' });
});
