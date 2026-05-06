import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'html' : 'list',
  timeout: 30_000,

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // Desktop Safari (WebKit). Catches Safari-only regressions: date input
    // formatting, focus-visible behaviour, BroadcastChannel availability,
    // sticky header z-index quirks. Run nightly in CI via:
    //   `yarn e2e --project=webkit`
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile coverage: Pixel 5 (Android Chrome) + iPhone 13 (Mobile Safari)
    // catches the layout regressions desktop projects miss — burger menu,
    // sidebar collapse, touch target sizes, viewport meta. Run with
    // `yarn e2e --project=mobile-chrome` or `--project=mobile-safari`.
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: 'yarn dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
