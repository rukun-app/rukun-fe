import { test, expect } from '@playwright/test'
const householdId = '10000000-0000-4000-8000-000000000001'
const areaId = '20000000-0000-4000-8000-000000000001'
const household = {
  public_id: householdId,
  reference: 'KK-001',
  address: 'Jalan Melati 1',
  area_id: areaId,
  block: 'A',
  house_number: '1',
  status: 'active',
  occupancy_status: 'occupied',
}
const permissions = [
  'households.view',
  'households.manage',
  'residents.view',
  'residents.manage',
  'areas.view',
  'areas.manage',
]

test.beforeEach(async ({ page }) => {
  await page.route('**/api/community/areas?*', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          data: [{ public_id: areaId, kind: 'rt', name: 'RT Melati', code: '01' }],
          next_cursor: null,
        },
      },
    }),
  )
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'test-token'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { id: 1, name: 'Test', email: null, status: 'active', roles: [], permissions },
      },
    }),
  )
})

test('household list follows opaque cursor and displays authorized details', async ({ page }) => {
  await page.route('**/api/community/households?*', async (route) => {
    const cursor = new URL(route.request().url()).searchParams.get('cursor')
    await route.fulfill({
      json: {
        success: true,
        data: {
          data: cursor ? [] : [household],
          next_cursor: cursor ? null : 'opaque-next',
          prev_cursor: cursor ? 'opaque-prev' : null,
        },
      },
    })
  })
  await page.goto('/manage/households')
  await expect(page.getByRole('link', { name: 'Jalan Melati 1', exact: true })).toBeVisible()
  await expect(page.getByText('Jalan Melati 1')).toBeVisible()
  await page.getByRole('button', { name: 'Berikutnya' }).click()
  await expect(page.getByText('Belum ada KK', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sebelumnya' })).toBeEnabled()
})

test('household creation validates and sends the backend contract with idempotency', async ({
  page,
}) => {
  let submitted: Record<string, unknown> | undefined
  let key: string | undefined
  await page.route('**/api/community/households', async (route) => {
    submitted = route.request().postDataJSON()
    key = route.request().headers()['idempotency-key']
    await route.fulfill({ json: { success: true, data: household } })
  })
  await page.route('**/api/community/households?*', (route) =>
    route.fulfill({
      json: { success: true, data: { data: [household], next_cursor: null, prev_cursor: null } },
    }),
  )
  await page.goto('/manage/households/new')
  await page.getByRole('button', { name: 'Simpan KK' }).click()
  await expect(page.getByText('Alamat wajib diisi')).toBeVisible()
  expect(submitted).toBeUndefined()
  await page.getByRole('combobox', { name: 'Pilih wilayah RT' }).click()
  await page.getByRole('option', { name: 'RT Melati · 01' }).click()
  await page.getByRole('textbox', { name: 'Alamat', exact: true }).fill('Jalan Melati 1')
  await page.getByRole('button', { name: 'Simpan KK' }).click()
  await expect(page).toHaveURL(/\/manage\/households$/)
  expect(submitted).toMatchObject({
    area_id: areaId,
    address: 'Jalan Melati 1',
    occupancy_status: 'occupied',
  })
  expect(key).toMatch(/^[0-9a-f-]{36}$/)
})

test('view-only user cannot open creation route', async ({ page }) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          id: 1,
          name: 'Test',
          email: null,
          status: 'active',
          roles: [],
          permissions: ['households.view'],
        },
      },
    }),
  )
  await page.goto('/manage/households/new')
  await expect(page.getByRole('heading', { name: 'Akses tidak tersedia' })).toBeVisible()
})

test('household details avoid requesting NIK/KK and handle server validation', async ({ page }) => {
  const sensitiveRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/sensitive')) sensitiveRequests.push(request.url())
  })
  await page.route(`**/api/community/households/${householdId}`, async (route) => {
    await route.fulfill(
      route.request().method() === 'PATCH'
        ? {
            status: 422,
            json: {
              success: false,
              code: 'validation.failed',
              message: 'Data belum dapat disimpan',
              errors: { address: ['Alamat tidak valid'] },
            },
          }
        : { json: { success: true, data: household } },
    )
  })
  await page.goto(`/manage/households/${householdId}`)
  await expect(page.getByRole('textbox', { name: 'Alamat', exact: true })).toHaveValue(
    'Jalan Melati 1',
  )
  await page.getByRole('textbox', { name: 'Alamat', exact: true }).fill('Alamat baru')
  await page.getByRole('button', { name: 'Simpan KK' }).click()
  await expect(page.getByRole('alert')).toContainText('Alamat tidak valid')
  expect(sensitiveRequests).toEqual([])
})

