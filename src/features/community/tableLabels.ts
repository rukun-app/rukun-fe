import { tr } from '@/i18n'
export function occupancyLabel(value?: string | null) {
  const labels: Record<string, string> = {
    occupied: 'Dihuni',
    vacant: 'Kosong',
    rented: 'Disewakan',
    other: 'Lainnya',
  }
  return tr(labels[value ?? ''] ?? 'Belum tersedia')
}
