import { test, expect, type Page } from '@playwright/test'
const initialUser = {
  id: 10,
  public_id: '10000000-0000-4000-8000-000000000001',
  name: 'Warga Awal',
  email: 'resident@example.test',
  phone: '+6281234567890',
  locale: 'id',
  status: 'active',
  roles: [],
  permissions: ['areas.view'],
  must_change_password: false,
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'account-session'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: initialUser } }),
  )
})
async function passwords(page: Page, current = 'old-password', next = 'new-password') {
  await page.getByLabel('Kata Sandi Saat Ini', { exact: true }).fill(current)
  await page.getByLabel('Kata Sandi Baru', { exact: true }).fill(next)
  await page.getByLabel('Konfirmasi Kata Sandi Baru', { exact: true }).fill(next)
}

test('account menu opens shared page and profile save applies server name and locale', async ({
  page,
}) => {
  let submitted: unknown
  await page.route('**/api/auth/profile', (route) => {
    submitted = route.request().postDataJSON()
    return route.fulfill({
      json: { success: true, data: { ...initialUser, name: 'Nama Baru', locale: 'en' } },
    })
  })
  await page.goto('/manage/dashboard')
  await page.getByRole('button', { name: 'Menu akun' }).click()
  await page.getByRole('menuitem', { name: 'Akun saya' }).click()
  await expect(page).toHaveURL('/account')
  await page.getByRole('textbox', { name: 'Nama lengkap' }).fill('Nama Baru')
  await page.getByRole('combobox', { name: 'Bahasa akun', exact: true }).click()
  await page.getByRole('option', { name: 'English', exact: true }).click()
  await page.getByRole('button', { name: 'Simpan profil', exact: true }).click()
  await expect(page.getByText('Profile saved', { exact: true })).toBeVisible()
  expect(submitted).toEqual({ name: 'Nama Baru', locale: 'en' })
  await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveValue('Nama Baru')
  expect(await page.evaluate(() => localStorage.getItem('rukun:locale'))).toBe('en')
})

for (const type of ['household', 'management', 'vendor', 'none']) {
  test(`shared account is accessible to ${type} without profile-management permissions`, async ({
    page,
  }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            ...initialUser,
            permissions: [],
            contexts:
              type === 'none'
                ? []
                : [
                    {
                      id: `${type}:test`,
                      type,
                      label: 'Akses uji',
                      scope: { type: type === 'management' ? 'rt' : type, id: 'scope-test' },
                      capabilities: [],
                    },
                  ],
          },
        },
      }),
    )
    await page.goto(type === 'household' ? '/app/account' : '/account')
    await expect(page.getByRole('heading', { name: 'Akun saya', exact: true })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Nama lengkap' })).toHaveValue('Warga Awal')
    await expect(page.getByRole('button', { name: 'Simpan profil', exact: true })).toBeEnabled()
  })
}

test('profile validation and backend errors preserve edits without changing the UI language', async ({
  page,
}) => {
  let calls = 0
  await page.route('**/api/auth/profile', (route) => {
    calls++
    return route.fulfill({
      status: 422,
      json: { message: 'Nama ditolak', errors: { name: ['Periksa nama Anda'] } },
    })
  })
  await page.goto('/account')
  await page.getByRole('textbox', { name: 'Nama lengkap' }).fill(' ')
  await page.getByRole('button', { name: 'Simpan profil', exact: true }).click()
  await expect(page.getByText('Nama wajib diisi', { exact: true })).toBeVisible()
  expect(calls).toBe(0)
  await page.getByRole('textbox', { name: 'Nama lengkap' }).fill('Nama Belum Disimpan')
  await page.getByRole('combobox', { name: 'Bahasa akun', exact: true }).click()
  await page.getByRole('option', { name: 'English', exact: true }).click()
  await page.getByRole('button', { name: 'Simpan profil', exact: true }).click()
  await expect(page.getByText('Nama ditolak', { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Nama lengkap' })).toHaveValue(
    'Nama Belum Disimpan',
  )
  await expect(page.getByRole('heading', { name: 'Akun saya', exact: true })).toBeVisible()
})

test('password update keeps current session and clears inputs only after server success', async ({
  page,
}) => {
  let payload: unknown
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  let calls = 0
  await page.route('**/api/auth/password', async (route) => {
    calls++
    payload = route.request().postDataJSON()
    await pending
    await route.fulfill({ json: { success: true, data: { message: 'Changed' } } })
  })
  await page.goto('/account')
  await passwords(page)
  await page.getByRole('button', { name: 'Simpan Kata Sandi' }).click()
  await expect.poll(() => calls).toBe(1)
  await expect(page.getByRole('button', { name: 'Simpan Kata Sandi' })).toBeDisabled()
  release()
  await expect(
    page.getByText('Kata sandi diperbarui. Sesi perangkat lain telah dicabut oleh server.'),
  ).toBeVisible()
  expect(payload).toEqual({
    current_password: 'old-password',
    password: 'new-password',
    password_confirmation: 'new-password',
  })
  await expect(page.getByLabel('Kata Sandi Baru', { exact: true })).toHaveValue('')
  expect(await page.evaluate(() => localStorage.getItem('rukun:token'))).toBe('account-session')
})

test('incorrect current password shows backend error and keeps the form', async ({ page }) => {
  await page.route('**/api/auth/password', (route) =>
    route.fulfill({
      status: 422,
      json: {
        message: 'Password salah',
        errors: { current_password: ['Kata sandi saat ini tidak sesuai'] },
      },
    }),
  )
  await page.goto('/account')
  await passwords(page)
  await page.getByRole('button', { name: 'Simpan Kata Sandi' }).click()
  await expect(page.getByText('Kata sandi saat ini tidak sesuai', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Kata Sandi Baru', { exact: true })).toHaveValue('new-password')
})

test('saving profile does not discard unsaved password changes or its leave guard', async ({
  page,
}) => {
  await page.route('**/api/auth/profile', (route) =>
    route.fulfill({ json: { success: true, data: { ...initialUser, name: 'Nama Baru' } } }),
  )
  await page.goto('/account')
  await passwords(page)
  await page.getByRole('textbox', { name: 'Nama lengkap' }).fill('Nama Baru')
  await page.getByRole('button', { name: 'Simpan profil', exact: true }).click()
  await expect(page.getByText('Profil tersimpan', { exact: true })).toBeVisible()
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('link', { name: 'Kembali ke aplikasi' }).click()
  await expect(page).toHaveURL('/account')
  await expect(page.getByLabel('Kata Sandi Baru', { exact: true })).toHaveValue('new-password')
})

test('server language is adopted without local choice, and account supports dark mobile', async ({
  page,
}) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: { ...initialUser, locale: 'en' } } }),
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'My account', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Enable dark mode' }).click()
  await expect(page.getByRole('button', { name: 'Save profile', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({
    path: 'e2e/artifacts/account-dark-mobile.png',
    fullPage: true,
    animations: 'disabled',
  })
})
