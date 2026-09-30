import { test, expect } from '@playwright/test'
const areaId = '10000000-0000-4000-8000-000000000001'
const parentId = '20000000-0000-4000-8000-000000000001'
const area = { public_id: areaId, kind: 'rt', code: '01', name: 'RT Melati', parent_id: parentId }
const parent = { public_id: parentId, kind: 'rw', code: '02', name: 'RW Mawar', parent_id: null }
const path = `/manage/areas/${areaId}`
const api = `**/api/community/areas/${areaId}`

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'areas-test'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          id: 1,
          name: 'Pengurus',
          status: 'active',
          roles: [],
          permissions: ['areas.view', 'areas.manage'],
        },
      },
    }),
  )
  await page.route('**/api/community/areas?*', (route) =>
    route.fulfill({ json: { success: true, data: { data: [area, parent], next_cursor: null } } }),
  )
  await page.route(api, (route) => route.fulfill({ json: { success: true, data: area } }))
  await page.route(`**/api/community/areas/${parentId}`, (route) =>
    route.fulfill({ json: { success: true, data: parent } }),
  )
})

test('area list opens readable detail and edit sends only mutable fields', async ({ page }) => {
  let payload: unknown
  let key: string | undefined
  await page.route(api, (route) => {
    if (route.request().method() === 'PATCH') {
      payload = route.request().postDataJSON()
      key = route.request().headers()['idempotency-key']
    }
    return route.fulfill({ json: { success: true, data: area } })
  })
  await page.goto('/manage/areas')
  await page.getByRole('link', { name: 'RT Melati', exact: true }).click()
  await expect(page.getByText('RW induk: RW Mawar · 02')).toBeVisible()
  await expect(page.locator('main')).not.toContainText(parentId)
  await expect(page.getByRole('combobox', { name: 'Jenis wilayah' })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Kode' }).fill('')
  await page.getByRole('button', { name: 'Simpan perubahan' }).click()
  await expect(page.getByText('Kode wajib diisi')).toBeVisible()
  expect(payload).toBeUndefined()
  await page.getByRole('textbox', { name: 'Kode' }).fill('03')
  await page.getByRole('textbox', { name: 'Nama wilayah' }).fill('RT Melati Baru')
  await page.getByRole('button', { name: 'Simpan perubahan' }).click()
  await expect(page).toHaveURL('/manage/areas')
  expect(payload).toEqual({ code: '03', name: 'RT Melati Baru' })
  expect(key).toBeTruthy()
  await expect(page.getByText('Wilayah diperbarui', { exact: true })).toBeVisible()
})

test('read-only area access hides edit and delete controls', async ({ page }) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { id: 1, name: 'Viewer', status: 'active', roles: [], permissions: ['areas.view'] },
      },
    }),
  )
  await page.goto(path)
  await expect(page.getByRole('textbox', { name: 'Nama wilayah' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Simpan perubahan' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Hapus wilayah', exact: true })).toHaveCount(0)
})