test('mobile dashboard fits without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/manage/dashboard')
  await expect(page.getByRole('heading', { name: 'Selamat datang, Test' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({ path: 'e2e/artifacts/dashboard-mobile.png', fullPage: true })
})

test('mobile navigation opens, closes with Escape, and navigates from the drawer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/manage/dashboard')
  const trigger = page.getByRole('button', { name: 'Buka menu navigasi' })
  await trigger.click()
  const drawer = page.getByRole('dialog', { name: 'Menu lingkungan' })
  await expect(drawer).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(trigger).toBeFocused()
  await page.route('**/api/community/residents?*', (route) =>
    route.fulfill({
      json: { success: true, data: { data: [], next_cursor: null, prev_cursor: null } },
    }),
  )
  await trigger.click()
  await drawer.getByRole('link', { name: 'Data Warga', exact: true }).click()
  await expect(page).toHaveURL(/\/manage\/residents$/)
  await expect(drawer).toBeHidden()
  await expect(page.getByText('Belum ada warga', { exact: true })).toBeVisible()
})

test('selected access survives reload and account menu can switch or log out', async ({ page }) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          id: 1,
          name: 'Test',
          email: null,
          status: 'active',
          roles: [],
          permissions: [...permissions, 'users.view'],
        },
      },
    }),
  )
  await page.route('**/api/auth/logout', (route) =>
    route.fulfill({ json: { success: true, data: { message: 'OK' } } }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: /Pengelolaan lingkungan/ }).click()
  await expect(page).toHaveURL(/\/manage\/dashboard$/)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Selamat datang, Test' })).toBeVisible()
  await page.getByRole('button', { name: 'Menu akun' }).click()
  await page.getByRole('menuitem', { name: 'Ganti akses' }).click()
  await expect(page).toHaveURL(/\/auth\/select-context$/)
  await page.getByRole('button', { name: /Pengelolaan lingkungan/ }).click()
  await page.getByRole('button', { name: 'Menu akun' }).click()
  await page.getByRole('menuitem', { name: 'Keluar' }).click()
  await expect(page).toHaveURL(/\/auth\/login$/)
  expect(await page.evaluate(() => sessionStorage.getItem('rukun:context'))).toBeNull()
})

