<script setup lang="ts">
import Tag from 'primevue/tag'
import { computed } from 'vue'
import { tr } from '@/i18n'
const props = defineProps<{ status?: string; label?: string }>()
const config: Record<
  string,
  { severity: 'success' | 'warn' | 'danger' | 'info' | 'secondary'; label: string }
> = {
  pending: { severity: 'warn', label: 'Menunggu' },
  approved: { severity: 'success', label: 'Disetujui' },
  rejected: { severity: 'danger', label: 'Ditolak' },
  paid: { severity: 'success', label: 'Lunas' },
  unpaid: { severity: 'warn', label: 'Belum Lunas' },
  overdue: { severity: 'danger', label: 'Jatuh Tempo' },
  active: { severity: 'success', label: 'Aktif' },
  inactive: { severity: 'secondary', label: 'Tidak aktif' },
  processing: { severity: 'info', label: 'Diproses' },
  moved: { severity: 'warn', label: 'Pindah' },
  deceased: { severity: 'secondary', label: 'Meninggal' },
}
const current = computed(
  () => config[props.status ?? ''] ?? { severity: 'secondary' as const, label: 'Belum tersedia' },
)
</script>
<template>
  <Tag :severity="current.severity" :value="label ?? tr(current.label)" rounded />
</template>
