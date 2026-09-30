import { test, expect, type Page } from '@playwright/test'
const token = 'test-reset-link-token'
const email = 'resident@example.test'
const password = 'New-password-123'
const link = `/reset-password?token=${token}&email=${encodeURIComponent(email)}`
async function fillPasswords(page: Page, value = password, confirmation = value) {
  await page.getByLabel('Kata Sandi Baru', { exact: true }).fill(value)
  await page.getByLabel('Konfirmasi Kata Sandi Baru', { exact: true }).fill(confirmation)
}

test('email link validates locally then submits once and removes reset credentials', async ({
  page,
}) => {
  let body: unknown
  let calls = 0
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/auth/reset-password', async (route) => {
    calls++
    body = route.request().postDataJSON()
    await pending
    await route.fulfill({ json: { success: true, data: { message: 'Reset complete' } } })
  })
  await page.goto(link)
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(email)
  await fillPasswords(page, 'too-short')
  await page.getByRole('button', { name: 'Simpan Kata Sandi' }).click()
  await expect(page.locator('#reset-password-error')).toContainText('12 karakter')
  expect(calls).toBe(0)
  await fillPasswords(page, password, 'different-password')
  await page.getByRole('button', { name: 'Simpan Kata Sandi' }).click()
  await expect(page.getByText('Kata sandi tidak cocok', { exact: true })).toBeVisible()
  expect(calls).toBe(0)
  await fillPasswords(page)
  await page.getByRole('button', { name: 'Simpan Kata Sandi' }).click()
  await expect.poll(() => calls).toBe(1)
  await expect(page.getByRole('button', { name: 'Simpan Kata Sandi' })).toBeDisabled()
  release()
  await expect(
    page.getByText('Kata sandi berhasil direset. Silakan masuk kembali dengan kata sandi baru.'),
  ).toBeVisible()
  await expect(page).toHaveURL('/auth/reset-password')
  expect(body).toEqual({ token, email, password, password_confirmation: password })
  await expect(page.getByLabel('Kata Sandi Baru', { exact: true })).toHaveCount(0)
  const stored = await page.evaluate(() =>
    JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]),
  )
  expect(stored).not.toContain(password)
  expect(stored).not.toContain(token)
  await page.getByRole('link', { name: 'Kembali ke halaman masuk' }).click()
  await expect(page).toHaveURL('/auth/login')
})

test('invalid links cannot submit and offer a new link', async ({ page }) => {
  let calls = 0
  await page.route('**/api/auth/reset-password', (route) => {
    calls++
    return route.fulfill({ status: 500, json: {} })
  })
  for (const query of [
    '',
    '?token=test',
    '?token=test&email=bad',
    '?token=one&token=two&email=a%40b.test',
  ]) {
    await page.goto(`/reset-password${query}`)
    await expect(
      page.getByText(
        'Tautan reset tidak lengkap atau tidak valid. Minta tautan baru melalui email.',
      ),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Simpan Kata Sandi' })).toHaveCount(0)
  }
  expect(calls).toBe(0)
  await page.getByRole('link', { name: 'Minta tautan reset baru' }).click()
  await expect(page).toHaveURL('/auth/forgot-password')
})

for (const status of [422, 429, 500]) {
  test(`reset ${status} stays usable and shows the backend error`, async ({ page }) => {
    await page.route('**/api/auth/reset-password', (route) =>
      route.fulfill({
        status,
        json: {
          message: 'Reset belum berhasil',
          errors:
            status === 422 ? { email: ['Tautan kedaluwarsa atau sudah digunakan'] } : undefined,
        },
      }),
    )
    await page.goto(link)
    await fillPasswords(page)
    await page.getByRole('button', { name: 'Simpan Kata Sandi' }).click()
    await expect(page.getByText('Reset belum berhasil', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Minta tautan reset baru' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Simpan Kata Sandi' })).toBeEnabled()
    await expect(page).toHaveURL(link)
  })
}

