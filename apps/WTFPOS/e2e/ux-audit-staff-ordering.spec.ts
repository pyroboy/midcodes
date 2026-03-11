import { test, expect } from '@playwright/test';

test.setTimeout(120000); // 2 min timeout for complex flow

async function login(page, username: string, password: string) {
  await page.goto('/');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 15000 });
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 15000 });
}

async function openTableWithPax(page, tableLabel: string, pax: number) {
  await page.locator(`[aria-label="Table ${tableLabel}"]`).click();
  await page.waitForTimeout(300);
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible({ timeout: 10000 });
  // Find the pax button within the modal, click the first one found
  await page.locator('.pos-card button', { hasText: new RegExp(`^${pax}$`) }).first().click();
  // Wait for page to settle
  await page.waitForTimeout(1000);
}

async function capturePageState(page, name: string) {
  const innerText = await page.locator('body').evaluate(el => el.innerText);
  const screenshot = await page.screenshot({ fullPage: true });

  return {
    name,
    text: innerText,
    screenshot: screenshot.toString('base64'),
  };
}

test('UX Audit: Staff taking complex order (HARD) — Table T1, 1024x768', async ({
  page,
}) => {
  const snapshots = [];

  // Login as Maria (staff)
  await login(page, 'maria', 'maria');
  snapshots.push(await capturePageState(page, 'A1-floor-plan-initial'));

  // Open Table T1 with 4 pax
  await openTableWithPax(page, 'T1', 4);
  snapshots.push(await capturePageState(page, 'A2-pax-modal-confirmed'));

  // AddItemModal now open with meats tab visible
  // Add Pork Unlimited
  await page.locator('button', { hasText: 'Unli Pork' }).click();
  snapshots.push(await capturePageState(page, 'A3-after-unli-pork'));

  // Add Samgyupsal x4 (click 4 times)
  for (let i = 0; i < 4; i++) {
    await page.locator('button', { hasText: 'Samgyupsal' }).first().click();
    await page.waitForTimeout(150);
  }
  snapshots.push(await capturePageState(page, 'A4-after-samgyupsal-x4'));

  // Switch to Dishes & Drinks tab
  await page.locator('button', { hasText: 'DISHES & DRINKS' }).click();
  snapshots.push(await capturePageState(page, 'A5-dishes-drinks-tab'));

  // Add Ramyun x3
  for (let i = 0; i < 3; i++) {
    await page.locator('button', { hasText: 'Ramyun' }).first().click();
    await page.waitForTimeout(150);
  }
  snapshots.push(await capturePageState(page, 'A6-after-ramyun-x3'));

  // Add Soju x4
  for (let i = 0; i < 4; i++) {
    await page.locator('button', { hasText: 'Soju' }).first().click();
    await page.waitForTimeout(150);
  }
  snapshots.push(await capturePageState(page, 'A7-after-soju-x4'));

  // Press CHARGE to finalize items
  await page.locator('button', { hasText: 'CHARGE' }).click();
  snapshots.push(await capturePageState(page, 'A8-after-charge'));

  // Print captured snapshots summary
  console.log('\n=== SNAPSHOTS CAPTURED FOR AUDIT ===');
  snapshots.forEach((s, i) => {
    console.log(`\n${i + 1}. ${s.name}`);
    console.log(`   Text length: ${s.text.length} chars`);
  });

  // Save snapshot names for later reference
  expect(snapshots.length).toBe(8);
});
