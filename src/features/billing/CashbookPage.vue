<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import { useBillingListLedgerEntry } from '@/api/generated/endpoints'
import { AppDataTable, MoneyDisplay, PageHeader } from '@/design-system'
import { normalizeApiError } from '@/api/errors/normalizer'
import { tr } from '@/i18n'
import { formatDateTime } from '@/shared/utils/dateTime'

const ledgerCursor = ref<string>()
const ledgerQuery = useBillingListLedgerEntry(
  computed(() => ({ per_page: 20, cursor: ledgerCursor.value })),
)

const entries = computed(() => ledgerQuery.data.value?.data?.data ?? [])
const summary = computed(() => {
  const income = entries.value.reduce((total, entry) => {
    if (entry.kind === 'income' || entry.kind === 'adjustment') {
      return total + Number(entry.amount ?? 0)
    }

    return total
  }, 0)

  const expense = entries.value.reduce((total, entry) => {
    if (entry.kind === 'expense' || entry.kind === 'reversal') {
      return total + Number(entry.amount ?? 0)
    }

    return total
  }, 0)

  return {
    income,
    expense,
    net: income - expense,
  }
})

function signedAmount(entry: { kind?: string; amount?: number }) {
  const amount = Number(entry.amount ?? 0)

  if (entry.kind === 'expense' || entry.kind === 'reversal') {
    return -amount
  }

  return amount
}

function kindLabel(value?: string) {
  switch (value) {
    case 'income':
      return tr('Pemasukan')
    case 'expense':
      return tr('Pengeluaran')
    case 'transfer':
      return tr('Transfer')
    case 'adjustment':
      return tr('Penyesuaian')
    case 'reversal':
      return tr('Pembatalan')
    default:
      return value || tr('Lainnya')
  }
}

function channelLabel(value?: string) {
  switch (value) {
    case 'cash':
      return tr('Tunai')
    case 'bank':
      return tr('Bank')
    default:
      return value || tr('Tidak diketahui')
  }
}

function kindTone(value?: string) {
  switch (value) {
    case 'income':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    case 'expense':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
    case 'transfer':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    case 'adjustment':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    case 'reversal':
      return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
    default:
      return 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200'
  }
}

function formatSignedDisplay(amount: number) {
  return amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
}
</script>

<template>
  <section class="page-container space-y-6">
    <PageHeader :title="tr('Kas')" :description="tr('Ringkasan kas dan arus masuk-keluar lingkungan.')">
      <template #actions>
        <Button
          :label="tr('Muat ulang')"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          :disabled="ledgerQuery.isFetching.value"
          @click="ledgerQuery.refetch()"
        />
      </template>
    </PageHeader>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-900">
        <p class="text-sm text-surface-500">{{ tr('Pemasukan') }}</p>
        <p class="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
          <MoneyDisplay :amount="summary.income" />
        </p>
      </div>
      <div class="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-900">
        <p class="text-sm text-surface-500">{{ tr('Pengeluaran') }}</p>
        <p class="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-400">
          <MoneyDisplay :amount="summary.expense" />
        </p>
      </div>
      <div class="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-900">
        <p class="text-sm text-surface-500">{{ tr('Saldo bersih') }}</p>
        <p class="mt-2 text-2xl font-semibold" :class="formatSignedDisplay(summary.net)">
          <MoneyDisplay :amount="summary.net" />
        </p>
      </div>
    </div>

    <AppDataTable
      :rows="entries"
      :title="tr('Catatan kas')"
      :search-fields="['reason', 'kind', 'channel']"
      :pending="ledgerQuery.isPending.value"
      :busy="ledgerQuery.isFetching.value"
      :error="ledgerQuery.isError.value ? normalizeApiError(ledgerQuery.error.value).message : null"
      :empty-title="tr('Belum ada catatan kas')"
      :empty-description="tr('Transaksi kas lingkungan akan muncul di sini.')"
      :next="ledgerQuery.data.value?.data?.next_cursor"
      :previous="ledgerQuery.data.value?.data?.prev_cursor"
      :page-key="[ledgerCursor].join(':')"
      @retry="ledgerQuery.refetch()"
      @page="ledgerCursor = $event"
    >
      <Column field="posted_on" :header="tr('Tanggal')" sortable>
        <template #body="{ data }">{{ formatDateTime(data.posted_on) }}</template>
      </Column>
      <Column field="kind" :header="tr('Jenis')" sortable>
        <template #body="{ data }">
          <span class="inline-flex rounded-full px-2 py-1 text-xs font-medium" :class="kindTone(data.kind)">
            {{ kindLabel(data.kind) }}
          </span>
        </template>
      </Column>
      <Column field="channel" :header="tr('Saluran')" sortable>
        <template #body="{ data }">{{ channelLabel(data.channel) }}</template>
      </Column>
      <Column field="amount" :header="tr('Nominal')" sortable>
        <template #body="{ data }">
          <span :class="formatSignedDisplay(signedAmount(data))">
            <MoneyDisplay :amount="signedAmount(data)" />
          </span>
        </template>
      </Column>
      <Column field="reason" :header="tr('Alasan')" sortable>
        <template #body="{ data }">{{ data.reason || tr('Tanpa keterangan') }}</template>
      </Column>
    </AppDataTable>
  </section>
</template>
