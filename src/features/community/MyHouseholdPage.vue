<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { tr } from '@/i18n'
import Column from 'primevue/column'
import { useContextStore } from '@/contexts/stores/context'
import { useHousehold, useResidents } from './queries'
import { AppDataTable, AppSkeleton, ErrorState, PageHeader, StatusBadge } from '@/design-system'
import { normalizeApiError } from '@/api/errors/normalizer'

const context = useContextStore()
const householdId = computed(() =>
  context.activeContext?.scope.type === 'household' ? context.activeContext.scope.id : '',
)
const household = useHousehold(householdId)
const cursor = ref<string>()
watch(householdId, () => {
  cursor.value = undefined
})
const residents = useResidents(cursor, householdId)
const home = computed(() => household.data.value?.data)
const people = computed(() => residents.data.value?.data)
</script>

<template>
  <section class="page-container">
    <PageHeader
      :title="tr('Keluarga saya')"
      :description="tr('Alamat dan anggota keluarga yang terdaftar di rumah Anda.')"
    />
    <AppSkeleton v-if="household.isPending.value" />
    <ErrorState
      v-else-if="household.isError.value"
      :description="normalizeApiError(household.error.value).message"
      @retry="household.refetch()"
    />
    <dl
      v-else-if="home"
      class="mb-6 grid gap-3 rounded-2xl border border-surface-200 bg-surface-0 p-5 sm:grid-cols-3"
    >
      <div>
        <dt class="text-sm text-surface-500">{{ tr('Alamat') }}</dt>
        <dd>{{ home.address }}</dd>
      </div>
      <div>
        <dt class="text-sm text-surface-500">{{ tr('Nomor rumah') }}</dt>
        <dd>{{ home.house_number || '—' }}</dd>
      </div>
      <div>
        <dt class="text-sm text-surface-500">{{ tr('Referensi keluarga') }}</dt>
        <dd>{{ home.reference }}</dd>
      </div>
    </dl>
    <AppDataTable
      :rows="people?.data ?? []"
      :search-fields="['name']"
      :title="tr('Anggota keluarga')"
      :pending="residents.isPending.value"
      :busy="residents.isFetching.value"
      :error="residents.isError.value ? normalizeApiError(residents.error.value).message : null"
      :empty-title="tr('Belum ada anggota keluarga')"
      :empty-description="tr('Hubungi pengurus untuk melengkapi data keluarga Anda.')"
      :next="people?.next_cursor"
      :previous="people?.prev_cursor"
      :page-key="`${householdId}:${cursor ?? ''}`"
      @page="cursor = $event"
      @retry="residents.refetch()"
    >
      <Column field="name" :header="tr('Nama')" />
      <Column field="birth_date" :header="tr('Tanggal lahir')" />
      <Column :header="tr('Status')"
        ><template #body="{ data }"><StatusBadge :status="data.status" /></template
      ></Column>
    </AppDataTable>
  </section>
</template>
