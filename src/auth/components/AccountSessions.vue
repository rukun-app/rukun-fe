<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { AppDataTable, MutationErrors } from '@/design-system'
import { listTokens, revokeToken, logoutAll } from '@/api/generated/endpoints'
import type { ApiToken } from '@/api/generated/models'
import { session } from '@/auth/stores/session'
import { clearAuthentication } from '@/auth/services/authentication'
import { useFormSubmission } from '@/shared/composables/useFormSubmission'
import { normalizeApiError } from '@/api/errors/normalizer'
import { formatDateTime } from '@/shared/utils/dateTime'
import { sessionLabel, sessionRevocation } from '@/auth/forms/sessions'
import { tr } from '@/i18n'
const props = defineProps<{ disabled: boolean; hasUnsavedChanges: boolean }>()
const emit = defineEmits<{ busy: [value: boolean]; signedOut: [] }>()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const query = useQuery({
  queryKey: ['account', session.getUser()?.id, 'sessions'],
  queryFn: ({ signal }) => listTokens(undefined, signal),
})
const rows = computed(() =>
  (query.data.value?.data ?? []).map((token) => ({ ...token, label: sessionLabel(token) })),
)
const { busy, error, submit } = useFormSubmission()
const confirming = ref(false)
watch([busy, confirming], () => emit('busy', busy.value || confirming.value), { flush: 'sync' })
let active = true
onBeforeUnmount(() => {
  active = false
  confirm.close()
  emit('busy', false)
})
function requestRevoke(token?: ApiToken) {
  if (busy.value || confirming.value || props.disabled) return
  const target = token ? sessionRevocation(token) : null
  if (token && !target) return
  const signsOut = !token || target?.signsOut === true
  const sessionToken = session.getToken()
  confirming.value = true
  confirm.require({
    header: token ? tr('Cabut sesi perangkat?') : tr('Keluar dari semua perangkat?'),
    message: `${target?.label ?? tr('Semua sesi akun Anda')}. ${signsOut ? tr('Perangkat ini juga akan keluar. Anda perlu masuk kembali.') : tr('Perangkat tersebut perlu masuk kembali; sesi perangkat ini tetap aktif.')}${signsOut && props.hasUnsavedChanges ? ' ' + tr('Perubahan formulir yang belum disimpan akan dibuang setelah berhasil.') : ''}`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: tr('Ya, lanjutkan'),
    rejectLabel: tr('Batal'),
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', outlined: true },
    onHide: () => {
      confirming.value = false
    },
    reject: () => {
      confirming.value = false
    },
    accept: async () => {
      confirming.value = false
      if (!active || sessionToken !== session.getToken()) return
      await submit(
        true,
        target ? { id: target.id } : { all: true },
        () => (target ? revokeToken(target.id) : logoutAll()),
        async () => {
          if (!active || sessionToken !== session.getToken()) return
          if (signsOut) {
            emit('signedOut')
            clearAuthentication()
            await router.replace('/auth/login')
          } else {
            await query.refetch()
            toast.add({ severity: 'success', summary: tr('Sesi perangkat dicabut'), life: 4000 })
          }
        },
      )
    },
  })
}
function refresh() {
  error.value = null
  void query.refetch()
}
</script>
<template>
  <section class="mt-8">
    <h2 class="font-semibold mb-2">{{ tr('Sesi perangkat') }}</h2>
    <p class="text-sm text-surface-500 mb-4">
      {{ tr('Nama sesi berasal dari server dan mungkin sama pada beberapa perangkat.') }}
    </p>
    <MutationErrors :error="error" />
    <div class="flex flex-wrap gap-2 my-4">
      <Button
        :label="tr('Muat ulang sesi')"
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        :disabled="disabled || busy || confirming || query.isFetching.value"
        @click="refresh"
      />
      <Button
        :label="tr('Keluar dari semua perangkat')"
        severity="danger"
        outlined
        :disabled="disabled || busy || confirming"
        @click="requestRevoke()"
      />
    </div>
    <AppDataTable
      :rows="rows"
      :title="tr('Daftar sesi perangkat')"
      :search-fields="['label']"
      :pending="query.isPending.value"
      :busy="query.isFetching.value || busy"
      :error="query.isError.value ? normalizeApiError(query.error.value).message : null"
      :empty-title="tr('Tidak ada sesi perangkat')"
      :empty-description="tr('Muat ulang untuk melihat sesi terbaru dari server.')"
      min-width="820px"
      @retry="refresh"
    >
      <Column field="label" :header="tr('Perangkat')" sortable
        ><template #body="{ data }"
          ><span>{{ data.label }}</span
          ><Tag
            v-if="data.is_current"
            :value="tr('Perangkat ini')"
            severity="info"
            class="ml-2" /></template
      ></Column>
      <Column field="created_at" :header="tr('Dibuat')" sortable
        ><template #body="{ data }">{{ formatDateTime(data.created_at) }}</template></Column
      >
      <Column field="last_used_at" :header="tr('Terakhir digunakan')" sortable
        ><template #body="{ data }">{{ formatDateTime(data.last_used_at) }}</template></Column
      >
      <Column field="expires_at" :header="tr('Kedaluwarsa')" sortable
        ><template #body="{ data }">{{ formatDateTime(data.expires_at) }}</template></Column
      >
      <Column :header="tr('Tindakan')"
        ><template #body="{ data }"
          ><Button
            :label="tr('Cabut sesi')"
            :aria-label="`${tr('Cabut sesi')} ${data.label}`"
            severity="danger"
            text
            :disabled="disabled || busy || confirming"
            @click="requestRevoke(data)" /></template
      ></Column>
    </AppDataTable>
  </section>
</template>
