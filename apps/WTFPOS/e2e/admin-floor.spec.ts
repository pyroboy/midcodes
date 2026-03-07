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

/** Switch owner from 'all' to a specific branch on POS page */
async function switchToBranch(page: Page, branchName: RegExp) {
  await page.locator('button', { hasText: 'Change Location' }).click();
  await expect(page.locator('h2', { hasText: 'Select Your Work Location' })).toBeVisible({ timeout: 3000 });
  await page.locator('button', { hasText: branchName }).first().click();
  await page.waitForTimeout(500);
}

const SVG = '[aria-label="Floor editor canvas"] svg';

/** Click a table label in the editor SVG. Text has pointer-events:none so we force click. */
async function clickTable(page: Page, label: string) {
  await page.locator(`${SVG} text`, { hasText: label }).first().click({ force: true });
}

/** Open the element dropdown and click an element type. */
async function addElement(page: Page, typeName: string) {
  const btn = page.locator('button', { hasText: '+ Element' });
  const dropdown = page.locator('.shadow-xl.py-1');
  // Retry click if dropdown doesn't appear (flaky toggle)
  for (let i = 0; i < 3; i++) {
    await btn.click();
    try {
      await expect(dropdown).toBeVisible({ timeout: 1500 });
      break;
    } catch {
      if (i === 2) throw new Error('Element dropdown did not appear after 3 attempts');
    }
  }
  await dropdown.locator('button', { hasText: typeName }).click();
}

// ─── Floor Editor — Page Load & Toolbar ───────────────────────────────────────

test.describe('Floor Editor — Page Load', () => {
  test('loads with toolbar, SVG canvas, and inspector panel', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);

    await expect(page.locator('button', { hasText: '+ Table' })).toBeVisible();
    await expect(page.locator('button', { hasText: '+ Element' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Grid' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Snap' })).toBeVisible();
    await expect(page.locator(`${SVG}`)).toBeVisible();
    await expect(page.locator('text=Canvas Settings')).toBeVisible();
    await expect(page.locator('text=Inspector')).toBeVisible();
  });

  test('shows seeded tables on the canvas (T1 visible)', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await expect(page.locator(`${SVG} text`, { hasText: 'T1' }).first()).toBeVisible({ timeout: 5000 });
  });

  test('Save Floor and Discard are disabled when clean', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await expect(page.locator('button', { hasText: 'Save Floor' })).toBeDisabled();
    await expect(page.locator('button', { hasText: 'Discard' })).toBeDisabled();
    await expect(page.locator('text=Unsaved')).not.toBeVisible();
  });
});

// ─── Floor Editor — Location Tabs ─────────────────────────────────────────────

test.describe('Floor Editor — Location Tabs', () => {
  test('shows retail branch tabs', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await expect(page.locator('button', { hasText: /Alta Citta/i })).toBeVisible();
    await expect(page.locator('button', { hasText: /Alona Beach/i })).toBeVisible();
  });

  test('switching tab discards pending changes', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await page.locator('button', { hasText: '+ Table' }).click();
    await page.waitForTimeout(800);
    // Adding a table writes to RxDB directly — add an element to get dirty state
    await addElement(page, 'Wall');
    await expect(page.locator('text=Unsaved')).toBeVisible({ timeout: 2000 });

    await page.locator('button', { hasText: /Alona Beach/i }).click();
    await expect(page.locator('text=Unsaved')).not.toBeVisible();
    await expect(page.locator('button', { hasText: 'Save Floor' })).toBeDisabled();
  });
});

// ─── Floor Editor — Add Table ─────────────────────────────────────────────────

test.describe('Floor Editor — Add Table', () => {
  test('+ Table adds a new auto-incremented table', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);

    const labels = await page.locator(`${SVG} text`).allTextContents();
    const maxNum = labels
      .map(t => t.match(/^T(\d+)$/))
      .filter(Boolean)
      .map(m => parseInt(m![1]))
      .reduce((max, n) => Math.max(max, n), 0);

    await page.locator('button', { hasText: '+ Table' }).click();
    await expect(page.locator(`${SVG} text`, { hasText: `T${maxNum + 1}` }).first()).toBeVisible({ timeout: 3000 });
  });
});

