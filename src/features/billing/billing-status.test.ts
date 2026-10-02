import { describe, expect, it } from 'vitest'
import { buildTransferSubmission, getBillingStatusMeta, summarizeBillingInvoices } from './model'

describe('billing status metadata', () => {
  it('maps invoice states to usable badge metadata', () => {
    expect(getBillingStatusMeta('paid', 'invoice')).toEqual({
      status: 'paid',
      label: 'Lunas',
    })

    expect(getBillingStatusMeta('overdue', 'invoice')).toEqual({
      status: 'overdue',
      label: 'Jatuh Tempo',
    })

    expect(getBillingStatusMeta('issued', 'invoice')).toEqual({
      status: 'processing',
      label: 'Menunggu pembayaran',
    })
  })

  it('maps manual payment states to approval metadata', () => {
    expect(getBillingStatusMeta('approved', 'submission')).toEqual({
      status: 'approved',
      label: 'Disetujui',
    })

    expect(getBillingStatusMeta('pending', 'submission')).toEqual({
      status: 'pending',
      label: 'Menunggu verifikasi',
    })
  })

  it('summarizes outstanding balances and due items for the billing overview', () => {
    expect(
      summarizeBillingInvoices([
        { outstanding_amount: 150000, status: 'overdue' },
        { outstanding_amount: 250000, status: 'issued' },
        { outstanding_amount: 0, status: 'paid' },
      ]),
    ).toEqual({
      totalOutstanding: 400000,
      totalDue: 1,
      totalInvoices: 3,
      unpaidInvoices: 2,
    })
  })

  it('builds a manual transfer submission payload for a selected invoice', () => {
    expect(
      buildTransferSubmission({
        amount: 150000,
        invoiceId: 'invoice-123',
        householdId: 'household-456',
        destinationAccountId: 'bank-789',
        proofFileId: 'file-xyz',
        transferredAt: '2026-10-02T09:30:00.000Z',
        note: 'Transfer via BCA',
      }),
    ).toEqual({
      household_id: 'household-456',
      amount: 150000,
      transferred_at: '2026-10-02T09:30:00.000Z',
      destination_account_id: 'bank-789',
      proof_file_id: 'file-xyz',
      note: 'Transfer via BCA',
      allocations: [{ invoice_id: 'invoice-123', amount: 150000 }],
    })
  })
})
