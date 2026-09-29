<script setup lang="ts">
import SessionActions from '@/auth/components/SessionActions.vue'
import { computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'

const route = useRoute()
const pageTitle = computed(() => String(route.meta['title'] ?? ''))

const navItems = [
  { to: '/system/overview', label: 'Overview', icon: 'pi pi-server' },
  { to: '/system/users', label: 'Users', icon: 'pi pi-users' },
  { to: '/system/settings', label: 'Settings', icon: 'pi pi-cog' },
] as const

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="system-shell flex flex-col min-h-svh bg-surface-100">
    <!-- Topbar -->
    <header class="sticky top-0 z-30 bg-zinc-900 text-white px-4 py-3 flex items-center gap-4">
      <span class="font-bold text-sm tracking-widest uppercase opacity-75">Rukun System</span>
      <nav class="flex gap-1 flex-1" aria-label="Navigasi sistem">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-zinc-300 hover:bg-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          :class="{ 'bg-zinc-700 text-white': isActive(item.to) }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <i :class="[item.icon, 'text-sm']" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <SessionActions />
    </header>

    <!-- Page title bar -->
    <div v-if="pageTitle" class="bg-surface-0 border-b border-surface-200 px-6 py-3">
      <h1 class="text-sm font-semibold text-surface-700">{{ pageTitle }}</h1>
    </div>

    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>
