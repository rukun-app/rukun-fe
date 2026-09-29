import { test, expect } from '@playwright/test'

const user = {
  id: 1,
  public_id: '00000000-0000-4000-8000-000000000001',
  name: 'Pengurus Uji',
  email: 'test@example.com',
  phone: null,
  status: 'active',
  roles: [],
  permissions: [
    'households.view',
    'households.manage',
    'residents.view',
    'residents.manage',
    'areas.view',
    'areas.manage',
  ],
  must_change_password: false,
}

async function profile(page: import('@playwright/test').Page, data = user) {
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { success: true, data } }))
}

test('login renders real controls without redirect loops or console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(page).toHaveURL(/\/auth\/login$/)
  await expect(page.getByLabel('Email / Nomor HP')).toBeEditable()
  await expect(page.getByLabel('Kata Sandi', { exact: true })).toBeEditable()
  await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeDisabled()
  expect(errors).toEqual([])
})

test('protected deep link redirects to login', async ({ page }) => {
  await page.goto('/manage/households')
  await expect(page).toHaveURL(/\/auth\/login\?redirect=/)
  await expect(page.getByLabel('Email / Nomor HP')).toBeVisible()
})

for (const identifier of ['test@example.com', '081234567890']) {
  test(`login follows actual backend envelope: ${identifier}`, async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      expect(route.request().postDataJSON()).toMatchObject({ identifier, device_name: 'web' })
      await route.fulfill({
        json: {
          success: true,
          data: { token: 'test-token', token_type: 'Bearer', expires_at: '2099-01-01', user },
        },
      })
    })
    await profile(page)
    await page.goto('/auth/login')
    await page.getByLabel('Email / Nomor HP').fill(identifier)
    await page.getByLabel('Kata Sandi', { exact: true }).fill('example-password')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page).toHaveURL(/\/manage\/dashboard$/)
  })
}

test('reload waits for profile and enforces initial password change', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'test-token'))
  await profile(page, { ...user, must_change_password: true })
  await page.goto('/manage/households')
  await expect(page).toHaveURL(/\/auth\/change-initial-password$/)
  await expect(page.getByLabel('Kata Sandi Sementara')).toBeVisible()
})

test('expired token recovers to usable login', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'expired'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { success: false, code: 'auth.unauthenticated' } }),
  )
  await page.goto('/manage/households')
  await expect(page).toHaveURL(/\/auth\/login/)
  await expect(page.getByLabel('Email / Nomor HP')).toBeEditable()
  expect(await page.evaluate(() => localStorage.getItem('rukun:token'))).toBeNull()
})

test('profile outage offers retry instead of infinite loading', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'test-token'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 503,
      json: { success: false, message: 'Layanan sedang tidak tersedia' },
    }),
  )
  await page.goto('/manage/households')
  await expect(page.getByRole('heading', { name: 'Sesi belum dapat dimuat' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Coba lagi' })).toBeEnabled()
})

test('profile without global permissions does not invent scoped access', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'test-token'))
  await profile(page, { ...user, permissions: [] })
  await page.goto('/')
  await expect(page).toHaveURL(/\/auth\/select-context$/)
  await expect(page.getByRole('status')).toContainText('Tidak ada akses')
  await expect(page.getByRole('button', { name: 'Keluar' })).toBeVisible()
})

test('password recovery sends email, not an unsupported phone identifier', async ({ page }) => {
  await page.route('**/api/auth/forgot-password', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ email: 'test@example.com' })
    await route.fulfill({ json: { success: true, data: { message: 'Accepted' } } })
  })
  await page.goto('/auth/forgot-password')
  await page.getByLabel('Email', { exact: true }).fill('test@example.com')
  await page.getByRole('button', { name: 'Kirim Instruksi' }).click()
  await expect(page.getByRole('status')).toContainText('Jika email terdaftar')
})

test('mobile login fits the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page.getByLabel('Email / Nomor HP')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({ path: 'e2e/artifacts/login-mobile.png', fullPage: true })
})
