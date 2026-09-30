import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  listAreas,
  showArea,
  listHouseholds,
  listResidents,
  showHousehold,
  showResident,
} from '@/api/generated/endpoints'
import { useContextStore } from '@/contexts/stores/context'

export function useAreas(cursor: Ref<string | undefined>) {
  const context = useContextStore()
  return useQuery({
    queryKey: computed(() => ['community', context.activeContextId, 'areas', cursor.value]),
    queryFn: ({ signal }) => listAreas({ per_page: 20, cursor: cursor.value }, undefined, signal),
    enabled: computed(() => context.can('areas.view')),
  })
}
export function useHouseholds(cursor: Ref<string | undefined>, area: Ref<string>) {
  const context = useContextStore()
  return useQuery({
    queryKey: computed(() => [
      'community',
      context.activeContextId,
      'households',
      cursor.value,
      area.value,
    ]),
    queryFn: ({ signal }) =>
      listHouseholds(
        { per_page: 20, cursor: cursor.value, area_id: area.value || undefined },
        undefined,
        signal,
      ),
    enabled: computed(() => context.can('households.view')),
  })
}
export function useResidents(cursor: Ref<string | undefined>, household: Ref<string>) {
  const context = useContextStore()
  return useQuery({
    queryKey: computed(() => [
      'community',
      context.activeContextId,
      'residents',
      cursor.value,
      household.value,
    ]),
    queryFn: ({ signal }) =>
      listResidents(
        { per_page: 20, cursor: cursor.value, household_id: household.value || undefined },
        undefined,
        signal,
      ),
    enabled: computed(() => context.can('residents.view')),
  })
}
export function useHousehold(id: Ref<string>) {
  const context = useContextStore()
  return useQuery({
    queryKey: computed(() => ['community', context.activeContextId, 'household', id.value]),
    // Editable forms must not be remounted by background focus/reconnect refetches.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: ({ signal }) => showHousehold(id.value, undefined, signal),
    enabled: computed(() => !!id.value && context.can('households.view')),
  })
}
export function useResident(id: Ref<string>) {
  const context = useContextStore()
  return useQuery({
    queryKey: computed(() => ['community', context.activeContextId, 'resident', id.value]),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: ({ signal }) => showResident(id.value, undefined, signal),
    enabled: computed(() => !!id.value && context.can('residents.view')),
  })
}

export function useArea(id: Ref<string>) {
  const context = useContextStore()
  return useQuery({
    queryKey: computed(() => ['community', context.activeContextId, 'area', id.value]),
    enabled: computed(() => !!id.value && context.can('areas.view')),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: ({ signal }) => showArea(id.value, undefined, signal),
  })
}
