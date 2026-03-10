/**
 * ux-audit-multiuser-tag.spec.ts
 *
 * Multi-user UX audit — Alta Citta (tag), heavy intensity
 * Viewport: 1024×768 (10" tablet landscape)
 *
 * Phases (serial — RxDB state carries across tests):
 *   P1  Staff        : create T3 Pork/4pax, T4 Mix/2pax, T5 Beef/6pax + takeout
 *   P2  Dispatch     : /kitchen/dispatch — all cards, station progress, DONE buttons
 *   P3  Stove        : /kitchen/stove — only dishes/drinks, mark DONE
 *   P4  KDS (legacy) : /kitchen/orders — KP-13 meats section probe, scroll depth
 *   P5  Sides prep   : /kitchen/sides-prep — refill vs original visual distinction
 *   P6  Weigh station: /kitchen/weigh-station — 2 portion weighs, button sizes
 *   P7  Staff refill : T3 refill storm (5 adds), order sidebar Round indicator
 *   P8  Checkout     : T3 cash · T4 SC discount + GCash · T5 leftover + split · takeout
 *
 * Screenshots land in: e2e/screenshots/ux-audit-multiuser-tag/
 *
 * Audit findings are emitted as test annotations and console.info lines so
 * the analyst can write the formal report after reviewing screenshots.
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// ── Constants ──────────────────────────────────────────────────────────────────

const SS_DIR = 'e2e/screenshots/ux-audit-multiuser-tag';
const ss = (name: string) => `${SS_DIR}/${name}.png`;

/** Tablet viewport used throughout */
const TABLET = { width: 1024, height: 768 };

/** Tables used by this audit — chosen to avoid collisions with other spec files */
const T_PORK  = 'T7'; // 4 pax · Pork package
const T_MIX   = 'T8'; // 2 pax · Mix package
const T_BEEF  = 'T9'; // 6 pax · Beef package

// ── Login helpers ──────────────────────────────────────────────────────────────

async function loginAsStaff(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('maria');
  await page.locator('#password').fill('maria');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 12000 });
  // Dismiss ShiftStartModal if it appears
  const shiftModal = page.locator('button', { hasText: /Start Shift|Skip|Begin/i }).first();
  if (await shiftModal.isVisible({ timeout: 4000 }).catch(() => false)) {
    await shiftModal.click();
    await page.waitForTimeout(500);
  }
  await expect(page.locator(`[aria-label="Table T1"]`)).toBeVisible({ timeout: 15000 });
}

async function loginAsKitchen(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('pedro');
  await page.locator('#password').fill('pedro');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/kitchen', { timeout: 12000 });
  await page.waitForTimeout(1500); // RxDB hydration
}

// ── Order helpers ──────────────────────────────────────────────────────────────

async function openTableWithPax(page: Page, tableLabel: string, pax: number) {
  await page.locator(`[aria-label="Table ${tableLabel}"]`).click({ force: true });
  // If PaxModal appears (fresh/available table) → select pax count
  const paxModal = page.locator('h3', { hasText: /How many guests/i });
  if (await paxModal.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Adults row is the first row — use .first() since same number appears in children/free rows too
    await page.locator('.pos-card button', { hasText: new RegExp(`^${pax}$`) }).first().click();
    // PaxModal has a Confirm button to submit the pax selection
    await page.locator('button', { hasText: 'Confirm' }).click();
  } else {
    // Table was already open → AddItemModal or order sidebar — log and continue
    console.info(`[AUDIT] openTableWithPax: ${tableLabel} already open — skipping pax entry`);
  }
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8000 });
}

async function selectPackageAndCharge(page: Page, packageName: string | RegExp) {
  await page.locator('button', { hasText: packageName }).first().click();
  await page.locator('button', { hasText: 'CHARGE' }).click();
  // Wait for AddItemModal to close (floor returns)
  await page.locator('h2', { hasText: 'Add to Order' }).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(600);
}

async function addDrink(page: Page, tableLabel: string) {
  // Re-open table (already open) → should go straight to order sidebar / AddItemModal
  await page.locator(`[aria-label="Table ${tableLabel}"]`).click({ force: true });
  await expect(page.locator('h2', { hasText: 'Add to Order' })).toBeVisible({ timeout: 8000 });
  const drinksTab = page.locator('button', { hasText: /Drinks/i });
  if (await drinksTab.count() > 0) {
    await drinksTab.first().click();
    const drinkBtn = page.locator('button', { hasText: /Iced Tea|Coke|Juice/i }).first();
    if (await drinkBtn.count() > 0) await drinkBtn.click();
  }
  await page.locator('button', { hasText: 'CHARGE' }).click();
  await page.locator('h2', { hasText: 'Add to Order' }).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(600);
}

// ── Checkout helpers ───────────────────────────────────────────────────────────

async function openCheckoutSkipLeftover(page: Page) {
  await page.locator('button', { hasText: 'Checkout' }).click();
  const leftover = page.locator('h2', { hasText: /Leftover Penalty/i });
  if (await leftover.isVisible({ timeout: 4000 }).catch(() => false)) {
    await page.locator('button', { hasText: /Skip.*Checkout|No Penalty/i }).first().click();
  }
  await expect(page.locator('.pos-card', { hasText: /Checkout/i }).first()).toBeVisible({ timeout: 8000 });
}

async function openCheckoutWithLeftover(page: Page, penaltyAmount: number) {
  await page.locator('button', { hasText: 'Checkout' }).click();
  const leftover = page.locator('h2', { hasText: /Leftover Penalty/i });
  if (await leftover.isVisible({ timeout: 4000 }).catch(() => false)) {
    // Try to enter penalty amount
    const penaltyInput = page.locator('input[type="number"]').first();
    if (await penaltyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await penaltyInput.fill(String(penaltyAmount));
    }
    await page.locator('button', { hasText: /Apply|Confirm|Checkout/i }).first().click();
  }
  await expect(page.locator('.pos-card', { hasText: /Checkout/i }).first()).toBeVisible({ timeout: 8000 });
}

async function confirmExactCash(page: Page) {
  const exactBtn = page.locator('button', { hasText: /Exact/i });
  if (await exactBtn.count() > 0) await exactBtn.click();
  const confirmBtn = page.locator('button', { hasText: /Confirm Payment/i });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click({ force: true });
  await expect(page.locator('text=/Payment Successful|Receipt/i').first()).toBeVisible({ timeout: 10000 });
  const doneBtn = page.locator('button', { hasText: /Done|Close/i }).first();
  if (await doneBtn.count() > 0) await doneBtn.click();
}