test('mobile household form keeps fields and actions inside viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/manage/households/new')
  await expect(page.getByRole('textbox', { name: 'Alamat', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Simpan KK' })).toBeEnabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({ path: 'e2e/artifacts/household-form-mobile.png', fullPage: true })
})

test('RT form selects only RW parents across cursor pages', async ({ page }) => {
  const rwId = '30000000-0000-4000-8000-000000000001'
  let submitted: Record<string, unknown> | undefined
  await page.route('**/api/community/areas?*', (route) => {
    const next = new URL(route.request().url()).searchParams.get('cursor')
    return route.fulfill({
      json: {
        success: true,
        data: {
          data: next
            ? [{ public_id: rwId, kind: 'rw', name: 'RW Mawar', code: '03' }]
            : [{ public_id: areaId, kind: 'rt', name: 'RT Melati', code: '01' }],
          next_cursor: next ? null : 'next-rw',
        },
      },
    })
  })
  await page.route('**/api/community/areas', (route) => {
    submitted = route.request().postDataJSON()
    return route.fulfill({ json: { success: true, data: { public_id: areaId, ...submitted } } })
  })
  await page.goto('/manage/areas')
  await page.getByRole('button', { name: 'Tambah wilayah' }).click()
  await page.locator('#kind').click()
  await page.getByRole('option', { name: 'Rukun Tetangga (RT)', exact: true }).click()
  await page.getByRole('textbox', { name: 'Kode' }).fill('02')
  await page.getByRole('textbox', { name: 'Nama wilayah' }).fill('RT Baru')
  await page.getByRole('combobox', { name: 'Pilih RW induk' }).click()
  await expect(page.getByRole('option', { name: 'RT Melati · 01' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Muat pilihan berikutnya' }).click()
  await page.getByRole('option', { name: 'RW Mawar · 03' }).click()
  await page.getByRole('button', { name: 'Simpan wilayah' }).click()
  await expect.poll(() => submitted).toMatchObject({ kind: 'rt', parent_id: rwId, name: 'RT Baru' })
})

test('resident form resolves a preselected household outside the first page', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined
  await page.route('**/api/community/households?*', (route) =>
    route.fulfill({ json: { success: true, data: { data: [], next_cursor: null } } }),
  )
  await page.route(`**/api/community/households/${householdId}`, (route) =>
    route.fulfill({ json: { success: true, data: household } }),
  )
  await page.route('**/api/community/residents?*', (route) =>
    route.fulfill({ json: { success: true, data: { data: [] } } }),
  )
  await page.route('**/api/community/residents', (route) => {
    submitted = route.request().postDataJSON()
    return route.fulfill({
      json: { success: true, data: { public_id: 'resident-id', ...submitted } },
    })
  })
  await page.goto(`/manage/residents/new?household=${householdId}`)
  await expect(page.getByRole('combobox', { name: 'Pilih kartu keluarga' })).toContainText(
    'KK-001 · Jalan Melati 1',
  )
  await page.getByRole('textbox', { name: 'Nama lengkap', exact: true }).fill('Warga Baru')
  await page.getByRole('button', { name: 'Simpan warga' }).click()
  await expect(page).toHaveURL(/\/manage\/residents$/)
  expect(submitted).toMatchObject({
    household_id: householdId,
    name: 'Warga Baru',
    relationship: 'other',
  })
})

test('reference errors offer retry and recover into named choices', async ({ page }) => {
  let failing = true
  await page.route('**/api/community/areas?*', (route) =>
    route.fulfill(
      failing
        ? { status: 403, json: { message: 'Unavailable' } }
        : {
            json: {
              success: true,
              data: { data: [{ public_id: areaId, kind: 'rt', name: 'RT Melati' }] },
            },
          },
    ),
  )
  await page.goto('/manage/households/new')
  await expect(page.getByRole('alert')).toContainText('Pilihan gagal dimuat.')
  failing = false
  await page.getByRole('button', { name: 'Coba lagi' }).click()
  await page.getByRole('combobox', { name: 'Pilih wilayah RT' }).click()
  await expect(page.getByRole('option', { name: 'RT Melati' })).toBeVisible()
})

test('language and dark theme persist through reload and apply to forms', async ({ page }) => {
  await page.goto('/manage/dashboard')
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  await page.getByRole('button', { name: 'Aktifkan mode gelap' }).click()
  await page.getByRole('combobox', { name: 'Bahasa', exact: true }).selectOption('en')
  await expect(page.getByRole('heading', { name: 'Welcome, Test' })).toBeVisible()
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.goto('/manage/households/new')
  await expect(page.getByRole('heading', { name: 'Add Household', exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Choose RT area' })).toBeVisible()
  await page.getByRole('button', { name: 'Save household' }).click()
  await expect(page.getByText('Address is required')).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'e2e/artifacts/household-dark-en.png', fullPage: true })
  await page.getByRole('button', { name: 'Use light mode' }).click()
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('id')
  await expect(page.getByRole('button', { name: 'Simpan KK' })).toBeVisible()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
})

test('household DataTable uses addresses, supports search and sort, and fits mobile', async ({
  page,
}) => {
  await page.route('**/api/community/households?*', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          data: [
            { ...household, address: 'Zaitun 1' },
            {
              ...household,
              public_id: 'second',
              address: 'Anggrek 2',
              reference: 'internal-reference',
            },
          ],
        },
      },
    }),
  )
  await page.goto('/manage/households')
  const table = page.getByRole('table', { name: 'Daftar keluarga' })
  await expect(table.getByRole('columnheader', { name: 'ALAMAT' })).toBeVisible()
  await expect(table).not.toContainText('KK-001')
  await expect(table).not.toContainText('internal-reference')
  await table.getByRole('columnheader', { name: 'ALAMAT' }).click()
  await expect(table.locator('tbody tr').first()).toContainText('Anggrek 2')
  await page.getByRole('textbox', { name: 'Cari di halaman ini' }).fill('zaitun')
  await expect(table.locator('tbody tr')).toHaveCount(1)
  await expect(table).toContainText('Zaitun 1')
  await page.getByRole('button', { name: 'Hapus pencarian' }).click()
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'e2e/artifacts/datatable-mobile.png', fullPage: true })
})

test('resident DataTable displays readable columns without technical reference', async ({
  page,
}) => {
  await page.route('**/api/community/residents?*', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          data: [
            {
              public_id: 'resident-id',
              name: 'Siti Aminah',
              reference: 'RES-technical-001',
              phone: '08123456789',
              status: 'active',
            },
          ],
        },
      },
    }),
  )
  await page.goto('/manage/residents')
  const table = page.getByRole('table', { name: 'Daftar warga' })
  await expect(table).toContainText('Siti Aminah')
  await expect(table).not.toContainText('RES-technical-001')
  await expect(table.getByRole('columnheader', { name: 'REFERENSI' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Aktifkan mode gelap' }).click()
  await page.getByRole('combobox', { name: 'Bahasa', exact: true }).selectOption('en')
  await expect(
    page
      .getByRole('table', { name: 'Resident list' })
      .getByRole('columnheader', { name: 'RESIDENT NAME' }),
  ).toBeVisible()
  await page.screenshot({ path: 'e2e/artifacts/datatable-dark-en.png', fullPage: true })
})