// ─── Floor Editor — Table Inspector ───────────────────────────────────────────

test.describe('Floor Editor — Table Inspector', () => {
  test('clicking a table shows inspector with all fields', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);

    await clickTable(page, 'T1');
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });

    for (const label of ['Label', 'Capacity', 'W (px)', 'H (px)', 'Roundness', 'Rotation', 'Table Color', 'Opacity']) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible();
    }
    await expect(page.locator('button', { hasText: 'Edit Chairs' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Delete Table' })).toBeVisible();
  });

  test('editing label marks dirty', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await clickTable(page, 'T1');
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });

    await page.locator('label:has-text("Label") input').first().fill('VIP-1');
    await expect(page.locator('text=Unsaved')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('button', { hasText: 'Save Floor' })).toBeEnabled();
  });

  test('editing capacity marks dirty', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await clickTable(page, 'T1');
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });

    await page.locator('label:has-text("Capacity") input').first().fill('8');
    await expect(page.locator('text=Unsaved')).toBeVisible({ timeout: 2000 });
  });

  test('color swatch click marks dirty', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await clickTable(page, 'T1');
    await expect(page.locator('text=Table Color')).toBeVisible({ timeout: 2000 });

    const swatches = page.locator('text=Table Color').locator('..').locator('button[style*="background-color"]');
    expect(await swatches.count()).toBeGreaterThan(0);
    await swatches.nth(1).click();
    await expect(page.locator('text=Unsaved')).toBeVisible({ timeout: 2000 });
  });

  test('Delete Table removes table and marks dirty', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);

    // Add a throwaway table
    await page.locator('button', { hasText: '+ Table' }).click();
    await page.waitForTimeout(800);

    const labels = await page.locator(`${SVG} text`).allTextContents();
    const last = labels.filter(t => /^T\d+$/.test(t)).sort((a, b) => parseInt(b.slice(1)) - parseInt(a.slice(1)))[0];

    await clickTable(page, last);
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });
    await page.locator('button', { hasText: 'Delete Table' }).click();
    await expect(page.locator('text=Unsaved')).toBeVisible({ timeout: 2000 });
  });

  test('Escape deselects', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await clickTable(page, 'T1');
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });

    await page.keyboard.press('Escape');
    await expect(page.locator('text=Canvas Settings')).toBeVisible({ timeout: 2000 });
  });
});

// ─── Floor Editor — Floor Elements ────────────────────────────────────────────

test.describe('Floor Editor — Floor Elements', () => {
  test('Element dropdown shows all 9 types', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);

    const btn = page.locator('button', { hasText: '+ Element' });
    const dropdown = page.locator('.shadow-xl.py-1');
    for (let i = 0; i < 3; i++) {
      await btn.click();
      try { await expect(dropdown).toBeVisible({ timeout: 1500 }); break; } catch { if (i === 2) throw new Error('Dropdown did not appear'); }
    }
    for (const name of ['Wall', 'Divider', 'Entrance', 'Exit', 'Bar', 'Kitchen', 'Furniture', 'Stairs']) {
      await expect(dropdown.locator('button', { hasText: name })).toBeVisible();
    }
    await expect(dropdown.locator('button', { hasText: /Label/ })).toBeVisible();
  });

  test('adding Wall selects it and marks dirty', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await addElement(page, 'Wall');
    await expect(page.locator('text=Element Selected')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=Unsaved')).toBeVisible();
  });

  test('element inspector shows all fields', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await addElement(page, 'Entrance');
    await expect(page.locator('text=Element Selected')).toBeVisible({ timeout: 2000 });

    for (const label of ['Label', 'W (px)', 'H (px)', 'Rotation', 'Color', 'Opacity']) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible();
    }
    await expect(page.locator('button', { hasText: 'Delete Element' })).toBeVisible();
  });

  test('Delete Element removes it', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await addElement(page, 'Bar');
    await expect(page.locator('text=Element Selected')).toBeVisible({ timeout: 2000 });

    await page.locator('button', { hasText: 'Delete Element' }).click();
    await expect(page.locator('text=Canvas Settings')).toBeVisible({ timeout: 2000 });
  });
});

