/**
 * e2e/pos-discounts-combined.spec.ts
 *
 * Tests that SC + PWD discounts can be applied simultaneously on the same order,
 * that both ID requirements gate the Confirm button, and that combined discount
 * math follows BIR rules.
 *
 * All four tests exercise the full checkout flow for a 4-pax table (T3)
 * with Pork Unlimited, 1 SC + 1 PWD declared at the pax modal.
 *
 * Math reference (4 pax, 1 SC + 1 PWD = 2 qualifying pax):
 *   qualifyingShare = subtotal × (2 / 4) = subtotal / 2
 *   disc = round((qualifyingShare / 1.12) × 0.20)
 *   total = subtotal - disc
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.setTimeout(30_000);

// ─── Login helper ─────────────────────────────────────────────────────────────

async function loginAsStaff(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('#username').fill('maria');
  await page.locator('#password').fill('maria');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 10_000 });
  await expect(page.locator('[aria-label="Table T1"]')).toBeVisible({ timeout: 12_000 });
}

// ─── Open table with mixed pax breakdown ─────────────────────────────────────
// PaxModal has separate ± counters for Adults, Children, Infants, SC, PWD.

async function openTableWithMixedPax(
  page: Page,
  tableLabel: string,
  adults: number,
  sc: number,
  pwd: number
): Promise<void> {
  await page.locator(`[aria-label="Table ${tableLabel}"]`).click({ force: true });
  await expect(page.locator('h3', { hasText: 'How many guests' })).toBeVisible({ timeout: 5_000 });

  // Increment Adults
  const adultsPlusBtn = page.locator('div').filter({ hasText: /^Adults/ }).locator('button', { hasText: /^\+$/ }).first();
  for (let i = 0; i < adults; i++) {
    await adultsPlusBtn.click();
  }

  // Increment SC (slot becomes available after adults are added)
  if (sc > 0) {
    const scPlusBtn = page.locator('div').filter({ hasText: /Senior Citizen/ }).locator('button', { hasText: /^\+$/ }).first();
    for (let i = 0; i < sc; i++) {
      await scPlusBtn.click();
    }
  }

  // Increment PWD
  if (pwd > 0) {
    const pwdPlusBtn = page.locator('div').filter({ hasText: /^PWD/ }).locator('button', { hasText: /^\+$/ }).first();
    for (let i = 0; i < pwd; i++) {
      await pwdPlusBtn.click();
    }
  }

  await page.locator('button', { hasText: /^Confirm( anyway)?$/ }).click();
  await expect(page.locator('h2', { hasText: /Add to Order/ })).toBeVisible({ timeout: 5_000 });
}

// ─── Select package and charge ────────────────────────────────────────────────

async function selectPackageAndCharge(page: Page, packageName: string): Promise<void> {
  await page.locator('button', { hasText: new RegExp(packageName, 'i') }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();
}

// ─── Open checkout ────────────────────────────────────────────────────────────

async function openCheckout(page: Page): Promise<void> {
  await page.locator('button', { hasText: 'Checkout' }).click();

  const skipBtn = page.locator('button', { hasText: /Skip.*Checkout|No Leftovers/i });
  if (await skipBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await skipBtn.click();
  }

  await expect(page.locator('.pos-card', { hasText: 'Checkout' }).first()).toBeVisible({ timeout: 5_000 });
}

// ─── Enter manager PIN ────────────────────────────────────────────────────────

async function enterManagerPin(page: Page, pin = '1234'): Promise<void> {
  const modal = page.locator('.fixed.inset-0').last();
  for (const digit of pin) {
    await modal.locator('button', { hasText: new RegExp(`^${digit}$`) }).click();
  }
  await modal.locator('button', { hasText: /Authorize|Confirm/i }).click();
}

// ─── Apply SC discount (first time — triggers PIN modal) ─────────────────────

async function applyScDiscount(page: Page, scId: string): Promise<void> {
  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await checkout.locator('button', { hasText: /Senior Citizen.*20%/i }).click();
  await expect(page.locator('h3', { hasText: /Authorize|Manager PIN/i })).toBeVisible({ timeout: 3_000 });
  await enterManagerPin(page, '1234');

  const scIdInput = page.locator('input[placeholder*="12345678"]').first();
  await expect(scIdInput).toBeVisible({ timeout: 4_000 });
  await scIdInput.fill(scId);
  await scIdInput.press('Tab');
}

// ─── Apply PWD discount (within 60-second PIN grace or re-enters PIN) ─────────

async function applyPwdDiscount(page: Page, pwdId: string): Promise<void> {
  const checkout = page.locator('.pos-card', { hasText: 'Checkout' }).first();
  await checkout.locator('button', { hasText: /PWD.*20%/i }).click();

  // If PIN modal appears (grace expired or edge case), re-enter
  const pinModalVisible = await page
    .locator('.fixed.inset-0')
    .filter({ hasText: /Authorize PWD|Manager PIN/i })
    .isVisible({ timeout: 1_500 })
    .catch(() => false);

  if (pinModalVisible) {
    await enterManagerPin(page, '1234');
  }

  // Wait for 2 ID inputs (SC + PWD)
  const allIdInputs = page.locator('input[placeholder*="12345678"]');
  await expect(allIdInputs).toHaveCount(2, { timeout: 4_000 });

  const pwdIdInput = allIdInputs.nth(1);
  await pwdIdInput.fill(pwdId);
  await pwdIdInput.press('Tab');
  // Allow recalcOrder to flush discount changes to RxDB
  await page.waitForTimeout(600);
}

// ─── Test 1: Can apply SC and PWD discounts simultaneously ────────────────────
// Verifies both discount buttons are green (bg-status-green) after being applied.

test(
  'Can apply SC and PWD discounts simultaneously',
  async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithMixedPax(page, 'T3', 4 /* adults */, 1 /* sc */, 1 /* pwd */);
    await selectPackageAndCharge(page, 'Pork Unlimited');
    await openCheckout(page);

    // Apply both discounts
    await applyScDiscount(page, 'SC-T1');
    await applyPwdDiscount(page, 'PWD-T1');

    // Both buttons should now have the active (green) class.
    // The active state is indicated by bg-status-green text-white.
    const checkoutCard = page.locator('.pos-card', { hasText: 'Checkout' }).first();
    const scBtn = checkoutCard.locator('button', { hasText: /Senior Citizen.*20%/i });
    const pwdBtn = checkoutCard.locator('button', { hasText: /PWD.*20%/i });

    await expect(scBtn).toHaveClass(/bg-status-green/);
    await expect(pwdBtn).toHaveClass(/bg-status-green/);

    // Close without completing checkout (click X)
    await checkoutCard.locator('button', { hasText: '✕' }).click();
  }
);

