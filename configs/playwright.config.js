const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '../tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : 'list',
  use: {
    baseURL: `http://127.0.0.1:${process.env.PORT || 3000}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start:test',
    url: `http://127.0.0.1:${process.env.PORT || 3000}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
