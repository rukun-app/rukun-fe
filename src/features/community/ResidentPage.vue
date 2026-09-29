<script setup lang="ts">
import { createIntentKey } from '@/shared/utils/idempotency'
import { computed, ref } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { createResident, updateResident } from '@/api/generated/endpoints'
import type { CreateResident, UpdateResident } from '@/api/generated/models'
import { useResident } from './queries'
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
const busy = ref(false)
const dirty = ref(false)
const error = ref<NormalizedApiError | null>(null)
const intentKey = createIntentKey()
onBeforeRouteLeave(
  () => !dirty.value || window.confirm('Perubahan belum disimpan. Tinggalkan halaman?'),
)
const resolver = computed(() =>
  zodResolver(
    z.object({
      household_id: editing.value
        ? z.string().nullable().optional()
        : z.string().uuid('UUID KK wajib valid'),
      name: z.string().trim().min(1, 'Nama wajib diisi').max(100),
      phone: z.string().nullable().optional(),
      birth_date: z.string().nullable().optional(),
      relationship: z.enum(['head', 'spouse', 'child', 'parent', 'other']),
      status: z.enum(['active', 'moved', 'deceased', 'inactive']).optional(),
    }),
  ),
)
async function save(event: FormSubmitEvent) {
  if (!event.valid || busy.value) return
  busy.value = true
  error.value = null
  try {
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
        { headers: { 'Idempotency-Key': intentKey(event.values) } },
      )
    dirty.value = false
    await queryClient.invalidateQueries({ queryKey: ['community'] })
    await router.push('/manage/residents')
  } catch (e) {
    error.value = normalizeApiError(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="p-4 md:p-6 max-w-2xl space-y-5">
    <RouterLink to="/manage/residents" class="text-primary-700 underline"
      >Kembali ke daftar warga</RouterLink
    >
    <h2 class="text-xl font-semibold">{{ editing ? 'Detail Warga' : 'Tambah Warga' }}</h2>
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
      <fieldset :disabled="busy || !context.can('residents.manage')" class="space-y-4">
        <div v-if="!editing" class="grid gap-1">
          <label for="household">UUID kartu keluarga</label
          ><InputText id="household" name="household_id" /><small class="text-red-700">{{
            $form.household_id?.error?.message
          }}</small>
        </div>
        <div class="grid gap-1">
          <label for="name">Nama lengkap</label><InputText id="name" name="name" /><small
            class="text-red-700"
            >{{ $form.name?.error?.message }}</small
          >
        </div>
        <div class="grid gap-1">
          <label for="phone">Nomor HP warga</label
          ><InputText id="phone" name="phone" type="tel" /><small class="text-surface-500"
            >Mengubah nomor ini tidak mengubah nomor login.</small
          >
        </div>
        <div class="grid gap-1">
          <label for="birth">Tanggal lahir</label
          ><InputText id="birth" name="birth_date" type="date" />
        </div>
        <div v-if="!editing" class="grid gap-1">
          <label for="relationship">Hubungan keluarga</label
          ><Select
            input-id="relationship"
            name="relationship"
            :options="[
              { label: 'Kepala keluarga', value: 'head' },
              { label: 'Pasangan', value: 'spouse' },
              { label: 'Anak', value: 'child' },
              { label: 'Orang tua', value: 'parent' },
              { label: 'Lainnya', value: 'other' },
            ]"
            option-label="label"
            option-value="value"
          />
        </div>
        <div v-if="editing" class="grid gap-1">
          <label for="status">Status</label
          ><Select
            input-id="status"
            name="status"
            :options="['active', 'moved', 'deceased', 'inactive']"
          />
        </div>
        <Button
          v-if="context.can('residents.manage')"
          type="submit"
          label="Simpan warga"
          :loading="busy"
        />
      </fieldset>
    </Form>
  </section>
</template>
