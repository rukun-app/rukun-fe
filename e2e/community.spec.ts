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
  await expect(page.getByRole('link', { name: 'KK-001', exact: true })).toBeVisible()
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
  await page.getByLabel('UUID wilayah RT').fill(areaId)
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
