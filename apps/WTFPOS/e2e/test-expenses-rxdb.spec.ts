import { test, expect } from '@playwright/test';

test.describe('RxDB Expenses Store Migration', () => {
    test('should allow adding expenses and persisting them to the database', async ({ page }) => {
        // Log console messages
        page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()} - ${msg.text()}`));
        page.on('pageerror', error => console.log(`BROWSER ERROR: ${error.message}`));

        // 1. Visit the expenses page
        await page.goto('/expenses');

        // Allow DB a moment to seed on first launch
        await page.waitForTimeout(1500);

        // Verify the static seated data shows up (seed.ts generated "Pork belly delivery")
        await expect(page.locator('text=Pork belly delivery')).toBeVisible();

        // 2. Add a unique new expense
        const uniqueNumber = Date.now().toString().slice(-4);
        const description = `Testing Playwright Setup ${uniqueNumber}`;
        const amount = '99.55';

        // Select Category: Utilities
        await page.selectOption('select', 'Utilities');
        
        // Fill Amount
        await page.fill('input[type="number"]', amount);
        
        // Fill Description
        await page.fill('input[type="text"]', description);
        
        // Submit
        await page.click('button:has-text("Record")');

        // 3. Verify it shows up immediately in the reactive list
        await expect(page.locator(`text=${description}`)).toBeVisible();

        // 4. Reload the page completely!
        await page.reload();
        await page.waitForTimeout(1000); // Give RxDB time to query

        // 5. Verify the newly generated expense persisted
        const expenseRow = page.locator('tr', { hasText: description });
        await expect(expenseRow).toBeVisible();

        // 6. Cleanup (delete the test expense)
        // Find the specific container holding our table, and click its delete button
        await expenseRow.locator('button:has-text("✕")').click();

        // 7. Verify it is gone
        await expect(expenseRow).not.toBeVisible();
    });
});
