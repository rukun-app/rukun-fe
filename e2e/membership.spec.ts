import { test, expect } from '@playwright/test'
const residentId = '10000000-0000-4000-8000-000000000001'
const currentId = '20000000-0000-4000-8000-000000000001'
const targetId = '30000000-0000-4000-8000-000000000001'
const profile = {
  id: 1,
  name: 'Pengurus',
  status: 'active',
  roles: [],
  permissions: ['residents.view', 'residents.manage', 'households.view'],
}
const resident = {
  public_id: residentId,
  name: 'Siti Aminah',
  status: 'active',
  household_id: currentId,
}
const current = { public_id: currentId, address: 'Jalan Melati 1', status: 'active' }
const target = { public_id: targetId, address: 'Jalan Mawar 2', status: 'active' }
const url = `/manage/residents/${residentId}/membership`

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'membership-test'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: profile } }),
  )
  await page.route(`**/api/community/residents/${residentId}`, (route) =>
    route.fulfill({ json: { success: true, data: resident } }),
  )
  await page.route('**/api/community/residents?*', (route) =>
    route.fulfill({ json: { success: true, data: { data: [] } } }),
  )
  await page.route(`**/api/community/residents/${residentId}/memberships?*`, (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          data: [
            {
              public_id: 'membership-1',
              household_id: currentId,
              relationship: 'head',
              starts_at: '2026-01-01T00:00:00Z',
              ends_at: null,
            },
          ],
          next_cursor: null,
        },
      },
    }),
  )
  await page.route('**/api/community/households?*', (route) =>
    route.fulfill({
      json: { success: true, data: { data: [current, target], next_cursor: null } },
    }),
  )
  await page.route(`**/api/community/households/${currentId}`, (route) =>
    route.fulfill({ json: { success: true, data: current } }),
  )
  await page.route(`**/api/community/households/${targetId}`, (route) =>
    route.fulfill({ json: { success: true, data: target } }),
  )
})

async function chooseTarget(page: import('@playwright/test').Page) {
  await page.getByRole('combobox', { name: 'Pilih keluarga tujuan' }).click()
  await page.getByRole('option', { name: 'Jalan Mawar 2', exact: true }).click()
  await page.getByRole('combobox', { name: 'Hubungan keluarga', exact: true }).click()
  await page.getByRole('option', { name: 'Anak', exact: true }).click()
}

