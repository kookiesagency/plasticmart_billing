'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { createRoot } from 'react-dom/client'
import { PrintablePartyReport } from './printable-party-report'

interface PartyMiniReportDialogProps {
  isOpen: boolean
  onClose: () => void
  partyId: number
  partyName: string
}

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

export function PartyMiniReportDialog({ isOpen, onClose, partyId, partyName }: PartyMiniReportDialogProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchReportData()
    } else {
      setReportData(null)
      setLoading(false)
    }
  }, [isOpen])

  const fetchReportData = async () => {
    setLoading(true)

    try {
      // Calculate current week range (Monday to Sunday)
      let now = new Date()
      let weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
      let weekEnd = endOfWeek(now, { weekStartsOn: 1 }) // Sunday
      let weekStartStr = weekStart.toISOString().slice(0, 10)
      let weekEndStr = weekEnd.toISOString().slice(0, 10)

      // Fetch all invoices for this party
      const { data: allInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, invoice_number, invoice_date, total_amount, payments(amount)')
        .eq('party_id', partyId)
        .is('deleted_at', null)
        .order('invoice_date', { ascending: true })

      if (invoicesError) throw invoicesError

      // Get party opening balance
      const { data: partyData, error: partyError } = await supabase
        .from('parties')
        .select('opening_balance')
        .eq('id', partyId)
        .single()

      if (partyError) throw partyError

      // Check if current week has any invoices
      let weeklyInvoices = allInvoices?.filter(inv =>
        inv.invoice_date >= weekStartStr && inv.invoice_date <= weekEndStr
      ) || []

      // If no invoices in current week, use last week
      if (weeklyInvoices.length === 0) {
        now = subWeeks(now, 1)
        weekStart = startOfWeek(now, { weekStartsOn: 1 })
        weekEnd = endOfWeek(now, { weekStartsOn: 1 })
        weekStartStr = weekStart.toISOString().slice(0, 10)
        weekEndStr = weekEnd.toISOString().slice(0, 10)

        weeklyInvoices = allInvoices?.filter(inv =>
          inv.invoice_date >= weekStartStr && inv.invoice_date <= weekEndStr
        ) || []
      }

      // Separate invoices: before week and during week
      const beforeWeekInvoices = allInvoices?.filter(inv => inv.invoice_date < weekStartStr) || []

      // Calculate previous outstanding (opening balance + before week invoices - payments)
      let previousOutstanding = partyData.opening_balance || 0

      beforeWeekInvoices.forEach(invoice => {
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
        previousOutstanding += invoice.total_amount - totalPaid
      })

      // Calculate week total and grand total
      const weekTotal = weeklyInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)

      // Grand total = previous outstanding + week total - week payments
      let weekPayments = 0
      weeklyInvoices.forEach(invoice => {
        weekPayments += invoice.payments.reduce((sum, p) => sum + p.amount, 0)
      })

      const grandTotal = previousOutstanding + weekTotal - weekPayments

      setReportData({
        previousOutstanding,
        weeklyInvoices,
        weekTotal,
        grandTotal,
        weekStart,
        weekEnd,
      })
    } catch (error: any) {
      toast.error('Failed to load report data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    if (!reportData) return

    toast.loading("Preparing document...", { id: "print-toast" })

    const container = document.createElement("div")
    container.className = "printable-container"
    document.body.appendChild(container)
    const root = createRoot(container)

    const cleanup = () => {
      root.unmount()
      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
      toast.dismiss("print-toast")
    }

    const onReady = () => {
      const originalTitle = document.title

      document.title = `${partyName} Weekly Report ${formatDate(reportData.weekStart.toISOString())} - ${formatDate(reportData.weekEnd.toISOString())}`
      window.print()
      setTimeout(() => {
        document.title = originalTitle
        cleanup()
      }, 100)
    }

    root.render(
      <div className="printable-area">
        <PrintablePartyReport
          partyName={partyName}
          reportData={reportData}
          onReady={onReady}
        />
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Weekly Mini Report - {partyName}</DialogTitle>
          {reportData && (
            <DialogDescription>
              Week of {formatDate(reportData.weekStart.toISOString())} to {formatDate(reportData.weekEnd.toISOString())}
            </DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reportData ? (
          <div className="space-y-4">
            {reportData.grandTotal === 0 && reportData.previousOutstanding === 0 ? (
              // Show message when everything is paid
              <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Check className="h-5 w-5 text-green-900" />
                  <p className="text-lg font-semibold text-green-900">All Paid</p>
                </div>
                <p className="text-sm text-green-700">No outstanding balance for this party</p>
              </div>
            ) : (
              <>
                {/* Previous Outstanding - Always show */}
                <div className="border-b pb-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Previous Outstanding Balance:</span>
                    <span className="text-lg font-bold">{formatCurrency(reportData.previousOutstanding)}</span>
                  </div>
                </div>

                {/* Current Week Invoices */}
                <div className="space-y-2">
                  <h4 className="font-medium">Current Week Invoices:</h4>
                  {reportData.weeklyInvoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No invoices this week</p>
                  ) : (
                    <div className="space-y-1">
                      {reportData.weeklyInvoices.map(invoice => {
                        return (
                          <div key={invoice.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                            <span>
                              Invoice #{invoice.invoice_number} ({formatDate(invoice.invoice_date)})
                            </span>
                            <span className="font-medium">
                              {formatCurrency(invoice.total_amount)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total This Week:</span>
                    <span className="text-lg font-bold">{formatCurrency(reportData.weekTotal)}</span>
                  </div>
                  {reportData.grandTotal !== 0 && (
                    <div className="flex justify-between items-center text-lg border-t pt-2">
                      <span className="font-bold">Grand Total Outstanding:</span>
                      <span className="font-bold text-primary">{formatCurrency(reportData.grandTotal)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {reportData && !(reportData.grandTotal === 0 && reportData.previousOutstanding === 0) && (
            <Button onClick={handlePrint}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
