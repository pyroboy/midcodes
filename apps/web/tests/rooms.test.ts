import { test, expect } from '@playwright/test';

test.describe('Rental_Units Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to rental_unit page (auth is handled by global setup)
    await page.goto('http://localhost:5173/dorm/rental_unit');
    await expect(page.getByRole('heading', { name: 'Rental_Units' })).toBeVisible();
  });

  test('displays rental_unit list headers', async ({ page }) => {
    // Check for column headers
    await expect(page.getByText('Rental_unit', { exact: true })).toBeVisible();
    await expect(page.getByText('Type', { exact: true })).toBeVisible();
    await expect(page.getByText('Status', { exact: true })).toBeVisible();
    await expect(page.getByText('Rate', { exact: true })).toBeVisible();
  });

  test('displays rental_unit details correctly', async ({ page }) => {
    // Check for rental_unit name and details
    await expect(page.getByText('Rental_unit 101')).toBeVisible();
    await expect(page.getByText('Property A - Floor 1 Wing East')).toBeVisible();
    await expect(page.getByText('VACANT')).toBeVisible();
    await expect(page.getByText('₱5,000/mo')).toBeVisible();
  });

  test('shows add rental_unit button for admin users', async ({ page }) => {
    // Check for Add Rental_unit button
    await expect(page.getByRole('button', { name: 'Add Rental_unit' })).toBeVisible();
  });

  test('can open rental_unit form', async ({ page }) => {
    // Click Add Rental_unit button
    await page.getByRole('button', { name: 'Add Rental_unit' }).click();

    // Wait for form to appear
    await page.waitForSelector('h3:has-text("Add Rental_unit")');

    // Check if form appears
    await expect(page.getByRole('heading', { name: 'Add Rental_unit' })).toBeVisible();

    // Check form fields
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Rental_unit Number')).toBeVisible();
    await expect(page.getByLabel('Type')).toBeVisible();
    await expect(page.getByLabel('Property')).toBeVisible();
    await expect(page.getByLabel('Floor')).toBeVisible();
    await expect(page.getByLabel('Status')).toBeVisible();
    await expect(page.getByLabel('Capacity')).toBeVisible();
    await expect(page.getByLabel('Base Rate')).toBeVisible();
  });

  test('can edit existing rental_unit', async ({ page }) => {
    // Click on a rental_unit
    await page.getByText('Rental_unit 101').click();

    // Wait for form to appear
    await page.waitForSelector('h3:has-text("Edit Rental_unit")');

    // Check if edit form appears
    await expect(page.getByRole('heading', { name: 'Edit Rental_unit' })).toBeVisible();

    // Check if form is populated with rental_unit data
    await expect(page.getByLabel('Name')).toHaveValue('Rental_unit 101');
    await expect(page.getByLabel('Rental_unit Number')).toHaveValue('101');
    await expect(page.getByLabel('Type')).toHaveValue('SINGLE');
    await expect(page.getByLabel('Status')).toHaveValue('VACANT');
    await expect(page.getByLabel('Capacity')).toHaveValue('1');
    await expect(page.getByLabel('Base Rate')).toHaveValue('5000');
  });

  test('can delete rental_unit as admin', async ({ page }) => {
    // Click on a rental_unit
    await page.getByText('Rental_unit 101').click();

    // Wait for form to appear
    await page.waitForSelector('h3:has-text("Edit Rental_unit")');

    // Check if delete button is visible for admin
    await expect(page.getByRole('button', { name: 'Delete Rental_unit' })).toBeVisible();
  });
});