test('old session cannot block recovery and is cleared only after success', async ({ page }) => {
  let profileCalls = 0
  let authHeader: string | undefined
  let contextHeader: string | undefined
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'stale-session'))
  await page.route('**/api/auth/me', (route) => {
    profileCalls++
    return route.fulfill({ status: 500, json: {} })
  })
  await page.route('**/api/auth/reset-password', (route) => {
    authHeader = route.request().headers()['authorization']
    contextHeader = route.request().headers()['x-rukun-context']
    return route.fulfill({ json: { success: true } })
  })
  await page.goto(link)
  await expect(page.getByLabel('Kata Sandi Baru', { exact: true })).toBeEditable()
  expect(await page.evaluate(() => localStorage.getItem('rukun:token'))).toBe('stale-session')
  expect(profileCalls).toBe(0)
  await fillPasswords(page)
  await page.getByRole('button', { name: 'Simpan Kata Sandi' }).click()
  await expect(page).toHaveURL('/auth/reset-password')
  expect(authHeader).toBeUndefined()
  expect(contextHeader).toBeUndefined()
  expect(await page.evaluate(() => localStorage.getItem('rukun:token'))).toBeNull()
})

test('reset page works in mobile dark English and sends the selected API language', async ({
  page,
}) => {
  let locale: string | undefined
  await page.route('**/api/auth/reset-password', (route) => {
    locale = route.request().headers()['accept-language']
    return route.fulfill({ status: 422, json: { message: 'Reset link expired' } })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(link)
  await page.getByRole('button', { name: 'Aktifkan mode gelap' }).click()
  await page.getByRole('combobox', { name: 'Bahasa', exact: true }).selectOption('en')
  await expect(page.getByRole('heading', { name: 'Reset Password', exact: true })).toBeVisible()
  await page.getByLabel('New Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm New Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Save Password' }).click()
  await expect(page.getByText('Reset link expired', { exact: true })).toBeVisible()
  expect(locale).toBe('en')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({
    path: 'e2e/artifacts/reset-dark-mobile.png',
    fullPage: true,
    animations: 'disabled',
  })
})

test('API language defaults to ID, follows switching and survives reload', async ({ page }) => {
  const languages: string[] = []
  await page.route('**/api/auth/forgot-password', (route) => {
    languages.push(route.request().headers()['accept-language'] ?? '')
    return route.fulfill({ status: 422, json: { message: 'Try again' } })
  })
  await page.goto('/auth/forgot-password')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'Kirim Instruksi' }).click()
  await expect.poll(() => languages).toEqual(['id'])
  await page.getByRole('combobox', { name: 'Bahasa', exact: true }).selectOption('en')
  await page.getByRole('button', { name: 'Send Instructions' }).click()
  await expect.poll(() => languages).toEqual(['id', 'en'])
  await page.reload()
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'Send Instructions' }).click()
  await expect.poll(() => languages).toEqual(['id', 'en', 'en'])
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('id')
  await page.getByRole('button', { name: 'Kirim Instruksi' }).click()
  await expect.poll(() => languages).toEqual(['id', 'en', 'en', 'id'])
})

test('failed recovery preserves the old session and can request another link despite profile outage', async ({
  page,
}) => {
  let profileCalls = 0
  let requestedEmail: unknown
  await page.addInitScript(() => localStorage.setItem('rukun:token', 'old-session'))
  await page.route('**/api/auth/me', (route) => {
    profileCalls++
    return route.fulfill({ status: 500, json: {} })
  })
  await page.route('**/api/auth/reset-password', (route) =>
    route.fulfill({ status: 422, json: { message: 'Tautan telah kedaluwarsa' } }),
  )
  await page.route('**/api/auth/forgot-password', (route) => {
    requestedEmail = route.request().postDataJSON()
    return route.fulfill({ json: { success: true } })
  })
  await page.goto(link)
  await fillPasswords(page)
  await page.getByRole('button', { name: 'Simpan Kata Sandi' }).click()
  await expect(page.getByText('Tautan telah kedaluwarsa')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('rukun:token'))).toBe('old-session')
  await page.getByRole('link', { name: 'Minta tautan reset baru' }).click()
  await expect(page).toHaveURL('/auth/forgot-password')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'Kirim Instruksi' }).click()
  await expect.poll(() => requestedEmail).toEqual({ email })
  expect(profileCalls).toBe(0)
})
