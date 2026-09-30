<script setup lang="ts">
import { recordOptions, relationshipValues, residentStatuses } from './options'
import { tr } from '@/i18n'
import ReferenceSelect from './ReferenceSelect.vue'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { useFormSubmission } from '@/shared/composables/useFormSubmission'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { createResident, updateResident } from '@/api/generated/endpoints'
import type { CreateResident, UpdateResident } from '@/api/generated/models'
import { useResident } from './queries'
import { MutationErrors } from '@/design-system'
import { AppSkeleton, ErrorState, PageHeader } from '@/design-system'
import { queryClient } from '@/app/providers/query'
import { normalizeApiError } from '@/api/errors/normalizer'
import { useContextStore } from '@/contexts/stores/context'
const route = useRoute()
const router = useRouter()
const context = useContextStore()
const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const query = useResident(id)
const editing = computed(() => !!id.value)
const initial = computed(() => ({
  household_id: route.query.household ?? '',
  name: '',
  phone: '',
  birth_date: '',
  relationship: 'other',
  status: 'active',
  ...query.data.value?.data,
}))
const { dirty } = useUnsavedChanges()
const { busy, error, submit } = useFormSubmission()
watch(id, () => {
  error.value = null
})
const resolver = computed(() =>
  zodResolver(
    z.object({
      household_id: editing.value
        ? z.string().nullable().optional()
        : z.string().uuid(tr('Pilih kartu keluarga')),
      name: z.string().trim().min(1, tr('Nama wajib diisi')).max(100),
      phone: z.string().nullable().optional(),
      birth_date: z.string().nullable().optional(),
      relationship: z.enum(relationshipValues),
      status: z.enum(residentStatuses).optional(),
    }),
  ),
)
async function save(event: FormSubmitEvent) {
  await submit(
    event.valid,
    event.values,
    async (headers) => {
      const { name, phone, birth_date, status } = event.values
      if (editing.value)
        await updateResident(id.value, {
          name,
          phone: phone || null,
          birth_date: birth_date || null,
          status,
        } as UpdateResident)
      else
        await createResident(
          {
            household_id: event.values.household_id,
            name,
            phone: phone || null,
            birth_date: birth_date || null,
            relationship: event.values.relationship,
          } as CreateResident,
          { headers },
        )
    },
    async () => {
      dirty.value = false
      await queryClient.invalidateQueries({ queryKey: ['community'] })
      await router.push('/manage/residents')
    },
  )
}
</script>
<template>
  <section class="page-container">
    <RouterLink to="/manage/residents" class="back-link"
      ><i class="pi pi-arrow-left" aria-hidden="true" /> {{ tr('Kembali ke daftar warga') }}
    </RouterLink>
    <PageHeader
      :eyebrow="tr('DATA WARGA')"
      :title="editing ? tr('Detail Warga') : tr('Tambah Warga')"
      :description="
        editing
          ? tr('Tinjau dan perbarui informasi warga yang terdaftar.')
          : tr('Kenali setiap warga, mulai dari data yang tepat.')
      "
    ></PageHeader>
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
          <span class="row-icon"><i class="pi pi-user" aria-hidden="true" /></span>
          <div>
            <h3>{{ tr('Informasi warga') }}</h3>
            <p>{{ tr('Kolom bertanda * wajib diisi.') }}</p>
          </div>
        </div>
        <MutationErrors :error="error" />
        <fieldset :disabled="busy || !context.can('residents.manage')" class="form-fields">
          <div v-if="!editing" class="form-field full-width">
            <label for="household">
              {{ tr('Kartu keluarga') }} <span class="required" aria-hidden="true">*</span></label
            ><ReferenceSelect
              input-id="household"
              resource="household"
              :label="tr('Pilih kartu keluarga')"
              :selected-id="String(initial.household_id || '')"
              name="household_id"
              :invalid="!!$form.household_id?.invalid"
              :disabled="busy"
              @change="dirty = true"
            /><small class="text-red-700">{{ $form.household_id?.error?.message }}</small
            ><small class="field-help">
              {{ tr('Tambahkan warga dari detail KK agar keluarga terisi otomatis.') }}
            </small>
          </div>
          <div class="form-field full-width">
            <label for="name">
              {{ tr('Nama lengkap') }} <span class="required" aria-hidden="true">*</span></label
            ><InputText
              id="name"
              name="name"
              :placeholder="tr('Nama lengkap warga')"
              :invalid="!!$form.name?.invalid"
            /><small class="text-red-700">{{ $form.name?.error?.message }}</small>
          </div>
          <div class="form-field">
            <label for="phone"> {{ tr('Nomor HP warga') }} </label
            ><InputText
              id="phone"
              name="phone"
              type="tel"
              :placeholder="tr('08xxxxxxxxxx')"
            /><small class="field-help">
              {{ tr('Nomor kontak warga, bukan perubahan nomor login.') }}
            </small>
          </div>
          <div class="form-field">
            <label for="birth"> {{ tr('Tanggal lahir') }} </label
            ><InputText id="birth" name="birth_date" type="date" />
          </div>
          <div v-if="!editing" class="form-field">
            <label for="relationship"> {{ tr('Hubungan keluarga') }} </label
            ><Select
              @change="dirty = true"
              input-id="relationship"
              name="relationship"
              :options="recordOptions(relationshipValues)"
              option-label="label"
              option-value="value"
            />
          </div>
          <div v-if="editing" class="form-field">
            <label for="status"> {{ tr('Status') }} </label
            ><Select
              @change="dirty = true"
              input-id="status"
              name="status"
              :options="recordOptions(residentStatuses)"
              option-label="label"
              option-value="value"
            />
          </div>
        </fieldset>
        <div v-if="context.can('residents.manage')" class="form-actions">
          <RouterLink to="/manage/residents" class="text-xs text-surface-500 mr-2">
            {{ tr('Batal') }} </RouterLink
          ><Button type="submit" :label="tr('Simpan warga')" icon="pi pi-check" :loading="busy" />
        </div>
      </Form>
      <aside class="form-note">
        <i class="pi pi-shield" aria-hidden="true" />
        <h3>{{ tr('Data warga, tanggung jawab bersama') }}</h3>
        <p>
          {{
            tr(
              'Isi data sesuai informasi warga. Nomor HP dan tanggal lahir boleh dikosongkan jika belum tersedia.',
            )
          }}
        </p>
        <p class="mt-3">{{ tr('Hubungan keluarga tidak mengubah hak akses akun.') }}</p>
      </aside>
    </div>
  </section>
</template>
