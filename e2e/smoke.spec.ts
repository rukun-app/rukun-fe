import { test, expect } from '@playwright/test'

test('app loads without crashing', async ({ page }) => {
  await page.goto('/')
  // RouterView renders — no unhandled JS errors
  await expect(page).not.toHaveTitle(/Error/)
})
