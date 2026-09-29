<script setup lang="ts">
/**
 * MoneyDisplay — formats IDR amounts consistently.
 * Always server-authoritative: never calculate amounts client-side.
 */

const props = withDefaults(
  defineProps<{
    /** Amount in full Rupiah (not cents) */
    amount: number
    /** Show + prefix for positive amounts (e.g. income) */
    signed?: boolean
    /** Dim zero amounts */
    dimZero?: boolean
  }>(),
  { signed: false, dimZero: false },
)

const formatted = () => {
  const abs = Math.abs(props.amount)
  const str = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs)

  if (props.signed && props.amount > 0) return `+${str}`
  if (props.amount < 0) return `-${str}`
  return str
}
</script>

<template>
  <span
    :class="[
      'font-mono tabular-nums',
      dimZero && amount === 0 ? 'text-surface-400' : '',
      signed && amount > 0 ? 'text-green-700' : '',
      amount < 0 ? 'text-red-700' : '',
    ]"
    :aria-label="`Rp ${amount.toLocaleString('id-ID')}`"
  >
    {{ formatted() }}
  </span>
</template>
