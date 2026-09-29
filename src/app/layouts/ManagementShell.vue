<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { useContextStore } from '@/contexts/stores/context'

const route = useRoute()
const contextStore = useContextStore()

const sidebarOpen = ref(true)

interface NavItem {
  to: string
  label: string
  icon: string
  capability?: string
}

const allNavItems: NavItem[] = [
  { to: '/manage/dashboard', label: 'Dashboard', icon: 'pi pi-chart-bar' },
  { to: '/manage/households', label: 'Warga', icon: 'pi pi-users' },
  { to: '/manage/billing', label: 'Tagihan', icon: 'pi pi-file-invoice' },
  { to: '/manage/payments', label: 'Verifikasi', icon: 'pi pi-check-circle', capability: 'payment.verify' },
  { to: '/manage/cashbook', label: 'Kas', icon: 'pi pi-wallet', capability: 'cashbook.read' },
  { to: '/manage/wifi', label: 'WiFi', icon: 'pi pi-wifi', capability: 'wifi.manage' },
  { to: '/manage/patrol', label: 'Ronda', icon: 'pi pi-shield' },
  { to: '/manage/services', label: 'Layanan', icon: 'pi pi-inbox' },
  { to: '/manage/reports', label: 'Laporan', icon: 'pi pi-book', capability: 'report.read' },
]

const navItems = computed(() =>
  allNavItems.filter((item) => !item.capability || contextStore.can(item.capability)),
)

function isActive(path: string) {
  return route.path.startsWith(path)
}

const pageTitle = computed(() => String(route.meta['title'] ?? ''))
</script>

<template>
  <div class="management-shell flex h-svh overflow-hidden bg-surface-100">
    <!-- Sidebar -->
    <aside
      :class="[
        'flex flex-col bg-surface-0 border-r border-surface-200 transition-all duration-200 overflow-y-auto shrink-0',
        sidebarOpen ? 'w-56' : 'w-14',
      ]"
      aria-label="Sidebar navigasi"
    >
      <!-- Logo / brand -->
      <div class="flex items-center gap-2 px-3 py-4 border-b border-surface-100">
        <span class="text-primary-600 font-bold text-lg tracking-tight" v-if="sidebarOpen">Rukun</span>
        <span class="text-primary-600 font-bold text-lg" v-else>R</span>
      </div>

      <!-- Nav items -->
      <nav class="flex-1 py-2" aria-label="Menu manajemen">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 mx-1 rounded-lg text-surface-600 hover:bg-surface-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :class="{ 'bg-primary-50 text-primary-700 font-medium': isActive(item.to) }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          :title="!sidebarOpen ? item.label : undefined"
        >
          <i :class="[item.icon, 'text-base shrink-0']" aria-hidden="true" />
          <span v-if="sidebarOpen" class="text-sm truncate">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- Main area -->
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <!-- Topbar -->
      <header class="flex items-center gap-3 px-4 py-3 bg-surface-0 border-b border-surface-200 shrink-0">
        <button
          type="button"
          class="p-2 rounded-lg hover:bg-surface-100 text-surface-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :aria-label="sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'"
          :aria-expanded="sidebarOpen"
          @click="sidebarOpen = !sidebarOpen"
        >
          <i class="pi pi-bars text-base" aria-hidden="true" />
        </button>

        <h1 class="text-base font-semibold text-surface-900 truncate flex-1">{{ pageTitle }}</h1>

        <slot name="topbar-actions" />
      </header>

      <!-- Scrollable content -->
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