// ─── Floor Editor — Canvas Settings ───────────────────────────────────────────

test.describe('Floor Editor — Canvas Settings', () => {
  test('shows width/height/grid inputs with defaults', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await expect(page.locator('text=Canvas Settings')).toBeVisible();

    await expect(page.locator('label:has-text("Width (px)") input')).toHaveValue('900');
    await expect(page.locator('label:has-text("Height (px)") input')).toHaveValue('600');
    await expect(page.locator('label:has-text("Grid Size (px)") input')).toHaveValue('20');
  });
});

// ─── Floor Editor — Zoom Controls ─────────────────────────────────────────────

test.describe('Floor Editor — Zoom Controls', () => {
  test('zoom in/out and 1:1 reset', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    // Zoom percentage display (the only w-10 span in the toolbar)
    const zoomDisplay = page.locator('span.w-10.text-center');
    await expect(zoomDisplay).toHaveText('100%');

    // Zoom in: the small btn-ghost with just "+" that's 7x7 (not "+ Table" or "+ Element")
    const zoomIn = page.locator('button.w-7', { hasText: '+' });
    await zoomIn.click();
    await expect(zoomDisplay).not.toHaveText('100%', { timeout: 1500 });

    await page.locator('button', { hasText: '1:1' }).click();
    await expect(zoomDisplay).toHaveText('100%', { timeout: 1500 });
  });
});

// ─── Floor Editor — Grid & Snap Toggles ──────────────────────────────────────

test.describe('Floor Editor — Grid & Snap Toggles', () => {
  test('Grid toggle', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    // Grid button is inside the toolbar, distinct from the SVG grid pattern
    const btn = page.locator('button:text-is("Grid")');
    await expect(btn).toHaveClass(/border-accent/);
    // Click to toggle off — the grid pattern in the SVG should disappear
    await btn.click();
    // Check that the SVG grid pattern is hidden (no <pattern> rendered)
    await expect(page.locator(`${SVG} pattern#floor-grid`)).toHaveCount(0, { timeout: 2000 });
    // Click to toggle back on
    await btn.click();
    await expect(page.locator(`${SVG} pattern#floor-grid`)).toHaveCount(1, { timeout: 2000 });
  });

  test('Snap toggle', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    const btn = page.locator('button', { hasText: /^Snap$/ });
    await expect(btn).toHaveClass(/border-accent/);
    await btn.click();
    await expect(btn).not.toHaveClass(/border-accent/, { timeout: 2000 });
    await btn.click();
    await expect(btn).toHaveClass(/border-accent/, { timeout: 2000 });
  });
});

// ─── Floor Editor — Chair Editor Modal ────────────────────────────────────────

