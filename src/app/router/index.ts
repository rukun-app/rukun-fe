import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { session } from '@/auth/stores/session'
import { ensureSession, hydrationError } from '@/auth/services/authentication'

// Route meta type augmentation
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    /** Block access until mustChangePassword === false */
    requiresPasswordChange?: boolean
    /** Allowed active context types; empty/absent = any */
    contextTypes?: string[]
    requiredCapabilities?: string[]
    title?: string
  }
}

const Placeholder = () => import('@/app/layouts/PlaceholderPage.vue')

const routes: RouteRecordRaw[] = [
  // Auth — bare layout (no shell)
  {
    path: '/auth',
    meta: { requiresAuth: false },
    component: () => import('@/app/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'session-error',
        name: 'auth.session-error',
        component: () => import('@/auth/pages/SessionErrorPage.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'login',
        name: 'auth.login',
        component: () => import('@/auth/pages/LoginPage.vue'),
        meta: { requiresAuth: false, title: 'Masuk' },
      },
      {
        path: 'forgot-password',
        name: 'auth.forgot-password',
        component: () => import('@/auth/pages/ForgotPasswordPage.vue'),
        meta: { requiresAuth: false, title: 'Lupa Password' },
      },
      {
        path: 'change-initial-password',
        name: 'auth.change-initial-password',
        component: () => import('@/auth/pages/ChangeInitialPasswordPage.vue'),
        meta: { requiresAuth: true, requiresPasswordChange: true, title: 'Buat Password' },
      },
      {
        path: 'select-context',
        name: 'auth.select-context',
        component: () => import('@/auth/pages/SelectContextPage.vue'),
        meta: { requiresAuth: true, title: 'Pilih Akses' },
      },
    ],
  },

  // Resident — ResidentShell
  {
    path: '/app',
    component: () => import('@/app/layouts/ResidentShell.vue'),
    meta: { requiresAuth: true, contextTypes: ['household'] },
    children: [
      { path: 'home', name: 'app.home', component: Placeholder, meta: { title: 'Beranda' } },
      { path: 'billing', name: 'app.billing', component: Placeholder, meta: { title: 'Tagihan' } },
      {
        path: 'billing/:id',
        name: 'app.billing.detail',
        component: Placeholder,
        meta: { title: 'Detail Tagihan' },
      },
      {
        path: 'payments',
        name: 'app.payments',
        component: Placeholder,
        meta: { title: 'Riwayat Pembayaran' },
      },
      {
        path: 'patrol',
        name: 'app.patrol',
        component: Placeholder,
        meta: { title: 'Jadwal Ronda' },
      },
      {
        path: 'services',
        name: 'app.services',
        component: Placeholder,
        meta: { title: 'Layanan' },
      },
      {
        path: 'marketplace',
        name: 'app.marketplace',
        component: Placeholder,
        meta: { title: 'Marketplace' },
      },
      { path: 'account', name: 'app.account', component: Placeholder, meta: { title: 'Akun' } },
      {
        path: 'notifications',
        name: 'app.notifications',
        component: Placeholder,
        meta: { title: 'Notifikasi' },
      },
    ],
  },

  // Management — ManagementShell
  {
    path: '/manage',
    component: () => import('@/app/layouts/ManagementShell.vue'),
    meta: { requiresAuth: true, contextTypes: ['management'] },
    children: [
      {
        path: 'dashboard',
        name: 'manage.dashboard',
        component: () => import('@/features/community/DashboardPage.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'areas',
        name: 'manage.areas',
        component: () => import('@/features/community/AreasPage.vue'),
        meta: { title: 'Wilayah', requiredCapabilities: ['areas.view'] },
      },
      {
        path: 'households/new',
        name: 'manage.households.new',
        component: () => import('@/features/community/HouseholdPage.vue'),
        meta: { title: 'Tambah KK', requiredCapabilities: ['households.manage'] },
      },
      {
        path: 'residents/new',
        name: 'manage.residents.new',
        component: () => import('@/features/community/ResidentPage.vue'),
        meta: { title: 'Tambah warga', requiredCapabilities: ['residents.manage'] },
      },
      {
        path: 'residents/:id',
        name: 'manage.residents.detail',
        component: () => import('@/features/community/ResidentPage.vue'),
        meta: { title: 'Detail warga', requiredCapabilities: ['residents.view'] },
      },
      {
        path: 'households',
        name: 'manage.households',
        component: () => import('@/features/community/HouseholdsPage.vue'),
        meta: { requiredCapabilities: ['households.view'], title: 'Kartu Keluarga' },
      },
      {
        path: 'households/:id',
        name: 'manage.households.detail',
        component: () => import('@/features/community/HouseholdPage.vue'),
        meta: { requiredCapabilities: ['households.view'], title: 'Detail KK' },
      },
      {
        path: 'residents',
        name: 'manage.residents',
        component: () => import('@/features/community/ResidentsPage.vue'),
        meta: { requiredCapabilities: ['residents.view'], title: 'Daftar Warga' },
      },
      {
        path: 'billing',
        name: 'manage.billing',
        component: Placeholder,
        meta: { title: 'Tagihan' },
      },
      {
        path: 'payments',
        name: 'manage.payments',
        component: Placeholder,
        meta: { title: 'Verifikasi Pembayaran' },
      },
      { path: 'cashbook', name: 'manage.cashbook', component: Placeholder, meta: { title: 'Kas' } },
      { path: 'wifi', name: 'manage.wifi', component: Placeholder, meta: { title: 'WiFi' } },
      { path: 'patrol', name: 'manage.patrol', component: Placeholder, meta: { title: 'Ronda' } },
      {
        path: 'activities',
        name: 'manage.activities',
        component: Placeholder,
        meta: { title: 'Kegiatan' },
      },
      {
        path: 'services',
        name: 'manage.services',
        component: Placeholder,
        meta: { title: 'Layanan Warga' },
      },
      {
        path: 'reports',
        name: 'manage.reports',
        component: Placeholder,
        meta: { title: 'Laporan' },
      },
    ],
  },

  // Vendor — VendorShell
  {
    path: '/vendor',
    component: () => import('@/app/layouts/VendorShell.vue'),
    meta: { requiresAuth: true, contextTypes: ['vendor'] },
    children: [
      {
        path: 'dashboard',
        name: 'vendor.dashboard',
        component: Placeholder,
        meta: { title: 'Dashboard Vendor' },
      },
      {
        path: 'customers',
        name: 'vendor.customers',
        component: Placeholder,
        meta: { title: 'Pelanggan' },
      },
      {
        path: 'delivery',
        name: 'vendor.delivery',
        component: Placeholder,
        meta: { title: 'Pengiriman' },
      },
      {
        path: 'history',
        name: 'vendor.history',
        component: Placeholder,
        meta: { title: 'Riwayat' },
      },
    ],
  },

  // System — SystemShell
  {
    path: '/system',
    component: () => import('@/app/layouts/SystemShell.vue'),
    meta: { requiresAuth: true, contextTypes: ['system'] },
    children: [
      {
        path: 'overview',
        name: 'system.overview',
        component: Placeholder,
        meta: { title: 'Ringkasan sistem' },
      },
      { path: 'users', name: 'system.users', component: Placeholder, meta: { title: 'Pengguna' } },
      {
        path: 'settings',
        name: 'system.settings',
        component: Placeholder,
        meta: { title: 'Pengaturan' },
      },
    ],
  },

  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/app/layouts/ForbiddenPage.vue'),
    meta: { requiresAuth: true },
  },
  // Fallback
  { path: '/', redirect: '/auth/login' },
  { path: '/:pathMatch(.*)*', redirect: '/auth/login' },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_, __, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

// ─── Navigation guard ────────────────────────────────────────────────────────
// Auth guard: token-based only. Authorization enforced at backend.
// Context guard: checks active context type matches route's contextTypes.
// mustChangePassword guard: forces change-password screen before anything else.
router.beforeEach(async (to) => {
  const requiresAuth = to.meta.requiresAuth === true
  if (to.name === 'auth.session-error') return
  await ensureSession()
  if (session.isAuthenticated() && hydrationError.value) return { name: 'auth.session-error' }
  const isAuthenticated = session.isAuthenticated()

  // 1. Unauthenticated → login
  if (requiresAuth && !isAuthenticated) {
    return { name: 'auth.login', query: { redirect: to.fullPath } }
  }

  // 2. Already authenticated → skip login page
  if (!requiresAuth && isAuthenticated && to.name === 'auth.login') {
    return resolveAuthenticatedHome()
  }

  if (!isAuthenticated) return // public route, no further checks

  const user = session.getUser()

  // 3. mustChangePassword → force change password (unless already heading there)
  if (user?.mustChangePassword && to.name !== 'auth.change-initial-password') {
    return { name: 'auth.change-initial-password' }
  }

  // 4. requiresPasswordChange route: only accessible when mustChangePassword is true
  if (to.meta.requiresPasswordChange && !user?.mustChangePassword) {
    return resolveAuthenticatedHome()
  }

  // 5. contextTypes check
  const allowedTypes = to.matched.flatMap((r) => r.meta.contextTypes ?? []).filter(Boolean)

  if (allowedTypes.length > 0) {
    // Dynamic import to avoid circular dep at module level
    const { useContextStore } = await import('@/contexts/stores/context')
    const ctxStore = useContextStore()
    const activeType = ctxStore.activeContext?.type

    if (!activeType) {
      // No active context yet — send to context selector
      return { name: 'auth.select-context', query: { redirect: to.fullPath } }
    }

    if (!allowedTypes.includes(activeType)) {
      // Wrong context type — send to context selector
      return { name: 'auth.select-context' }
    }
  }
  const { useContextStore } = await import('@/contexts/stores/context')
  if (to.meta.requiredCapabilities?.some((capability) => !useContextStore().can(capability)))
    return { name: 'forbidden' }
})

// ─── helper ─────────────────────────────────────────────────────────────────
async function resolveAuthenticatedHome() {
  const { useContextStore } = await import('@/contexts/stores/context')
  const ctxStore = useContextStore()
  if (session.getUser()?.mustChangePassword) return { name: 'auth.change-initial-password' }
  const ctxType = ctxStore.activeContext?.type

  if (!ctxType) return { name: 'auth.select-context' }

  const map: Record<string, string> = {
    household: 'app.home',
    management: 'manage.dashboard',
    vendor: 'vendor.dashboard',
    system: 'system.overview',
  }
  return { name: map[ctxType] ?? 'auth.select-context' }
}
