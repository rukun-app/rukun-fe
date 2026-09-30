<script setup lang="ts">
import { tr } from '@/i18n'
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import Drawer from 'primevue/drawer'
import ManagementNav from '@/app/components/ManagementNav.vue'
import SessionActions from '@/auth/components/SessionActions.vue'
const route = useRoute()
const mobileOpen = ref(false)
const menuTrigger = ref<HTMLButtonElement>()
watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  },
)
const pageTitle = computed(() =>
  route.name === 'manage.dashboard' ? 'Ringkasan' : String(route.meta.title ?? 'Lingkungan'),
)
</script>
<template>
  <div class="management-shell">
    <a class="skip-link" href="#main-content"> {{ tr('Lewati ke konten') }} </a>
    <aside class="desktop-sidebar" :aria-label="tr('Sidebar navigasi')"><ManagementNav /></aside>
    <Drawer
      v-model:visible="mobileOpen"
      :header="tr('Menu lingkungan')"
      :aria-label="tr('Menu lingkungan')"
      @after-hide="menuTrigger?.focus()"
      :close-button-props="{ 'aria-label': tr('Tutup menu navigasi') }"
      class="mobile-navigation"
      :pt="{ content: { style: 'padding: 0; display: flex; flex-direction: column;' } }"
      ><ManagementNav @navigate="mobileOpen = false"
    /></Drawer>
    <div class="workspace">
      <header class="workspace-header">
        <button
          type="button"
          ref="menuTrigger"
          class="mobile-menu-button"
          :aria-label="tr('Buka menu navigasi')"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = true"
        >
          <i class="pi pi-bars" aria-hidden="true" />
        </button>
        <div class="workspace-breadcrumb">
          <span> {{ tr('Lingkungan') }} </span><i class="pi pi-angle-right" aria-hidden="true" />
          <h1>{{ tr(pageTitle) }}</h1>
        </div>
        <SessionActions />
      </header>
      <main id="main-content" class="workspace-main" tabindex="-1"><RouterView /></main>
      <footer class="workspace-footer">
        <span> {{ tr('Dirawat bersama. Tumbuh bersama.') }} </span
        ><span>Rukun <i class="pi pi-sparkles" aria-hidden="true" /></span>
      </footer>
    </div>
  </div>
</template>