// ─── Test 2: Combined discount shown in checkout ──────────────────────────────
// Verifies both "Senior Citizen 20%" and "PWD 20%" labels appear in the totals
// section, plus a combined discount row with a "-₱" amount.

test(
  'Combined discount shown in checkout',
  async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithMixedPax(page, 'T3', 4 /* adults */, 1 /* sc */, 1 /* pwd */);
    await selectPackageAndCharge(page, 'Pork Unlimited');
    await openCheckout(page);

    await applyScDiscount(page, 'SC-T2');
    await applyPwdDiscount(page, 'PWD-T2');

    const checkoutCard = page.locator('.pos-card', { hasText: 'Checkout' }).first();

    // Both individual discount labels appear in the totals section
    await expect(
      checkoutCard.locator('span', { hasText: /Senior Citizen 20%/i })
    ).toBeVisible();

    await expect(
      checkoutCard.locator('span', { hasText: /PWD 20%/i })
    ).toBeVisible();

    // Combined totals row shows "Total Discount (2 applied)" with a -₱ amount
    await expect(
      checkoutCard.locator('span', { hasText: /Total Discount.*2 applied/i })
    ).toBeVisible();

    await expect(
      checkoutCard.locator('span', { hasText: /-₱/ })
    ).toBeVisible();

    await checkoutCard.locator('button', { hasText: '✕' }).click();
  }
);

// ─── Test 3: SC ID and PWD ID both required before Confirm ────────────────────
// The Confirm Payment button must be disabled when IDs are missing.
// It becomes enabled only after BOTH SC ID and PWD ID are filled.

