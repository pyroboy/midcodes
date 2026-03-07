import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// 15 seconds max per test
test.setTimeout(15_000);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsOwner(page: Page) {
  await page.goto('/');
  await page.locator('#username').fill('chris');
  await page.locator('#password').fill('chris');
  await page.locator('button', { hasText: 'LOGIN' }).click();
  await page.waitForURL('**/pos', { timeout: 5000 });
  await expect(
    page.locator('text=/Alta Citta|Tagbilaran|Alona Beach|Panglao/i').first()
  ).toBeVisible({ timeout: 5000 });
}

async function goToFloorEditor(page: Page) {
  await page.goto('/admin/floor-editor');
  await expect(page.locator('button', { hasText: '+ Table' })).toBeVisible({ timeout: 5000 });
}

/** Switch owner to a specific branch via the LocationBanner modal */
async function switchToBranch(page: Page, branchName: RegExp) {
  await page.locator('button', { hasText: 'Change Location' }).click();
  await expect(page.locator('h2', { hasText: 'Select Your Work Location' })).toBeVisible({ timeout: 3000 });
  await page.locator('button', { hasText: branchName }).first().click();
  await page.waitForTimeout(500);
}

/** Switch owner to "All Locations" view */
async function switchToAll(page: Page) {
  await page.locator('button', { hasText: 'Change Location' }).click();
  await expect(page.locator('h2', { hasText: 'Select Your Work Location' })).toBeVisible({ timeout: 3000 });
  await page.locator('button', { hasText: /All Locations/i }).first().click();
  await page.waitForTimeout(500);
}

const SVG = '[aria-label="Floor editor canvas"] svg';

/** Click a table label in the editor SVG (force due to pointer-events:none on text). */
async function clickTable(page: Page, label: string) {
  await page.locator(`${SVG} text`, { hasText: label }).first().click({ force: true });
}

/** Open the element dropdown and click a type. */
async function addElement(page: Page, typeName: string) {
  await page.locator('button', { hasText: '+ Element' }).click();
  const dropdown = page.locator('.shadow-xl.py-1');
  await expect(dropdown).toBeVisible({ timeout: 2000 });
  await dropdown.locator('button', { hasText: typeName }).click();
}

// ─── Setup: Apply chairs + element + border width, then save ─────────────────

test.describe('All Locations View — Chairs, Elements, Border Width', () => {
  test('setup: add chairs to T1, an element, set border width, and save', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await page.locator('button', { hasText: /Alta Citta/i }).click();
    await page.waitForTimeout(400);

    // ── Set chairs on T1 ──
    await clickTable(page, 'T1');
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });

    // Set border width to 3px
    await expect(page.locator('text=/Border Width/')).toBeVisible();

    await page.locator('button', { hasText: 'Edit Chairs' }).click();
    await expect(page.locator('h2', { hasText: /Chair Editor/ })).toBeVisible({ timeout: 2000 });

    // Set left side to Lounge
    await page.locator('button', { hasText: 'left' }).click();
    const modal = page.locator('.bg-white.rounded-2xl');
    await modal.locator('button', { hasText: 'Lounge' }).first().click();

    await page.locator('button', { hasText: 'Apply Chairs' }).click();
    await expect(page.locator('h2', { hasText: /Chair Editor/ })).not.toBeVisible();

    // ── Add an Entrance element with a unique label ──
    const elLabel = `ALLVIEW-${Date.now().toString(36)}`;
    await addElement(page, 'Entrance');
    await expect(page.locator('text=Element Selected')).toBeVisible({ timeout: 2000 });
    await page.locator('label:has-text("Label") input').first().fill(elLabel);

    // ── Save floor ──
    await page.locator('button', { hasText: 'Save Floor' }).click();
    await expect(page.locator('text=Unsaved')).not.toBeVisible({ timeout: 3000 });

    // ── Navigate to POS — All locations view (owner default) ──
    await page.goto('/pos');
    await page.waitForTimeout(500);

    // Owner starts at 'all' — should see AllBranchesDashboard
    await expect(page.locator('text=ALL BRANCHES')).toBeVisible({ timeout: 5000 });

    // ── Verify chairs show on T1 in the all-branches view ──
    // The AllBranchesDashboard renders each branch in its own SVG.
    // Find the Alta Citta panel SVG. It contains T1 and chair rects.
    const altaCittaSvg = page.locator('svg').filter({ hasText: 'T1' }).first();
    await expect(altaCittaSvg).toBeVisible({ timeout: 3000 });

    // T1 should have more than just the table rect — chair rects are additional <rect> siblings
    const t1Rects = altaCittaSvg.locator('rect');
    const rectCount = await t1Rects.count();
    // Canvas bg (2 rects) + at least 1 table rect + chair rects = > 3
    expect(rectCount).toBeGreaterThan(3);

    // ── Verify element label appears (non-white text) ──
    const elText = altaCittaSvg.locator('text', { hasText: elLabel });
    await expect(elText).toBeVisible({ timeout: 3000 });
    // Element text should NOT be white (#ffffff)
    const fill = await elText.getAttribute('fill');
    expect(fill).not.toBe('#ffffff');
    expect(fill).not.toBe('white');

    // ── Verify element uses dashed lines ──
    // Elements are rendered as <rect> with stroke-dasharray
    const dashedRects = altaCittaSvg.locator('rect[stroke-dasharray]');
    const dashedCount = await dashedRects.count();
    expect(dashedCount).toBeGreaterThan(0);
  });
});

