import { test, expect } from '@playwright/test'
const user = {
  id: 10,
  name: 'Warga',
  email: 'resident@example.test',
  email_verified_at: null,
  locale: 'id',
  roles: [],
  permissions: [],
  must_change_password: false,
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'verification-session'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: user } }),
  )
  await page.route('**/api/auth/tokens', (route) =>
    route.fulfill({ json: { success: true, data: [] } }),
  )
})

test('resend uses own email without credentials and does not claim verification', async ({
  page,
}) => {
  let payload: unknown
  let headers: Record<string, string> = {}
  await page.route('**/api/auth/email/resend', (route) => {
    payload = route.request().postDataJSON()
    headers = route.request().headers()
    return route.fulfill({ json: { success: true, data: { message: 'Accepted' } } })
  })
  await page.goto('/account')
  await page.getByRole('button', { name: 'Kirim ulang email verifikasi' }).click()
  await expect(page.getByText('Permintaan kirim ulang diterima.', { exact: false })).toBeVisible()
  expect(payload).toEqual({ email: user.email })
  expect(headers['authorization']).toBeUndefined()
  expect(headers['x-rukun-context']).toBeUndefined()
  expect(headers['accept-language']).toBe('id')
  await expect(page.getByText('Email belum terverifikasi', { exact: true })).toBeVisible()
})

test('checking confirmed status preserves both dirty forms and leave guard', async ({ page }) => {
  await page.goto('/account')
  await page.getByRole('textbox', { name: 'Nama lengkap' }).fill('Belum Disimpan')
  await page.getByLabel('Kata Sandi Baru', { exact: true }).fill('new-password')
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: { success: true, data: { ...user, email_verified_at: '2026-10-01T01:00:00Z' } },
    }),
  )
  await page.getByRole('button', { name: 'Periksa status email' }).click()
  await expect(page.getByText('Email terverifikasi', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Kirim ulang email verifikasi' })).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'Nama lengkap' })).toHaveValue('Belum Disimpan')
  await expect(page.getByLabel('Kata Sandi Baru', { exact: true })).toHaveValue('new-password')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('link', { name: 'Kembali ke aplikasi' }).click()
  await expect(page).toHaveURL('/account')
})

for (const scenario of [
  {
    label: 'verified',
    data: { email_verified_at: '2026-10-01T01:00:00Z' },
    text: 'Email terverifikasi',
  },
  {
    label: 'unknown',
    data: { email_verified_at: undefined },
    text: 'Status verifikasi belum tersedia',
  },
  { label: 'phone only', data: { email: null }, text: 'Belum memiliki email' },
]) {
  test(`${scenario.label} does not offer resend`, async ({ page }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ json: { success: true, data: { ...user, ...scenario.data } } }),
    )
    await page.goto('/account')
    await expect(page.getByText(scenario.text, { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Kirim ulang email verifikasi' })).toHaveCount(0)
  })
}

test('rate limited resend remains retryable without changing status', async ({ page }) => {
  await page.route('**/api/auth/email/resend', (route) =>
    route.fulfill({ status: 429, json: { message: 'Terlalu banyak permintaan' } }),
  )
  await page.goto('/account')
  await page.getByRole('button', { name: 'Kirim ulang email verifikasi' }).click()
  await expect(page.getByText('Terlalu banyak permintaan', { exact: true })).toBeVisible()
  await expect(page.getByText('Email belum terverifikasi', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Kirim ulang email verifikasi' })).toBeEnabled()
})

test('failed status check preserves previous state and supports retry', async ({ page }) => {
  await page.goto('/account')
  await expect(page.getByText('Email belum terverifikasi', { exact: true })).toBeVisible()
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 500, json: { message: 'Status belum tersedia' } }),
  )
  await page.getByRole('button', { name: 'Periksa status email' }).click()
  await expect(page.getByText('Status belum tersedia', { exact: true })).toBeVisible()
  await expect(page.getByText('Email belum terverifikasi', { exact: true })).toBeVisible()
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: user } }),
  )
  await page.getByRole('button', { name: 'Periksa status email' }).click()
  await expect(
    page.getByText('Server masih menandai email belum terverifikasi.', { exact: false }),
  ).toBeVisible()
})

test('verification supports English and dark mobile layout', async ({ page }) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: { ...user, locale: 'en' } } }),
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/account')
  await page.getByRole('button', { name: 'Use dark mode' }).click()
  await expect(page.getByRole('button', { name: 'Resend verification email' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({
    path: 'e2e/artifacts/email-verification-dark.png',
    fullPage: true,
    animations: 'disabled',
  })
})
