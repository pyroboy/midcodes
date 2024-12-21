import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  // Go to the login page
  await page.goto('/login');

  // Fill in login form
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for login to complete and redirect
  await page.waitForURL('/**');
}

export async function loginAsStaff(page: Page) {
  // Go to the login page
  await page.goto('/login');

  // Fill in login form
  await page.getByLabel('Email').fill('staff@example.com');
  await page.getByLabel('Password').fill('staff123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for login to complete and redirect
  await page.waitForURL('/**');
}

export async function loginAsUser(page: Page) {
  // Go to the login page
  await page.goto('/login');

  // Fill in login form
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('user123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for login to complete and redirect
  await page.waitForURL('/**');
}
