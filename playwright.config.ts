import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  webServer: {
    command: 'npm run dev',
    port: 5173,
    timeout: 120000, // Increase timeout to 2 minutes
    reuseExistingServer: !process.env.CI,
  },
  testDir: 'tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Add persistent context settings
    storageState: './test-storage-state.json',
    // Optimize browser settings
    launchOptions: {
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
      ]
    },
  },
  expect: {
    timeout: 10000,
  },
  // Run tests in parallel
  workers: process.env.CI ? 1 : 4,
  retries: process.env.CI ? 2 : 0,
  // Speed up by using a single browser instance
  fullyParallel: true,
  // Optimize for faster local development
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
        // Skip unnecessary browser features
        contextOptions: {
          reducedMotion: 'reduce',
          forcedColors: 'active',
        },
      },
      dependencies: ['setup'],
    },
  ],
};

export default config;