// ── Touch target measurement helper ───────────────────────────────────────────

/**
 * Measures the bounding box height of every <button> on the page.
 * Returns { under44: number, under56: number, total: number }
 * Logs a CONCERN annotation if any button is < 44px (POS minimum).
 * Logs a CRITICAL annotation if any button is < 56px on a kitchen page.
 */
async function auditButtonHeights(
  page: Page,
  context: { title: string; kitchenPage?: boolean }
): Promise<{ under44: number; under56: number; total: number; min: number }> {
  const result = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const heights = buttons
      .map((b) => b.getBoundingClientRect().height)
      .filter((h) => h > 0); // ignore hidden
    return {
      total: heights.length,
      under44: heights.filter((h) => h < 44).length,
      under56: heights.filter((h) => h < 56).length,
      min: heights.length ? Math.min(...heights) : 0,
    };
  });
  const minRequired = context.kitchenPage ? 56 : 44;
  const violations = context.kitchenPage ? result.under56 : result.under44;
  if (violations > 0) {
    console.info(
      `[AUDIT][KP-01] ${context.title}: ${violations}/${result.total} buttons below ${minRequired}px ` +
      `(min found: ${result.min.toFixed(0)}px) — Touch Target Violation`
    );
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// AUDIT SUITE
// ══════════════════════════════════════════════════════════════════════════════

test.describe.serial('UX Audit — Multi-user handoff — tag branch', () => {
  test.setTimeout(90_000);

  // ── P1: Staff creates 3 dine-in tables + 1 takeout ─────────────────────────

  test('P1 Staff — open floor, create T3 Pork/4pax + T4 Mix/2pax + T5 Beef/6pax + takeout', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await loginAsStaff(page);

    // 1-A  Floor plan — initial state
    await page.screenshot({ path: ss('p1-01-floor-initial') });
    await auditButtonHeights(page, { title: 'P1 Floor plan initial' });

    // ── T3 Pork / 4 pax ──────────────────────────────────────────────────────
    await openTableWithPax(page, T_PORK, 4);
    await page.screenshot({ path: ss('p1-02-pax-modal-t3-pork') });
    await auditButtonHeights(page, { title: 'P1 PaxModal T3' });

    // Package selection screen
    await page.screenshot({ path: ss('p1-03-add-item-modal-t3') });

    // Try Pork packages in priority order
    const porkPackage = page.locator('button', {
      hasText: /Unli Pork|Pork Unlimited|Unli Samgyup Pork/i
    }).first();
    await expect.soft(porkPackage).toBeVisible({ timeout: 5000 });
    await porkPackage.click();

    // Add a drink to make the ticket richer
    const drinksTab = page.locator('button', { hasText: /^Drinks$/i });
    if (await drinksTab.count() > 0) {
      await drinksTab.first().click();
      const drinkItem = page.locator('button', { hasText: /Iced Tea|Coke/i }).first();
      if (await drinkItem.count() > 0) await drinkItem.click();
    }

    await page.screenshot({ path: ss('p1-04-order-sidebar-t3-before-charge') });
    await auditButtonHeights(page, { title: 'P1 Order Sidebar T3' });

    await page.locator('button', { hasText: 'CHARGE' }).click();
    await page.locator('h2', { hasText: 'Add to Order' }).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: ss('p1-05-floor-after-t3-charged') });

    // ── T4 Mix / 2 pax ───────────────────────────────────────────────────────
    await openTableWithPax(page, T_MIX, 2);
    await page.screenshot({ path: ss('p1-06-pax-modal-t4-mix') });

    const mixPackage = page.locator('button', {
      hasText: /Unli Mix|Mix Unlimited|Mix & Match|Samgyup Mix/i
    }).first();
    if (await mixPackage.count() > 0) {
      await mixPackage.click();
    } else {
      // Fallback: any available package
      await page.locator('button', { hasText: /Unli|Unlimited/i }).first().click();
    }

    await page.screenshot({ path: ss('p1-07-add-item-t4-mix') });
    await page.locator('button', { hasText: 'CHARGE' }).click();
    await page.locator('h2', { hasText: 'Add to Order' }).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: ss('p1-08-floor-after-t4-charged') });

    // ── T9 Beef / 6 pax ──────────────────────────────────────────────────────
    await openTableWithPax(page, T_BEEF, 6);
    await page.screenshot({ path: ss('p1-09-pax-modal-t5-beef') });

    const beefPackage = page.locator('button', {
      hasText: /Unli Beef|Beef Unlimited/i
    }).first();
    if (await beefPackage.count() > 0) {
      await beefPackage.click();
    } else {
      await page.locator('button', { hasText: /Unli|Unlimited/i }).first().click();
    }

    await page.screenshot({ path: ss('p1-10-add-item-t5-beef') });
    await page.locator('button', { hasText: 'CHARGE' }).click();
    await page.locator('h2', { hasText: 'Add to Order' }).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: ss('p1-11-floor-after-t5-charged') });

    // ── Takeout order ─────────────────────────────────────────────────────────
    const takeoutBtn = page.locator('button', { hasText: /New Takeout|Takeout/i }).first();
    if (await takeoutBtn.count() > 0) {
      await takeoutBtn.click();
      const takeoutModal = page.locator('h2', { hasText: /Takeout|New Order/i });
      if (await takeoutModal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await page.screenshot({ path: ss('p1-12-takeout-modal') });
        // Fill customer name if required
        const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="customer" i]').first();
        if (await nameInput.count() > 0) await nameInput.fill('Audit Takeout Customer');
        // Add a package or item
        const pkg = page.locator('button', { hasText: /Unli|Unlimited/i }).first();
        if (await pkg.count() > 0) await pkg.click();
        await page.locator('button', { hasText: 'CHARGE' }).click();
        await page.screenshot({ path: ss('p1-13-floor-after-takeout') });
      }
    } else {
      console.info('[AUDIT] P1: No New Takeout button found — takeout entry point missing or hidden');
      await page.screenshot({ path: ss('p1-12-no-takeout-button') });
    }

    // 1-Z  Final floor state with 3 occupied tables
    await page.screenshot({ path: ss('p1-14-floor-final-3tables-occupied') });
    await auditButtonHeights(page, { title: 'P1 Final floor' });
  });

  // ── P2: Kitchen Dispatch ───────────────────────────────────────────────────

  test('P2 Dispatch — /kitchen/dispatch: 3 table cards, station progress, DONE targets', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await loginAsKitchen(page);
    await page.goto('/kitchen/dispatch');
    await page.waitForTimeout(2000); // RxDB hydration

    // 2-A  Full dispatch board
    await page.screenshot({ path: ss('p2-01-dispatch-full-board') });
    const btns = await auditButtonHeights(page, { title: 'P2 Dispatch board', kitchenPage: true });
    console.info(`[AUDIT] P2 Dispatch button audit: ${JSON.stringify(btns)}`);

    // Check all 3 dine-in tables are visible
    for (const table of [T_PORK, T_MIX, T_BEEF]) {
      const card = page.locator('text=' + table).first();
      const visible = await card.isVisible({ timeout: 5000 }).catch(() => false);
      if (!visible) {
        console.info(`[AUDIT][P2] Table ${table} card NOT visible on dispatch board — handoff gap`);
      } else {
        console.info(`[AUDIT][P2] Table ${table} card visible ✓`);
      }
    }

    // Check station progress rows exist (meats / dishes / sides)
    const stationLabels = ['Meats', 'Dishes', 'Sides', 'MEAT', 'DISH', 'SIDE'];
    for (const label of stationLabels) {
      const el = page.locator(`text=/${label}/i`).first();
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.info(`[AUDIT][P2] Station label "${label}" visible on dispatch card ✓`);
        break;
      }
    }

    // Check for READY TO RUN indicator (may not be lit yet since kitchen hasn't worked)
    const readyToRun = page.locator('text=/READY TO RUN|READY|ALL DONE/i').first();
    if (await readyToRun.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.info('[AUDIT][P2] READY TO RUN indicator visible on dispatch board');
      await page.screenshot({ path: ss('p2-02-dispatch-ready-to-run') });
    }

    // Try marking a sides item DONE on the first available card
    const doneBtn = page.locator('button', { hasText: /^DONE$|^Done$/ }).first();
    if (await doneBtn.count() > 0) {
      // Measure button height before clicking
      const h = await doneBtn.evaluate((el) => el.getBoundingClientRect().height);
      console.info(`[AUDIT][P2] First DONE button height: ${h.toFixed(0)}px (kitchen min: 56px)`);
      if (h < 56) console.info(`[AUDIT][KP-01][CRITICAL] DONE button ${h.toFixed(0)}px < 56px (kitchen page)`);
      await doneBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: ss('p2-03-dispatch-after-sides-done') });
    } else {
      console.info('[AUDIT][P2] No DONE button found — sides items may not be present yet');
      await page.screenshot({ path: ss('p2-02-dispatch-no-done-button') });
    }

    // Check for ALL SIDES DONE / batch complete button
    const allSidesDone = page.locator('button', { hasText: /ALL SIDES DONE|All Sides Done/i }).first();
    if (await allSidesDone.count() > 0) {
      const h = await allSidesDone.evaluate((el) => el.getBoundingClientRect().height);
      console.info(`[AUDIT][P2] ALL SIDES DONE button height: ${h.toFixed(0)}px`);
    }

    // Scroll to check if cards extend below fold
    const scrollable = page.locator('main, [class*="overflow-y-auto"], [class*="overflow-auto"]').first();
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.screenshot({ path: ss('p2-04-dispatch-scrolled') });
    await page.evaluate(() => window.scrollTo(0, 0));
  });

  // ── P3: Kitchen Stove ──────────────────────────────────────────────────────

  test('P3 Stove — /kitchen/stove: only dishes/drinks, no meat, DONE button sizes', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await loginAsKitchen(page);
    await page.goto('/kitchen/stove');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: ss('p3-01-stove-full-queue') });
    const btns = await auditButtonHeights(page, { title: 'P3 Stove queue', kitchenPage: true });
    console.info(`[AUDIT] P3 Stove button audit: ${JSON.stringify(btns)}`);

    // CRITICAL CHECK: meat items must NOT appear on stove page
    const meatTerms = ['Samgyupsal', 'Beef Belly', 'Pork Belly', 'Wagyu', 'MEATS'];
    for (const term of meatTerms) {
      const el = page.locator(`text=${term}`).first();
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.info(`[AUDIT][P3][FAIL] Meat item "${term}" visible on Stove page — routing error`);
      }
    }

    // Verify dishes/drinks are shown
    const dishSectionHeader = page.locator('text=/DISHES|Dishes|Drinks/i').first();
    if (await dishSectionHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.info('[AUDIT][P3] Dishes/Drinks section header visible ✓');
    }

    // Check item text size (should be ≥18px for 60cm viewing distance)
    const itemTextSize = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('h3, h4, .font-bold, .font-semibold'));
      const sizes = items.map((el) => parseFloat(window.getComputedStyle(el).fontSize)).filter((s) => s > 0);
      return sizes.length ? Math.min(...sizes) : 0;
    });
    console.info(`[AUDIT][P3] Smallest prominent text on stove: ${itemTextSize.toFixed(0)}px (kitchen min: 18px)`);
    if (itemTextSize < 18 && itemTextSize > 0) {
      console.info(`[AUDIT][P3][CONCERN] Text ${itemTextSize.toFixed(0)}px < 18px — may not be legible at 60-90cm`);
    }

    // Mark first item DONE if available
    const doneBtn = page.locator('button', { hasText: /^DONE$|^Done$/ }).first();
    if (await doneBtn.count() > 0) {
      const h = await doneBtn.evaluate((el) => el.getBoundingClientRect().height);
      console.info(`[AUDIT][P3] DONE button height: ${h.toFixed(0)}px`);
      if (h < 56) console.info(`[AUDIT][KP-01][CRITICAL] Stove DONE button ${h.toFixed(0)}px < 56px`);
      await doneBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: ss('p3-02-stove-after-done') });
    } else {
      console.info('[AUDIT][P3] No DONE button — queue may be empty or drinks not yet ordered');
      await page.screenshot({ path: ss('p3-02-stove-no-done') });
    }

    // Check ALL DONE button
    const allDone = page.locator('button', { hasText: /ALL DONE|All Done/i }).first();
    if (await allDone.count() > 0) {
      const h = await allDone.evaluate((el) => el.getBoundingClientRect().height);
      console.info(`[AUDIT][P3] ALL DONE button height: ${h.toFixed(0)}px`);
    }
  });

  // ── P4: Legacy KDS (/kitchen/orders) ──────────────────────────────────────

  test('P4 KDS legacy — /kitchen/orders: meats section probe (KP-13), scroll depth', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await loginAsKitchen(page);
    await page.goto('/kitchen/orders');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: ss('p4-01-kds-full-queue') });
    await auditButtonHeights(page, { title: 'P4 KDS legacy', kitchenPage: true });

    // KP-13: Check if MEATS section is rendered
    const meatsSection = page.locator('text=/MEATS|Meats/i').first();
    const meatsSectionVisible = await meatsSection.isVisible({ timeout: 3000 }).catch(() => false);
    if (meatsSectionVisible) {
      console.info('[AUDIT][P4] MEATS section header visible on /kitchen/orders ✓');
    } else {
      console.info('[AUDIT][P4][KP-13][FAIL] MEATS section NOT visible on /kitchen/orders — meat items silently invisible');
    }

    // Check for DISHES & DRINKS section
    const dishesSection = page.locator('text=/DISHES.*DRINKS|DISHES & DRINKS/i').first();
    if (await dishesSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.info('[AUDIT][P4] DISHES & DRINKS section visible ✓');
    }

    // KP-11: Measure scroll depth needed to reach "All DONE" button
    const allDoneBtn = page.locator('button', { hasText: /All DONE|ALL DONE/i }).first();
    if (await allDoneBtn.count() > 0) {
      const box = await allDoneBtn.boundingBox();
      if (box) {
        console.info(`[AUDIT][P4] "All DONE" button Y position: ${box.y.toFixed(0)}px (viewport height: 768px)`);
        if (box.y > 768) {
          console.info(`[AUDIT][P4][KP-11][CONCERN] "All DONE" button is below fold (${box.y.toFixed(0)}px) — requires scroll`);
        }
      }
    }

    // Scroll to bottom to see full ticket
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.screenshot({ path: ss('p4-02-kds-scrolled-bottom') });
    await page.evaluate(() => window.scrollTo(0, 0));

    // KP-12: Singleton state — try toggling DISHES section on ticket 1, check if ticket 2 affected
    const dishToggle = page.locator('button', { hasText: /DISHES|DISH/i }).first();
    if (await dishToggle.count() > 0) {
      await dishToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: ss('p4-03-kds-dishes-toggled') });
      console.info('[AUDIT][P4][KP-12] Toggled DISHES section — check screenshot for global state bleed across tickets');
    }
  });

  // ── P5: Sides Prep — refill vs original distinction ───────────────────────

  test('P5 Sides prep — /kitchen/sides-prep: refill vs original visual distinction (KP-04)', async ({ page, context }) => {
    await page.setViewportSize(TABLET);

    // STEP A: Staff adds a refill for T3 to create the test condition
    const staffPage = await context.newPage();
    await staffPage.setViewportSize(TABLET);
    await loginAsStaff(staffPage);

    // Open T3 (already open) to get to order sidebar
    await staffPage.locator(`[aria-label="Table ${T_PORK}"]`).click({ force: true });
    const addItemModal = staffPage.locator('h2', { hasText: 'Add to Order' });
    const orderSidebar = staffPage.locator('button', { hasText: 'Checkout' });

    if (await addItemModal.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Already in AddItemModal — just charge to close
      await staffPage.locator('button', { hasText: 'CHARGE' }).click();
    }

    // Click T3 again to get to order sidebar
    await staffPage.locator(`[aria-label="Table ${T_PORK}"]`).click({ force: true });
    await staffPage.waitForTimeout(1000);

    // Look for Refill button in order sidebar
    const refillBtn = staffPage.locator('button', { hasText: /^Refill$|^Add Refill$/i }).first();
    if (await refillBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await staffPage.screenshot({ path: ss('p5-01-order-sidebar-refill-button') });
      await refillBtn.click();

      const refillModal = staffPage.locator('h2', { hasText: /Refill/i });
      if (await refillModal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await staffPage.screenshot({ path: ss('p5-02-refill-panel') });
        // Add a meat refill
        const meatRefill = staffPage.locator('button', { hasText: /Samgyupsal|Pork Belly|Beef/i }).first();
        if (await meatRefill.count() > 0) {
          await meatRefill.click();
          await staffPage.screenshot({ path: ss('p5-03-refill-selected') });
        }
        const doneBtn = staffPage.locator('button', { hasText: /Done|Close/i }).first();
        if (await doneBtn.count() > 0) await doneBtn.click();
      }
    } else {
      console.info('[AUDIT][P5] Refill button not visible in order sidebar — may need to be at floor level');
      await staffPage.screenshot({ path: ss('p5-01-no-refill-button') });
    }

    // Screenshot order sidebar after refill — check for Round 2 header (KP-04)
    await staffPage.screenshot({ path: ss('p5-04-order-sidebar-after-refill') });
    const round2Header = staffPage.locator('text=/Round 2|ROUND 2|Refill/i').first();
    if (await round2Header.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.info('[AUDIT][P5][KP-04] Round/Refill indicator visible in order sidebar ✓');
    } else {
      console.info('[AUDIT][P5][KP-04][CONCERN] No Round 2 / Refill separator in order sidebar — refills not visually grouped');
    }

    await staffPage.close();

    // STEP B: Sides prep page — check refill vs original distinction
    await loginAsKitchen(page);
    await page.goto('/kitchen/sides-prep');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: ss('p5-05-sides-prep-full') });
    await auditButtonHeights(page, { title: 'P5 Sides prep', kitchenPage: true });

    // Check for filter pills (KP-04 fix pattern)
    const filterPills = page.locator('button', { hasText: /New|Refill|Original|All/i });
    const pillCount = await filterPills.count();
    console.info(`[AUDIT][P5] Filter pills found: ${pillCount}`);
    if (pillCount > 0) {
      await page.screenshot({ path: ss('p5-06-sides-prep-filter-pills') });

      // Try "Refill" filter pill
      const refillPill = page.locator('button', { hasText: /^Refill$/i }).first();
      if (await refillPill.count() > 0) {
        await refillPill.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: ss('p5-07-sides-prep-refill-filtered') });
        console.info('[AUDIT][P5][KP-04] Refill filter pill present and clickable ✓');
      }
    } else {
      console.info('[AUDIT][P5][KP-04][CONCERN] No filter pills (New vs Refill) on sides prep — KP-04 not resolved here');
    }

    // Check for refill visual badge on queue cards (🔄 or REFILL text)
    const refillBadge = page.locator('text=/🔄|REFILL|Refill/i').first();
    if (await refillBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.info('[AUDIT][P5][KP-04] Refill badge visible on sides prep queue card ✓');
      await page.screenshot({ path: ss('p5-08-sides-prep-refill-badge') });
    } else {
      console.info('[AUDIT][P5][KP-04][CONCERN] No refill badge on sides prep queue cards — refills indistinguishable from originals');
    }

    // BATCH DONE button height check
    const batchDone = page.locator('button', { hasText: /BATCH DONE|Batch Done/i }).first();
    if (await batchDone.count() > 0) {
      const h = await batchDone.evaluate((el) => el.getBoundingClientRect().height);
      console.info(`[AUDIT][P5] BATCH DONE button height: ${h.toFixed(0)}px (kitchen min: 56px)`);
      if (h < 56) console.info(`[AUDIT][KP-01][CRITICAL] BATCH DONE ${h.toFixed(0)}px < 56px`);
    }
  });

  // ── P6: Weigh Station ──────────────────────────────────────────────────────

  test('P6 Weigh station — /kitchen/weigh-station: 2 portion weighs, button sizes, scale UI', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await loginAsKitchen(page);
    await page.goto('/kitchen/weigh-station');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: ss('p6-01-weigh-station-initial') });
    const btns = await auditButtonHeights(page, { title: 'P6 Weigh station', kitchenPage: true });
    console.info(`[AUDIT] P6 Weigh station button audit: ${JSON.stringify(btns)}`);

    // Check Bluetooth scale status visibility
    const btStatus = page.locator('text=/Bluetooth|BT Scale|Scale|Connected|Not Connected|Disconnected/i').first();
    if (await btStatus.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.info('[AUDIT][P6] Bluetooth scale status indicator visible ✓');
    } else {
      console.info('[AUDIT][P6][CONCERN] No Bluetooth scale status visible — hardware state hidden');
    }

    // Check pending meat groups
    const pendingGroups = page.locator('.rounded-xl.border, .pos-card').filter({
      has: page.locator('text=/T3|T4|T5/i')
    });
    const groupCount = await pendingGroups.count();
    console.info(`[AUDIT][P6] Pending meat groups visible: ${groupCount} (expected ≥1 for T3/T4/T5)`);
    if (groupCount === 0) {
      console.info('[AUDIT][P6][CONCERN] No pending meat groups visible — weigh station may not be receiving KDS data');
    }

    // ── Weigh #1 ──────────────────────────────────────────────────────────────
    // Click first available meat item to select it
    const firstMeatBtn = page.locator('button', { hasText: /Samgyupsal|Pork Belly|Beef Belly|Wagyu/i }).first();
    if (await firstMeatBtn.count() > 0) {
      await firstMeatBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: ss('p6-02-weigh-item-selected') });

      // Check weight input / numpad is visible
      const weightLabel = page.locator('text=/Weight.*grams|Weight \(g\)|Enter weight/i').first();
      const numpad = page.locator('.grid.grid-cols-3').first();
      if (await numpad.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.info('[AUDIT][P6] Numpad visible for manual weight input ✓');

        // Check numpad button sizes (should be ≥56px for wet hands, PRD says knuckle-sized ≥64px)
        const numBtnH = await numpad.locator('button').first().evaluate(
          (el) => el.getBoundingClientRect().height
        ).catch(() => 0);
        console.info(`[AUDIT][P6] Numpad button height: ${numBtnH.toFixed(0)}px (PRD min: 64px for butcher)`);
        if (numBtnH < 64) {
          console.info(`[AUDIT][KP-01][CONCERN] Numpad buttons ${numBtnH.toFixed(0)}px < 64px PRD requirement`);
        }

        // Enter 200g
        for (const key of ['2', '0', '0']) {
          const keyBtn = numpad.getByRole('button', { name: new RegExp(`^${key}$`) });
          if (await keyBtn.count() > 0) await keyBtn.click();
        }
        await page.screenshot({ path: ss('p6-03-weight-entered-200g') });

        // Check weight display (should show large mono font)
        const weightDisplay = page.locator('.font-mono').first();
        if (await weightDisplay.isVisible({ timeout: 2000 }).catch(() => false)) {
          const displayText = await weightDisplay.textContent();
          console.info(`[AUDIT][P6] Weight display shows: "${displayText?.trim()}"`);
          const displaySize = await weightDisplay.evaluate(
            (el) => parseFloat(window.getComputedStyle(el).fontSize)
          );
          console.info(`[AUDIT][P6] Weight display font size: ${displaySize.toFixed(0)}px`);
        }

        // DISPATCH button
        const dispatchBtn = page.locator('button', { hasText: /DISPATCH|Dispatch/i }).first();
        if (await dispatchBtn.count() > 0) {
          const h = await dispatchBtn.evaluate((el) => el.getBoundingClientRect().height);
          console.info(`[AUDIT][P6] DISPATCH button height: ${h.toFixed(0)}px`);
          if (h < 56) console.info(`[AUDIT][KP-01][CRITICAL] DISPATCH button ${h.toFixed(0)}px < 56px`);
          await dispatchBtn.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: ss('p6-04-after-first-dispatch') });
          console.info('[AUDIT][P6] Weigh #1 dispatched at 200g');
        }
      } else {
        console.info('[AUDIT][P6][CONCERN] Numpad not visible after selecting meat — manual weight input path broken');
        await page.screenshot({ path: ss('p6-02-no-numpad') });
      }
    } else {
      console.info('[AUDIT][P6] No meat button found to select — pending items list may be empty');
      await page.screenshot({ path: ss('p6-02-no-pending-meats') });
    }

    // ── Weigh #2 ──────────────────────────────────────────────────────────────
    const secondMeatBtn = page.locator('button', { hasText: /Samgyupsal|Pork|Beef/i }).first();
    if (await secondMeatBtn.count() > 0) {
      await secondMeatBtn.click();
      await page.waitForTimeout(500);

      const numpad = page.locator('.grid.grid-cols-3').first();
      if (await numpad.isVisible({ timeout: 2000 }).catch(() => false)) {
        for (const key of ['1', '8', '0']) {
          const keyBtn = numpad.getByRole('button', { name: new RegExp(`^${key}$`) });
          if (await keyBtn.count() > 0) await keyBtn.click();
        }
        const dispatchBtn = page.locator('button', { hasText: /DISPATCH|Dispatch/i }).first();
        if (await dispatchBtn.count() > 0) {
          await dispatchBtn.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: ss('p6-05-after-second-dispatch') });
          console.info('[AUDIT][P6] Weigh #2 dispatched at 180g');
        }
      }
    }

    // Check dispatched log (right panel)
    const dispatchLog = page.locator('text=/g|dispatched|Dispatched/i').first();
    if (await dispatchLog.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.info('[AUDIT][P6] Dispatch log visible with weight entries ✓');
      await page.screenshot({ path: ss('p6-06-dispatch-log') });
    }
  });

  // ── P7: Staff refill storm on T3 ──────────────────────────────────────────

  test('P7 Staff — refill storm T3: 4x meat adds, order sidebar Round indicator', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await loginAsStaff(page);

    // Open T3 (existing open table)
    await page.locator(`[aria-label="Table ${T_PORK}"]`).click({ force: true });
    await page.waitForTimeout(1000);

    // Might land in AddItemModal or order sidebar context
    const addItemModal = page.locator('h2', { hasText: 'Add to Order' });
    if (await addItemModal.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Close it first
      await page.locator('button', { hasText: 'CHARGE' }).click();
      await page.waitForTimeout(500);
      await page.locator(`[aria-label="Table ${T_PORK}"]`).click({ force: true });
      await page.waitForTimeout(1000);
    }

    // Take screenshot of current order sidebar state
    await page.screenshot({ path: ss('p7-01-order-sidebar-before-refill') });

    // Look for Refill button
    const refillBtn = page.locator('button', { hasText: /^Refill$|Refill Items/i }).first();
    if (await refillBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      // First refill add
      await refillBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: ss('p7-02-refill-panel-open') });

      // Add refill item 4 times to simulate storm
      for (let i = 0; i < 4; i++) {
        const meatBtn = page.locator('button', { hasText: /Samgyupsal|Pork|Beef/i }).first();
        if (await meatBtn.count() > 0) {
          await meatBtn.click();
          await page.waitForTimeout(300);
        }
      }

      await page.screenshot({ path: ss('p7-03-refill-storm-4x') });

      const doneBtn = page.locator('button', { hasText: /Done|Close/i }).first();
      if (await doneBtn.count() > 0) await doneBtn.click();
    } else {
      // Fallback: use AddItemModal if Refill panel isn't accessible
      console.info('[AUDIT][P7] Refill panel not accessible — trying AddItemModal for refill items');
      await page.locator(`[aria-label="Table ${T_PORK}"]`).click({ force: true });
      if (await addItemModal.isVisible({ timeout: 5000 }).catch(() => false)) {
        for (let i = 0; i < 3; i++) {
          const meatBtn = page.locator('button', { hasText: /Samgyupsal|Pork/i }).first();
          if (await meatBtn.count() > 0) await meatBtn.click();
        }
        await page.screenshot({ path: ss('p7-03-refill-via-add-item') });
        await page.locator('button', { hasText: 'CHARGE' }).click();
        await page.waitForTimeout(500);
        await page.locator(`[aria-label="Table ${T_PORK}"]`).click({ force: true });
      }
    }

    // KEY UX AUDIT: Does the order sidebar show a "Round 2" / "Refill" separator? (KP-04)
    await page.screenshot({ path: ss('p7-04-order-sidebar-after-refill-storm') });

    const round2Indicator = page.locator('text=/Round 2|ROUND 2|Refill Round|🔄/i').first();
    if (await round2Indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.info('[AUDIT][P7][KP-04] Round 2 / refill indicator visible in order sidebar ✓');
    } else {
      console.info('[AUDIT][P7][KP-04][FAIL] No Round 2 indicator in order sidebar — 4 refill items blend with original items');
    }

    // Check if sidebar scrolls to reveal refill items (KP-11)
    const scrollablePanel = page.locator('[class*="overflow-y-auto"]').last();
    await page.evaluate(() => {
      const panels = document.querySelectorAll('[class*="overflow-y-auto"]');
      if (panels.length) panels[panels.length - 1].scrollTop = 9999;
    });
    await page.screenshot({ path: ss('p7-05-order-sidebar-scrolled-bottom') });
    await page.evaluate(() => {
      const panels = document.querySelectorAll('[class*="overflow-y-auto"]');
      if (panels.length) panels[panels.length - 1].scrollTop = 0;
    });

    // Send all refill items to kitchen
    const chargeBtn = page.locator('button', { hasText: 'CHARGE' });
    if (await chargeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chargeBtn.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: ss('p7-06-floor-after-refill-storm-sent') });
  });

  // ── P8-A: Checkout T3 — Cash ───────────────────────────────────────────────

  test('P8a Checkout T3 — cash payment', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await loginAsStaff(page);

    await page.locator(`[aria-label="Table ${T_PORK}"]`).click({ force: true });
    await page.waitForTimeout(1000);

    // Close AddItemModal if it opened
    const addItemModal = page.locator('h2', { hasText: 'Add to Order' });
    if (await addItemModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.locator('button', { hasText: 'CHARGE' }).click();
      await page.waitForTimeout(500);
      await page.locator(`[aria-label="Table ${T_PORK}"]`).click({ force: true });
      await page.waitForTimeout(500);
    }

    // Checkout button
    const checkoutBtn = page.locator('button', { hasText: 'Checkout' });
    if (await checkoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkoutBtn.click();
    } else {
      console.info('[AUDIT][P8a] Checkout button not visible from floor — may need to select table first');
      await page.screenshot({ path: ss('p8a-01-no-checkout-btn') });
      return;
    }

    // Handle leftover penalty modal
    const leftoverModal = page.locator('h2', { hasText: /Leftover Penalty/i });
    if (await leftoverModal.isVisible({ timeout: 4000 }).catch(() => false)) {
      await page.screenshot({ path: ss('p8a-01-leftover-modal') });
      await auditButtonHeights(page, { title: 'P8a Leftover modal' });
      await page.locator('button', { hasText: /Skip.*Checkout|No Penalty/i }).first().click();
    }

    // CheckoutModal
    await expect(page.locator('.pos-card', { hasText: /Checkout/i }).first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: ss('p8a-02-checkout-modal') });
    await auditButtonHeights(page, { title: 'P8a CheckoutModal' });

    // Payment method: Cash
    const cashBtn = page.locator('button', { hasText: /^Cash$/i });
    if (await cashBtn.count() > 0) {
      const h = await cashBtn.evaluate((el) => el.getBoundingClientRect().height);
      console.info(`[AUDIT][P8a] Cash button height: ${h.toFixed(0)}px`);
      await cashBtn.click();
    }

    // Cash preset chips / Exact button
    const exactBtn = page.locator('button', { hasText: /Exact/i }).first();
    if (await exactBtn.count() > 0) await exactBtn.click();

    await page.screenshot({ path: ss('p8a-03-checkout-cash-entered') });

    const confirmBtn = page.locator('button', { hasText: /Confirm Payment/i });
    await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
    await page.screenshot({ path: ss('p8a-04-checkout-confirm-area') });

    const confirmH = await confirmBtn.evaluate((el) => el.getBoundingClientRect().height);
    console.info(`[AUDIT][P8a] Confirm Payment button height: ${confirmH.toFixed(0)}px`);

    await confirmBtn.click({ force: true });
    await expect(page.locator('text=/Payment Successful|Receipt/i').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: ss('p8a-05-receipt-modal') });
    await auditButtonHeights(page, { title: 'P8a Receipt modal' });

    const doneBtn = page.locator('button', { hasText: /^Done$|^Close$/i }).first();
    if (await doneBtn.count() > 0) await doneBtn.click();
    await page.screenshot({ path: ss('p8a-06-floor-after-t3-closed') });
  });

  // ── P8-B: Checkout T4 — SC Discount + GCash ──────────────────────────────

  test('P8b Checkout T4 — Senior Citizen 20% discount + GCash', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await loginAsStaff(page);

    await page.locator(`[aria-label="Table ${T_MIX}"]`).click({ force: true });
    await page.waitForTimeout(1000);

    const addItemModal = page.locator('h2', { hasText: 'Add to Order' });
    if (await addItemModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.locator('button', { hasText: 'CHARGE' }).click();
      await page.waitForTimeout(500);
      await page.locator(`[aria-label="Table ${T_MIX}"]`).click({ force: true });
      await page.waitForTimeout(500);
    }

    const checkoutBtn = page.locator('button', { hasText: 'Checkout' });
    if (!await checkoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.info('[AUDIT][P8b] Checkout button not visible for T4 — table may already be closed');
      await page.screenshot({ path: ss('p8b-01-no-checkout') });
      return;
    }
    await checkoutBtn.click();

    const leftoverModal = page.locator('h2', { hasText: /Leftover Penalty/i });
    if (await leftoverModal.isVisible({ timeout: 4000 }).catch(() => false)) {
      await page.locator('button', { hasText: /Skip.*Checkout|No Penalty/i }).first().click();
    }

    await expect(page.locator('.pos-card', { hasText: /Checkout/i }).first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: ss('p8b-01-checkout-modal-t4') });

    // Apply Senior Citizen discount
    const scBtn = page.locator('button', { hasText: /Senior|SC|Senior Citizen/i }).first();
    if (await scBtn.count() > 0) {
      await scBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: ss('p8b-02-sc-discount-applied') });
      console.info('[AUDIT][P8b] SC discount button found and clicked');

      // Check discount is reflected in total
      const discountLine = page.locator('text=/Discount|SC|20%/i').first();
      if (await discountLine.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.info('[AUDIT][P8b] Discount line visible in checkout total ✓');
      } else {
        console.info('[AUDIT][P8b][CONCERN] No discount line visible after SC applied — unclear if applied');
      }
    } else {
      console.info('[AUDIT][P8b][CONCERN] No Senior Citizen discount button found in CheckoutModal');
      await page.screenshot({ path: ss('p8b-02-no-sc-button') });
    }

    // Payment method: GCash
    const gcashBtn = page.locator('button', { hasText: /GCash/i }).first();
    if (await gcashBtn.count() > 0) {
      const h = await gcashBtn.evaluate((el) => el.getBoundingClientRect().height);
      console.info(`[AUDIT][P8b] GCash button height: ${h.toFixed(0)}px`);
      await gcashBtn.click();
    }

    await page.screenshot({ path: ss('p8b-03-gcash-selected') });

    const confirmBtn = page.locator('button', { hasText: /Confirm Payment/i });
    await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
    await confirmBtn.click({ force: true });
    await expect(page.locator('text=/Payment Successful|Receipt/i').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: ss('p8b-04-receipt-gcash-sc') });

    const doneBtn = page.locator('button', { hasText: /^Done$|^Close$/i }).first();
    if (await doneBtn.count() > 0) await doneBtn.click();
  });

  // ── P8-C: Checkout T5 — Leftover penalty + Split bill ─────────────────────

  test('P8c Checkout T5 — leftover penalty entry + split bill', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await loginAsStaff(page);

    await page.locator(`[aria-label="Table ${T_BEEF}"]`).click({ force: true });
    await page.waitForTimeout(1000);

    const addItemModal = page.locator('h2', { hasText: 'Add to Order' });
    if (await addItemModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.locator('button', { hasText: 'CHARGE' }).click();
      await page.waitForTimeout(500);
      await page.locator(`[aria-label="Table ${T_BEEF}"]`).click({ force: true });
      await page.waitForTimeout(500);
    }

    const checkoutBtn = page.locator('button', { hasText: 'Checkout' });
    if (!await checkoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.info('[AUDIT][P8c] Checkout button not visible for T5');
      await page.screenshot({ path: ss('p8c-01-no-checkout') });
      return;
    }

    // ── Leftover Penalty ──
    const splitBillBtn = page.locator('button', { hasText: /Split Bill|Split/i }).first();
    if (await splitBillBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // If split bill is accessible from sidebar BEFORE checkout, test it here
      await page.screenshot({ path: ss('p8c-01-split-bill-button-visible') });
      await splitBillBtn.click();
      await page.waitForTimeout(500);
      const splitModal = page.locator('h2, h3', { hasText: /Split/i }).first();
      if (await splitModal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await page.screenshot({ path: ss('p8c-02-split-bill-modal') });
        await auditButtonHeights(page, { title: 'P8c Split Bill modal' });
        console.info('[AUDIT][P8c] Split Bill modal opened ✓');
        // Close split bill modal for now, proceed through checkout
        const closeBtn = page.locator('button', { hasText: /Cancel|Close|✕/i }).first();
        if (await closeBtn.count() > 0) await closeBtn.click();
      }
    }

    await checkoutBtn.click();

    // Leftover penalty modal — this time ENTER a penalty
    const leftoverModal = page.locator('h2', { hasText: /Leftover Penalty/i });
    if (await leftoverModal.isVisible({ timeout: 4000 }).catch(() => false)) {
      await page.screenshot({ path: ss('p8c-03-leftover-penalty-modal') });
      await auditButtonHeights(page, { title: 'P8c LeftoverPenaltyModal' });

      // Try to enter penalty weight/amount
      const penaltyInput = page.locator('input[type="number"], input[inputmode="decimal"]').first();
      if (await penaltyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await penaltyInput.fill('250'); // 250g leftover
        await page.screenshot({ path: ss('p8c-04-leftover-amount-entered') });
        console.info('[AUDIT][P8c] Leftover penalty input found and filled ✓');
      } else {
        console.info('[AUDIT][P8c][CONCERN] No numeric input in LeftoverPenaltyModal — may use buttons only');
        // Try numpad buttons
        const numpad = page.locator('.grid.grid-cols-3, [class*="numpad"]').first();
        if (await numpad.isVisible({ timeout: 2000 }).catch(() => false)) {
          const twoBtn = numpad.getByRole('button', { name: /^2$/ });
          const fiveBtn = numpad.getByRole('button', { name: /^5$/ });
          const zeroBtn = numpad.getByRole('button', { name: /^0$/ });
          for (const b of [twoBtn, fiveBtn, zeroBtn]) {
            if (await b.count() > 0) await b.click();
          }
          await page.screenshot({ path: ss('p8c-04-leftover-numpad') });
        }
      }

      const applyBtn = page.locator('button', { hasText: /Apply|Confirm|Add Penalty/i }).first();
      if (await applyBtn.count() > 0) {
        await applyBtn.click();
      } else {
        // Skip if can't apply
        await page.locator('button', { hasText: /Skip|No Penalty/i }).first().click();
      }
    }

    await expect(page.locator('.pos-card', { hasText: /Checkout/i }).first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: ss('p8c-05-checkout-after-leftover') });

    // Split bill from within checkout
    const splitInCheckout = page.locator('button', { hasText: /Split Bill|Split/i }).first();
    if (await splitInCheckout.isVisible({ timeout: 3000 }).catch(() => false)) {
      await splitInCheckout.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: ss('p8c-06-split-modal-in-checkout') });
      await auditButtonHeights(page, { title: 'P8c Split modal in checkout' });
      const cancelSplit = page.locator('button', { hasText: /Cancel|Close|Back/i }).first();
      if (await cancelSplit.count() > 0) await cancelSplit.click();
    } else {
      console.info('[AUDIT][P8c][CONCERN] No Split Bill option visible inside CheckoutModal');
    }

    // Complete payment (Cash, exact)
    const cashBtn = page.locator('button', { hasText: /^Cash$/i }).first();
    if (await cashBtn.count() > 0) await cashBtn.click();
    const exactBtn = page.locator('button', { hasText: /Exact/i }).first();
    if (await exactBtn.count() > 0) await exactBtn.click();

    const confirmBtn = page.locator('button', { hasText: /Confirm Payment/i });
    await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
    await confirmBtn.click({ force: true });
    await expect(page.locator('text=/Payment Successful|Receipt/i').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: ss('p8c-07-receipt-after-leftover') });

    const doneBtn = page.locator('button', { hasText: /^Done$|^Close$/i }).first();
    if (await doneBtn.count() > 0) await doneBtn.click();
    await page.screenshot({ path: ss('p8c-08-floor-final') });
  });

  // ── P8-D: Close takeout ───────────────────────────────────────────────────

  test('P8d Close takeout — takeout queue + checkout flow', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await loginAsStaff(page);

    await page.screenshot({ path: ss('p8d-01-floor-with-takeout-queue') });

    // Find the Takeout queue panel / button
    const takeoutQueueBtn = page.locator('button, [role="tab"]', { hasText: /Takeout|Takeouts/i }).first();
    if (await takeoutQueueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await takeoutQueueBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: ss('p8d-02-takeout-queue-panel') });
      await auditButtonHeights(page, { title: 'P8d Takeout queue' });

      // Click on first takeout order
      const takeoutCard = page.locator('[class*="card"], .pos-card', { hasText: /Audit Takeout|Takeout/i }).first();
      if (await takeoutCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await takeoutCard.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: ss('p8d-03-takeout-order-selected') });

        const checkoutBtn = page.locator('button', { hasText: 'Checkout' });
        if (await checkoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await checkoutBtn.click();
          const leftoverModal = page.locator('h2', { hasText: /Leftover Penalty/i });
          if (await leftoverModal.isVisible({ timeout: 3000 }).catch(() => false)) {
            await page.locator('button', { hasText: /Skip|No Penalty/i }).first().click();
          }
          await expect(page.locator('.pos-card', { hasText: /Checkout/i }).first()).toBeVisible({ timeout: 8000 });
          await page.screenshot({ path: ss('p8d-04-takeout-checkout-modal') });

          const cashBtn = page.locator('button', { hasText: /^Cash$/i }).first();
          if (await cashBtn.count() > 0) await cashBtn.click();
          const exactBtn = page.locator('button', { hasText: /Exact/i }).first();
          if (await exactBtn.count() > 0) await exactBtn.click();

          const confirmBtn = page.locator('button', { hasText: /Confirm Payment/i });
          if (await confirmBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
            await confirmBtn.click({ force: true });
            await expect(page.locator('text=/Payment Successful|Receipt/i').first()).toBeVisible({ timeout: 10000 });
            await page.screenshot({ path: ss('p8d-05-takeout-receipt') });
            const doneBtn = page.locator('button', { hasText: /^Done$|^Close$/i }).first();
            if (await doneBtn.count() > 0) await doneBtn.click();
          }
        }
      } else {
        console.info('[AUDIT][P8d] No takeout order card found — takeout may not have been created in P1');
        await page.screenshot({ path: ss('p8d-02-no-takeout-orders') });
      }
    } else {
      console.info('[AUDIT][P8d] No Takeout queue tab/button visible on POS floor');
      await page.screenshot({ path: ss('p8d-01-no-takeout-queue') });
    }

    // Final floor screenshot — all tables should be closed
    await page.screenshot({ path: ss('p8d-06-floor-final-all-closed') });
    console.info('[AUDIT] === Full multi-user scenario complete. Check e2e/screenshots/ux-audit-multiuser-tag/ ===');
  });
});
