<script setup lang="ts">
import { tr } from '@/i18n'
import Skeleton from 'primevue/skeleton'

/**
 * AppSkeleton — loading placeholder using PrimeVue Skeleton.
 * Convention: always show at least one skeleton row per content area
 * while data is fetching; never show blank screens.
 */
withDefaults(
  defineProps<{
    rows?: number
    /** 'card' renders a card-shaped skeleton; 'list' renders stacked rows */
    variant?: 'card' | 'list'
  }>(),
  { rows: 3, variant: 'list' },
)
</script>

<template>
  <div aria-busy="true" :aria-label="tr('Memuat...')" role="status">
    <!-- Card variant -->
    <div v-if="variant === 'card'" class="rounded-xl border border-surface-200 p-4 space-y-3">
      <Skeleton height="1rem" width="60%" />
      <Skeleton height="0.75rem" width="40%" />
      <Skeleton height="2rem" class="mt-2" />
    </div>

    <!-- List variant -->
    <div v-else class="space-y-3 px-4 py-2">
      <div v-for="i in rows" :key="i" class="flex items-center gap-3">
        <Skeleton shape="circle" size="2.5rem" />
        <div class="flex-1 space-y-2">
          <Skeleton height="0.875rem" :width="`${60 + (i % 3) * 10}%`" />
          <Skeleton height="0.75rem" width="40%" />
        </div>
      </div>
    </div>
  </div>
</template>
