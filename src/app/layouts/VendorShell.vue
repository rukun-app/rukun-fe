<script setup lang="ts">
import { useRoute, RouterLink, RouterView } from 'vue-router'

const route = useRoute()

const navItems = [
  { to: '/vendor/dashboard', label: 'Dashboard', icon: 'pi pi-home' },
  { to: '/vendor/customers', label: 'Pelanggan', icon: 'pi pi-users' },
  { to: '/vendor/delivery', label: 'Pengiriman', icon: 'pi pi-truck' },
  { to: '/vendor/history', label: 'Riwayat', icon: 'pi pi-history' },
] as const

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="vendor-shell flex flex-col min-h-svh bg-surface-50">
    <!-- Topbar -->
    <header class="sticky top-0 z-30 bg-surface-0 border-b border-surface-200 px-4 py-3 flex items-center gap-4">
      <span class="text-primary-600 font-bold text-base">Rukun Vendor</span>
      <nav class="flex gap-1 flex-1" aria-label="Navigasi vendor">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-surface-600 hover:bg-surface-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :class="{ 'bg-primary-50 text-primary-700 font-medium': isActive(item.to) }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <i :class="[item.icon, 'text-sm']" aria-hidden="true" />
          <span class="hidden sm:inline">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </header>

    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>