test('cancel deletion makes no request; confirmed deletion refreshes the list', async ({
  page,
}) => {
  let deleted = false
  let writes = 0
  await page.route(api, (route) => {
    if (route.request().method() === 'DELETE') {
      deleted = true
      writes++
    }
    return route.fulfill({ json: { success: true, data: deleted ? { deleted: true } : area } })
  })
  await page.route('**/api/community/areas?*', (route) =>
    route.fulfill({ json: { success: true, data: { data: deleted ? [parent] : [area, parent] } } }),
  )
  await page.goto('/manage/areas')
  await page.getByRole('link', { name: 'RT Melati', exact: true }).click()
  await page.getByRole('button', { name: 'Hapus wilayah', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toContainText('RT Melati (01)')
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  expect(writes).toBe(0)
  await page.getByRole('button', { name: 'Hapus wilayah', exact: true }).click()
  await page.getByRole('button', { name: 'Ya, hapus wilayah' }).click()
  await expect(page).toHaveURL('/manage/areas')
  await expect(page.getByRole('link', { name: 'RT Melati', exact: true })).toHaveCount(0)
  expect(writes).toBe(1)
})

for (const status of [403, 409, 422]) {
  test(`update ${status} preserves form values and surfaces backend errors`, async ({ page }) => {
    await page.route(api, (route) =>
      route.request().method() === 'PATCH'
        ? route.fulfill({
            status,
            json: {
              message: 'Perubahan ditolak server',
              errors: status === 422 ? { code: ['Kode tidak valid'] } : undefined,
            },
          })
        : route.fulfill({ json: { success: true, data: area } }),
    )
    await page.goto(path)
    await page.getByRole('textbox', { name: 'Nama wilayah' }).fill('Nama baru')
    await page.getByRole('button', { name: 'Simpan perubahan' }).click()
    await expect(page.getByText('Perubahan ditolak server')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Nama wilayah' })).toHaveValue('Nama baru')
    await expect(page).toHaveURL(path)
  })
}

test('in-use deletion stays on detail and retains unsaved changes', async ({ page }) => {
  await page.route(api, (route) =>
    route.request().method() === 'DELETE'
      ? route.fulfill({
          status: 409,
          json: { code: 'area.in_use', message: 'Wilayah masih digunakan' },
        })
      : route.fulfill({ json: { success: true, data: area } }),
  )
  await page.goto(path)
  await page.getByRole('textbox', { name: 'Nama wilayah' }).fill('Belum disimpan')
  await page.getByRole('button', { name: 'Hapus wilayah', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    'Perubahan formulir yang belum disimpan',
  )
  await page.getByRole('button', { name: 'Ya, hapus wilayah' }).click()
  await expect(page.getByText('Wilayah masih digunakan', { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Nama wilayah' })).toHaveValue('Belum disimpan')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('link', { name: 'Kembali ke daftar wilayah' }).click()
  await expect(page).toHaveURL(path)
})

test('unavailable parent uses readable fallback and can retry', async ({ page }) => {
  await page.route(`**/api/community/areas/${parentId}`, (route) =>
    route.fulfill({ status: 403, json: { message: 'Forbidden' } }),
  )
  await page.goto(path)
  await expect(page.getByText('RW induk: RW induk tidak tersedia')).toBeVisible()
  await expect(page.locator('main')).not.toContainText(parentId)
  await page.route(`**/api/community/areas/${parentId}`, (route) =>
    route.fulfill({ json: { success: true, data: parent } }),
  )
  await page.getByRole('button', { name: 'Muat ulang RW induk' }).click()
  await expect(page.getByText('RW induk: RW Mawar · 02')).toBeVisible()
})

test('detail failure offers retry without exposing mutation controls', async ({ page }) => {
  await page.route(api, (route) =>
    route.fulfill({ status: 404, json: { message: 'Wilayah tidak tersedia' } }),
  )
  await page.goto(path)
  await expect(page.getByText('Wilayah tidak tersedia')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hapus wilayah', exact: true })).toHaveCount(0)
  await page.route(api, (route) => route.fulfill({ json: { success: true, data: area } }))
  await page.getByRole('button', { name: 'Coba lagi' }).click()
  await expect(page.getByRole('textbox', { name: 'Nama wilayah' })).toHaveValue('RT Melati')
})

test('area detail and confirmation fit mobile dark English', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(path)
  await page.getByRole('button', { name: 'Aktifkan mode gelap' }).click()
  await page.getByRole('combobox', { name: 'Bahasa', exact: true }).selectOption('en')
  await expect(page.getByRole('heading', { name: 'Area details', level: 2 })).toBeVisible()
  await page.getByRole('button', { name: 'Delete area', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toContainText('Deletion cannot be undone.')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'e2e/artifacts/area-dark-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
})
