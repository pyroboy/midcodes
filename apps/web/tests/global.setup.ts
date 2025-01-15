import { test as setup, expect } from '@playwright/test';
import { writeFileSync } from 'fs';

setup('authenticate', async ({ page }) => {
  try {
    // Create an empty storage state file first
    writeFileSync('./test-storage-state.json', '{}');

    // Go to the auth page and login
    await page.goto('http://localhost:5174/auth');
    await expect(page.getByRole('heading', { name: 'Welcome to March of Faith,' })).toBeVisible();
    await page.getByPlaceholder('name@example.com').fill('arjomagno@gmail.com');
    await page.getByPlaceholder('••••••••').fill('123456');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for successful login
    await page.waitForURL('http://localhost:5174/**');

    // Save signed-in state
    await page.context().storageState({ path: './test-storage-state.json' });
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
});
