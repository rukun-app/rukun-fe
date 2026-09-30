import { test, expect } from '@playwright/test'

test('login provides persisted theme and language on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/auth/login')
  await page.getByRole('combobox', { name: 'Bahasa', exact: true }).selectOption('en')
  await page.getByRole('button', { name: 'Use dark mode' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'e2e/artifacts/login-dark-en-mobile.png', fullPage: true })
})

test('system access shares dark theme and English navigation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('rukun:token', 'test')
    localStorage.setItem('rukun:theme', 'dark')
    localStorage.setItem('rukun:locale', 'en')
  })
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { id: 1, name: 'Admin', status: 'active', roles: [], permissions: ['users.view'] },
      },
    }),
  )
  await page.goto('/system/overview')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('link', { name: 'Users', exact: true })).toBeVisible()
  await expect(page.getByText('This space is being prepared.')).toBeVisible()
})
