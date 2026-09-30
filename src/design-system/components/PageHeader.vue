<script setup lang="ts">
import Toolbar from 'primevue/toolbar'
import { tr } from '@/i18n'
defineProps<{ title: string; description?: string; eyebrow?: string; backTo?: string }>()
</script>
<template>
  <RouterLink v-if="backTo" :to="backTo" class="back-link" :aria-label="tr('Kembali')"
    ><i class="pi pi-arrow-left" aria-hidden="true" />{{ tr('Kembali') }}</RouterLink
  >
  <Toolbar class="page-heading page-toolbar">
    <template #start
      ><div>
        <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
        <slot name="subtitle" /></div
    ></template>
    <template #end><slot name="actions" /></template>
  </Toolbar>
</template>
