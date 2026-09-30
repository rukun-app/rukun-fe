<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { AppDataTable, AppSkeleton, ErrorState, MutationErrors, PageHeader } from '@/design-system'
import { useContextStore } from '@/contexts/stores/context'
import { useFormSubmission } from '@/shared/composables/useFormSubmission'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { queryClient } from '@/app/providers/query'
import { ensureSession } from '@/auth/services/authentication'
import { normalizeApiError } from '@/api/errors/normalizer'
import { moveResident } from '@/api/generated/endpoints'
import { tr } from '@/i18n'
import { useResident, useHousehold } from './queries'
import { useMembershipHistory } from './useMembershipHistory'
import { recordLabel, recordOptions, relationshipValues } from './options'
import { householdAddress, membershipDate, membershipPayload, membershipSchema } from './membership'
import ReferenceSelect from './ReferenceSelect.vue'
const route = useRoute()
const router = useRouter()
const context = useContextStore()
const confirm = useConfirm()
const toast = useToast()
const id = computed(() => String(route.params.id))
const residentQuery = useResident(id)
const resident = computed(() => residentQuery.data.value?.data)
const currentId = computed(() => resident.value?.household_id ?? '')
const currentQuery = useHousehold(currentId)
const currentLabel = computed(() =>
  !currentId.value
    ? tr('Belum terhubung dengan keluarga')
    : !context.can('households.view')
      ? tr('Alamat keluarga dibatasi akses')
      : currentQuery.isPending.value
        ? tr('Memuat...')
        : householdAddress(currentQuery.isError.value ? undefined : currentQuery.data.value?.data),
)
const selectedTarget = ref('')
const targetQuery = useHousehold(selectedTarget)
const cursor = ref<string>()
const ready = computed(() => residentQuery.isSuccess.value)
const {
  query: history,
  result,
  rows,
  addressError,
  retryAddresses,
} = useMembershipHistory(id, cursor, ready)
const { busy, error, submit } = useFormSubmission()
const { dirty } = useUnsavedChanges()
const confirming = ref(false)
watch(id, () => {
  cursor.value = undefined
  selectedTarget.value = ''
  error.value = null
  confirm.close()
})
const resolver = computed(() => zodResolver(membershipSchema()))
onBeforeUnmount(() => confirm.close())
function requestChange(event: FormSubmitEvent) {
  if (!event.valid || busy.value || confirming.value || !context.can('residents.manage')) return
  const payload = membershipPayload(event.values)
  if (
    payload.household_id &&
    (!targetQuery.isSuccess.value ||
      targetQuery.data.value?.data?.public_id !== payload.household_id)
  )
    return
  const residentId = id.value
  const activeContext = context.activeContextId
  const destination = payload.household_id
    ? householdAddress(targetQuery.data.value?.data)
    : tr('Tanpa keluarga')
  confirming.value = true
  confirm.require({
    header: tr('Konfirmasi mutasi keluarga'),
    message: `${resident.value?.name ?? ''} → ${destination}. ${payload.household_id ? recordLabel(payload.relationship) + '. ' : ''}${tr('Keanggotaan lama akan ditutup. Akses terkait keluarga lama dapat dicabut oleh server.')}`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: tr('Ya, simpan mutasi'),
    rejectLabel: tr('Batal'),
    rejectProps: { severity: 'secondary', outlined: true },
    acceptProps: { severity: payload.household_id ? 'primary' : 'danger' },
    onHide: () => {
      confirming.value = false
    },
    reject: () => {
      confirming.value = false
    },
    accept: async () => {
      confirming.value = false
      if (
        residentId !== id.value ||
        activeContext !== context.activeContextId ||
        !context.can('residents.manage')
      )
        return
      await submit(
        true,
        payload,
        (headers) => moveResident(residentId, payload, { headers }),
        async () => {
          dirty.value = false
          await queryClient.cancelQueries({ queryKey: ['community'] })
          queryClient.removeQueries({ queryKey: ['community'] })
          await ensureSession(true)
          await router.replace('/manage/residents')
          toast.add({
            severity: 'success',
            summary: tr('Mutasi keluarga tersimpan'),
            detail: tr('Data diperbarui berdasarkan respons server.'),
            life: 5000,
          })
        },
      )
    },
  })
}
</script>
<template>
  <section class="page-container">
    <RouterLink :to="`/manage/residents/${id}`" class="back-link"
      ><i class="pi pi-arrow-left" aria-hidden="true" />{{
        tr('Kembali ke detail warga')
      }}</RouterLink
    >
    <PageHeader
      :eyebrow="tr('DATA WARGA')"
      :title="tr('Keanggotaan keluarga')"
      :description="tr('Tinjau riwayat dan kelola hubungan warga dengan keluarganya.')"
    />
    <AppSkeleton v-if="residentQuery.isPending.value" />
    <ErrorState
      v-else-if="residentQuery.isError.value"
      :description="normalizeApiError(residentQuery.error.value).message"
      @retry="residentQuery.refetch()"
    />
    <template v-else>
      <div class="form-note mb-6">
        <h3>{{ resident?.name }}</h3>
        <p>{{ tr('Keluarga saat ini') }}: {{ currentLabel }}</p>
      </div>
      <Form
        v-if="context.can('residents.manage')"
        v-slot="$form"
        :key="id"
        :initial-values="{ mode: 'move', household_id: '', relationship: '' }"
        :resolver="resolver"
        class="form-panel mb-6"
        @submit="requestChange"
        @input="dirty = true"
        @change="dirty = true"
      >
        <div class="form-panel-heading">
          <div>
            <h3>{{ tr('Mutasi keanggotaan') }}</h3>
            <p>{{ tr('Pilih keluarga tujuan atau akhiri keanggotaan saat ini.') }}</p>
          </div>
        </div>
        <MutationErrors :error="error" />
        <fieldset :disabled="busy || confirming" class="form-fields">
          <div class="form-field full-width">
            <label for="membership-mode">{{ tr('Jenis perubahan') }}</label
            ><Select
              input-id="membership-mode"
              name="mode"
              :aria-label="tr('Jenis perubahan')"
              :disabled="busy || confirming"
              :options="[
                { value: 'move', label: tr('Pindah keluarga / ubah hubungan') },
                { value: 'end', label: tr('Akhiri keanggotaan') },
              ]"
              option-label="label"
              option-value="value"
              @change="dirty = true"
            />
          </div>
          <template v-if="$form.mode?.value !== 'end'">
            <div class="form-field full-width">
              <label for="destination">{{ tr('Keluarga tujuan') }}</label
              ><ReferenceSelect
                input-id="destination"
                name="household_id"
                resource="household"
                :label="tr('Pilih keluarga tujuan')"
                :invalid="!!$form.household_id?.invalid"
                :disabled="busy || confirming"
                @update:model-value="selectedTarget = $event"
                @change="dirty = true"
              /><small class="text-red-700">{{ $form.household_id?.error?.message }}</small
              ><small class="field-help">{{
                tr('Pilih keluarga yang sama untuk mengubah hubungan keluarga.')
              }}</small>
              <ErrorState
                v-if="selectedTarget && targetQuery.isError.value"
                :description="tr('Keluarga tujuan belum dapat diverifikasi.')"
                @retry="targetQuery.refetch()"
              />
            </div>
            <div class="form-field">
              <label for="membership-relationship">{{ tr('Hubungan keluarga') }}</label
              ><Select
                input-id="membership-relationship"
                name="relationship"
                :aria-label="tr('Hubungan keluarga')"
                :disabled="busy || confirming"
                :options="recordOptions(relationshipValues)"
                option-label="label"
                option-value="value"
                :placeholder="tr('Pilih hubungan keluarga')"
                :invalid="!!$form.relationship?.invalid"
                @change="dirty = true"
              /><small class="text-red-700">{{ $form.relationship?.error?.message }}</small>
            </div>
          </template>
          <Message v-else severity="warn" :closable="false" class="full-width">{{
            tr(
              'Warga tidak lagi terhubung dengan keluarga. Tindakan ini tidak menghapus data warga.',
            )
          }}</Message>
        </fieldset>
        <div class="form-actions">
          <Button
            type="submit"
            :label="tr('Tinjau perubahan')"
            icon="pi pi-check"
            :loading="busy"
            :disabled="
              confirming ||
              ($form.mode?.value === 'end'
                ? !currentId
                : !context.can('households.view') ||
                  (!!selectedTarget && !targetQuery.isSuccess.value))
            "
          />
        </div>
      </Form>
      <Message v-if="addressError" severity="warn" :closable="false" class="mb-4"
        >{{ tr('Sebagian alamat keluarga tidak dapat dimuat.') }}
        <Button :label="tr('Coba lagi')" text @click="retryAddresses()"
      /></Message>
      <AppDataTable
        :rows="rows"
        :title="tr('Riwayat keanggotaan')"
        :search-fields="['householdLabel']"
        :pending="history.isPending.value"
        :busy="history.isFetching.value"
        :error="history.isError.value ? normalizeApiError(history.error.value).message : null"
        :empty-title="tr('Belum ada riwayat keanggotaan')"
        :empty-description="tr('Riwayat hanya mencakup keluarga yang boleh diakses akun Anda.')"
        :next="result?.next_cursor"
        :previous="result?.prev_cursor"
        :page-key="[id, cursor].join(':')"
        min-width="760px"
        @page="cursor = $event"
        @retry="history.refetch()"
      >
        <Column field="householdLabel" :header="tr('KARTU KELUARGA')" sortable />
        <Column field="relationship" :header="tr('Hubungan keluarga')"
          ><template #body="{ data }">{{ recordLabel(data.relationship) }}</template></Column
        >
        <Column field="starts_at" :header="tr('Mulai')" sortable
          ><template #body="{ data }">{{ membershipDate(data.starts_at) }}</template></Column
        >
        <Column field="ends_at" :header="tr('Berakhir')" sortable
          ><template #body="{ data }">{{ membershipDate(data.ends_at) }}</template></Column
        >
        <Column :header="tr('STATUS')"
          ><template #body="{ data }"
            ><Tag
              :severity="data.ends_at === null ? 'success' : 'secondary'"
              :value="
                data.ends_at === null
                  ? tr('Aktif')
                  : data.ends_at
                    ? tr('Selesai')
                    : tr('Belum tersedia')
              " /></template
        ></Column>
      </AppDataTable>
      <p class="field-help mt-4">
        {{ tr('Riwayat hanya mencakup keluarga yang boleh diakses akun Anda.') }}
      </p>
    </template>
  </section>
</template>