test('history resolves readable addresses and follows opaque server cursors', async ({ page }) => {
  await page.route(`**/api/community/residents/${residentId}/memberships?*`, (route) => {
    const cursor = new URL(route.request().url()).searchParams.get('cursor')
    return route.fulfill({
      json: {
        success: true,
        data: {
          data: cursor
            ? []
            : [
                {
                  public_id: 'membership-1',
                  household_id: currentId,
                  relationship: 'child',
                  starts_at: '2026-01-01T00:00:00Z',
                  ends_at: null,
                },
              ],
          next_cursor: cursor ? null : 'opaque-history',
          prev_cursor: cursor ? 'previous' : null,
        },
      },
    })
  })
  await page.goto(url)
  const table = page.getByRole('table', { name: 'Riwayat keanggotaan' })
  await expect(table).toContainText('Jalan Melati 1')
  await expect(table).toContainText('Anak')
  await expect(table).not.toContainText(currentId)
  await page.getByRole('button', { name: 'Berikutnya' }).click()
  await expect(page.getByText('Belum ada riwayat keanggotaan')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sebelumnya' })).toBeEnabled()
})

test('transfer requires validation and confirmation; cancel does not write', async ({ page }) => {
  const writes: unknown[] = []
  await page.route(`**/api/community/residents/${residentId}/membership`, (route) => {
    writes.push(route.request().postDataJSON())
    expect(route.request().headers()['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/)
    return route.fulfill({ json: { success: true, data: { ...resident, household_id: targetId } } })
  })
  await page.goto(url)
  await page.getByRole('button', { name: 'Tinjau perubahan' }).click()
  await expect(page.getByText('Pilih kartu keluarga', { exact: true })).toBeVisible()
  await chooseTarget(page)
  await page.getByRole('button', { name: 'Tinjau perubahan' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('Jalan Mawar 2')
  await expect(dialog).toContainText('Siti Aminah')
  await dialog.getByRole('button', { name: 'Batal' }).click()
  expect(writes).toHaveLength(0)
  await page.getByRole('button', { name: 'Tinjau perubahan' }).click()
  await dialog.getByRole('button', { name: 'Ya, simpan mutasi' }).click()
  await expect(page).toHaveURL(/\/manage\/residents$/)
  expect(writes).toEqual([{ household_id: targetId, relationship: 'child' }])
  await expect(page.getByText('Mutasi keluarga tersimpan', { exact: true })).toBeVisible()
})

test('ending membership sends null rather than deleting the resident', async ({ page }) => {
  let body: unknown
  await page.route(`**/api/community/residents/${residentId}/membership`, (route) => {
    body = route.request().postDataJSON()
    return route.fulfill({ json: { success: true, data: { ...resident, household_id: null } } })
  })
  await page.goto(url)
  await page.getByRole('combobox', { name: 'Jenis perubahan' }).click()
  await page.getByRole('option', { name: 'Akhiri keanggotaan', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Pilih keluarga tujuan' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Tinjau perubahan' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ya, simpan mutasi' }).click()
  await expect(page).toHaveURL(/\/manage\/residents$/)
  expect(body).toEqual({ household_id: null, relationship: 'other' })
})

for (const status of [403, 409]) {
  test(`backend ${status} keeps the existing membership and surfaces the error`, async ({
    page,
  }) => {
    await page.route(`**/api/community/residents/${residentId}/membership`, (route) =>
      route.fulfill({ status, json: { success: false, message: 'Perubahan ditolak server' } }),
    )
    await page.goto(url)
    await chooseTarget(page)
    await page.getByRole('button', { name: 'Tinjau perubahan' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Ya, simpan mutasi' }).click()
    await expect(page.getByRole('alert')).toContainText('Perubahan ditolak server')
    await expect(page).toHaveURL(new RegExp(`/residents/${residentId}/membership$`))
    await expect(page.getByRole('table', { name: 'Riwayat keanggotaan' })).toContainText(
      'Jalan Melati 1',
    )
  })
}

test('read-only access hides mutation controls and does not fetch restricted household addresses', async ({
  page,
}) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: { success: true, data: { ...profile, permissions: ['residents.view'] } },
    }),
  )
  const addresses: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/community/households')) addresses.push(request.url())
  })
  await page.goto(url)
  await expect(page.getByRole('table', { name: 'Riwayat keanggotaan' })).toContainText(
    'Alamat keluarga dibatasi akses',
  )
  await expect(page.getByRole('button', { name: 'Tinjau perubahan' })).toHaveCount(0)
  expect(addresses).toEqual([])
})

test('membership page fits mobile in dark mode and English', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(url)
  await page.getByRole('button', { name: 'Aktifkan mode gelap' }).click()
  await page.getByRole('combobox', { name: 'Bahasa', exact: true }).selectOption('en')
  await expect(
    page.getByRole('heading', { name: 'Household membership', exact: true, level: 2 }),
  ).toBeVisible()
  await expect(page.getByRole('table', { name: 'Membership history' })).toContainText(
    'Jalan Melati 1',
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'e2e/artifacts/membership-dark-mobile.png', fullPage: true })
})

test('relationship changes within the same household use the membership endpoint', async ({
  page,
}) => {
  let body: unknown
  await page.route(`**/api/community/residents/${residentId}/membership`, (route) => {
    body = route.request().postDataJSON()
    return route.fulfill({ json: { success: true, data: resident } })
  })
  await page.goto(url)
  await page.getByRole('combobox', { name: 'Pilih keluarga tujuan' }).click()
  await page.getByRole('option', { name: 'Jalan Melati 1', exact: true }).click()
  await page.getByRole('combobox', { name: 'Hubungan keluarga', exact: true }).click()
  await page.getByRole('option', { name: 'Pasangan', exact: true }).click()
  await page.getByRole('button', { name: 'Tinjau perubahan' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ya, simpan mutasi' }).click()
  await expect(page).toHaveURL(/\/manage\/residents$/)
  expect(body).toEqual({ household_id: currentId, relationship: 'spouse' })
})

test('history retries request failures and never displays unavailable household IDs', async ({
  page,
}) => {
  let failing = true
  await page.route(`**/api/community/residents/${residentId}/memberships?*`, (route) =>
    route.fulfill(
      failing
        ? { status: 500, json: { message: 'Riwayat belum dapat dimuat' } }
        : {
            json: {
              success: true,
              data: {
                data: [
                  {
                    public_id: 'membership-1',
                    household_id: currentId,
                    relationship: 'child',
                    starts_at: '2026-01-01T00:00:00Z',
                    ends_at: null,
                  },
                ],
              },
            },
          },
    ),
  )
  await page.route(`**/api/community/households/${currentId}`, (route) =>
    route.fulfill({ status: 403, json: { message: 'Tidak dapat diakses' } }),
  )
  await page.goto(url)
  await expect(page.getByRole('alert')).toContainText('Riwayat belum dapat dimuat')
  failing = false
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
  const table = page.getByRole('table', { name: 'Riwayat keanggotaan' })
  await expect(table).toContainText('Keluarga tidak tersedia')
  await expect(table).not.toContainText(currentId)
  await expect(page.getByText('Sebagian alamat keluarga tidak dapat dimuat.')).toBeVisible()
})
