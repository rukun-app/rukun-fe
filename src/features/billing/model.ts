export type BillingStatusKind = 'invoice' | 'submission'

export type BillingInvoiceLike = {
  outstanding_amount?: number | null
  status?: string | null
}

export function summarizeBillingInvoices(invoices: BillingInvoiceLike[]) {
  const totalOutstanding = invoices.reduce((sum, invoice) => {
    const amount = Number(invoice.outstanding_amount ?? 0)
    return Number.isFinite(amount) && amount > 0 ? sum + amount : sum
  }, 0)

  const unpaidInvoices = invoices.filter((invoice) => (Number(invoice.outstanding_amount ?? 0) > 0)).length
  const totalDue = invoices.filter((invoice) => invoice.status === 'overdue').length

  return {
    totalOutstanding,
    totalDue,
    totalInvoices: invoices.length,
    unpaidInvoices,
  }
}

export function getBillingStatusMeta(status?: string, kind: BillingStatusKind = 'invoice') {
  const value = status ?? ''

  if (kind === 'submission') {
    const map: Record<string, { status: string; label: string }> = {
      pending: { status: 'pending', label: 'Menunggu verifikasi' },
      approved: { status: 'approved', label: 'Disetujui' },
      rejected: { status: 'rejected', label: 'Ditolak' },
      cancelled: { status: 'secondary', label: 'Dibatalkan' },
    }

    return map[value] ?? { status: 'secondary', label: 'Belum tersedia' }
  }

  const map: Record<string, { status: string; label: string }> = {
    draft: { status: 'secondary', label: 'Draft' },
    issued: { status: 'processing', label: 'Menunggu pembayaran' },
    partially_paid: { status: 'processing', label: 'Sebagian dibayar' },
    paid: { status: 'paid', label: 'Lunas' },
    overdue: { status: 'overdue', label: 'Jatuh Tempo' },
    cancelled: { status: 'secondary', label: 'Dibatalkan' },
  }

  return map[value] ?? { status: 'secondary', label: 'Belum tersedia' }
}
