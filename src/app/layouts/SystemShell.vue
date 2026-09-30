<script setup lang="ts">
import { tr } from '@/i18n'
import SessionActions from '@/auth/components/SessionActions.vue'
import BrandMark from '@/app/components/BrandMark.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const items = [
  { to: '/system/overview', label: 'Ringkasan', icon: 'pi pi-th-large' },
  { to: '/system/users', label: 'Pengguna', icon: 'pi pi-users' },
  { to: '/system/settings', label: 'Pengaturan', icon: 'pi pi-cog' },
]
</script>
<template>
  <div class="system-shell">
    <header class="system-header">
      <RouterLink to="/system/overview"><BrandMark /></RouterLink
      ><span class="system-label"> {{ tr('Administrasi sistem') }} </span><SessionActions />
    </header>
    <nav class="system-nav" :aria-label="tr('Navigasi sistem')">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :aria-current="route.path === item.to ? 'page' : undefined"
        ><i :class="item.icon" aria-hidden="true" />{{ tr(item.label) }}</RouterLink
      >
    </nav>
    <main><RouterView /></main>
  </div>
</template>
