<script setup lang="ts">
import { tr } from '@/i18n'
import { computed } from 'vue'
const props = defineProps<{ status?: string }>()
const label = computed(
  () =>
    ({ active: 'Aktif', inactive: 'Tidak aktif', moved: 'Pindah', deceased: 'Meninggal' })[
      props.status ?? ''
    ] ??
    props.status ??
    'Belum tersedia',
)
</script>
<template>
  <span
    class="status-chip"
    :class="{ 'is-active': status === 'active', 'is-warning': status === 'moved' }"
    >{{ tr(label) }}</span
  >
</template>
