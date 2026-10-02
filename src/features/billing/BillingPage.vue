<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import {
  useBillingListBankAccount,
  useBillingListInvoice,
  useBillingListSubmission,
  useBillingShowInvoice,
  useBillingSubmitTransfer,
  useUploadFile,
} from '@/api/generated/endpoints'
import { normalizeApiError } from '@/api/errors/normalizer'
import { queryClient } from '@/app/providers/query'
import { useContextStore } from '@/contexts/stores/context'
import { AppDataTable, AppSkeleton, ErrorState, MoneyDisplay, MutationErrors, PageHeader, StatusBadge } from '@/design-system'
import { tr } from '@/i18n'
import { formatDateTime } from '@/shared/utils/dateTime'
import { buildTransferSubmission, getBillingStatusMeta, summarizeBillingInvoices } from './model'

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
const bankAccountQuery = useBillingListBankAccount(computed(() => ({ per_page: 50 })) )
const uploadFileMutation = useUploadFile()
const submitTransferMutation = useBillingSubmitTransfer()
const invoiceDetailQuery = useBillingShowInvoice(selectedInvoiceId, {
  query: { enabled: computed(() => !!selectedInvoiceId.value) },
})

const transferForm = ref({
  invoiceId: '',
  amount: '',
  destinationAccountId: '',
  transferredAt: '',
  proofFileId: '',
  proofFileName: '',
  note: '',
})

const invoices = computed(() => invoiceQuery.data.value?.data?.data ?? [])
const submissions = computed(() => submissionQuery.data.value?.data?.data ?? [])
const selectedInvoice = computed(() => invoiceDetailQuery.data.value?.data)
const bankAccounts = computed(() => bankAccountQuery.data.value?.data?.data ?? [])
const householdId = computed(() =>
  context.activeContext?.scope.type === 'household' ? context.activeContext.scope.id : '',
)
const summary = computed(() => summarizeBillingInvoices(invoices.value))
const submitTransferError = computed(() =>
  submitTransferMutation.error.value ? normalizeApiError(submitTransferMutation.error.value) : null,
)
const invoiceOptions = computed(() =>
  invoices.value.map((invoice) => ({
    value: invoice.public_id ?? '',
    label: `${invoice.subject ?? tr('Tagihan')} · ${invoice.period ?? ''}`,
  })),
)
const bankAccountOptions = computed(() =>
  bankAccounts.value.map((account) => ({
    value: account.public_id ?? '',
    label: `${account.bank_name ?? tr('Bank')} · ${account.account_number ?? ''} · ${account.account_holder ?? ''}`,
  })),
)

const canReviewSubmissions = computed(
  () => context.can('payments.approve') || context.can('payments.review') || context.can('billing.manage'),
)
const canSubmitTransfer = computed(
  () => !!householdId.value && (context.can('payments.submit') || context.can('billing.manage')),
)

watch(
  selectedInvoiceId,
  (invoiceId) => {
    if (!invoiceId || transferForm.value.invoiceId) return
    transferForm.value.invoiceId = invoiceId
    const selected = invoices.value.find((entry) => (entry.public_id ?? '') === invoiceId)
    if (selected && !transferForm.value.amount) {
      transferForm.value.amount = String(selected.outstanding_amount ?? 0)
    }
  },
  { immediate: true },
)

watch(
  () => transferForm.value.invoiceId,
  (invoiceId) => {
    const selected = invoices.value.find((entry) => (entry.public_id ?? '') === invoiceId)
    if (!selected) return
    if (!transferForm.value.amount || Number(transferForm.value.amount) <= 0) {
      transferForm.value.amount = String(selected.outstanding_amount ?? 0)
    }
  },
)

function invoiceMeta(invoice: { status?: string }) {
  return getBillingStatusMeta(invoice.status, 'invoice')
}

function submissionMeta(submission: { status?: string }) {
  return getBillingStatusMeta(submission.status, 'submission')
}

function resetTransferForm() {
  transferForm.value = {
    invoiceId: transferForm.value.invoiceId,
    amount: '',
    destinationAccountId: '',
    transferredAt: '',
    proofFileId: '',
    proofFileName: '',
    note: '',
  }
}

async function handleProofUpload(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]

  if (!file) return

  const result = await uploadFileMutation.mutateAsync({
    data: {
      file,
      display_name: file.name,
      metadata: { kind: 'billing-transfer-proof' },
    },
  })

  transferForm.value.proofFileId = result.data.id
  transferForm.value.proofFileName = file.name
  target.value = ''
}

