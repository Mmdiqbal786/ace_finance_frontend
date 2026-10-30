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
  timeout: 180_000,
  expect: { timeout: 30_000 },
  outputDir: 'test-results/docs-walkthroughs',
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'off',
    video: 'on',
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
