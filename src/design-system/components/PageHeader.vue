<script setup lang="ts">
import { tr } from '@/i18n'
defineProps<{
  title: string
  backTo?: string
}>()
</script>

<template>
  <div class="flex items-center gap-3 px-4 pt-4 pb-2">
    <RouterLink
      v-if="backTo"
      :to="backTo"
      class="p-2 -ml-2 rounded-lg hover:bg-surface-100 text-surface-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      :aria-label="tr('Kembali')"
    >
      <i class="pi pi-arrow-left text-sm" aria-hidden="true" />
    </RouterLink>
    <div class="flex-1 min-w-0">
      <h1 class="text-lg font-semibold text-surface-900 truncate">{{ title }}</h1>
      <slot name="subtitle" />
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
