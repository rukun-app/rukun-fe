import type { AreaData, HouseholdData } from '@/api/generated/models'
export function referenceOptions(
  resource: 'rw' | 'rt' | 'household',
  records: (AreaData | HouseholdData)[],
) {
  return records.flatMap((record) => {
    if (!record.public_id) return []
    if (resource === 'household') {
      const household = record as HouseholdData
      return [
        {
          value: record.public_id,
          label:
            [household.reference, household.address, household.block, household.house_number]
              .filter(Boolean)
              .join(' · ') || '—',
        },
      ]
    }
    const area = record as AreaData
    if (area.kind !== resource) return []
    return [
      {
        value: record.public_id,
        label: [area.name, area.code].filter(Boolean).join(' · ') || resource.toUpperCase(),
      },
    ]
  })
}
