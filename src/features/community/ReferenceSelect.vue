<script setup lang="ts">
import { tr } from '@/i18n'
import { computed } from 'vue'
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { listAreas, listHouseholds, showHousehold } from '@/api/generated/endpoints'
import { useContextStore } from '@/contexts/stores/context'
import { referenceOptions } from './referenceOptions'
const props = defineProps<{
  resource: 'rw' | 'rt' | 'household'
  inputId: string
  label: string
  name?: string
  modelValue?: string | null
  selectedId?: string
  invalid?: boolean
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; change: [] }>()
const context = useContextStore()
const allowed = computed(() =>
  context.can(props.resource === 'household' ? 'households.view' : 'areas.view'),
)
const query = useInfiniteQuery({
  queryKey: computed(() => ['community', context.activeContextId, 'references', props.resource]),
  enabled: allowed,
  initialPageParam: undefined as string | undefined,
  queryFn: async ({ pageParam, signal }) => {
    const params = { per_page: 50, cursor: pageParam }
    if (props.resource === 'household') {
      const response = await listHouseholds(params, undefined, signal)
      return {
        options: referenceOptions('household', response.data?.data ?? []),
        next: response.data?.next_cursor,
      }
    }
    const response = await listAreas(params, undefined, signal)
    return {
      options: referenceOptions(props.resource, response.data?.data ?? []),
      next: response.data?.next_cursor,
    }
  },
  getNextPageParam: (page) => page.next || undefined,
})
const loaded = computed(() => query.data.value?.pages.flatMap((page) => page.options) ?? [])
const selected = useQuery({
  queryKey: computed(() => [
    'community',
    context.activeContextId,
    'reference-household',
    props.selectedId,
  ]),
  enabled: computed(
    () =>
      allowed.value &&
      props.resource === 'household' &&
      !!props.selectedId &&
      !loaded.value.some((option) => option.value === props.selectedId),
  ),
  queryFn: ({ signal }) => showHousehold(props.selectedId!, undefined, signal),
})
function retry() {
  if (query.isError.value) void query.refetch()
  if (selected.isError.value && props.selectedId) void selected.refetch()
}
const options = computed(() => {
  const extra = selected.data.value?.data
    ? referenceOptions('household', [selected.data.value.data])
    : []
  return [...new Map([...loaded.value, ...extra].map((option) => [option.value, option])).values()]
})
</script>
<template>
  <div class="reference-select">
    <Select
      :input-id="inputId"
      :aria-label="label"
      :name="name"
      :model-value="modelValue"
      :options="options"
      option-label="label"
      option-value="value"
      :placeholder="label"
      filter
      :filter-placeholder="tr('Cari nama pada pilihan yang dimuat')"
      :empty-message="tr('Belum ada pilihan. Tambahkan data referensi terlebih dahulu.')"
      :empty-filter-message="tr('Nama tidak ditemukan pada pilihan yang dimuat.')"
      :loading="query.isFetching.value || selected.isFetching.value"
      :invalid="invalid"
      :disabled="disabled || !allowed"
      class="w-full"
      @update:model-value="emit('update:modelValue', $event)"
      @change="emit('change')"
    >
      <template #footer>
        <Button
          v-if="query.hasNextPage.value"
          :label="tr('Muat pilihan berikutnya')"
          text
          size="small"
          :loading="query.isFetchingNextPage.value"
          @click="query.fetchNextPage()"
        />
      </template>
    </Select>
    <small v-if="!allowed" class="field-help">
      {{ tr('Akses daftar referensi belum tersedia untuk akun ini.') }}
    </small>
    <div v-if="query.isError.value || selected.isError.value" role="alert" class="field-help">
      {{ tr('Pilihan gagal dimuat.') }}
      <Button :label="tr('Coba lagi')" text size="small" @click="retry" />
    </div>
  </div>
</template>
