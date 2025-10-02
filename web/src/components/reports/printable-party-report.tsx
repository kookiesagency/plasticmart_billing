'use client'

import { useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

type WeeklyInvoice = {
  id: number
  invoice_number: string
  invoice_date: string
  total_amount: number
  payments: { amount: number }[]
}

type ReportData = {
  previousOutstanding: number
  weeklyInvoices: WeeklyInvoice[]
  weekTotal: number
  grandTotal: number
  weekStart: Date
  weekEnd: Date
}

type PrintablePartyReportProps = {
  partyName: string
  reportData: ReportData
  onReady: () => void
}

export function PrintablePartyReport({ partyName, reportData, onReady }: PrintablePartyReportProps) {
  useEffect(() => {
    // Call onReady once the component has mounted
    onReady()
  }, [onReady])

  return (
    <div className="bg-white text-black p-8 font-sans text-sm">
      <header className="text-center mb-8 pb-6 border-b border-gray-400">
        <h2 className="text-2xl font-bold mb-2">WEEKLY MINI REPORT</h2>
        <h3 className="text-xl font-semibold">{partyName}</h3>
        <p className="text-sm text-gray-600 mt-2">
          Week: {formatDate(reportData.weekStart.toISOString())} to {formatDate(reportData.weekEnd.toISOString())}
        </p>
      </header>

      {reportData.grandTotal === 0 && reportData.previousOutstanding === 0 ? (
        // Show message when everything is paid
        <section className="text-center py-16 border-2 border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <p className="text-2xl font-bold text-gray-900">All Paid</p>
          </div>
          <p className="text-base text-gray-600">No outstanding balance for this party</p>
        </section>
      ) : (
        <>
          {/* Previous Outstanding Balance - Always show */}
          <section className="mb-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-base">Previous Outstanding Balance:</span>
              <span className="text-lg font-bold">{formatCurrency(reportData.previousOutstanding)}</span>
            </div>
          </section>

          {/* Current Week Invoices */}
          <section className="mb-6 mt-6">
            <h4 className="font-bold text-base mb-3">Current Week Invoices:</h4>

            {reportData.weeklyInvoices.length === 0 ? (
              <p className="text-center text-gray-500 py-6">No invoices this week</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="text-left p-2 font-bold">Invoice #</th>
                    <th className="text-left p-2 font-bold">Date</th>
                    <th className="text-right p-2 font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.weeklyInvoices.map((invoice, index) => {
                    return (
                      <tr key={invoice.id}>
                        <td className="p-2 font-mono">{invoice.invoice_number}</td>
                        <td className="p-2">{formatDate(invoice.invoice_date)}</td>
                        <td className="p-2 text-right">{formatCurrency(invoice.total_amount)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>

          {/* Totals Section */}
          <section className="space-y-4 mt-8 pt-6 border-t border-gray-400">
            <div className="flex justify-between items-center text-base">
              <span className="font-bold">Total This Week:</span>
              <span className="font-bold">{formatCurrency(reportData.weekTotal)}</span>
            </div>

            {reportData.grandTotal !== 0 && (
              <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                <span className="font-bold text-lg">Grand Total Outstanding:</span>
                <span className="font-bold text-xl">{formatCurrency(reportData.grandTotal)}</span>
              </div>
            )}
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-gray-300 text-xs text-gray-600 text-center">
        <p>Generated on {formatDate(new Date().toISOString())}</p>
      </footer>
    </div>
  )
}
