import { tr } from '@/i18n'
export const householdStatuses = ['active', 'moved', 'inactive'] as const
export const residentStatuses = ['active', 'moved', 'deceased', 'inactive'] as const
export const occupancyValues = ['occupied', 'vacant', 'rented', 'other'] as const
export const relationshipValues = ['head', 'spouse', 'child', 'parent', 'other'] as const
export const areaKinds = ['rw', 'rt'] as const
const labels: Record<string, string> = {
  active: 'Aktif',
  moved: 'Pindah',
  inactive: 'Tidak aktif',
  deceased: 'Meninggal',
  occupied: 'Dihuni',
  vacant: 'Kosong',
  rented: 'Disewakan',
  other: 'Lainnya',
  head: 'Kepala keluarga',
  spouse: 'Pasangan',
  child: 'Anak',
  parent: 'Orang tua',
  rw: 'Rukun Warga (RW)',
  rt: 'Rukun Tetangga (RT)',
}
export function recordLabel(value?: string | null) {
  return tr(labels[value ?? ''] ?? 'Belum tersedia')
}
export function recordOptions<T extends string>(values: readonly T[]) {
  return values.map((value) => ({ value, label: recordLabel(value) }))
}
