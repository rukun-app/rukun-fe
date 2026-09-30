<script setup lang="ts">
import { tr } from '@/i18n'
/**
 * StatusBadge — maps a string status to a visual badge.
 * Colors are semantic; never rely on color alone (always show text).
 */

type Status =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'unpaid'
  | 'overdue'
  | 'active'
  | 'inactive'
  | 'processing'

const props = defineProps<{ status: Status; label?: string }>()

const config: Record<Status, { cls: string; defaultLabel: string }> = {
  pending: { cls: 'bg-amber-100 text-amber-800', defaultLabel: 'Menunggu' },
  approved: { cls: 'bg-green-100 text-green-800', defaultLabel: 'Disetujui' },
  rejected: { cls: 'bg-red-100 text-red-800', defaultLabel: 'Ditolak' },
  paid: { cls: 'bg-green-100 text-green-800', defaultLabel: 'Lunas' },
  unpaid: { cls: 'bg-amber-100 text-amber-800', defaultLabel: 'Belum Lunas' },
  overdue: { cls: 'bg-red-100 text-red-800', defaultLabel: 'Jatuh Tempo' },
  active: { cls: 'bg-teal-100 text-teal-800', defaultLabel: 'Aktif' },
  inactive: { cls: 'bg-surface-100 text-surface-600', defaultLabel: 'Tidak Aktif' },
  processing: { cls: 'bg-blue-100 text-blue-800', defaultLabel: 'Diproses' },
}

const current = () => config[props.status]
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      current().cls,
    ]"
  >
    {{ tr(label ?? current().defaultLabel) }}
  </span>
</template>
