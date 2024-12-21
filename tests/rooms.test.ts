import { test, expect } from '@playwright/test';

test.describe('Rooms Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to rooms page (auth is handled by global setup)
    await page.goto('http://localhost:5173/dorm/rooms');
    await expect(page.getByRole('heading', { name: 'Rooms' })).toBeVisible();
  });

  test('displays room list headers', async ({ page }) => {
    // Check for column headers
    await expect(page.getByText('Room', { exact: true })).toBeVisible();
    await expect(page.getByText('Type', { exact: true })).toBeVisible();
    await expect(page.getByText('Status', { exact: true })).toBeVisible();
    await expect(page.getByText('Rate', { exact: true })).toBeVisible();
  });

  test('displays room details correctly', async ({ page }) => {
    // Check for room name and details
    await expect(page.getByText('Room 101')).toBeVisible();
    await expect(page.getByText('Property A - Floor 1 Wing East')).toBeVisible();
    await expect(page.getByText('VACANT')).toBeVisible();
    await expect(page.getByText('₱5,000/mo')).toBeVisible();
  });

  test('shows add room button for admin users', async ({ page }) => {
    // Check for Add Room button
    await expect(page.getByRole('button', { name: 'Add Room' })).toBeVisible();
  });

  test('can open room form', async ({ page }) => {
    // Click Add Room button
    await page.getByRole('button', { name: 'Add Room' }).click();

    // Wait for form to appear
    await page.waitForSelector('h3:has-text("Add Room")');

    // Check if form appears
    await expect(page.getByRole('heading', { name: 'Add Room' })).toBeVisible();

    // Check form fields
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Room Number')).toBeVisible();
    await expect(page.getByLabel('Type')).toBeVisible();
    await expect(page.getByLabel('Property')).toBeVisible();
    await expect(page.getByLabel('Floor')).toBeVisible();
    await expect(page.getByLabel('Status')).toBeVisible();
    await expect(page.getByLabel('Capacity')).toBeVisible();
    await expect(page.getByLabel('Base Rate')).toBeVisible();
  });

  test('can edit existing room', async ({ page }) => {
    // Click on a room
    await page.getByText('Room 101').click();

    // Wait for form to appear
    await page.waitForSelector('h3:has-text("Edit Room")');

    // Check if edit form appears
    await expect(page.getByRole('heading', { name: 'Edit Room' })).toBeVisible();

    // Check if form is populated with room data
    await expect(page.getByLabel('Name')).toHaveValue('Room 101');
    await expect(page.getByLabel('Room Number')).toHaveValue('101');
    await expect(page.getByLabel('Type')).toHaveValue('SINGLE');
    await expect(page.getByLabel('Status')).toHaveValue('VACANT');
    await expect(page.getByLabel('Capacity')).toHaveValue('1');
    await expect(page.getByLabel('Base Rate')).toHaveValue('5000');
  });

  test('can delete room as admin', async ({ page }) => {
    // Click on a room
    await page.getByText('Room 101').click();

    // Wait for form to appear
    await page.waitForSelector('h3:has-text("Edit Room")');

    // Check if delete button is visible for admin
    await expect(page.getByRole('button', { name: 'Delete Room' })).toBeVisible();
  });
});
