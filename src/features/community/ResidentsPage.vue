<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useResidents } from './queries'
import CursorPager from './CursorPager.vue'
import RecordStatus from './RecordStatus.vue'
import { useContextStore } from '@/contexts/stores/context'
import { AppSkeleton, EmptyState, ErrorState } from '@/design-system'
import { normalizeApiError } from '@/api/errors/normalizer'
const route = useRoute()
const context = useContextStore()
const cursor = ref<string>()
const household = computed(() =>
  typeof route.query.household === 'string' ? route.query.household : '',
)
const query = useResidents(cursor, household)
const result = computed(() => query.data.value?.data)
</script>
<template>
  <section class="page-container">
    <div class="page-heading">
      <div>
        <span class="eyebrow">DATA LINGKUNGAN</span>
        <h2>Data Warga</h2>
        <p>Kenali dan kelola warga yang tinggal di lingkungan Anda.</p>
      </div>
      <RouterLink
        v-if="context.can('residents.manage')"
        :to="{ path: '/manage/residents/new', query: { household } }"
        ><Button label="Tambah warga" icon="pi pi-plus"
      /></RouterLink>
    </div>
    <p v-if="household" class="filter-notice">
      <i class="pi pi-filter mr-2" aria-hidden="true" /> Menampilkan anggota keluarga yang
      dipilih.<RouterLink to="/manage/residents">Tampilkan semua warga</RouterLink>
    </p>
    <div class="data-panel">
      <div class="data-toolbar">
        <span class="data-toolbar-label">{{ household ? 'Anggota keluarga' : 'Daftar warga' }}</span
        ><span class="field-help">Data sesuai akses Anda</span>
      </div>
      <AppSkeleton v-if="query.isPending.value" variant="list" />
      <ErrorState
        v-else-if="query.isError.value"
        :description="normalizeApiError(query.error.value).message"
        @retry="query.refetch()"
      />
      <EmptyState
        v-else-if="!result?.data?.length"
        title="Belum ada warga"
        description="Lengkapi lingkungan Anda dengan menambahkan warga pada keluarga yang terdaftar."
        icon="pi pi-users"
      />
      <DataTable
        v-else
        :value="result.data"
        data-key="public_id"
        :pt="{ table: { 'aria-label': 'Daftar warga', style: 'min-width: 580px' } }"
      >
        <Column field="name" header="NAMA WARGA"
          ><template #body="{ data }"
            ><RouterLink :to="`/manage/residents/${data.public_id}`" class="table-primary"
              ><span class="row-icon" aria-hidden="true"><i class="pi pi-user" /></span
              >{{ data.name }}</RouterLink
            ></template
          ></Column
        >
        <Column field="reference" header="REFERENSI" />
        <Column field="phone" header="NOMOR HP"
          ><template #body="{ data }">{{ data.phone || '—' }}</template></Column
        >
        <Column field="status" header="STATUS"
          ><template #body="{ data }"><RecordStatus :status="data.status" /></template
        ></Column>
        <Column header=""
          ><template #body="{ data }"
            ><RouterLink
              :to="`/manage/residents/${data.public_id}`"
              :aria-label="`Buka detail ${data.name}`"
              class="text-surface-400"
              ><i class="pi pi-arrow-up-right" aria-hidden="true" /></RouterLink></template
        ></Column>
      </DataTable>
      <div class="data-panel-footer">
        <p>{{ result?.data?.length ?? 0 }} warga di halaman ini</p>
        <CursorPager
          :next="result?.next_cursor"
          :previous="result?.prev_cursor"
          :busy="query.isFetching.value"
          @change="cursor = $event"
        />
      </div>
    </div>
    <p class="field-help mt-4">
      <i class="pi pi-lock mr-1" aria-hidden="true" /> Informasi pribadi warga dijaga sesuai hak
      akses.
    </p>
  </section>
</template>
