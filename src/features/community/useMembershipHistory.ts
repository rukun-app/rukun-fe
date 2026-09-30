import { computed, type Ref } from 'vue'
import { useQuery, useQueries } from '@tanstack/vue-query'
import { residentMembershipHistory, showHousehold } from '@/api/generated/endpoints'
import { useContextStore } from '@/contexts/stores/context'
import { householdAddress } from './membership'
import { tr } from '@/i18n'
export function useMembershipHistory(
  id: Ref<string>,
  cursor: Ref<string | undefined>,
  ready: Ref<boolean>,
) {
  const context = useContextStore()
  const query = useQuery({
    queryKey: computed(() => [
      'community',
      context.activeContextId,
      'memberships',
      id.value,
      cursor.value,
    ]),
    enabled: computed(() => ready.value && !!id.value && context.can('residents.view')),
    queryFn: ({ signal }) =>
      residentMembershipHistory(
        id.value,
        { per_page: 20, cursor: cursor.value },
        undefined,
        signal,
      ),
  })
  const result = computed(() => query.data.value?.data)
  const ids = computed(() => [
    ...new Set(
      (result.value?.data ?? []).flatMap((row) => (row.household_id ? [row.household_id] : [])),
    ),
  ])
  // Only resolve IDs already returned in the authorized page, once per unique household.
  const households = useQueries({
    queries: computed(() =>
      context.can('households.view')
        ? ids.value.map((household) => ({
            queryKey: ['community', context.activeContextId, 'household', household],
            queryFn: ({ signal }: { signal: AbortSignal }) =>
              showHousehold(household, undefined, signal),
            retry: false,
          }))
        : [],
    ),
  })
  const rows = computed(() =>
    (result.value?.data ?? []).map((row) => {
      const match = households.value[ids.value.indexOf(row.household_id ?? '')]
      return {
        ...row,
        householdLabel: !context.can('households.view')
          ? tr('Alamat keluarga dibatasi akses')
          : match?.isPending
            ? tr('Memuat...')
            : householdAddress(match?.isError ? undefined : match?.data?.data),
      }
    }),
  )
  const addressError = computed(() => households.value.some((item) => item.isError))
  const retryAddresses = () =>
    Promise.all(households.value.filter((item) => item.isError).map((item) => item.refetch()))
  return { query, result, rows, addressError, retryAddresses }
}
