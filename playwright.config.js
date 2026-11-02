import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
