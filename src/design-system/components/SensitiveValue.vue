<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    /** Characters to show when hidden (default: dots) */
    placeholder?: string
    /** Accessible label for the reveal button */
    revealLabel?: string
    hideLabel?: string
  }>(),
  {
    placeholder: '••••••••',
    revealLabel: 'Tampilkan',
    hideLabel: 'Sembunyikan',
  },
)

const revealed = ref(false)
</script>

<template>
  <span class="inline-flex items-center gap-1.5">
    <span v-if="revealed" class="font-mono text-sm select-all">
      <slot />
    </span>
    <span v-else class="text-sm text-surface-400 tracking-widest" aria-hidden="true">
      {{ placeholder }}
    </span>
    <button
      type="button"
      class="text-xs text-primary-600 underline hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
      :aria-label="revealed ? hideLabel : revealLabel"
      :aria-pressed="revealed"
      @click="revealed = !revealed"
    >
      {{ revealed ? hideLabel : revealLabel }}
    </button>
  </span>
</template>
