<script setup lang="ts">
import { tr } from '@/i18n'
withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
  }>(),
  {
    title: 'Belum ada data',
    description: '',
    icon: 'pi pi-inbox',
  },
)
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center"
  >
    <span class="text-surface-300" aria-hidden="true">
      <i :class="[icon, 'text-5xl']" />
    </span>
    <p class="text-base font-medium text-surface-600">{{ tr(title) }}</p>
    <p v-if="description" class="text-sm text-surface-400 max-w-xs">{{ description }}</p>
    <slot />
  </div>
</template>
