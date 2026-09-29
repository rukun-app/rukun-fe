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
  <section class="p-4 md:p-6 space-y-5">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-xl font-semibold">Wilayah RT / RW</h2>
      <Button
        v-if="context.can('areas.manage')"
        label="Tambah wilayah"
        @click="creating = !creating"
      />
    </div>
    <Form
      v-if="creating"
      v-slot="$form"
      :resolver="resolver"
      :initial-values="{ kind: 'rw', name: '', code: '', parent_id: '' }"
      class="bg-surface-0 p-4 rounded-xl grid gap-3 max-w-xl"
      @submit="save"
    >
      <MutationErrors :error="error" />
      <label for="kind">Jenis wilayah</label
      ><Select input-id="kind" name="kind" :options="['rw', 'rt']" /> <label for="code">Kode</label
      ><InputText id="code" name="code" /><small class="text-red-700">{{
        $form.code?.error?.message
      }}</small>
      <label for="area-name">Nama wilayah</label><InputText id="area-name" name="name" /><small
        class="text-red-700"
        >{{ $form.name?.error?.message }}</small
      >
      <label for="parent">UUID RW induk (untuk RT)</label
      ><InputText id="parent" name="parent_id" /><small class="text-red-700">{{
        $form.parent_id?.error?.message
      }}</small>
      <Button type="submit" label="Simpan wilayah" :loading="busy" />
    </Form>
    <AppSkeleton v-if="query.isPending.value" variant="list" /><ErrorState
      v-else-if="query.isError.value"
      :description="normalizeApiError(query.error.value).message"
      @retry="query.refetch()"
    /><EmptyState v-else-if="!result?.data?.length" title="Belum ada wilayah" />
    <DataTable v-else :value="result.data" striped-rows class="overflow-x-auto"
      ><Column field="name" header="Nama" /><Column field="kind" header="Jenis" /><Column
        field="code"
        header="Kode" /><Column field="public_id" header="UUID wilayah"
    /></DataTable>
    <CursorPager
      :next="result?.next_cursor"
      :previous="result?.prev_cursor"
      :busy="query.isFetching.value"
      @change="cursor = $event"
    />
  </section>
</template>
