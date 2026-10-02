<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import { AppDataTable, MutationErrors, PageHeader } from '@/design-system'
import {
  listNotificationPreferences,
  updateNotificationPreferences,
} from '@/api/generated/endpoints'
import { session } from '@/auth/stores/session'
import { queryClient } from '@/app/providers/query'
import { normalizeApiError } from '@/api/errors/normalizer'
import { useFormSubmission } from '@/shared/composables/useFormSubmission'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { tr } from '@/i18n'
import { categoryLabel } from './model'
import {
  clonePreferences,
  parsePreferences,
  preferencesChanged,
  preferencesPayload,
  type Channel,
  type NotificationPreference,
} from './preferences'
const key = ['account', session.getUser()?.id, 'notification-preferences']
const query = useQuery({
  queryKey: key,
  queryFn: async ({ signal }) =>
    parsePreferences(await listNotificationPreferences(undefined, signal)),
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
})
const baseline = ref<NotificationPreference[]>([])
const draft = ref<NotificationPreference[]>([])
const { dirty } = useUnsavedChanges()
const { busy, error, submit } = useFormSubmission()
const saved = ref(false)
let active = true
onBeforeUnmount(() => {
  active = false
})
watch(
  draft,
  () => {
    dirty.value = preferencesChanged(draft.value, baseline.value)
  },
  { deep: true, flush: 'sync' },
)
function apply(value: NotificationPreference[]) {
  baseline.value = clonePreferences(value)
  draft.value = clonePreferences(value)
}
watch(
  query.data,
  (value) => {
    if (value && !dirty.value) apply(value)
  },
  { immediate: true },
)
const tableRows = computed(() =>
  draft.value.map((row) => ({
    ...row,
    public_id: row.category,
    label: tr(categoryLabel(row.category)),
  })),
)
const channels: { key: Channel; label: string }[] = [
  { key: 'database', label: 'Inbox aplikasi' },
  { key: 'mail', label: 'Email' },
]
function toggle(category: string, channel: Channel, value: boolean) {
  const row = draft.value.find((item) => item.category === category)
  if (!row || busy.value || row.locked_channels.includes(channel) || query.isError.value) return
  row[`${channel}_enabled`] = value
  saved.value = false
}
function reset() {
  if (busy.value) return
  apply(baseline.value)
  error.value = null
  saved.value = false
}
async function save() {
  if (!dirty.value || busy.value || query.isError.value || query.isFetching.value) return
  const token = session.getToken()
  saved.value = false
  await submit(true, draft.value, async () => {
    const response = parsePreferences(
      await updateNotificationPreferences(preferencesPayload(draft.value, baseline.value)),
    )
    if (!active || token !== session.getToken()) return
    apply(response)
    queryClient.setQueryData(key, response)
    saved.value = true
  })
}
</script>
<template>
  <section>
    <PageHeader
      :title="tr('Preferensi notifikasi')"
      :description="tr('Pilih kanal untuk setiap jenis notifikasi akun Anda.')"
      back-to="/notifications"
    />
    <Message severity="info" :closable="false" class="mb-4">{{
      tr(
        'Kanal wajib ditentukan server dan tidak dapat dinonaktifkan. Perubahan berlaku untuk notifikasi berikutnya.',
      )
    }}</Message>
    <Message v-if="saved" severity="success" :closable="false" class="mb-4">{{
      tr('Preferensi notifikasi tersimpan')
    }}</Message>
    <MutationErrors :error="error" />
    <AppDataTable
      :rows="tableRows"
      :title="tr('Kanal notifikasi')"
      :search-fields="['label']"
      :pending="query.isPending.value"
      :busy="query.isFetching.value || busy"
      :error="query.isError.value ? normalizeApiError(query.error.value).message : null"
      :empty-title="tr('Preferensi belum tersedia')"
      min-width="480px"
      @retry="query.refetch()"
    >
      <Column field="label" :header="tr('Kategori')" sortable />
      <Column v-for="channel in channels" :key="channel.key" :header="tr(channel.label)">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <ToggleSwitch
              :model-value="data[`${channel.key}_enabled`]"
              :aria-label="`${tr(channel.label)} ${data.label}`"
              :disabled="
                busy || query.isFetching.value || data.locked_channels.includes(channel.key)
              "
              @update:model-value="toggle(data.category, channel.key, $event)"
            />
            <Tag
              v-if="data.locked_channels.includes(channel.key)"
              :value="tr('Wajib')"
              severity="secondary"
            />
          </div>
        </template>
      </Column>
    </AppDataTable>
    <div class="flex flex-wrap gap-3 mt-4">
      <Button
        :label="tr('Simpan preferensi')"
        :loading="busy"
        :disabled="busy || !dirty || query.isError.value || query.isFetching.value"
        @click="save"
      />
      <Button
        :label="tr('Batalkan perubahan')"
        severity="secondary"
        outlined
        :disabled="busy || !dirty"
        @click="reset"
      />
    </div>
  </section>
</template>
