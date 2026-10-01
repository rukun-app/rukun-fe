import { z } from 'zod'
import { tr } from '@/i18n'
export { formatDateTime as membershipDate } from '@/shared/utils/dateTime'
import { relationshipValues } from './options'
import type { HouseholdData, MoveResident } from '@/api/generated/models'
export function membershipSchema() {
  return z.discriminatedUnion('mode', [
    z.object({
      mode: z.literal('move'),
      household_id: z.string().uuid(tr('Pilih kartu keluarga')),
      relationship: z.enum(relationshipValues, {
        errorMap: () => ({ message: tr('Pilih hubungan keluarga') }),
      }),
    }),
    z.object({ mode: z.literal('end') }),
  ])
}
export function membershipPayload(values: unknown): MoveResident {
  const data = membershipSchema().parse(values)
  return data.mode === 'end'
    ? { household_id: null, relationship: 'other' }
    : { household_id: data.household_id, relationship: data.relationship }
}
export function householdAddress(data?: HouseholdData) {
  return data
    ? [data.address, data.block, data.house_number].filter(Boolean).join(' · ') ||
        tr('Alamat belum tersedia')
    : tr('Keluarga tidak tersedia')
}
