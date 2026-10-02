<script setup lang="ts">
import { tr } from '@/i18n'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useContextStore } from '@/contexts/stores/context'
import BrandMark from './BrandMark.vue'
const emit = defineEmits<{ navigate: [] }>()
const context = useContextStore()
const route = useRoute()
const items = computed(() =>
  [
    { to: '/manage/dashboard', label: 'Ringkasan', icon: 'pi pi-th-large' },
    {
      to: '/manage/households',
      label: 'Kartu Keluarga',
      icon: 'pi pi-home',
      capability: 'households.view',
    },
    {
      to: '/manage/residents',
      label: 'Data Warga',
      icon: 'pi pi-users',
      capability: 'residents.view',
    },
    { to: '/manage/areas', label: 'Wilayah RT / RW', icon: 'pi pi-map', capability: 'areas.view' },
    { to: '/manage/billing', label: 'Tagihan', icon: 'pi pi-wallet', capability: 'billing.manage' },
  ].filter((item) => !item.capability || context.can(item.capability)),
)
</script>
<template>
  <div class="sidebar-content">
    <RouterLink to="/manage/dashboard" class="sidebar-brand" @click="emit('navigate')"
      ><BrandMark /><span> {{ tr('Ruang kelola lingkungan') }} </span></RouterLink
    >
    <div class="sidebar-section-label">{{ tr('MENU UTAMA') }}</div>
    <nav :aria-label="tr('Menu manajemen')" class="sidebar-nav">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :aria-current="route.path.startsWith(item.to) ? 'page' : undefined"
        @click="emit('navigate')"
        ><i :class="item.icon" aria-hidden="true" /><span>{{ tr(item.label) }}</span
        ><span v-if="route.path.startsWith(item.to)" class="nav-dot"
      /></RouterLink>
    </nav>
    <div class="sidebar-bottom">
      <div class="sidebar-note">
        <i class="pi pi-heart" aria-hidden="true" />
        <p>
          {{ tr('Lingkungan yang baik') }} <br />
          {{ tr('dimulai dari kita.') }}
        </p>
      </div>
      <RouterLink to="/auth/select-context" class="context-link" @click="emit('navigate')"
        ><span class="context-icon"><i class="pi pi-building" aria-hidden="true" /></span
        ><span
          ><strong> {{ tr('Ruang pengurus') }} </strong
          ><small> {{ tr('Ganti akses') }} </small></span
        ><i class="pi pi-angle-right" aria-hidden="true"
      /></RouterLink>
    </div>
  </div>
</template>