// ─── Element text color is not white on POS branch view ──────────────────────

test.describe('POS Branch View — Element Text Not White', () => {
  test('element label text fill is not white on POS floor plan', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await page.locator('button', { hasText: /Alta Citta/i }).click();
    await page.waitForTimeout(400);

    // Add element with known label
    const elLabel = `COLOR-${Date.now().toString(36)}`;
    await addElement(page, 'Kitchen');
    await expect(page.locator('text=Element Selected')).toBeVisible({ timeout: 2000 });
    await page.locator('label:has-text("Label") input').first().fill(elLabel);

    await page.locator('button', { hasText: 'Save Floor' }).click();
    await expect(page.locator('text=Unsaved')).not.toBeVisible({ timeout: 3000 });

    // Go to POS branch view
    await page.goto('/pos');
    await switchToBranch(page, /Alta Citta|Tagbilaran/i);

    const posFloor = page.locator('.rounded-xl.border svg');
    const elText = posFloor.locator('text', { hasText: elLabel });
    await expect(elText).toBeVisible({ timeout: 5000 });

    const fill = await elText.getAttribute('fill');
    expect(fill).not.toBe('#ffffff');
    expect(fill).not.toBe('white');
  });
});

// ─── Elements use dashed lines on POS branch view ────────────────────────────