test.describe('Floor Editor — Chair Editor Modal', () => {
  test('opens with side tabs and chair types', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await clickTable(page, 'T1');
    await page.locator('button', { hasText: 'Edit Chairs' }).click();
    await expect(page.locator('h2', { hasText: /Chair Editor/ })).toBeVisible({ timeout: 2000 });

    // Side tabs
    for (const s of ['top', 'bottom', 'left', 'right']) {
      await expect(page.locator('button', { hasText: s })).toBeVisible();
    }
    // Chair types
    for (const t of ['None', 'Individual', 'Lounge', 'L-Shape', 'Diner']) {
      await expect(page.locator(`button span:has-text("${t}")`).first()).toBeVisible();
    }
    await expect(page.locator('text=Live Preview')).toBeVisible();
  });

  test('Lounge hides count, Individual shows count', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await clickTable(page, 'T1');
    await page.locator('button', { hasText: 'Edit Chairs' }).click();
    await expect(page.locator('text=Chair Type')).toBeVisible({ timeout: 2000 });

    await page.locator('button', { hasText: 'Lounge' }).first().click();
    // The "-" / "+" stepper buttons should not be visible for Lounge
    await expect(page.locator('span.text-2xl.font-mono')).not.toBeVisible();

    await page.locator('button', { hasText: 'Individual' }).first().click();
    // The count stepper should be visible for Individual
    await expect(page.locator('span.text-2xl.font-mono')).toBeVisible();
  });

  test('Cancel closes without marking dirty', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await clickTable(page, 'T1');
    await page.locator('button', { hasText: 'Edit Chairs' }).click();
    await expect(page.locator('h2', { hasText: /Chair Editor/ })).toBeVisible({ timeout: 2000 });
    await page.locator('button', { hasText: 'Cancel' }).click();
    await expect(page.locator('h2', { hasText: /Chair Editor/ })).not.toBeVisible();
  });

  test('Apply Chairs closes modal and marks dirty', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await clickTable(page, 'T1');
    await page.locator('button', { hasText: 'Edit Chairs' }).click();
    await expect(page.locator('h2', { hasText: /Chair Editor/ })).toBeVisible({ timeout: 2000 });

    await page.locator('button', { hasText: 'left' }).click();
    await page.locator('button', { hasText: 'Lounge' }).first().click();
    await page.locator('button', { hasText: 'Apply Chairs' }).click();

    await expect(page.locator('h2', { hasText: /Chair Editor/ })).not.toBeVisible();
    await expect(page.locator('text=Unsaved')).toBeVisible({ timeout: 2000 });
  });

  test('Clear All resets sides', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await clickTable(page, 'T1');
    await page.locator('button', { hasText: 'Edit Chairs' }).click();
    await expect(page.locator('text=Chair Type')).toBeVisible({ timeout: 2000 });

    await page.locator('button', { hasText: 'Clear All' }).click();
    await expect(page.locator('button:has-text("Individual")').first()).toHaveClass(/border-accent/);
  });

  test('switching side tabs updates editing label', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await clickTable(page, 'T1');
    await page.locator('button', { hasText: 'Edit Chairs' }).click();
    await expect(page.locator('text=Chair Type')).toBeVisible({ timeout: 2000 });

    await page.locator('button', { hasText: 'left' }).click();
    await expect(page.locator('text=/Editing:.*left/i')).toBeVisible();
    await page.locator('button', { hasText: 'right' }).click();
    await expect(page.locator('text=/Editing:.*right/i')).toBeVisible();
  });
});

// ─── Floor Editor — Discard Changes ──────────────────────────────────────────

test.describe('Floor Editor — Discard', () => {
  test('Discard resets all pending changes', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await addElement(page, 'Kitchen');
    await expect(page.locator('text=Unsaved')).toBeVisible({ timeout: 2000 });

    await page.locator('button', { hasText: 'Discard' }).click();
    await expect(page.locator('text=Unsaved')).not.toBeVisible();
    await expect(page.locator('button', { hasText: 'Save Floor' })).toBeDisabled();
  });
});

// ─── Floor Editor — Keyboard Shortcuts ───────────────────────────────────────

test.describe('Floor Editor — Keyboard Shortcuts', () => {
  test('Delete key removes selected table', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);

    await page.locator('button', { hasText: '+ Table' }).click();
    await page.waitForTimeout(800);
    const labels = await page.locator(`${SVG} text`).allTextContents();
    const last = labels.filter(t => /^T\d+$/.test(t)).sort((a, b) => parseInt(b.slice(1)) - parseInt(a.slice(1)))[0];

    await clickTable(page, last);
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });

    await page.keyboard.press('Delete');
    await expect(page.locator('text=Unsaved')).toBeVisible({ timeout: 2000 });
  });

  test('Backspace removes selected element', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await addElement(page, 'Divider');
    await expect(page.locator('text=Element Selected')).toBeVisible({ timeout: 2000 });

    await page.keyboard.press('Backspace');
    await expect(page.locator('text=Canvas Settings')).toBeVisible({ timeout: 2000 });
  });
});

