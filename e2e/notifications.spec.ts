import { test, expect, type Page } from '@playwright/test'
const user = {
  id: 10,
  name: 'Warga',
  locale: 'id',
  roles: [],
  permissions: [],
  must_change_password: false,
}
const first = {
  id: 'owned-1',
  title: 'Akun diperbarui',
  message: 'Profil Anda telah diperbarui.',
  category: 'account',
  read_at: null as string | null,
  created_at: '2026-10-02T01:00:00Z',
}
const second = { ...first, id: 'owned-2', title: 'Keamanan akun', category: 'security' }
function withReadState(read: boolean) {
  return { ...first, read_at: read ? '2026-10-02T02:00:00Z' : null }
}
async function fixtures(page: Page) {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'inbox-session'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: user } }),
  )
  await page.route('**/api/notifications/unread-count', (route) =>
    route.fulfill({ json: { success: true, data: { count: 2 } } }),
  )
  await page.route(/\/api\/notifications(?:\?.*)?$/, (route) =>
    route.fulfill({
      json: { success: true, data: { data: [first], next_cursor: 'opaque+/=', prev_cursor: null } },
    }),
  )
  await page.route('**/api/notifications/owned-1', (route) =>
    route.fulfill({ json: { success: true, data: first } }),
  )
}

test.beforeEach(async ({ page }) => {
  await fixtures(page)
})

