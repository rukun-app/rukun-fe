<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'

const route = useRoute()

const navItems = [
  { to: '/app/home', label: 'Beranda', icon: 'pi pi-home' },
  { to: '/app/billing', label: 'Tagihan', icon: 'pi pi-file-invoice' },
  { to: '/app/patrol', label: 'Ronda', icon: 'pi pi-shield' },
  { to: '/app/services', label: 'Layanan', icon: 'pi pi-th-large' },
  { to: '/app/account', label: 'Akun', icon: 'pi pi-user' },
] as const

function isActive(path: string) {
  return route.path.startsWith(path)
}

const pageTitle = computed(() => String(route.meta['title'] ?? ''))
</script>

<template>
  <div class="resident-shell flex flex-col min-h-svh bg-surface-50">
    <!-- Top status bar area — safe area aware -->
    <header
      v-if="pageTitle"
      class="sticky top-0 z-30 bg-surface-0 border-b border-surface-200 px-4 py-3 flex items-center gap-3 safe-area-top"
    >
      <h1 class="text-base font-semibold text-surface-900 truncate flex-1">{{ pageTitle }}</h1>
    </header>

    <!-- Main scrollable content -->
    <main class="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <RouterView />
    </main>

    <!-- Bottom navigation -->
    <nav
      class="fixed bottom-0 inset-x-0 z-40 bg-surface-0 border-t border-surface-200 flex safe-area-bottom"
      aria-label="Navigasi utama"
    >
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] min-w-[44px] text-surface-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
        :class="{ 'text-primary-600 font-medium': isActive(item.to) }"
        :aria-current="isActive(item.to) ? 'page' : undefined"
      >
        <i :class="[item.icon, 'text-xl']" aria-hidden="true" />
        <span class="text-[11px] leading-none">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
