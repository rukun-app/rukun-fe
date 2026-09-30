<script setup lang="ts">
import { tr } from '@/i18n'
import ReferenceSelect from './ReferenceSelect.vue'
import { createIntentKey } from '@/shared/utils/idempotency'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { createHousehold, updateHousehold } from '@/api/generated/endpoints'
import type { CreateHousehold, UpdateHousehold } from '@/api/generated/models'
import { useHousehold } from './queries'
import MutationErrors from './MutationErrors.vue'
import { AppSkeleton, ErrorState } from '@/design-system'
import { queryClient } from '@/app/providers/query'
import { normalizeApiError } from '@/api/errors/normalizer'
import type { NormalizedApiError } from '@/api/errors/types'
import { useContextStore } from '@/contexts/stores/context'
const route = useRoute()
const router = useRouter()
const context = useContextStore()
const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const query = useHousehold(id)
const editing = computed(() => !!id.value)
const initial = computed(() => ({
  area_id: '',
  address: '',
  block: '',
  house_number: '',
  occupancy_status: 'occupied',
  status: 'active',
  ...query.data.value?.data,
}))
const busy = ref(false)
const dirty = ref(false)
const error = ref<NormalizedApiError | null>(null)
const intentKey = createIntentKey()
watch(id, () => {
  dirty.value = false
  error.value = null
})
onBeforeRouteLeave(
  () => !dirty.value || window.confirm(tr('Perubahan belum disimpan. Tinggalkan halaman?')),
)
const resolver = computed(() =>
  zodResolver(
    z.object({
      area_id: editing.value ? z.string().optional() : z.string().uuid(tr('Pilih wilayah RT')),
      address: z.string().trim().min(1, tr('Alamat wajib diisi')).max(2000),
      block: z.string().nullable().optional(),
      house_number: z.string().nullable().optional(),
      occupancy_status: z.enum(['occupied', 'vacant', 'rented', 'other']),
      status: z.enum(['active', 'moved', 'inactive']).optional(),
    }),
  ),
)
async function save(event: FormSubmitEvent) {
  if (!event.valid || busy.value) return
  busy.value = true
  error.value = null
  try {
    const { address, block, house_number, occupancy_status, status } = event.values
    if (editing.value)
      await updateHousehold(id.value, {
        address,
        block,
        house_number,
        occupancy_status,
        status,
      } as UpdateHousehold)
    else
      await createHousehold(
        {
          area_id: event.values.area_id,
          address,
          block,
          house_number,
          occupancy_status,
        } as CreateHousehold,
        { headers: { 'Idempotency-Key': intentKey(event.values) } },
      )
    dirty.value = false
    await queryClient.invalidateQueries({ queryKey: ['community'] })
    await router.push('/manage/households')
  } catch (e) {
    error.value = normalizeApiError(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="page-container">
    <RouterLink to="/manage/households" class="back-link"
      ><i class="pi pi-arrow-left" aria-hidden="true" /> {{ tr('Kembali ke daftar KK') }}
    </RouterLink>
    <div class="page-heading">
      <div>
        <span class="eyebrow"> {{ tr('DATA KELUARGA') }} </span>
        <h2>{{ editing ? tr('Detail Kartu Keluarga') : tr('Tambah Kartu Keluarga') }}</h2>
        <p>
          {{
            editing
              ? tr('Tinjau dan perbarui informasi rumah tangga.')
              : tr('Catat rumah tangga sebagai bagian dari lingkungan Anda.')
          }}
        </p>
      </div>
    </div>
    <AppSkeleton v-if="editing && query.isPending.value" />
    <ErrorState
      v-else-if="editing && query.isError.value"
      :description="normalizeApiError(query.error.value).message"
      @retry="query.refetch()"
    />
    <div v-else class="form-layout">
      <Form
        v-slot="$form"
        :key="id + String(query.dataUpdatedAt.value)"
        :initial-values="initial"
        :resolver="resolver"
        class="form-panel"
        @submit="save"
        @input="dirty = true"
        @change="dirty = true"
      >
        <div class="form-panel-heading">
          <span class="row-icon"><i class="pi pi-home" aria-hidden="true" /></span>
          <div>
            <h3>{{ tr('Informasi rumah tangga') }}</h3>
            <p>{{ tr('Kolom bertanda * wajib diisi.') }}</p>
          </div>
        </div>
        <MutationErrors :error="error" />
        <fieldset :disabled="busy || !context.can('households.manage')" class="form-fields">
          <div v-if="!editing" class="form-field full-width">
            <label for="area">
              {{ tr('Wilayah RT') }} <span class="required" aria-hidden="true">*</span></label
            ><ReferenceSelect
              input-id="area"
              resource="rt"
              :label="tr('Pilih wilayah RT')"
              name="area_id"
              :invalid="!!$form.area_id?.invalid"
              :disabled="busy"
              @change="dirty = true"
            /><small class="text-red-700">{{ $form.area_id?.error?.message }}</small
            ><small class="field-help"> {{ tr('Pilih RT tempat keluarga tinggal.') }} </small>
          </div>
          <div class="form-field full-width">
            <label for="address">
              {{ tr('Alamat') }} <span class="required" aria-hidden="true">*</span></label
            ><InputText
              id="address"
              name="address"
              :placeholder="tr('Contoh: Jalan Melati Raya')"
              :invalid="!!$form.address?.invalid"
            /><small class="text-red-700">{{ $form.address?.error?.message }}</small>
          </div>
          <div class="form-field">
            <label for="block"> {{ tr('Blok') }} </label
            ><InputText id="block" name="block" :placeholder="tr('Contoh: A')" />
          </div>
          <div class="form-field">
            <label for="number"> {{ tr('Nomor rumah') }} </label
            ><InputText id="number" name="house_number" :placeholder="tr('Contoh: 12')" />
          </div>
          <div class="form-field">
            <label for="occupancy"> {{ tr('Hunian') }} </label
            ><Select
              input-id="occupancy"
              name="occupancy_status"
              :options="[
                { label: tr('Dihuni'), value: 'occupied' },
                { label: tr('Kosong'), value: 'vacant' },
                { label: tr('Disewakan'), value: 'rented' },
                { label: tr('Lainnya'), value: 'other' },
              ]"
              option-label="label"
              option-value="value"
            />
          </div>
          <div v-if="editing" class="form-field">
            <label for="status"> {{ tr('Status') }} </label
            ><Select
              input-id="status"
              name="status"
              :options="[
                { label: tr('Aktif'), value: 'active' },
                { label: tr('Pindah'), value: 'moved' },
                { label: tr('Tidak aktif'), value: 'inactive' },
              ]"
              option-label="label"
              option-value="value"
            />
          </div>
        </fieldset>
        <div v-if="context.can('households.manage')" class="form-actions">
          <RouterLink to="/manage/households" class="text-xs text-surface-500 mr-2">
            {{ tr('Batal') }} </RouterLink
          ><Button type="submit" :label="tr('Simpan KK')" icon="pi pi-check" :loading="busy" />
        </div>
      </Form>
      <aside class="form-note">
        <i class="pi pi-info-circle" aria-hidden="true" />
        <h3>{{ tr('Rumah untuk setiap keluarga') }}</h3>
        <p>
          {{
            tr(
              'Pastikan alamat dan wilayah RT sudah sesuai. Data ini menjadi dasar pendataan anggota keluarga.',
            )
          }}
        </p>
        <RouterLink
          v-if="editing && context.can('residents.view')"
          :to="{ path: '/manage/residents', query: { household: id } }"
        >
          {{ tr('Lihat anggota keluarga') }}
          <i class="pi pi-arrow-right ml-1" aria-hidden="true" /></RouterLink
        ><RouterLink v-else-if="context.can('areas.view')" to="/manage/areas">
          {{ tr('Lihat daftar wilayah') }} <i class="pi pi-arrow-right ml-1" aria-hidden="true"
        /></RouterLink>
      </aside>
    </div>
  </section>
</template>
