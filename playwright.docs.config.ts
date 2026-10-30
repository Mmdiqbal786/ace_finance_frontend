import { defineConfig, devices } from '@playwright/test';

/**
 * Role walkthrough recordings (Demo) for voice-over documentation.
 *
 *   npm run test:e2e:docs
 */
const baseURL =
  process.env.BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'https://finance.aceolution.com';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/role-walkthroughs.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 600_000,
  expect: { timeout: 30_000 },
  outputDir: 'test-results/docs-walkthroughs',
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'off',
    // Higher-res recording for Demo Guide training videos
    video: { mode: 'on', size: { width: 1920, height: 1080 } },
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    launchOptions: {
      // Slight slowdown so clicks/fills are readable on the recording
      slowMo: 120,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
