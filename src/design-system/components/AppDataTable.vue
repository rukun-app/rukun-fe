<script setup lang="ts" generic="T extends object">
import { computed, ref, watch } from 'vue'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import AppSkeleton from './AppSkeleton.vue'
import EmptyState from './EmptyState.vue'
import ErrorState from './ErrorState.vue'
import CursorPager from './CursorPager.vue'
import { tr } from '@/i18n'
const props = withDefaults(
  defineProps<{
    rows: T[]
    title: string
    searchFields: (keyof T)[]
    pending?: boolean
    busy?: boolean
    error?: string | null
    emptyTitle: string
    emptyDescription?: string
    emptyIcon?: string
    next?: string | null
    previous?: string | null
    pageKey?: string
    minWidth?: string
  }>(),
  { minWidth: '580px' },
)
const emit = defineEmits<{ retry: []; page: [cursor: string] }>()
const search = ref('')
const tableKey = ref(0)
// Search/sort apply to one server cursor page; reset them when its identity changes.
watch(
  () => props.pageKey,
  () => {
    search.value = ''
    tableKey.value++
  },
)
const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase()
  return term
    ? props.rows.filter((row) =>
        props.searchFields.some((field) =>
          String(row[field] ?? '')
            .toLocaleLowerCase()
            .includes(term),
        ),
      )
    : props.rows
})
</script>
<template>
  <section class="data-panel" :aria-label="title" :aria-busy="busy || pending">
    <div class="data-toolbar">
      <span class="data-toolbar-label">{{ title }}</span>
      <div class="table-search">
        <i class="pi pi-search" aria-hidden="true" />
        <InputText
          v-model="search"
          :aria-label="tr('Cari di halaman ini')"
          :placeholder="tr('Cari di halaman ini')"
          :disabled="pending || !!error"
        />
        <Button
          v-if="search"
          icon="pi pi-times"
          text
          :aria-label="tr('Hapus pencarian')"
          @click="search = ''"
        />
      </div>
      <slot name="toolbar" />
    </div>
    <p class="table-scope-note">{{ tr('Pencarian dan pengurutan berlaku pada halaman ini.') }}</p>
    <ErrorState v-if="error" :description="error" @retry="emit('retry')" />
    <AppSkeleton v-else-if="pending" variant="list" />
    <DataTable
      v-else
      :key="tableKey"
      :value="filtered"
      data-key="public_id"
      :loading="busy"
      striped-rows
      removable-sort
      scrollable
      :table-style="{ minWidth }"
      :pt="{ table: { 'aria-label': title } }"
    >
      <slot />
      <template #empty>
        <EmptyState
          :title="search ? tr('Tidak ada hasil pencarian') : emptyTitle"
          :description="search ? tr('Coba kata lain atau hapus pencarian.') : emptyDescription"
          :icon="emptyIcon"
        />
      </template>
    </DataTable>
    <div class="data-panel-footer">
      <p role="status" aria-live="polite">
        {{ error || pending ? '—' : `${filtered.length} / ${rows.length}` }}
        {{ tr('baris pada halaman ini') }}
      </p>
      <CursorPager
        :next="next"
        :previous="previous"
        :busy="busy || pending || !!error"
        @change="emit('page', $event)"
      />
    </div>
  </section>
</template>