for (const type of ['household', 'management', 'vendor', 'none']) {
  test(`shared inbox is accessible to ${type} without global permissions`, async ({ page }) => {
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
    await page.goto(type === 'household' ? '/app/notifications' : '/notifications')
    await expect(page).toHaveURL('/notifications')
    await expect(page.getByRole('heading', { name: 'Notifikasi', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: first.title, exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Menu akun' }).click()
    await expect(page.getByRole('menuitem', { name: 'Notifikasi', exact: true })).toBeVisible()
  })
}

test('server filters reset cursor and opaque pagination is preserved', async ({ page }) => {
  const requests: URL[] = []
  await page.route(/\/api\/notifications(?:\?.*)?$/, (route) => {
    const url = new URL(route.request().url())
    requests.push(url)
    return route.fulfill({
      json: {
        success: true,
        data: {
          data: url.searchParams.has('cursor') ? [second] : [first],
          next_cursor: url.searchParams.has('cursor') ? null : 'opaque+/=',
          prev_cursor: url.searchParams.has('cursor') ? 'back' : null,
        },
      },
    })
  })
  await page.goto('/notifications')
  await page.getByRole('button', { name: 'Berikutnya', exact: true }).click()
  await expect(page.getByRole('button', { name: second.title, exact: true })).toBeVisible()
  expect(requests.at(-1)?.searchParams.get('cursor')).toBe('opaque+/=')
  await page.getByRole('combobox', { name: 'Filter status notifikasi' }).click()
  await page.getByRole('option', { name: 'Belum dibaca', exact: true }).click()
  await expect.poll(() => requests.at(-1)?.searchParams.get('status')).toBe('unread')
  expect(requests.at(-1)?.searchParams.has('cursor')).toBe(false)
  await page.getByRole('combobox', { name: 'Filter kategori notifikasi' }).click()
  await page.getByRole('option', { name: 'Keamanan', exact: true }).click()
  await expect.poll(() => requests.at(-1)?.searchParams.get('category')).toBe('security')
})

test('opening detail is read-only; explicit read/unread refreshes detail, list and count', async ({
  page,
}) => {
  let read = false
  let writes = 0
  const item = () => withReadState(read)
  await page.route('**/api/notifications/owned-1', (route) =>
    route.fulfill({ json: { success: true, data: item() } }),
  )
  await page.route('**/api/notifications/unread-count', (route) =>
    route.fulfill({ json: { success: true, data: { count: read ? 0 : 1 } } }),
  )
  await page.route('**/api/notifications/owned-1/*', (route) => {
    expect(['PATCH', 'DELETE']).toContain(route.request().method())
    writes++
    read = route.request().method() === 'PATCH'
    return route.fulfill({ json: { success: true, data: item() } })
  })
  await page.goto('/notifications')
  await page.getByRole('button', { name: first.title, exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Detail notifikasi' })
  await expect(dialog.getByText(first.message)).toBeVisible()
  expect(writes).toBe(0)
  await dialog.getByRole('button', { name: 'Tandai dibaca', exact: true }).click()
  await expect(
    dialog.getByRole('button', { name: 'Tandai belum dibaca', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Belum dibaca: 0', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Tandai belum dibaca', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'Tandai dibaca', exact: true })).toBeVisible()
  expect(writes).toBe(2)
})

test('read-all explains scope, cancel makes no write and success refreshes count', async ({
  page,
}) => {
  let writes = 0
  await page.route('**/api/notifications/read-all', (route) => {
    writes++
    return route.fulfill({ json: { success: true, data: { message: 'Read' } } })
  })
  await page.goto('/notifications')
  await page.getByRole('button', { name: 'Tandai semua dibaca', exact: true }).click()
  await expect(
    page.getByText(
      'Semua notifikasi akun, termasuk di luar filter saat ini, akan ditandai dibaca.',
    ),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  expect(writes).toBe(0)
  await page.getByRole('button', { name: 'Tandai semua dibaca', exact: true }).click()
  await page.route('**/api/notifications/unread-count', (route) =>
    route.fulfill({ json: { success: true, data: { count: 0 } } }),
  )
  await page.getByRole('button', { name: 'Ya, tandai dibaca', exact: true }).click()
  await expect(page.getByText('Belum dibaca: 0', { exact: true })).toBeVisible()
  expect(writes).toBe(1)
})

test('write failure preserves unread state and permits retry', async ({ page }) => {
  await page.route('**/api/notifications/owned-1/read', (route) =>
    route.fulfill({ status: 403, json: { message: 'Akses ditolak' } }),
  )
  await page.goto('/notifications')
  await page.getByRole('button', { name: first.title, exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Detail notifikasi' })
  await dialog.getByRole('button', { name: 'Tandai dibaca', exact: true }).click()
  await expect(dialog.getByText('Akses ditolak', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Tandai dibaca', exact: true })).toBeEnabled()
})

test('list failure retries into empty state and count failure is not shown as zero', async ({
  page,
}) => {
  await page.route(/\/api\/notifications(?:\?.*)?$/, (route) =>
    route.fulfill({ status: 500, json: { message: 'Inbox gagal dimuat' } }),
  )
  await page.route('**/api/notifications/unread-count', (route) =>
    route.fulfill({ status: 500, json: { message: 'Count failed' } }),
  )
  await page.goto('/notifications')
  await expect(page.getByText('Inbox gagal dimuat', { exact: true })).toBeVisible()
  await expect(page.getByText('Belum dibaca: —', { exact: true })).toBeVisible()
  await page.route(/\/api\/notifications(?:\?.*)?$/, (route) =>
    route.fulfill({
      json: { success: true, data: { data: [], next_cursor: null, prev_cursor: null } },
    }),
  )
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
  await expect(page.getByText('Tidak ada notifikasi', { exact: true })).toBeVisible()
})

test('detail renders text safely without navigating to arbitrary actions', async ({ page }) => {
  await page.route('**/api/notifications/owned-1', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          ...first,
          message: '<img src=x onerror=alert(1)>',
          action: { url: 'https://outside.test' },
          context: { household_id: 'secret-id' },
        },
      },
    }),
  )
  await page.goto('/notifications')
  await page.getByRole('button', { name: first.title, exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Detail notifikasi' })
  await expect(dialog.getByText('<img src=x onerror=alert(1)>', { exact: true })).toBeVisible()
  await expect(dialog.locator('img')).toHaveCount(0)
  await expect(dialog.getByRole('link')).toHaveCount(0)
  await expect(page.getByText('secret-id', { exact: true })).toHaveCount(0)
})

test('English dark mobile inbox and detail fit the viewport', async ({ page }) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: { ...user, locale: 'en' } } }),
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/notifications')
  await page.getByRole('button', { name: 'Use dark mode' }).click()
  await expect(page.getByRole('button', { name: 'Mark all as read', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: first.title, exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Notification details' })).toBeVisible()
  await page.screenshot({
    path: 'e2e/artifacts/notifications-dark-mobile.png',
    fullPage: true,
    animations: 'disabled',
  })
})
