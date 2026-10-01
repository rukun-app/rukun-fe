import { test, expect } from '@playwright/test'
const current = {
  id: 11,
  name: 'Laptop rumah',
  is_current: true,
  created_at: '2026-09-01T10:00:00Z',
  last_used_at: '2026-10-01T01:00:00Z',
  expires_at: null,
}
const other = {
  id: 22,
  name: 'Ponsel lama',
  is_current: false,
  created_at: '2026-09-01T10:00:00Z',
  last_used_at: null,
  expires_at: null,
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'session-fixture'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          id: 1,
          name: 'Pengguna',
          email: 'user@example.test',
          locale: 'id',
          status: 'active',
          roles: [],
          permissions: [],
        },
      },
    }),
  )
  await page.route('**/api/auth/tokens', (route) =>
    route.fulfill({ json: { success: true, data: [current, other] } }),
  )
})

test('sessions table shows server names and current marker, and can search', async ({ page }) => {
  await page.goto('/account')
  const table = page.getByRole('table', { name: 'Daftar sesi perangkat' })
  await expect(table).toContainText('Laptop rumah')
  await expect(table).toContainText('Perangkat ini')
  await expect(table).toContainText('Ponsel lama')
  await page.getByRole('textbox', { name: 'Cari di halaman ini' }).fill('Ponsel')
  await expect(table).not.toContainText('Laptop rumah')
  await expect(table).toContainText('Ponsel lama')
})

test('cancel makes no write; revoking another device refreshes while retaining this session', async ({
  page,
}) => {
  let revoked = false
  let writes = 0
  await page.route('**/api/auth/tokens', (route) =>
    route.fulfill({ json: { success: true, data: revoked ? [current] : [current, other] } }),
  )
  await page.route('**/api/auth/tokens/22', (route) => {
    writes++
    revoked = true
    return route.fulfill({ json: { success: true } })
  })
  await page.goto('/account')
  await page.getByRole('button', { name: 'Cabut sesi Ponsel lama', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toContainText('Ponsel lama')
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  expect(writes).toBe(0)
  await page.getByRole('button', { name: 'Cabut sesi Ponsel lama', exact: true }).click()
  await page.getByRole('button', { name: 'Ya, lanjutkan' }).click()
  await expect(page.getByRole('table', { name: 'Daftar sesi perangkat' })).not.toContainText(
    'Ponsel lama',
  )
  expect(writes).toBe(1)
  expect(await page.evaluate(() => localStorage.getItem('rukun:token'))).toBe('session-fixture')
})

for (const mode of ['current', 'all']) {
  test(`confirmed ${mode} revocation signs out only after success and accounts for unsaved forms`, async ({
    page,
  }) => {
    let release!: () => void
    let writes = 0
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    await page.route(
      mode === 'all' ? '**/api/auth/logout-all' : '**/api/auth/tokens/11',
      async (route) => {
        writes++
        await pending
        await route.fulfill({ json: { success: true } })
      },
    )
    await page.goto('/account')
    await page.getByRole('textbox', { name: 'Nama lengkap' }).fill('Belum disimpan')
    await page
      .getByRole('button', {
        name: mode === 'all' ? 'Keluar dari semua perangkat' : 'Cabut sesi Laptop rumah',
        exact: true,
      })
      .click()
    await expect(page.getByRole('alertdialog')).toContainText(
      'Perubahan formulir yang belum disimpan',
    )
    await page.getByRole('button', { name: 'Ya, lanjutkan' }).click()
    await expect.poll(() => writes).toBe(1)
    expect(await page.evaluate(() => localStorage.getItem('rukun:token'))).toBe('session-fixture')
    release()
    await expect(page).toHaveURL('/auth/login')
    expect(await page.evaluate(() => localStorage.getItem('rukun:token'))).toBeNull()
  })
}

for (const status of [404, 500]) {
  test(`revocation ${status} preserves current session and does not remove the row optimistically`, async ({
    page,
  }) => {
    await page.route('**/api/auth/tokens/22', (route) =>
      route.fulfill({ status, json: { message: 'Pencabutan belum berhasil' } }),
    )
    await page.goto('/account')
    await page.getByRole('button', { name: 'Cabut sesi Ponsel lama', exact: true }).click()
    await page.getByRole('button', { name: 'Ya, lanjutkan' }).click()
    await expect(page.getByText('Pencabutan belum berhasil', { exact: true })).toBeVisible()
    await expect(page.getByRole('table', { name: 'Daftar sesi perangkat' })).toContainText(
      'Ponsel lama',
    )
    expect(await page.evaluate(() => localStorage.getItem('rukun:token'))).toBe('session-fixture')
  })
}

test('list error retries into an empty state without blocking profile', async ({ page }) => {
  await page.route('**/api/auth/tokens', (route) =>
    route.fulfill({ status: 500, json: { message: 'Daftar sesi gagal dimuat' } }),
  )
  await page.goto('/account')
  await expect(page.getByText('Daftar sesi gagal dimuat', { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Nama lengkap' })).toBeEditable()
  await page.route('**/api/auth/tokens', (route) =>
    route.fulfill({ json: { success: true, data: [] } }),
  )
  await page.getByRole('button', { name: 'Coba lagi' }).click()
  await expect(page.getByText('Tidak ada sesi perangkat', { exact: true })).toBeVisible()
})

test('mobile dark English session list fits and formats server dates', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('rukun:locale', 'en')
    localStorage.setItem('rukun:theme', 'dark')
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/account')
  await expect(page.getByRole('table', { name: 'Device sessions list' })).toContainText(
    'This device',
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Sign out of all devices', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toContainText('This device will also sign out.')
  await page.screenshot({
    path: 'e2e/artifacts/sessions-dark-mobile.png',
    fullPage: true,
    animations: 'disabled',
  })
})
