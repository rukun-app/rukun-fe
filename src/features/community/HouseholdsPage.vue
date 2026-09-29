<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useHouseholds } from './queries'
import CursorPager from './CursorPager.vue'
import { useContextStore } from '@/contexts/stores/context'
import { AppSkeleton, EmptyState, ErrorState } from '@/design-system'
import { normalizeApiError } from '@/api/errors/normalizer'
const context = useContextStore()
const cursor = ref<string>()
const area = ref('')
const filter = ref('')
const query = useHouseholds(cursor, area)
const result = computed(() => query.data.value?.data)
function resetFilter() {
  filter.value = ''
  area.value = ''
}
watch(area, () => {
  cursor.value = undefined
})
</script>
<template>
  <section class="p-4 md:p-6 space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold">Kartu Keluarga</h2>
        <p class="text-sm text-surface-500">Rumah tangga dan anggota dalam lingkungan Anda.</p>
      </div>
      <RouterLink v-if="context.can('households.manage')" to="/manage/households/new"
        ><Button label="Tambah KK" icon="pi pi-plus"
      /></RouterLink>
    </div>
    <form class="flex flex-wrap gap-2" @submit.prevent="area = filter.trim()">
      <label for="area-filter" class="sr-only">UUID wilayah</label
      ><InputText id="area-filter" v-model="filter" placeholder="Filter UUID wilayah RT" /><Button
        type="submit"
        label="Terapkan"
        severity="secondary"
      /><Button label="Reset" text @click="resetFilter" />
    </form>
    <AppSkeleton v-if="query.isPending.value" variant="list" />
    <ErrorState
      v-else-if="query.isError.value"
      :description="normalizeApiError(query.error.value).message"
      @retry="query.refetch()"
    />
    <EmptyState
      v-else-if="!result?.data?.length"
      title="Belum ada KK"
      description="Tambahkan rumah tangga atau gunakan filter wilayah lain."
    />
    <DataTable
      v-else
      :value="result.data"
      data-key="public_id"
      striped-rows
      class="overflow-x-auto"
      :pt="{ table: { 'aria-label': 'Daftar kartu keluarga' } }"
      ><Column field="reference" header="Referensi"
        ><template #body="{ data }"
          ><RouterLink
            :to="`/manage/households/${data.public_id}`"
            class="text-primary-700 underline"
            >{{ data.reference }}</RouterLink
          ></template
        ></Column
      ><Column field="address" header="Alamat" /><Column field="block" header="Blok" /><Column
        field="house_number"
        header="Nomor" /><Column field="status" header="Status"
    /></DataTable>
    <CursorPager
      :next="result?.next_cursor"
      :previous="result?.prev_cursor"
      :busy="query.isFetching.value"
      @change="cursor = $event"
    />
  </section>
</template>
