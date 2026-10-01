<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import { useConfirm } from 'primevue/useconfirm'
import BrandMark from '@/app/components/BrandMark.vue'
import SessionActions from '@/auth/components/SessionActions.vue'
import { AppDataTable, AppSkeleton, ErrorState, MutationErrors, PageHeader } from '@/design-system'
import { readNotification, unreadNotification, readAllNotifications } from '@/api/generated/endpoints'
import { queryClient } from '@/app/providers/query'
import { session } from '@/auth/stores/session'
import { useFormSubmission } from '@/shared/composables/useFormSubmission'
import { normalizeApiError } from '@/api/errors/normalizer'
import { formatDateTime } from '@/shared/utils/dateTime'
import { tr } from '@/i18n'
import { categoryLabel, type InboxItem } from './model'
import { useInbox } from './queries'
const status = ref<'' | 'read' | 'unread'>('')
const category = ref<'' | 'security' | 'account' | 'system'>('')
const cursor = ref<string>()
const selected = ref('')
const visible = computed({ get: () => !!selected.value, set: (value) => { if (!value) selected.value = '' } })
const { key, list, count, detail } = useInbox(status, category, cursor, selected)
const rows = computed(() => (list.data.value?.data ?? []).map(row => ({ ...row, public_id: row.id, categoryLabel: tr(categoryLabel(row.category)) })))
const statuses = computed(() => [{ value: '', label: tr('Semua status') }, { value: 'unread', label: tr('Belum dibaca') }, { value: 'read', label: tr('Sudah dibaca') }])
const categories = computed(() => [{ value: '', label: tr('Semua kategori') }, ...['security', 'account', 'system'].map(value => ({ value, label: tr(categoryLabel(value)) }))])
watch([status, category], () => { cursor.value = undefined })
const { busy, error, submit } = useFormSubmission()
const confirm = useConfirm()
const confirming = ref(false)
const locked = computed(() => busy.value || confirming.value)
let active = true
onBeforeUnmount(() => { active = false; confirm.close() })
async function change(item?: InboxItem) {
  if (busy.value) return
  const token = session.getToken()
  await submit(true, { id: item?.id, read: !item?.read_at }, () => item ? (item.read_at ? unreadNotification(encodeURIComponent(item.id)) : readNotification(encodeURIComponent(item.id))) : readAllNotifications(), async () => {
    if (!active || session.getToken() !== token) return
    cursor.value = undefined
    await queryClient.invalidateQueries({ queryKey: key })
  })
}
function markAll() {
  if (locked.value || !count.data.value) return
  const token = session.getToken()
  confirming.value = true
  confirm.require({ header: tr('Tandai semua dibaca'), message: tr('Semua notifikasi akun, termasuk di luar filter saat ini, akan ditandai dibaca.'), acceptLabel: tr('Ya, tandai dibaca'), rejectLabel: tr('Batal'), accept: () => { confirming.value = false; if (active && token === session.getToken()) void change() }, reject: () => { confirming.value = false }, onHide: () => { confirming.value = false } })
}
function open(item: InboxItem) { error.value = null; selected.value = item.id }
</script>
<template>
  <main class="max-w-6xl mx-auto p-4 sm:p-8">
    <header class="flex items-center justify-between gap-4 mb-8"><BrandMark /><SessionActions /></header>
    <PageHeader :title="tr('Notifikasi')" :description="tr('Pesan dan pembaruan untuk akun Anda.')" back-to="/">
      <template #actions><Button :label="tr('Tandai semua dibaca')" :disabled="locked || count.isError.value || !count.data.value" @click="markAll" /></template>
      <template #subtitle><p role="status">{{ tr('Belum dibaca') }}: {{ count.isPending.value || count.isError.value ? '—' : count.data.value }}</p><Button v-if="count.isError.value" :label="tr('Ulangi jumlah notifikasi')" text @click="count.refetch()" /></template>
    </PageHeader>
    <MutationErrors :error="error" />
    <div class="flex flex-wrap gap-3 mb-4">
      <Select v-model="status" :options="statuses" option-label="label" option-value="value" :aria-label="tr('Filter status notifikasi')" :disabled="locked" />
      <Select v-model="category" :options="categories" option-label="label" option-value="value" :aria-label="tr('Filter kategori notifikasi')" :disabled="locked" />
      <Button :label="tr('Muat ulang')" icon="pi pi-refresh" severity="secondary" outlined :disabled="locked || list.isFetching.value" @click="list.refetch(); count.refetch()" />
    </div>
    <AppDataTable :rows="rows" :title="tr('Inbox notifikasi')" :search-fields="['title', 'message', 'categoryLabel']" :pending="list.isPending.value" :busy="list.isFetching.value || locked" :error="list.isError.value ? normalizeApiError(list.error.value).message : null" :empty-title="tr('Tidak ada notifikasi')" :empty-description="tr('Notifikasi yang sesuai filter akan muncul di sini.')" :next="list.data.value?.next_cursor" :previous="list.data.value?.prev_cursor" :page-key="[cursor, status, category].join(':')" @retry="list.refetch()" @page="cursor = $event">
      <Column field="title" :header="tr('Pesan')" sortable><template #body="{ data }"><Button :label="data.title" link :disabled="locked" class="text-left" @click="open(data)" /></template></Column>
      <Column field="categoryLabel" :header="tr('Kategori')" sortable />
      <Column :header="tr('Status')"><template #body="{ data }"><Tag :severity="data.read_at ? 'secondary' : 'info'" :value="tr(data.read_at ? 'Sudah dibaca' : 'Belum dibaca')" /></template></Column>
      <Column field="created_at" :header="tr('Diterima')" sortable><template #body="{ data }">{{ formatDateTime(data.created_at) }}</template></Column>
    </AppDataTable>
    <Dialog v-model:visible="visible" modal :header="tr('Detail notifikasi')" :style="{ width: '36rem', maxWidth: 'calc(100vw - 2rem)' }">
      <ErrorState v-if="detail.isError.value" :description="normalizeApiError(detail.error.value).message" @retry="detail.refetch()" />
      <AppSkeleton v-else-if="detail.isPending.value" />
      <template v-else-if="detail.data.value">
        <h3 class="font-semibold break-words">{{ detail.data.value.title }}</h3>
        <p class="text-sm text-surface-500 my-2">{{ tr(categoryLabel(detail.data.value.category)) }} · {{ formatDateTime(detail.data.value.created_at) }}</p>
        <Tag :severity="detail.data.value.read_at ? 'secondary' : 'info'" :value="tr(detail.data.value.read_at ? 'Sudah dibaca' : 'Belum dibaca')" />
        <p class="whitespace-pre-wrap break-words my-4">{{ detail.data.value.message }}</p>
        <MutationErrors :error="error" />
        <Button :label="tr(detail.data.value.read_at ? 'Tandai belum dibaca' : 'Tandai dibaca')" :loading="busy" :disabled="locked || detail.isFetching.value" @click="change(detail.data.value)" />
      </template>
    </Dialog>
  </main>
</template>
