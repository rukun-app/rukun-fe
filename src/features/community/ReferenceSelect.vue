<script setup lang="ts">
import { tr } from '@/i18n'
import { toRef } from 'vue'
import { useReferenceOptions } from './useReferenceOptions'
import Select from 'primevue/select'
import Button from 'primevue/button'
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
const { allowed, query, selected, options, retry } = useReferenceOptions(
  toRef(props, 'resource'),
  toRef(props, 'selectedId'),
)
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
