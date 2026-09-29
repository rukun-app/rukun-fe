<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useResidents } from './queries'
import CursorPager from './CursorPager.vue'
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
  <section class="p-4 md:p-6 space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-semibold">Data Warga</h2>
      <RouterLink
        v-if="context.can('residents.manage')"
        :to="{ path: '/manage/residents/new', query: { household } }"
        ><Button label="Tambah warga" icon="pi pi-plus"
      /></RouterLink>
    </div>
    <p v-if="household" class="text-sm break-all">
      Anggota KK: {{ household }} ·
      <RouterLink to="/manage/residents" class="underline">Semua warga</RouterLink>
    </p>
    <AppSkeleton v-if="query.isPending.value" variant="list" />
    <ErrorState
      v-else-if="query.isError.value"
      :description="normalizeApiError(query.error.value).message"
      @retry="query.refetch()"
    />
    <EmptyState
      v-else-if="!result?.data?.length"
      title="Belum ada warga"
      description="Tambahkan warga pada kartu keluarga yang sudah terdaftar."
    />
    <DataTable v-else :value="result.data" data-key="public_id" striped-rows class="overflow-x-auto"
      ><Column field="name" header="Nama"
        ><template #body="{ data }"
          ><RouterLink
            :to="`/manage/residents/${data.public_id}`"
            class="text-primary-700 underline"
            >{{ data.name }}</RouterLink
          ></template
        ></Column
      ><Column field="reference" header="Referensi" /><Column
        field="phone"
        header="Nomor HP" /><Column field="status" header="Status"
    /></DataTable>
    <CursorPager
      :next="result?.next_cursor"
      :previous="result?.prev_cursor"
      :busy="query.isFetching.value"
      @change="cursor = $event"
    />
  </section>
</template>