test.describe('POS Branch View — Elements Use Dashed Lines', () => {
  test('floor elements render with stroke-dasharray on POS floor plan', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await page.locator('button', { hasText: /Alta Citta/i }).click();
    await page.waitForTimeout(400);

    const elLabel = `DASH-${Date.now().toString(36)}`;
    await addElement(page, 'Bar');
    await expect(page.locator('text=Element Selected')).toBeVisible({ timeout: 2000 });
    await page.locator('label:has-text("Label") input').first().fill(elLabel);

    await page.locator('button', { hasText: 'Save Floor' }).click();
    await expect(page.locator('text=Unsaved')).not.toBeVisible({ timeout: 3000 });

    await page.goto('/pos');
    await switchToBranch(page, /Alta Citta|Tagbilaran/i);

    const posFloor = page.locator('.rounded-xl.border svg');
    // There should be at least one dashed rect (floor element)
    const dashed = posFloor.locator('rect[stroke-dasharray]');
    const count = await dashed.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ─── Elements use dashed lines in the floor editor ───────────────────────────

test.describe('Floor Editor — Elements Render Dashed', () => {
  test('added element has stroke-dasharray in editor SVG', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);

    await addElement(page, 'Wall');
    await expect(page.locator('text=Element Selected')).toBeVisible({ timeout: 2000 });

    // The element rect in the editor SVG should have stroke-dasharray
    const editorSvg = page.locator(`${SVG}`);
    const dashedRects = editorSvg.locator('rect[stroke-dasharray]');
    // At least the element rect + its selection ring
    const count = await dashedRects.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

// ─── Border Width — visible in inspector and affects rendering ───────────────

test.describe('Floor Editor — Border Width Control', () => {
  test('table inspector shows Border Width slider', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);

    await clickTable(page, 'T1');
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });

    await expect(page.locator('text=/Border Width/')).toBeVisible();
    // The slider input should be present
    const slider = page.locator('input[type="range"][max="6"]');
    await expect(slider).toBeVisible();
  });

  test('changing border width marks dirty', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);

    await clickTable(page, 'T1');
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });

    const slider = page.locator('input[type="range"][max="6"]');
    await slider.fill('4');
    await expect(page.locator('text=Unsaved')).toBeVisible({ timeout: 2000 });
  });

  test('saved border width propagates to POS', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await page.locator('button', { hasText: /Alta Citta/i }).click();
    await page.waitForTimeout(400);

    await clickTable(page, 'T1');
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });

    // Set border width to 4
    const slider = page.locator('input[type="range"][max="6"]');
    await slider.fill('4');

    await page.locator('button', { hasText: 'Save Floor' }).click();
    await expect(page.locator('text=Unsaved')).not.toBeVisible({ timeout: 3000 });

    // Verify on POS
    await page.goto('/pos');
    await switchToBranch(page, /Alta Citta|Tagbilaran/i);

    const t1 = page.locator('[aria-label="Table T1"]');
    await expect(t1).toBeVisible({ timeout: 5000 });

    // The table body rect should have stroke-width="4"
    const bodyRect = t1.locator('rect').first();
    // Note: the first rect might be a chair — find the main table rect
    // The table body rect has fill attribute set (not "none")
    const rects = t1.locator('rect');
    const count = await rects.count();
    let foundBorderWidth = false;
    for (let i = 0; i < count; i++) {
      const sw = await rects.nth(i).getAttribute('stroke-width');
      if (sw === '4') {
        foundBorderWidth = true;
        break;
      }
    }
    expect(foundBorderWidth).toBe(true);
  });
});

// ─── Chairs visible in All Locations dashboard ──────────────────────────────

test.describe('All Locations — Chairs Render', () => {
  test('chairs on T1 are visible as extra rects in the all-branches SVG', async ({ page }) => {
    await loginAsOwner(page);

    // First ensure T1 has chairs (set in floor editor)
    await goToFloorEditor(page);
    await page.locator('button', { hasText: /Alta Citta/i }).click();
    await page.waitForTimeout(400);

    await clickTable(page, 'T1');
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });

    await page.locator('button', { hasText: 'Edit Chairs' }).click();
    await expect(page.locator('h2', { hasText: /Chair Editor/ })).toBeVisible({ timeout: 2000 });

    // Ensure top = Individual (default)
    await page.locator('button', { hasText: 'top' }).click();
    const modal = page.locator('.bg-white.rounded-2xl');
    await modal.locator('button', { hasText: 'Individual' }).first().click();

    await page.locator('button', { hasText: 'Apply Chairs' }).click();
    await expect(page.locator('h2', { hasText: /Chair Editor/ })).not.toBeVisible();

    await page.locator('button', { hasText: 'Save Floor' }).click();
    await expect(page.locator('text=Unsaved')).not.toBeVisible({ timeout: 3000 });

    // Go to POS all-locations view
    await page.goto('/pos');
    await page.waitForTimeout(500);

    // Owner is at 'all' — sees AllBranchesDashboard
    await expect(page.locator('text=ALL BRANCHES')).toBeVisible({ timeout: 5000 });

    // Find the Alta Citta SVG panel (contains T1)
    const altaSvg = page.locator('svg').filter({ hasText: 'T1' }).first();
    await expect(altaSvg).toBeVisible({ timeout: 3000 });

    // Count all rects. With chairs, there should be more rects than just canvas (2) + tables.
    // Without chairs: canvas bg rect + canvas border rect + N table rects
    // With chairs: + chair rects per table that has chairConfig
    const allRects = altaSvg.locator('rect');
    const rectCount = await allRects.count();
    // At minimum: 2 canvas rects + 1 table rect + 2 chair rects = 5
    expect(rectCount).toBeGreaterThanOrEqual(5);
  });
});
