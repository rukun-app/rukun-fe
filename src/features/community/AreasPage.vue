<script setup lang="ts">
import { createIntentKey } from '@/shared/utils/idempotency'
import { computed, ref } from 'vue'
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { createArea } from '@/api/generated/endpoints'
import type { CreateArea } from '@/api/generated/models'
import { useAreas } from './queries'
import CursorPager from './CursorPager.vue'
import MutationErrors from './MutationErrors.vue'
import { useContextStore } from '@/contexts/stores/context'
import { AppSkeleton, EmptyState, ErrorState } from '@/design-system'
import { normalizeApiError } from '@/api/errors/normalizer'
import type { NormalizedApiError } from '@/api/errors/types'
import { queryClient } from '@/app/providers/query'
const context = useContextStore()
const cursor = ref<string>()
const query = useAreas(cursor)
const result = computed(() => query.data.value?.data)
const creating = ref(false)
const busy = ref(false)
const error = ref<NormalizedApiError | null>(null)
const intentKey = createIntentKey()
const resolver = zodResolver(
  z
    .object({
      kind: z.enum(['rw', 'rt']),
      code: z.string().trim().min(1),
      name: z.string().trim().min(1),
      parent_id: z.string().optional(),
    })
    .superRefine((value, ctx) => {
      if (value.kind === 'rt' && !z.string().uuid().safeParse(value.parent_id).success)
        ctx.addIssue({
          code: 'custom',
          path: ['parent_id'],
          message: 'UUID RW induk wajib valid untuk RT',
        })
    }),
)
async function save(event: FormSubmitEvent) {
  if (!event.valid || busy.value) return
  busy.value = true
  error.value = null
  try {
    const data = event.values
    await createArea(
      {
        kind: data.kind,
        code: data.code,
        name: data.name,
        ...(data.kind === 'rt' ? { parent_id: data.parent_id } : {}),
      } as CreateArea,
      { headers: { 'Idempotency-Key': intentKey(event.values) } },
    )
    creating.value = false
    await queryClient.invalidateQueries({ queryKey: ['community'] })
  } catch (e) {
    error.value = normalizeApiError(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="page-container">
    <div class="page-heading">
      <div>
        <span class="eyebrow">DATA LINGKUNGAN</span>
        <h2>Wilayah RT / RW</h2>
        <p>Struktur wilayah yang menyatukan keluarga dan warga.</p>
      </div>
      <Button
        v-if="context.can('areas.manage')"
        :label="creating ? 'Tutup formulir' : 'Tambah wilayah'"
        :icon="creating ? 'pi pi-times' : 'pi pi-plus'"
        :severity="creating ? 'secondary' : undefined"
        @click="creating = !creating"
      />
    </div>
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
          <h3>Wilayah baru</h3>
          <p>Tambahkan RW atau RT di bawah RW yang sudah terdaftar.</p>
        </div>
      </div>
      <MutationErrors :error="error" />
      <div class="form-fields">
        <div class="form-field">
          <label for="kind">Jenis wilayah <span class="required">*</span></label
          ><Select
            input-id="kind"
            name="kind"
            :options="[
              { label: 'Rukun Warga (RW)', value: 'rw' },
              { label: 'Rukun Tetangga (RT)', value: 'rt' },
            ]"
            option-label="label"
            option-value="value"
          />
        </div>
        <div class="form-field">
          <label for="code">Kode <span class="required">*</span></label
          ><InputText id="code" name="code" placeholder="Contoh: 01" /><small
            class="text-red-700"
            >{{ $form.code?.error?.message }}</small
          >
        </div>
        <div class="form-field">
          <label for="area-name">Nama wilayah <span class="required">*</span></label
          ><InputText id="area-name" name="name" placeholder="Contoh: RW 01 Melati" /><small
            class="text-red-700"
            >{{ $form.name?.error?.message }}</small
          >
        </div>
        <div v-if="$form.kind?.value === 'rt'" class="form-field">
          <label for="parent">UUID RW induk (untuk RT) <span class="required">*</span></label
          ><InputText
            id="parent"
            name="parent_id"
            placeholder="Salin ID RW dari daftar wilayah"
          /><small class="text-red-700">{{ $form.parent_id?.error?.message }}</small
          ><small class="field-help">RT harus berada di bawah satu RW.</small>
        </div>
      </div>
      <div class="form-actions">
        <Button
          label="Batal"
          severity="secondary"
          text
          :disabled="busy"
          @click="creating = false"
        /><Button type="submit" label="Simpan wilayah" icon="pi pi-check" :loading="busy" />
      </div>
    </Form>
    <div class="data-panel">
      <div class="data-toolbar">
        <span class="data-toolbar-label">Daftar wilayah</span
        ><span class="field-help">Hierarki RW &amp; RT</span>
      </div>
      <AppSkeleton v-if="query.isPending.value" variant="list" /><ErrorState
        v-else-if="query.isError.value"
        :description="normalizeApiError(query.error.value).message"
        @retry="query.refetch()"
      /><EmptyState
        v-else-if="!result?.data?.length"
        title="Belum ada wilayah"
        description="Mulai dengan menambahkan RW, kemudian RT di dalamnya."
        icon="pi pi-map"
      />
      <DataTable
        v-else
        :value="result.data"
        :pt="{ table: { 'aria-label': 'Daftar wilayah', style: 'min-width: 650px' } }"
      >
        <Column field="name" header="NAMA WILAYAH"
          ><template #body="{ data }"
            ><span class="table-primary"
              ><span class="row-icon" aria-hidden="true"><i class="pi pi-map-marker" /></span
              >{{ data.name }}</span
            ></template
          ></Column
        >
        <Column field="kind" header="JENIS"
          ><template #body="{ data }"
            ><span class="status-chip" :class="{ 'is-active': data.kind === 'rw' }">{{
              data.kind === 'rw' ? 'Rukun Warga' : 'Rukun Tetangga'
            }}</span></template
          ></Column
        >
        <Column field="code" header="KODE" />
        <Column field="public_id" header="ID WILAYAH"
          ><template #body="{ data }"
            ><code class="text-[10px] text-surface-400 select-all">{{
              data.public_id
            }}</code></template
          ></Column
        >
      </DataTable>
      <div class="data-panel-footer">
        <p>{{ result?.data?.length ?? 0 }} wilayah di halaman ini</p>
        <CursorPager
          :next="result?.next_cursor"
          :previous="result?.prev_cursor"
          :busy="query.isFetching.value"
          @change="cursor = $event"
        />
      </div>
    </div>
    <p class="field-help mt-4">
      <i class="pi pi-info-circle mr-1" aria-hidden="true" /> Gunakan ID wilayah RT saat menambahkan
      kartu keluarga.
    </p>
  </section>
</template>
