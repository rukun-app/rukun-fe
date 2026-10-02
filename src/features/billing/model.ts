import type { BillingGenerateInvoices } from '@/api/generated/models'

export type BillingStatusKind = 'invoice' | 'submission'

export type BillingInvoiceLike = {
  outstanding_amount?: number | null
  status?: string | null
}

export type BillingTransferSubmissionInput = {
  amount: number
  invoiceId: string
  householdId: string
  destinationAccountId: string
  proofFileId: string
  transferredAt: string
  note?: string | null
}

export type BillingInvoiceGenerationInput = {
  areaId: string
  paymentTypeId: string
  period: string
  dueDate: string
  subject?: string | null
  householdIds?: string[]
  settleBy?: string | null
  state?: 'draft' | 'issued' | null
}

export function buildTransferSubmission({
  amount,
  invoiceId,
  householdId,
  destinationAccountId,
  proofFileId,
  transferredAt,
  note,
}: BillingTransferSubmissionInput) {
  return {
    household_id: householdId,
    amount,
    transferred_at: transferredAt,
    destination_account_id: destinationAccountId,
    proof_file_id: proofFileId,
    note: note?.trim() ? note.trim() : undefined,
    allocations: [{ invoice_id: invoiceId, amount }],
  }
}

export function buildInvoiceGenerationPayload({
  areaId,
  paymentTypeId,
  period,
  dueDate,
  subject,
  householdIds,
  settleBy,
  state,
}: BillingInvoiceGenerationInput): BillingGenerateInvoices {
  const payload: BillingGenerateInvoices = {
    area_id: areaId,
    payment_type_id: paymentTypeId,
    period,
    due_date: dueDate,
  }

  const cleanedSubject = subject?.trim()
  if (cleanedSubject) {
    payload.subject = cleanedSubject
  }

  if (householdIds && householdIds.length > 0) {
    payload.household_ids = householdIds
  }

  const cleanedSettleBy = settleBy?.trim()
  if (cleanedSettleBy) {
    payload.settle_by = cleanedSettleBy
  }

  if (state) {
    payload.state = state
  }

  return payload
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
