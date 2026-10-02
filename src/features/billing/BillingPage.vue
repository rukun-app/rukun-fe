<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import { useBillingListInvoice, useBillingListSubmission, useBillingShowInvoice } from '@/api/generated/endpoints'
import { normalizeApiError } from '@/api/errors/normalizer'
import { useContextStore } from '@/contexts/stores/context'
import { AppDataTable, AppSkeleton, ErrorState, MoneyDisplay, PageHeader, StatusBadge } from '@/design-system'
import { tr } from '@/i18n'
import { formatDateTime } from '@/shared/utils/dateTime'
import { getBillingStatusMeta, summarizeBillingInvoices } from './model'

const route = useRoute()
const context = useContextStore()
const invoiceCursor = ref<string>()
const submissionCursor = ref<string>()
const selectedInvoiceId = computed(() => (route.params.id ? String(route.params.id) : ''))
const listRoute = computed(() => (route.path.startsWith('/manage/') ? '/manage/billing' : '/app/billing'))

const invoiceQuery = useBillingListInvoice(
  computed(() => ({ per_page: 20, cursor: invoiceCursor.value })),
)
const submissionQuery = useBillingListSubmission(
  computed(() => ({ per_page: 20, cursor: submissionCursor.value })),
)
const invoiceDetailQuery = useBillingShowInvoice(selectedInvoiceId, {
  query: { enabled: computed(() => !!selectedInvoiceId.value) },
})

const invoices = computed(() => invoiceQuery.data.value?.data?.data ?? [])
const submissions = computed(() => submissionQuery.data.value?.data?.data ?? [])
const selectedInvoice = computed(() => invoiceDetailQuery.data.value?.data)

const summary = computed(() => summarizeBillingInvoices(invoices.value))

const canReviewSubmissions = computed(
  () => context.can('payments.approve') || context.can('payments.review') || context.can('billing.manage'),
)

function invoiceMeta(invoice: { status?: string }) {
  return getBillingStatusMeta(invoice.status, 'invoice')
}

function submissionMeta(submission: { status?: string }) {
  return getBillingStatusMeta(submission.status, 'submission')
}
</script>