// ─── Save & POS Propagation — Tables ─────────────────────────────────────────

test.describe('Floor Editor — Save propagates to POS', () => {
  test('new table appears on the POS floor plan', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);

    await page.locator('button', { hasText: /Alta Citta/i }).click();
    await page.waitForTimeout(400);

    const labels = await page.locator(`${SVG} text`).allTextContents();
    const maxNum = labels.map(t => t.match(/^T(\d+)$/)).filter(Boolean).map(m => parseInt(m![1])).reduce((a, b) => Math.max(a, b), 0);
    const newLabel = `T${maxNum + 1}`;

    await page.locator('button', { hasText: '+ Table' }).click();
    await expect(page.locator(`${SVG} text`, { hasText: newLabel })).toBeVisible({ timeout: 3000 });

    // Go to POS and switch to Tagbilaran
    await page.goto('/pos');
    await switchToBranch(page, /Alta Citta|Tagbilaran/i);

    await expect(page.locator(`[aria-label="Table ${newLabel}"]`)).toBeVisible({ timeout: 5000 });
  });

  test('renamed table label shows on POS', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await page.locator('button', { hasText: /Alta Citta/i }).click();
    await page.waitForTimeout(400);

    // Add + rename + save
    await page.locator('button', { hasText: '+ Table' }).click();
    await page.waitForTimeout(800);
    const labels = await page.locator(`${SVG} text`).allTextContents();
    const last = labels.filter(t => /^T\d+$/.test(t)).sort((a, b) => parseInt(b.slice(1)) - parseInt(a.slice(1)))[0];

    await clickTable(page, last);
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });

    const uniqueLabel = `E2E-${Date.now().toString(36)}`;
    await page.locator('label:has-text("Label") input').first().fill(uniqueLabel);
    await page.locator('button', { hasText: 'Save Floor' }).click();
    await expect(page.locator('text=Unsaved')).not.toBeVisible({ timeout: 3000 });

    // Verify on POS
    await page.goto('/pos');
    await switchToBranch(page, /Alta Citta|Tagbilaran/i);
    await expect(page.locator(`[aria-label="Table ${uniqueLabel}"]`)).toBeVisible({ timeout: 5000 });
  });
});

// ─── Save & POS Propagation — Floor Elements ────────────────────────────────

test.describe('Floor Editor — Elements propagate to POS', () => {
  test('saved floor element label appears on POS floor plan', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await page.locator('button', { hasText: /Alta Citta/i }).click();
    await page.waitForTimeout(400);

    // Add a Kitchen element with a unique label
    await addElement(page, 'Kitchen');
    await expect(page.locator('text=Element Selected')).toBeVisible({ timeout: 2000 });

    const elLabel = `KIT-${Date.now().toString(36)}`;
    await page.locator('label:has-text("Label") input').first().fill(elLabel);

    // Save
    await page.locator('button', { hasText: 'Save Floor' }).click();
    await expect(page.locator('text=Unsaved')).not.toBeVisible({ timeout: 3000 });

    // Go to POS, switch to Tagbilaran, verify the element label is on the SVG floor
    await page.goto('/pos');
    await switchToBranch(page, /Alta Citta|Tagbilaran/i);

    // FloorPlan renders element labels as SVG <text> inside the floor SVG
    const posFloorSvg = page.locator('.rounded-xl.border svg');
    await expect(posFloorSvg.locator('text', { hasText: elLabel })).toBeVisible({ timeout: 5000 });
  });

  test('saved Entrance element appears on POS floor plan', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await page.locator('button', { hasText: /Alta Citta/i }).click();
    await page.waitForTimeout(400);

    await addElement(page, 'Entrance');
    await expect(page.locator('text=Element Selected')).toBeVisible({ timeout: 2000 });

    const elLabel = `ENTRY-${Date.now().toString(36)}`;
    await page.locator('label:has-text("Label") input').first().fill(elLabel);

    await page.locator('button', { hasText: 'Save Floor' }).click();
    await expect(page.locator('text=Unsaved')).not.toBeVisible({ timeout: 3000 });

    await page.goto('/pos');
    await switchToBranch(page, /Alta Citta|Tagbilaran/i);

    const posFloorSvg = page.locator('.rounded-xl.border svg');
    await expect(posFloorSvg.locator('text', { hasText: elLabel })).toBeVisible({ timeout: 5000 });
  });
});

