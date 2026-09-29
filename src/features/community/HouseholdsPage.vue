<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useHouseholds } from './queries'
import CursorPager from './CursorPager.vue'
import RecordStatus from './RecordStatus.vue'
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
  <section class="page-container">
    <div class="page-heading">
      <div>
        <span class="eyebrow">DATA LINGKUNGAN</span>
        <h2>Kartu Keluarga</h2>
        <p>Rumah tangga yang menjadi bagian dari lingkungan Anda.</p>
      </div>
      <RouterLink v-if="context.can('households.manage')" to="/manage/households/new"
        ><Button label="Tambah KK" icon="pi pi-plus"
      /></RouterLink>
    </div>
    <div class="data-panel">
      <form class="data-toolbar" @submit.prevent="area = filter.trim()">
        <span class="data-toolbar-label">Daftar keluarga</span
        ><label for="area-filter" class="sr-only">UUID wilayah</label
        ><InputText
          id="area-filter"
          v-model="filter"
          placeholder="Filter berdasarkan ID wilayah RT"
        /><Button
          type="submit"
          label="Terapkan"
          icon="pi pi-filter"
          severity="secondary"
          outlined
        /><Button v-if="filter || area" label="Reset" text @click="resetFilter" />
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
        description="Setiap lingkungan dimulai dari sebuah keluarga. Tambahkan KK pertama atau gunakan wilayah lain."
        icon="pi pi-home"
      />
      <DataTable
        v-else
        :value="result.data"
        data-key="public_id"
        :pt="{ table: { 'aria-label': 'Daftar kartu keluarga', style: 'min-width: 620px' } }"
      >
        <Column field="reference" header="KARTU KELUARGA"
          ><template #body="{ data }"
            ><RouterLink :to="`/manage/households/${data.public_id}`" class="table-primary"
              ><span class="row-icon" aria-hidden="true"><i class="pi pi-home" /></span
              >{{ data.reference }}</RouterLink
            ></template
          ></Column
        >
        <Column field="address" header="ALAMAT" />
        <Column header="BLOK / NOMOR"
          ><template #body="{ data }"
            ><span>{{ data.block || '—' }} / {{ data.house_number || '—' }}</span></template
          ></Column
        >
        <Column field="status" header="STATUS"
          ><template #body="{ data }"><RecordStatus :status="data.status" /></template
        ></Column>
        <Column header=""
          ><template #body="{ data }"
            ><RouterLink
              :to="`/manage/households/${data.public_id}`"
              :aria-label="`Buka detail ${data.reference}`"
              class="text-surface-400"
              ><i class="pi pi-arrow-up-right" aria-hidden="true" /></RouterLink></template
        ></Column>
      </DataTable>
      <div class="data-panel-footer">
        <p>{{ result?.data?.length ?? 0 }} keluarga di halaman ini</p>
        <CursorPager
          :next="result?.next_cursor"
          :previous="result?.prev_cursor"
          :busy="query.isFetching.value"
          @change="cursor = $event"
        />
      </div>
    </div>
    <p class="field-help mt-4">
      <i class="pi pi-lock mr-1" aria-hidden="true" /> Data keluarga hanya dapat diakses sesuai izin
      akun Anda.
    </p>
  </section>
</template>
