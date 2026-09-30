import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import { ref, nextTick } from 'vue'
import ResidentShell from './ResidentShell.vue'
import VendorShell from './VendorShell.vue'
import ManagementShell from './ManagementShell.vue'
import SystemShell from './SystemShell.vue'
import { setLocale } from '@/i18n'
import { applyTheme } from '@/shared/preferences/theme'
vi.mock('@/auth/composables/useAuth', () => ({
  useAuth: () => ({ logout: vi.fn(), loading: ref(false) }),
}))
beforeEach(() => {
  setLocale('id')
  applyTheme(false)
})
describe('preferences in every access shell', () => {
  for (const [name, component] of Object.entries({
    resident: ResidentShell,
    vendor: VendorShell,
    management: ManagementShell,
    system: SystemShell,
  })) {
    it(`supports theme and language in ${name} access`, async () => {
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/', component: { template: '<div />' }, meta: { title: 'Beranda' } }],
      })
      await router.push('/')
      const wrapper = mount(component, { global: { plugins: [createPinia(), router, PrimeVue] } })
      await wrapper.get('button[aria-label="Aktifkan mode gelap"]').trigger('click')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      await wrapper.get('select[aria-label="Bahasa"]').setValue('en')
      await nextTick()
      expect(wrapper.find('button[aria-label="Use light mode"]').exists()).toBe(true)
      expect(localStorage.getItem('rukun:locale')).toBe('en')
      wrapper.unmount()
    })
  }
})