test(
  'SC ID and PWD ID both required before confirm',
  async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithMixedPax(page, 'T3', 4 /* adults */, 1 /* sc */, 1 /* pwd */);
    await selectPackageAndCharge(page, 'Pork Unlimited');
    await openCheckout(page);

    const checkoutCard = page.locator('.pos-card', { hasText: 'Checkout' }).first();
    const confirmBtn = page.locator('button', { hasText: /✓ Confirm Payment/ });

    // Set up exact cash payment first so payment amount is not the blocking factor
    await page.locator('button', { hasText: /^Exact$/ }).click();

    // ── With 0 IDs entered: Confirm must be disabled ──────────────────────────
    // Apply SC discount (with PIN, leaves SC ID blank)
    await checkoutCard.locator('button', { hasText: /Senior Citizen.*20%/i }).click();
    await expect(page.locator('h3', { hasText: /Authorize|Manager PIN/i })).toBeVisible({ timeout: 3_000 });
    await enterManagerPin(page, '1234');
    await expect(page.locator('input[placeholder*="12345678"]').first()).toBeVisible({ timeout: 4_000 });

    // SC ID is blank → Confirm still disabled
    await expect(confirmBtn).toBeDisabled();

    // Apply PWD discount (within grace)
    await checkoutCard.locator('button', { hasText: /PWD.*20%/i }).click();
    const pinModalVisible2 = await page
      .locator('.fixed.inset-0')
      .filter({ hasText: /Authorize PWD|Manager PIN/i })
      .isVisible({ timeout: 1_500 })
      .catch(() => false);
    if (pinModalVisible2) await enterManagerPin(page, '1234');

    // Both SC ID and PWD ID are blank → still disabled
    await expect(confirmBtn).toBeDisabled();

    // ── Fill SC ID only → still disabled ─────────────────────────────────────
    const allIdInputs = page.locator('input[placeholder*="12345678"]');
    await expect(allIdInputs).toHaveCount(2, { timeout: 4_000 });
    await allIdInputs.first().fill('SC-ONLY-999');
    await allIdInputs.first().press('Tab');
    await expect(confirmBtn).toBeDisabled();

    // ── Fill PWD ID too → now enabled ────────────────────────────────────────
    await allIdInputs.nth(1).fill('PWD-ONLY-999');
    await allIdInputs.nth(1).press('Tab');
    await page.waitForTimeout(400);
    await expect(confirmBtn).toBeEnabled({ timeout: 5_000 });

    // Close
    await checkoutCard.locator('button', { hasText: '✕' }).click();
  }
);

// ─── Test 4: Combined discount math is correct ────────────────────────────────
// 4 pax, 1 SC + 1 PWD = 2 qualifying pax.
// BIR formula: disc = round((subtotal × 2/4 / 1.12) × 0.20)
// total = subtotal - disc

test(
  'Combined discount math is correct',
  async ({ page }) => {
    await loginAsStaff(page);
    await openTableWithMixedPax(page, 'T3', 4 /* adults */, 1 /* sc */, 1 /* pwd */);
    await selectPackageAndCharge(page, 'Pork Unlimited');
    await openCheckout(page);

    const checkoutCard = page.locator('.pos-card', { hasText: 'Checkout' }).first();

    // Read subtotal before applying discounts
    const subtotalPreText = await checkoutCard
      .locator('span', { hasText: /^Subtotal/ })
      .locator('..')
      .locator('span')
      .last()
      .innerText()
      .catch(() => '0');
    const subtotal = parseFloat(subtotalPreText.replace(/[₱,\s]/g, '')) || 0;

    // Apply SC and PWD discounts
    await applyScDiscount(page, 'SC-MATH');
    await applyPwdDiscount(page, 'PWD-MATH');

    // Wait for recalcOrder to update order.total in RxDB before Exact sets the cash amount
    await page.waitForTimeout(800);

    // Pay exact cash and confirm
    await page.locator('button', { hasText: /^Exact$/ }).click();
    const confirmBtn = page.locator('button', { hasText: /✓ Confirm Payment/ });
    await expect(confirmBtn).toBeEnabled({ timeout: 5_000 });
    await confirmBtn.click({ force: true });

    // Wait for receipt
    await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 8_000 });

    // Read TOTAL from receipt
    const totalText = await page
      .locator('div', { hasText: /^TOTAL/ })
      .last()
      .locator('span')
      .last()
      .innerText()
      .catch(() => '0');
    const total = parseFloat(totalText.replace(/[₱,\s]/g, '')) || 0;

    // Sanity: subtotal must be > 0
    expect(subtotal, 'Subtotal should be > 0').toBeGreaterThan(0);

    // Compute expected discount: 2 qualifying pax out of 4
    const qualifyingShare = subtotal * (2 / 4);
    const expectedDiscount = Math.round((qualifyingShare / 1.12) * 0.20);
    const expectedTotal = subtotal - expectedDiscount;

    // Allow ±1 for integer rounding
    expect(total).toBeGreaterThanOrEqual(expectedTotal - 1);
    expect(total).toBeLessThanOrEqual(expectedTotal + 1);

    // Total must be strictly less than subtotal
    expect(total, 'Combined SC+PWD discount must reduce total below subtotal').toBeLessThan(subtotal);

    await page.locator('button', { hasText: /^Done$/ }).click();
  }
);
