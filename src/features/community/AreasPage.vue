<script setup lang="ts">
import { recordOptions, areaKinds } from './options'
import { tr } from '@/i18n'
import ReferenceSelect from './ReferenceSelect.vue'
import { useFormSubmission } from '@/shared/composables/useFormSubmission'
import { computed, ref } from 'vue'
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Column from 'primevue/column'
import { createArea } from '@/api/generated/endpoints'
import type { CreateArea } from '@/api/generated/models'
import { useAreas } from './queries'
import { MutationErrors } from '@/design-system'
import { useContextStore } from '@/contexts/stores/context'
import { AppDataTable, PageHeader } from '@/design-system'
import { normalizeApiError } from '@/api/errors/normalizer'
import { queryClient } from '@/app/providers/query'
const context = useContextStore()
const cursor = ref<string>()
const query = useAreas(cursor)
const result = computed(() => query.data.value?.data)
const creating = ref(false)
const { busy, error, submit } = useFormSubmission()
const resolver = computed(() =>
  zodResolver(
    z
      .object({
        kind: z.enum(areaKinds),
        code: z.string().trim().min(1, tr('Kode wajib diisi')),
        name: z.string().trim().min(1, tr('Nama wilayah wajib diisi')),
        parent_id: z.string().optional(),
      })
      .superRefine((value, ctx) => {
        if (value.kind === 'rt' && !z.string().uuid().safeParse(value.parent_id).success)
          ctx.addIssue({
            code: 'custom',
            path: ['parent_id'],
            message: tr('Pilih RW induk untuk RT'),
          })
      }),
  ),
)

async function save(event: FormSubmitEvent) {
  await submit(
    event.valid,
    event.values,
    async (headers) => {
      const data = event.values
      await createArea(
        {
          kind: data.kind,
          code: data.code,
          name: data.name,
          ...(data.kind === 'rt' ? { parent_id: data.parent_id } : {}),
        } as CreateArea,
        { headers },
      )
    },
    async () => {
      creating.value = false
      await queryClient.invalidateQueries({ queryKey: ['community'] })
    },
  )
}
</script>
<template>
  <section class="page-container">
    <PageHeader
      :eyebrow="tr('DATA LINGKUNGAN')"
      :title="tr('Wilayah RT / RW')"
      :description="tr('Struktur wilayah yang menyatukan keluarga dan warga.')"
    >
      <template #actions
        ><Button
          v-if="context.can('areas.manage')"
          :label="creating ? tr('Tutup formulir') : tr('Tambah wilayah')"
          :icon="creating ? 'pi pi-times' : 'pi pi-plus'"
          :disabled="busy"
          :severity="creating ? 'secondary' : undefined"
          @click="creating = !creating" /></template
    ></PageHeader>
    <Form
      v-if="creating"
      v-slot="$form"
      :resolver="resolver"
      :initial-values="{ kind: 'rw', name: '', code: '', parent_id: '' }"
      class="form-panel mb-6"
      @submit="save"
    >
      <div class="form-panel-heading">
        <span class="row-icon"><i class="pi pi-map" aria-hidden="true" /></span>
        <div>
          <h3>{{ tr('Wilayah baru') }}</h3>
          <p>{{ tr('Tambahkan RW atau RT di bawah RW yang sudah terdaftar.') }}</p>
        </div>
      </div>
      <MutationErrors :error="error" />
      <fieldset :disabled="busy" class="form-fields">
        <div class="form-field">
          <label for="kind"> {{ tr('Jenis wilayah') }} <span class="required">*</span></label
          ><Select
            input-id="kind"
            name="kind"
            :options="recordOptions(areaKinds)"
            option-label="label"
            option-value="value"
          />
        </div>
        <div class="form-field">
          <label for="code"> {{ tr('Kode') }} <span class="required">*</span></label
          ><InputText id="code" name="code" :placeholder="tr('Contoh: 01')" /><small
            class="text-red-700"
            >{{ $form.code?.error?.message }}</small
          >
        </div>
        <div class="form-field">
          <label for="area-name"> {{ tr('Nama wilayah') }} <span class="required">*</span></label
          ><InputText id="area-name" name="name" :placeholder="tr('Contoh: RW 01 Melati')" /><small
            class="text-red-700"
            >{{ $form.name?.error?.message }}</small
          >
        </div>
        <div v-if="$form.kind?.value === 'rt'" class="form-field">
          <label for="parent"> {{ tr('RW induk') }} <span class="required">*</span></label
          ><ReferenceSelect
            input-id="parent"
            name="parent_id"
            resource="rw"
            :label="tr('Pilih RW induk')"
            :invalid="!!$form.parent_id?.invalid"
          /><small class="text-red-700">{{ $form.parent_id?.error?.message }}</small
          ><small class="field-help"> {{ tr('RT harus berada di bawah satu RW.') }} </small>
        </div>
      </fieldset>
      <div class="form-actions">
        <Button
          :label="tr('Batal')"
          severity="secondary"
          text
          :disabled="busy"
          @click="creating = false"
        /><Button type="submit" :label="tr('Simpan wilayah')" icon="pi pi-check" :loading="busy" />
      </div>
    </Form>
    <AppDataTable
      :rows="result?.data ?? []"
      :title="tr('Daftar wilayah')"
      :search-fields="['name', 'code']"
      :pending="query.isPending.value"
      :busy="query.isFetching.value"
      :error="query.isError.value ? normalizeApiError(query.error.value).message : null"
      :empty-title="tr('Belum ada wilayah')"
      :empty-description="tr('Mulai dengan menambahkan RW, kemudian RT di dalamnya.')"
      empty-icon="pi pi-map"
      :next="result?.next_cursor"
      :previous="result?.prev_cursor"
      :page-key="cursor"
      @retry="query.refetch()"
      @page="cursor = $event"
    >
      <Column field="name" sortable :header="tr('NAMA WILAYAH')"
        ><template #body="{ data }"
          ><span class="table-primary"
            ><span class="row-icon" aria-hidden="true"><i class="pi pi-map-marker" /></span
            >{{ data.name }}</span
          ></template
        ></Column
      >
      <Column field="kind" sortable :header="tr('JENIS')"
        ><template #body="{ data }"
          ><span class="status-chip" :class="{ 'is-active': data.kind === 'rw' }">{{
            data.kind === 'rw' ? tr('Rukun Warga') : tr('Rukun Tetangga')
          }}</span></template
        ></Column
      >
      <Column field="code" sortable :header="tr('KODE')" />
    </AppDataTable>
    <p class="field-help mt-4">
      <i class="pi pi-info-circle mr-1" aria-hidden="true" />
      {{ tr('Pilih nama wilayah RT saat menambahkan kartu keluarga.') }}
    </p>
  </section>
</template>
