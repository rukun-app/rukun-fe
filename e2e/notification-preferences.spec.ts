import { test, expect, type Page } from '@playwright/test'
const user = {
  id: 10,
  name: 'Warga',
  locale: 'id',
  roles: [],
  permissions: [],
  must_change_password: false,
}
const original = [
  {
    category: 'security',
    database_enabled: true,
    mail_enabled: true,
    locked_channels: ['database', 'mail'],
  },
  {
    category: 'account',
    database_enabled: true,
    mail_enabled: true,
    locked_channels: ['database'],
  },
  { category: 'system', database_enabled: true, mail_enabled: false, locked_channels: [] },
]
async function setup(page: Page) {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'preferences-session'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: user } }),
  )
  await page.route('**/api/notification-preferences', (route) =>
    route.fulfill({ json: { success: true, data: original } }),
  )
  await page.route('**/api/notifications/unread-count', (route) =>
    route.fulfill({ json: { success: true, data: { count: 0 } } }),
  )
  await page.route(/\/api\/notifications(?:\?.*)?$/, (route) =>
    route.fulfill({
      json: { success: true, data: { data: [], next_cursor: null, prev_cursor: null } },
    }),
  )
}

test.beforeEach(async ({ page }) => {
  await setup(page)
})

for (const type of ['household', 'management', 'vendor', 'none']) {
  test(`preferences are available for ${type} and respect locked channels`, async ({ page }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            ...user,
            contexts:
              type === 'none'
                ? []
                : [
                    {
                      id: `${type}:test`,
                      type,
                      label: 'Akses',
                      scope: { type, id: 'scope' },
                      capabilities: [],
                    },
                  ],
          },
        },
      }),
    )
    await page.goto('/notifications')
    await page.getByRole('link', { name: 'Preferensi notifikasi', exact: true }).click()
    await expect(page).toHaveURL('/notifications/preferences')
    await expect(page.getByRole('switch', { name: 'Email Keamanan', exact: true })).toBeChecked()
    await expect(page.getByRole('switch', { name: 'Email Keamanan', exact: true })).toBeDisabled()
    await expect(
      page.getByRole('switch', { name: 'Inbox aplikasi Akun', exact: true }),
    ).toBeDisabled()
    await expect(page.getByRole('switch', { name: 'Email Akun', exact: true })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Simpan preferensi' })).toBeDisabled()
  })
}

test('saves only changed categories once and adopts canonical server response', async ({
  page,
}) => {
  let payload: unknown
  let writes = 0
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/notification-preferences', async (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({ json: { success: true, data: original } })
    writes++
    payload = route.request().postDataJSON()
    await pending
    return route.fulfill({
      json: { success: true, data: original.map((row) => ({ ...row, mail_enabled: true })) },
    })
  })
  await page.goto('/notifications/preferences')
  await page.getByRole('switch', { name: 'Email Akun', exact: true }).uncheck()
  await page.getByRole('button', { name: 'Simpan preferensi' }).click()
  await expect.poll(() => writes).toBe(1)
  await expect(page.getByRole('button', { name: 'Simpan preferensi' })).toBeDisabled()
  await expect(page.getByRole('switch', { name: 'Email Akun', exact: true })).toBeDisabled()
  release()
  await expect(page.getByText('Preferensi notifikasi tersimpan', { exact: true })).toBeVisible()
  expect(payload).toEqual({
    preferences: [{ category: 'account', database_enabled: true, mail_enabled: false }],
  })
  await expect(page.getByRole('switch', { name: 'Email Akun', exact: true })).toBeChecked()
  await expect(page.getByRole('button', { name: 'Simpan preferensi' })).toBeDisabled()
  await page.getByRole('link', { name: 'Kembali', exact: true }).click()
  await expect(page).toHaveURL('/notifications')
})

test('dirty guard preserves edits and discard restores server values without writing', async ({
  page,
}) => {
  let writes = 0
  page.on('request', (request) => {
    if (request.method() === 'PUT') writes++
  })
  await page.goto('/notifications/preferences')
  await page.getByRole('switch', { name: 'Email Akun', exact: true }).uncheck()
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('link', { name: 'Kembali', exact: true }).click()
  await expect(page).toHaveURL('/notifications/preferences')
  await expect(page.getByRole('switch', { name: 'Email Akun', exact: true })).not.toBeChecked()
  await page.getByRole('button', { name: 'Batalkan perubahan' }).click()
  await expect(page.getByRole('switch', { name: 'Email Akun', exact: true })).toBeChecked()
  await expect(page.getByRole('button', { name: 'Simpan preferensi' })).toBeDisabled()
  expect(writes).toBe(0)
})

for (const status of [403, 422, 500]) {
  test(`save ${status} preserves unsaved choices and allows retry`, async ({ page }) => {
    await page.route('**/api/notification-preferences', (route) => {
      if (route.request().method() === 'GET')
        return route.fulfill({ json: { success: true, data: original } })
      return route.fulfill({
        status,
        json: {
          message: 'Preferensi ditolak',
          errors: { 'preferences.account.mail_enabled': ['Periksa kanal email akun'] },
        },
      })
    })
    await page.goto('/notifications/preferences')
    await page.getByRole('switch', { name: 'Email Akun', exact: true }).uncheck()
    await page.getByRole('button', { name: 'Simpan preferensi' }).click()
    await expect(page.getByText('Preferensi ditolak', { exact: true })).toBeVisible()
    await expect(page.getByText('Periksa kanal email akun', { exact: true })).toBeVisible()
    await expect(page.getByRole('switch', { name: 'Email Akun', exact: true })).not.toBeChecked()
    await expect(page.getByRole('button', { name: 'Simpan preferensi' })).toBeEnabled()
  })
}

test('load failure retries and dynamic server locks are applied', async ({ page }) => {
  await page.route('**/api/notification-preferences', (route) =>
    route.fulfill({ status: 500, json: { message: 'Kanal gagal dimuat' } }),
  )
  await page.goto('/notifications/preferences')
  await expect(page.getByText('Kanal gagal dimuat', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Simpan preferensi' })).toBeDisabled()
  await page.route('**/api/notification-preferences', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: original.map((row) => ({
          ...row,
          mail_enabled: true,
          locked_channels: ['database', 'mail'],
        })),
      },
    }),
  )
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
  await expect(page.getByRole('switch', { name: 'Email Sistem', exact: true })).toBeChecked()
  await expect(page.getByRole('switch', { name: 'Email Sistem', exact: true })).toBeDisabled()
})

test('malformed response is an error rather than editable defaults', async ({ page }) => {
  await page.route('**/api/notification-preferences', (route) =>
    route.fulfill({ json: { success: true, data: [{ category: 'security' }] } }),
  )
  await page.goto('/notifications/preferences')
  await expect(page.getByRole('button', { name: 'Coba lagi', exact: true })).toBeVisible()
  await expect(page.getByRole('switch')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Simpan preferensi' })).toBeDisabled()
})

test('English dark mobile preferences fit and show readable required channels', async ({
  page,
}) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: { ...user, locale: 'en' } } }),
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/notifications/preferences')
  await page.getByRole('button', { name: 'Use dark mode' }).click()
  await expect(
    page.getByRole('heading', { name: 'Notification preferences', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('switch', { name: 'In-app inbox Security', exact: true }),
  ).toBeDisabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({
    path: 'e2e/artifacts/notification-preferences-dark-mobile.png',
    fullPage: true,
    animations: 'disabled',
  })
})