async function submitTransfer() {
  if (!canSubmitTransfer.value || !householdId.value) return

  const amount = Number(transferForm.value.amount)
  const payload = buildTransferSubmission({
    amount,
    invoiceId: transferForm.value.invoiceId,
    householdId: householdId.value,
    destinationAccountId: transferForm.value.destinationAccountId,
    proofFileId: transferForm.value.proofFileId,
    transferredAt: transferForm.value.transferredAt,
    note: transferForm.value.note,
  })

  await submitTransferMutation.mutateAsync({ data: payload })
  resetTransferForm()
  await Promise.all([invoiceQuery.refetch(), submissionQuery.refetch(), bankAccountQuery.refetch()])
  await queryClient.invalidateQueries({ queryKey: ['api', 'billing'] })
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

    <section v-if="canSubmitTransfer" class="rounded-2xl border border-surface-200 bg-surface-0 p-5 dark:border-surface-700 dark:bg-surface-900">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <p class="text-sm uppercase tracking-[0.12em] text-surface-500">{{ tr('Transfer manual') }}</p>
          <h2 class="mt-1 text-xl font-semibold">{{ tr('Ajukan bukti pembayaran') }}</h2>
        </div>
      </div>

      <MutationErrors :error="submitTransferError" />

      <div v-if="!householdId" class="rounded-xl border border-dashed border-surface-300 bg-surface-50 p-4 text-sm text-surface-600 dark:border-surface-600 dark:bg-surface-950 dark:text-surface-300">
        {{ tr('Pilih konteks rumah tangga untuk mengajukan transfer manual.') }}
      </div>

      <div v-else class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300" for="transfer-invoice">
              {{ tr('Tagihan') }}
            </label>
            <Select
              id="transfer-invoice"
              v-model="transferForm.invoiceId"
              :options="invoiceOptions"
              option-label="label"
              option-value="value"
              :placeholder="tr('Pilih tagihan')"
              class="w-full"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300" for="transfer-amount">
              {{ tr('Nominal') }}
            </label>
            <input
              id="transfer-amount"
              v-model="transferForm.amount"
              type="number"
              min="1"
              inputmode="numeric"
              class="w-full rounded-lg border border-surface-300 bg-surface-0 px-3 py-2 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-surface-600 dark:bg-surface-950 dark:text-surface-100"
              :placeholder="tr('Masukkan nominal')"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300" for="transfer-bank">
              {{ tr('Rekening tujuan') }}
            </label>
            <Select
              id="transfer-bank"
              v-model="transferForm.destinationAccountId"
              :options="bankAccountOptions"
              option-label="label"
              option-value="value"
              :placeholder="tr('Pilih rekening tujuan')"
              class="w-full"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300" for="transfer-date">
              {{ tr('Tanggal transfer') }}
            </label>
            <input
              id="transfer-date"
              v-model="transferForm.transferredAt"
              type="datetime-local"
              class="w-full rounded-lg border border-surface-300 bg-surface-0 px-3 py-2 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-surface-600 dark:bg-surface-950 dark:text-surface-100"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300" for="transfer-proof">
            {{ tr('Bukti transfer') }}
          </label>
          <input
            id="transfer-proof"
            type="file"
            accept="image/*,.pdf"
            class="block w-full rounded-lg border border-surface-300 bg-surface-0 px-3 py-2 text-sm text-surface-900 file:mr-3 file:rounded file:border-0 file:bg-primary-600 file:px-3 file:py-2 file:text-white dark:border-surface-600 dark:bg-surface-950 dark:text-surface-100"
            @change="handleProofUpload"
          />
          <small v-if="transferForm.proofFileName" class="text-xs text-surface-500">
            {{ tr('Berkas terpilih:') }} {{ transferForm.proofFileName }}
          </small>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300" for="transfer-note">
            {{ tr('Catatan') }}
          </label>
          <Textarea
            id="transfer-note"
            v-model="transferForm.note"
            rows="3"
            :placeholder="tr('Tambahkan catatan bila diperlukan')"
            auto-resize
            class="w-full"
          />
        </div>

        <div class="flex justify-end">
          <Button
            :label="tr('Ajukan transfer')"
            icon="pi pi-send"
            :loading="uploadFileMutation.isPending.value || submitTransferMutation.isPending.value"
            :disabled="!transferForm.invoiceId || !transferForm.destinationAccountId || !transferForm.proofFileId || !transferForm.transferredAt || Number(transferForm.amount) <= 0"
            @click="submitTransfer"
          />
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
