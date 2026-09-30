<script setup lang="ts">
import { tr } from '@/i18n'
import ReferenceSelect from './ReferenceSelect.vue'
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import { useHouseholds } from './queries'
import { recordLabel } from './options'
import { StatusBadge } from '@/design-system'
import { useContextStore } from '@/contexts/stores/context'
import { AppDataTable, PageHeader } from '@/design-system'
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
    <PageHeader
      :eyebrow="tr('DATA LINGKUNGAN')"
      :title="tr('Kartu Keluarga')"
      :description="tr('Rumah tangga yang menjadi bagian dari lingkungan Anda.')"
    >
      <template #actions
        ><RouterLink v-if="context.can('households.manage')" to="/manage/households/new"
          ><Button :label="tr('Tambah KK')" icon="pi pi-plus" /></RouterLink></template
    ></PageHeader>
    <AppDataTable
      :rows="result?.data ?? []"
      :title="tr('Daftar keluarga')"
      :search-fields="['address', 'block', 'house_number']"
      :pending="query.isPending.value"
      :busy="query.isFetching.value"
      :error="query.isError.value ? normalizeApiError(query.error.value).message : null"
      :empty-title="tr('Belum ada KK')"
      :empty-description="
        tr(
          'Setiap lingkungan dimulai dari sebuah keluarga. Tambahkan KK pertama atau gunakan wilayah lain.',
        )
      "
      empty-icon="pi pi-home"
      :next="result?.next_cursor"
      :previous="result?.prev_cursor"
      :page-key="[cursor, area].join(':')"
      @retry="query.refetch()"
      @page="cursor = $event"
    >
      <template #toolbar>
        <form class="table-filter" @submit.prevent="area = filter.trim()">
          <label for="area-filter" class="sr-only"> {{ tr('Wilayah RT') }} </label
          ><ReferenceSelect
            input-id="area-filter"
            resource="rt"
            :label="tr('Filter wilayah RT')"
            v-model="filter"
          /><Button
            type="submit"
            :label="tr('Terapkan')"
            icon="pi pi-filter"
            severity="secondary"
            outlined
          /><Button v-if="filter || area" :label="tr('Reset')" text @click="resetFilter" />
        </form>
      </template>
      <Column field="address" sortable :header="tr('ALAMAT')"
        ><template #body="{ data }"
          ><RouterLink :to="`/manage/households/${data.public_id}`" class="table-primary"
            ><span class="row-icon" aria-hidden="true"><i class="pi pi-home" /></span
            >{{ data.address || tr('Alamat belum tersedia') }}</RouterLink
          ></template
        ></Column
      >
      <Column field="occupancy_status" sortable :header="tr('HUNIAN')"
        ><template #body="{ data }">{{ recordLabel(data.occupancy_status) }}</template></Column
      >
      <Column :header="tr('BLOK / NOMOR')"
        ><template #body="{ data }"
          ><span>{{ data.block || '—' }} / {{ data.house_number || '—' }}</span></template
        ></Column
      >
      <Column field="status" sortable :header="tr('STATUS')"
        ><template #body="{ data }"
          ><StatusBadge :status="data.status" :label="recordLabel(data.status)" /></template
      ></Column>
      <Column :header="tr('AKSI')"
        ><template #body="{ data }"
          ><RouterLink
            :to="`/manage/households/${data.public_id}`"
            :aria-label="`${tr('Buka detail')} ${data.address || tr('Alamat belum tersedia')}`"
            class="text-surface-400"
            ><i class="pi pi-arrow-up-right" aria-hidden="true" /></RouterLink></template
      ></Column>
    </AppDataTable>
    <p class="field-help mt-4">
      <i class="pi pi-lock mr-1" aria-hidden="true" />
      {{ tr('Data keluarga hanya dapat diakses sesuai izin akun Anda.') }}
    </p>
  </section>
</template>
