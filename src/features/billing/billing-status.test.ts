import { describe, expect, it } from 'vitest'
import { getBillingStatusMeta, summarizeBillingInvoices } from './model'

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
})
