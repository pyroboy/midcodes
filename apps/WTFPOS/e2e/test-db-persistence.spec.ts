import { test, expect } from '@playwright/test';

test.describe('RxDB Offline Database', () => {
    test('should persist data correctly across page reloads', async ({ page }) => {
        // Log console messages
        page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()} - ${msg.text()}`));
        page.on('pageerror', error => console.log(`BROWSER ERROR: ${error.message}`));

        // Go to the test route
        await page.goto('/test-db');
        
        // Wait for DB to be Initialized
        await expect(page.locator('text=Loading database...')).not.toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=RxDB Test Page')).toBeVisible();

        // Unique table name to avoid conflicts if the DB isn't cleared
        const uniqueTableName = `Table-${Date.now()}`;

        // 1. Add a table
        await page.fill('input[placeholder="Table Name"]', uniqueTableName);
        await page.click('button:has-text("Add Table")');

        // 2. Verify it's on the page
        const tableItem = page.locator(`h3:has-text("${uniqueTableName}")`);
        await expect(tableItem).toBeVisible();

        // 3. Reload the page completely!
        await page.reload();

        // 4. Wait for DB to initialize again
        await expect(page.locator('text=Loading database...')).not.toBeVisible({ timeout: 5000 });

        // 5. Verify the data persisted
        await expect(tableItem).toBeVisible();

        // 6. Cleanup (delete the table)
        // Find the specific container holding our table, and click its delete button
        const container = page.locator('div.border.p-4', { hasText: uniqueTableName });
        await container.locator('button:has-text("Delete")').click();

        // 7. Verify it is gone
        await expect(tableItem).not.toBeVisible();
    });
});
