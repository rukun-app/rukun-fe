<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    retryLabel?: string
  }>(),
  {
    title: 'Terjadi kesalahan',
    description: '',
    retryLabel: 'Coba lagi',
  },
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div role="alert" class="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
    <span class="text-red-400" aria-hidden="true">
      <i class="pi pi-exclamation-circle text-5xl" />
    </span>
    <p class="text-base font-medium text-surface-700">{{ title }}</p>
    <p v-if="description" class="text-sm text-surface-500 max-w-xs">{{ description }}</p>
    <button
      type="button"
      class="mt-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors"
      @click="emit('retry')"
    >
      {{ retryLabel }}
    </button>
    <slot />
  </div>
</template>
