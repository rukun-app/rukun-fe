import { computed, type Ref } from 'vue'
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'
import { listAreas, listHouseholds, showHousehold } from '@/api/generated/endpoints'
import { useContextStore } from '@/contexts/stores/context'
import { referenceOptions } from './referenceOptions'
export function useReferenceOptions(
  resource: Ref<'rw' | 'rt' | 'household'>,
  selectedId: Ref<string | undefined>,
) {
  const context = useContextStore()
  const allowed = computed(() =>
    context.can(resource.value === 'household' ? 'households.view' : 'areas.view'),
  )
  const query = useInfiniteQuery({
    queryKey: computed(() => ['community', context.activeContextId, 'references', resource.value]),
    enabled: allowed,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam, signal }) => {
      const params = { per_page: 50, cursor: pageParam }
      if (resource.value === 'household') {
        const response = await listHouseholds(params, undefined, signal)
        return {
          options: referenceOptions('household', response.data?.data ?? []),
          next: response.data?.next_cursor,
        }
      }
      const response = await listAreas(params, undefined, signal)
      return {
        options: referenceOptions(resource.value, response.data?.data ?? []),
        next: response.data?.next_cursor,
      }
    },
    getNextPageParam: (page) => page.next || undefined,
  })
  const loaded = computed(() => query.data.value?.pages.flatMap((page) => page.options) ?? [])
  const selected = useQuery({
    queryKey: computed(() => [
      'community',
      context.activeContextId,
      'reference-household',
      selectedId.value,
    ]),
    enabled: computed(
      () =>
        allowed.value &&
        resource.value === 'household' &&
        !!selectedId.value &&
        !loaded.value.some((option) => option.value === selectedId.value),
    ),
    queryFn: ({ signal }) => showHousehold(selectedId.value!, undefined, signal),
  })
  function retry() {
    if (query.isError.value) void query.refetch()
    if (selected.isError.value && selectedId.value) void selected.refetch()
  }
  const options = computed(() => {
    const extra = selected.data.value?.data
      ? referenceOptions('household', [selected.data.value.data])
      : []
    return [
      ...new Map([...loaded.value, ...extra].map((option) => [option.value, option])).values(),
    ]
  })

  return { allowed, query, selected, options, retry }
}
