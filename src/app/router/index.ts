import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { session } from '@/auth/stores/session'

// Route meta type augmentation
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    contextTypes?: string[]
    requiredCapabilities?: string[]
  }
}

const routes: RouteRecordRaw[] = [
  // Auth
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        name: 'auth.login',
        component: () => import('@/app/layouts/PlaceholderPage.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'forgot-password',
        name: 'auth.forgot-password',
        component: () => import('@/app/layouts/PlaceholderPage.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'change-initial-password',
        name: 'auth.change-initial-password',
        component: () => import('@/app/layouts/PlaceholderPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },

  // Resident (warga)
  {
    path: '/app',
    meta: { requiresAuth: true, contextTypes: ['household'] },
    children: [
      { path: 'home', name: 'app.home', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'bills', name: 'app.bills', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'payments', name: 'app.payments', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'patrol', name: 'app.patrol', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'services', name: 'app.services', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'marketplace', name: 'app.marketplace', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'account', name: 'app.account', component: () => import('@/app/layouts/PlaceholderPage.vue') },
    ],
  },

  // Management (pengurus RT/RW)
  {
    path: '/manage',
    meta: { requiresAuth: true, contextTypes: ['management'] },
    children: [
      { path: 'dashboard', name: 'manage.dashboard', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'households', name: 'manage.households', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'residents', name: 'manage.residents', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'billing', name: 'manage.billing', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'payments', name: 'manage.payments', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'cashbook', name: 'manage.cashbook', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'wifi', name: 'manage.wifi', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'patrol', name: 'manage.patrol', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'activities', name: 'manage.activities', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'services', name: 'manage.services', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'reports', name: 'manage.reports', component: () => import('@/app/layouts/PlaceholderPage.vue') },
    ],
  },

  // Vendor
  {
    path: '/vendor',
    meta: { requiresAuth: true, contextTypes: ['vendor'] },
    children: [
      { path: 'dashboard', name: 'vendor.dashboard', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'wifi', name: 'vendor.wifi', component: () => import('@/app/layouts/PlaceholderPage.vue') },
      { path: 'gallon', name: 'vendor.gallon', component: () => import('@/app/layouts/PlaceholderPage.vue') },
    ],
  },

  // System admin
  {
    path: '/system',
    meta: { requiresAuth: true, contextTypes: ['system'] },
    children: [
      { path: '', name: 'system.index', component: () => import('@/app/layouts/PlaceholderPage.vue') },
    ],
  },

  // Fallback
  { path: '/', redirect: '/auth/login' },
  { path: '/:pathMatch(.*)*', redirect: '/auth/login' },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Global navigation guard — auth check only; authorization final at backend
router.beforeEach((to) => {
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
  const isAuthenticated = session.getToken() !== null

  if (requiresAuth && !isAuthenticated) {
    return { name: 'auth.login', query: { redirect: to.fullPath } }
  }

  if (!requiresAuth && isAuthenticated && to.name === 'auth.login') {
    return { name: 'app.home' }
  }
})
