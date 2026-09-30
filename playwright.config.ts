import { defineConfig, devices } from '@playwright/test'

const preview = process.env['PLAYWRIGHT_PREVIEW'] === '1'
const baseURL = preview ? 'http://127.0.0.1:4173' : 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  expect: { timeout: 15000 },
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: preview ? 'pnpm preview --host 127.0.0.1 --port 4173 --strictPort' : 'pnpm dev',
    url: baseURL,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 1000 },
    reuseExistingServer: !preview && !process.env['CI'],
  },
})