<template>
  <section class="page-container space-y-6">
    <PageHeader :title="tr('Tagihan')" :description="tr('Ringkasan tagihan dan riwayat pembayaran.')">
      <template #actions>
        <Button
          :label="tr('Muat ulang')"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          :disabled="invoiceQuery.isFetching.value || submissionQuery.isFetching.value"
          @click="void invoiceQuery.refetch(); void submissionQuery.refetch()"
        />
      </template>
    </PageHeader>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-900">
        <p class="text-sm text-surface-500">{{ tr('Belum lunas') }}</p>
        <p class="mt-2 text-2xl font-semibold">
          <MoneyDisplay :amount="summary.totalOutstanding" />
        </p>
      </div>
      <div class="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-900">
        <p class="text-sm text-surface-500">{{ tr('Jatuh tempo') }}</p>
        <p class="mt-2 text-2xl font-semibold">{{ summary.totalDue }}</p>
      </div>
      <div class="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-900">
        <p class="text-sm text-surface-500">{{ tr('Tagihan aktif') }}</p>
        <p class="mt-2 text-2xl font-semibold">{{ summary.totalInvoices }}</p>
      </div>
    </div>

    <section
      v-if="selectedInvoiceId"
      class="rounded-2xl border border-surface-200 bg-surface-0 p-5 dark:border-surface-700 dark:bg-surface-900"
    >
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <p class="text-sm uppercase tracking-[0.12em] text-surface-500">{{ tr('Detail tagihan') }}</p>
          <h2 class="mt-1 text-xl font-semibold">{{ tr('Rincian invoice') }}</h2>
        </div>
        <RouterLink :to="listRoute">
          <Button :label="tr('Kembali ke daftar')" text />
        </RouterLink>
      </div>

      <ErrorState
        v-if="invoiceDetailQuery.isError.value"
        :description="normalizeApiError(invoiceDetailQuery.error.value).message"
        @retry="invoiceDetailQuery.refetch()"
      />
      <AppSkeleton v-else-if="invoiceDetailQuery.isPending.value" />
      <div v-else-if="selectedInvoice" class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold">{{ selectedInvoice.subject || tr('Tagihan') }}</h3>
            <p class="text-sm text-surface-500">{{ selectedInvoice.period || '—' }}</p>
          </div>
          <StatusBadge
            :status="invoiceMeta(selectedInvoice).status"
            :label="tr(invoiceMeta(selectedInvoice).label)"
          />
        </div>

        <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-xl border border-surface-200 p-3 dark:border-surface-700">
            <dt class="text-xs uppercase tracking-[0.08em] text-surface-500">{{ tr('Nominal') }}</dt>
            <dd class="mt-2 text-lg font-semibold">
              <MoneyDisplay :amount="selectedInvoice.amount ?? 0" />
            </dd>
          </div>
          <div class="rounded-xl border border-surface-200 p-3 dark:border-surface-700">
            <dt class="text-xs uppercase tracking-[0.08em] text-surface-500">{{ tr('Masih harus dibayar') }}</dt>
            <dd class="mt-2 text-lg font-semibold">
              <MoneyDisplay :amount="selectedInvoice.outstanding_amount ?? 0" />
            </dd>
          </div>
          <div class="rounded-xl border border-surface-200 p-3 dark:border-surface-700">
            <dt class="text-xs uppercase tracking-[0.08em] text-surface-500">{{ tr('Dibayar') }}</dt>
            <dd class="mt-2 text-lg font-semibold">
              <MoneyDisplay :amount="selectedInvoice.paid_amount ?? 0" />
            </dd>
          </div>
          <div class="rounded-xl border border-surface-200 p-3 dark:border-surface-700">
            <dt class="text-xs uppercase tracking-[0.08em] text-surface-500">{{ tr('Jatuh tempo') }}</dt>
            <dd class="mt-2 text-lg font-semibold">{{ formatDateTime(selectedInvoice.due_date) }}</dd>
          </div>
        </dl>

        <div class="rounded-xl border border-dashed border-surface-300 bg-surface-50 p-4 dark:border-surface-600 dark:bg-surface-950">
          <p class="text-sm font-medium text-surface-700 dark:text-surface-300">
            {{ tr('Catatan operasional') }}
          </p>
          <p class="mt-2 text-sm text-surface-600 dark:text-surface-400">
            {{ tr('Status invoice mengikuti kontrak backend dan akan diperbarui setelah review transfer atau penerimaan pembayaran.') }}
          </p>
        </div>
      </div>
    </section>

    <AppDataTable
      :rows="invoices"
      :title="tr('Daftar tagihan')"
      :search-fields="['subject', 'period', 'status']"
      :pending="invoiceQuery.isPending.value"
      :busy="invoiceQuery.isFetching.value"
      :error="invoiceQuery.isError.value ? normalizeApiError(invoiceQuery.error.value).message : null"
      :empty-title="tr('Belum ada tagihan')"
      :empty-description="tr('Tagihan bulanan Anda akan muncul di sini.')"
      :next="invoiceQuery.data.value?.data?.next_cursor"
      :previous="invoiceQuery.data.value?.data?.prev_cursor"
      :page-key="[invoiceCursor].join(':')"
      @retry="invoiceQuery.refetch()"
      @page="invoiceCursor = $event"
    >
      <Column field="subject" :header="tr('Tagihan')" sortable>
        <template #body="{ data }">
          <div class="font-medium">{{ data.subject || tr('Tagihan') }}</div>
          <div class="text-sm text-surface-500">{{ data.period || '—' }}</div>
        </template>
      </Column>
      <Column field="amount" :header="tr('Nominal')" sortable>
        <template #body="{ data }">
          <MoneyDisplay :amount="data.amount ?? 0" />
        </template>
      </Column>
      <Column field="outstanding_amount" :header="tr('Outstanding')" sortable>
        <template #body="{ data }">
          <MoneyDisplay :amount="data.outstanding_amount ?? 0" />
        </template>
      </Column>
      <Column field="due_date" :header="tr('Jatuh tempo')" sortable>
        <template #body="{ data }">{{ formatDateTime(data.due_date) }}</template>
      </Column>
      <Column field="status" :header="tr('Status')" sortable>
        <template #body="{ data }">
          <StatusBadge :status="invoiceMeta(data).status" :label="tr(invoiceMeta(data).label)" />
        </template>
      </Column>
      <Column :header="tr('Aksi')" :style="{ width: '8rem' }">
        <template #body="{ data }">
          <RouterLink :to="`${listRoute}/${data.public_id ?? data.id ?? ''}`">
            <Button :label="tr('Detail')" text size="small" />
          </RouterLink>
        </template>
      </Column>
    </AppDataTable>

    <AppDataTable
      v-if="canReviewSubmissions"
      :rows="submissions"
      :title="tr('Verifikasi pembayaran')"
      :search-fields="['status', 'amount', 'household_id']"
      :pending="submissionQuery.isPending.value"
      :busy="submissionQuery.isFetching.value"
      :error="submissionQuery.isError.value ? normalizeApiError(submissionQuery.error.value).message : null"
      :empty-title="tr('Tidak ada pengajuan transfer')"
      :empty-description="tr('Pengajuan manual yang menunggu verifikasi akan muncul di sini.')"
      :next="submissionQuery.data.value?.data?.next_cursor"
      :previous="submissionQuery.data.value?.data?.prev_cursor"
      :page-key="[submissionCursor].join(':')"
      @retry="submissionQuery.refetch()"
      @page="submissionCursor = $event"
    >
      <Column field="amount" :header="tr('Nominal')" sortable>
        <template #body="{ data }">
          <MoneyDisplay :amount="data.amount ?? 0" />
        </template>
      </Column>
      <Column field="transferred_at" :header="tr('Waktu transfer')" sortable>
        <template #body="{ data }">{{ formatDateTime(data.transferred_at) }}</template>
      </Column>
      <Column field="status" :header="tr('Status')" sortable>
        <template #body="{ data }">
          <StatusBadge :status="submissionMeta(data).status" :label="tr(submissionMeta(data).label)" />
        </template>
      </Column>
    </AppDataTable>
  </section>
</template>
