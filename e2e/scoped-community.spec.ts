import { test, expect } from '@playwright/test'

const homeId = '10000000-0000-4000-8000-000000000001'
const rtId = '20000000-0000-4000-8000-000000000001'
const householdContext = {
  id: `household:${homeId}`,
  type: 'household',
  label: 'Rumah Demo 01',
  scope: { type: 'household', id: homeId },
  capabilities: ['households.view', 'residents.view'],
}
const managementContext = {
  id: `rt:${rtId}`,
  type: 'management',
  label: 'RT 01 Demo',
  scope: { type: 'rt', id: rtId },
  capabilities: ['households.view', 'residents.view', 'areas.view'],
}

test('resident context displays only its household and members', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'scoped-test-token'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          id: 1,
          name: 'Warga Demo',
          email: 'demo@example.test',
          status: 'active',
          roles: [],
          permissions: [],
          contexts: [householdContext],
        },
      },
    }),
  )
  await page.route(`**/api/community/households/${homeId}`, (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          public_id: homeId,
          reference: 'DEMO-COM-H01',
          address: 'Jalan Melati Demo No. 1',
          house_number: '01',
          status: 'active',
        },
      },
    }),
  )
  await page.route('**/api/community/residents?*', (route) => {
    expect(new URL(route.request().url()).searchParams.get('household_id')).toBe(homeId)
    return route.fulfill({
      json: {
        success: true,
        data: {
          data: ['Budi Demo', 'Siti Demo', 'Andi Demo', 'Dina Demo'].map((name, i) => ({
            public_id: `person-${i}`,
            name,
            birth_date: '2000-01-01',
            status: 'active',
          })),
          next_cursor: null,
          prev_cursor: null,
        },
      },
    })
  })
  await page.goto('/app/home')
  await expect(page.getByRole('heading', { name: 'Keluarga saya', level: 2 })).toBeVisible()
  await expect(page.getByText('Jalan Melati Demo No. 1')).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Budi Demo', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Dina Demo', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Simpan', exact: true })).toHaveCount(0)
})

test('scoped RT user can select management without global permissions', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'scoped-test-token'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          id: 2,
          name: 'Pengurus Demo',
          email: 'rt@example.test',
          status: 'active',
          roles: [],
          permissions: [],
          contexts: [managementContext, householdContext],
        },
      },
    }),
  )
  await page.goto('/auth/select-context')
  await page.getByRole('button', { name: /RT 01 Demo/ }).click()
  await expect(page).toHaveURL(/\/manage\/dashboard$/)
  await expect(page.getByRole('link', { name: /Kartu Keluarga/ }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Data Warga/ }).first()).toBeVisible()
})
