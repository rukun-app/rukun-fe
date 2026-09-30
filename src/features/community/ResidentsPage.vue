<script setup lang="ts">
import { recordLabel } from './options'
import { tr } from '@/i18n'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import { useResidents } from './queries'
import { StatusBadge } from '@/design-system'
import { useContextStore } from '@/contexts/stores/context'
import { AppDataTable, PageHeader } from '@/design-system'
import { normalizeApiError } from '@/api/errors/normalizer'
const route = useRoute()
const context = useContextStore()
const cursor = ref<string>()
const household = computed(() =>
  typeof route.query.household === 'string' ? route.query.household : '',
)
watch(household, () => {
  cursor.value = undefined
})
const query = useResidents(cursor, household)
const result = computed(() => query.data.value?.data)
</script>
<template>
  <section class="page-container">
    <PageHeader
      :eyebrow="tr('DATA LINGKUNGAN')"
      :title="tr('Data Warga')"
      :description="tr('Kenali dan kelola warga yang tinggal di lingkungan Anda.')"
    >
      <template #actions
        ><RouterLink
          v-if="context.can('residents.manage')"
          :to="{ path: '/manage/residents/new', query: { household } }"
          ><Button :label="tr('Tambah warga')" icon="pi pi-plus" /></RouterLink></template
    ></PageHeader>
    <p v-if="household" class="filter-notice">
      <i class="pi pi-filter mr-2" aria-hidden="true" />
      {{ tr('Menampilkan anggota keluarga yang dipilih.') }}
      <RouterLink to="/manage/residents"> {{ tr('Tampilkan semua warga') }} </RouterLink>
    </p>
    <AppDataTable
      :rows="result?.data ?? []"
      :title="tr(household ? 'Anggota keluarga' : 'Daftar warga')"
      :search-fields="['name', 'phone']"
      :pending="query.isPending.value"
      :busy="query.isFetching.value"
      :error="query.isError.value ? normalizeApiError(query.error.value).message : null"
      :empty-title="tr('Belum ada warga')"
      :empty-description="
        tr('Lengkapi lingkungan Anda dengan menambahkan warga pada keluarga yang terdaftar.')
      "
      empty-icon="pi pi-users"
      :next="result?.next_cursor"
      :previous="result?.prev_cursor"
      :page-key="[cursor, household].join(':')"
      @retry="query.refetch()"
      @page="cursor = $event"
    >
      <Column field="name" sortable :header="tr('NAMA WARGA')"
        ><template #body="{ data }"
          ><RouterLink :to="`/manage/residents/${data.public_id}`" class="table-primary"
            ><span class="row-icon" aria-hidden="true"><i class="pi pi-user" /></span
            >{{ data.name }}</RouterLink
          ></template
        ></Column
      >
      <Column field="phone" sortable :header="tr('NOMOR HP')"
        ><template #body="{ data }">{{ data.phone || '—' }}</template></Column
      >
      <Column field="status" sortable :header="tr('STATUS')"
        ><template #body="{ data }"
          ><StatusBadge :status="data.status" :label="recordLabel(data.status)" /></template
      ></Column>
      <Column :header="tr('AKSI')"
        ><template #body="{ data }"
          ><RouterLink
            :to="`/manage/residents/${data.public_id}`"
            :aria-label="`${tr('Buka detail')} ${data.name}`"
            class="text-surface-400"
            ><i class="pi pi-arrow-up-right" aria-hidden="true" /></RouterLink></template
      ></Column>
    </AppDataTable>
    <p class="field-help mt-4">
      <i class="pi pi-lock mr-1" aria-hidden="true" />
      {{ tr('Informasi pribadi warga dijaga sesuai hak akses.') }}
    </p>
  </section>
</template>