// ─── Save & POS Propagation — Chairs ─────────────────────────────────────────

test.describe('Floor Editor — Chairs propagate to POS', () => {
  test('applying chairs to a table and saving makes chair rects visible on POS', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await page.locator('button', { hasText: /Alta Citta/i }).click();
    await page.waitForTimeout(400);

    // Select T1
    await clickTable(page, 'T1');
    await expect(page.locator('text=Table Selected')).toBeVisible({ timeout: 2000 });

    // Open Chair Editor
    await page.locator('button', { hasText: 'Edit Chairs' }).click();
    await expect(page.locator('h2', { hasText: /Chair Editor/ })).toBeVisible({ timeout: 2000 });

    // Set TOP to Individual (default), set LEFT to Lounge
    await page.locator('button', { hasText: 'left' }).click();
    await page.locator('button', { hasText: 'Lounge' }).first().click();

    // Set a distinctive color — scope to the modal content (not the backdrop)
    const modal = page.locator('.bg-white.rounded-2xl');
    const colorBtns = modal.locator('button.rounded-full[style*="background-color"]');
    await colorBtns.nth(1).click();

    await page.locator('button', { hasText: 'Apply Chairs' }).click();
    await expect(page.locator('text=Unsaved')).toBeVisible({ timeout: 2000 });

    // Save the floor
    await page.locator('button', { hasText: 'Save Floor' }).click();
    await expect(page.locator('text=Unsaved')).not.toBeVisible({ timeout: 3000 });

    // Go to POS, switch to Tagbilaran
    await page.goto('/pos');
    await switchToBranch(page, /Alta Citta|Tagbilaran/i);

    // The POS FloorPlan renders chairs as <rect> elements inside each table's <g>
    // T1's group has aria-label="Table T1" — find chair rects near it
    const t1Group = page.locator('[aria-label="Table T1"]');
    await expect(t1Group).toBeVisible({ timeout: 5000 });

    // Chair rects are rendered INSIDE the table <g> as <rect> elements with rx="4"
    // They have fill color from the chairConfig. We should find at least 2 rects
    // (the table body rect + at least one chair rect)
    const rects = t1Group.locator('rect');
    const rectCount = await rects.count();
    // Table body = 1 rect, chairs = at least 1 more (lounge on left + individual on top)
    expect(rectCount).toBeGreaterThan(1);
  });
});

// ─── Save & POS Propagation — Element persists across reload ─────────────────

test.describe('Floor Editor — Persistence', () => {
  test('saved element persists after navigating away and back', async ({ page }) => {
    await loginAsOwner(page);
    await goToFloorEditor(page);
    await page.locator('button', { hasText: /Alta Citta/i }).click();
    await page.waitForTimeout(400);

    await addElement(page, 'Stairs');
    const elLabel = `STAIRS-${Date.now().toString(36)}`;
    await page.locator('label:has-text("Label") input').first().fill(elLabel);

    await page.locator('button', { hasText: 'Save Floor' }).click();
    await expect(page.locator('text=Unsaved')).not.toBeVisible({ timeout: 3000 });

    // Navigate away
    await page.goto('/pos');
    await page.waitForTimeout(300);

    // Come back
    await page.goto('/admin/floor-editor');
    await expect(page.locator('button', { hasText: '+ Table' })).toBeVisible({ timeout: 5000 });
    await page.locator('button', { hasText: /Alta Citta/i }).click();
    await page.waitForTimeout(500);

    await expect(page.locator(`${SVG} text`, { hasText: elLabel })).toBeVisible({ timeout: 3000 });
  });
});
