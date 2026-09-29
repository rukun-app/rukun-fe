<script setup lang="ts">
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
  () => !dirty.value || window.confirm('Perubahan belum disimpan. Tinggalkan halaman?'),
)
const resolver = computed(() =>
  zodResolver(
    z.object({
      area_id: editing.value ? z.string().optional() : z.string().uuid('UUID RT wajib valid'),
      address: z.string().trim().min(1, 'Alamat wajib diisi').max(2000),
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
  <section class="p-4 md:p-6 max-w-2xl space-y-5">
    <RouterLink to="/manage/households" class="text-primary-700 underline"
      >Kembali ke daftar KK</RouterLink
    >
    <h2 class="text-xl font-semibold">
      {{ editing ? 'Detail Kartu Keluarga' : 'Tambah Kartu Keluarga' }}
    </h2>
    <AppSkeleton v-if="editing && query.isPending.value" />
    <ErrorState
      v-else-if="editing && query.isError.value"
      :description="normalizeApiError(query.error.value).message"
      @retry="query.refetch()"
    />
    <Form
      v-else
      v-slot="$form"
      :key="id + String(query.dataUpdatedAt.value)"
      :initial-values="initial"
      :resolver="resolver"
      class="space-y-4"
      @submit="save"
      @input="dirty = true"
      @change="dirty = true"
    >
      <MutationErrors :error="error" />
      <fieldset :disabled="busy || !context.can('households.manage')" class="space-y-4">
        <div v-if="!editing" class="grid gap-1">
          <label for="area">UUID wilayah RT</label><InputText id="area" name="area_id" /><small
            class="text-red-700"
            >{{ $form.area_id?.error?.message }}</small
          >
        </div>
        <div class="grid gap-1">
          <label for="address">Alamat</label><InputText id="address" name="address" /><small
            class="text-red-700"
            >{{ $form.address?.error?.message }}</small
          >
        </div>
        <div class="grid gap-1">
          <label for="block">Blok</label><InputText id="block" name="block" />
        </div>
        <div class="grid gap-1">
          <label for="number">Nomor rumah</label><InputText id="number" name="house_number" />
        </div>
        <div class="grid gap-1">
          <label for="occupancy">Hunian</label
          ><Select
            input-id="occupancy"
            name="occupancy_status"
            :options="[
              { label: 'Dihuni', value: 'occupied' },
              { label: 'Kosong', value: 'vacant' },
              { label: 'Disewakan', value: 'rented' },
              { label: 'Lainnya', value: 'other' },
            ]"
            option-label="label"
            option-value="value"
          />
        </div>
        <div v-if="editing" class="grid gap-1">
          <label for="status">Status</label
          ><Select input-id="status" name="status" :options="['active', 'moved', 'inactive']" />
        </div>
        <Button
          v-if="context.can('households.manage')"
          type="submit"
          label="Simpan KK"
          :loading="busy"
        />
      </fieldset>
    </Form>
    <RouterLink
      v-if="editing && context.can('residents.view')"
      :to="{ path: '/manage/residents', query: { household: id } }"
      class="inline-block text-primary-700 underline"
      >Lihat anggota keluarga</RouterLink
    >
  </section>
</template>
