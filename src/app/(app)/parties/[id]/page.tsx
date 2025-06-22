'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/data-table'
import { columns } from '@/app/(app)/invoices/columns'
import { type Invoice } from '@/app/(app)/invoices/columns'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { toast } from 'sonner'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'
import { subDays, startOfWeek, startOfMonth, startOfYear, endOfToday } from 'date-fns'
import { Button } from '@/components/ui/button'
import { SetHeader } from '@/components/layout/header-context'

type PartyDetails = {
  name: string
  invoices: Invoice[]
}

export default function PartyReportPage() {
  const params = useParams<{ id: string }>()
  const supabase = createClient()
  const [party, setParty] = useState<PartyDetails | null>(null)
  const [summary, setSummary] = useState({ totalBilled: 0, totalReceived: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [invoicesToDelete, setInvoicesToDelete] = useState<Invoice[] | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  const fetchPartyData = async (range?: DateRange) => {
    if (!params.id) return
    setLoading(true)

    const { data: partyData, error: partyError } = await supabase
      .from('parties')
      .select('name')
      .eq('id', params.id)
      .single()

    if (partyError) {
      console.error('Error fetching party data:', partyError)
      setParty(null)
      setLoading(false)
      return
    }

    let invoicesQuery = supabase
      .from('invoices')
      .select('*, payments(amount)')
      .eq('party_id', params.id)
      .is('deleted_at', null)

    if (range?.from) {
      invoicesQuery = invoicesQuery.gte('invoice_date', range.from.toISOString())
    }
    if (range?.to) {
      // Set to end of day to include all invoices on the selected end date
      const toDate = new Date(range.to)
      toDate.setHours(23, 59, 59, 999)
      invoicesQuery = invoicesQuery.lte('invoice_date', toDate.toISOString())
    }
    
    const { data: invoicesData, error: invoicesError } = await invoicesQuery;

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
    } else if (invoicesData) {
      let totalBilled = 0
      let totalReceived = 0

      const processedInvoices = invoicesData.map((invoice: any) => {
        const amountReceived = invoice.payments.reduce((acc: any, p: any) => acc + p.amount, 0)
        const amountPending = invoice.total_amount - amountReceived
        let status: 'Paid' | 'Pending' | 'Partial' = 'Pending'
        if (amountReceived >= invoice.total_amount) {
          status = 'Paid'
        } else if (amountReceived > 0) {
          status = 'Partial'
        }
        
        totalBilled += invoice.total_amount
        totalReceived += amountReceived

        return {
          ...invoice,
          party: { name: partyData.name },
          amount_received: amountReceived,
          amount_pending: amountPending,
          status,
        }
      })
      
      setParty({ name: partyData.name, invoices: processedInvoices })
      setSummary({ totalBilled, totalReceived, balance: totalBilled - totalReceived })
    }
    setLoading(false)
  }
  
  useEffect(() => {
    fetchPartyData(dateRange)
  }, [params.id, dateRange])

  const handleBulkDelete = (selectedInvoices: Invoice[]) => {
    setInvoicesToDelete(selectedInvoices);
  };

  const confirmBulkDelete = async () => {
    if (!invoicesToDelete) return;
    const idsToDelete = invoicesToDelete.map((inv) => inv.id);
    const { error } = await supabase
      .from("invoices")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", idsToDelete);

    if (error) {
      toast.error(`Failed to delete ${idsToDelete.length} invoices.`);
    } else {
      toast.success(`${idsToDelete.length} invoices deleted successfully!`);
      fetchPartyData(dateRange); // Refresh data
    }
    setInvoicesToDelete(null);
  };

  const setDatePreset = (preset: 'week' | 'month' | 'year') => {
    const today = endOfToday();
    let fromDate: Date;

    if (preset === 'week') {
      fromDate = startOfWeek(today);
    } else if (preset === 'month') {
      fromDate = startOfMonth(today);
    } else {
      fromDate = startOfYear(today);
    }
    setDateRange({ from: fromDate, to: today });
  };

  if (loading && !party) return <div className="p-6">Loading party report...</div>
  if (!party) return <div className="p-6">Party not found.</div>

  const invoiceColumns = columns(() => {})

  return (
    <>
      <SetHeader 
        title={`Report for ${party.name}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setDatePreset('week')}>This Week</Button>
            <Button variant="outline" onClick={() => setDatePreset('month')}>This Month</Button>
            <Button variant="outline" onClick={() => setDatePreset('year')}>This Year</Button>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
        }
      />
      <ConfirmationDialog
        isOpen={!!invoicesToDelete}
        onClose={() => setInvoicesToDelete(null)}
        onConfirm={confirmBulkDelete}
        title={`Delete ${invoicesToDelete?.length || ""} Invoices`}
        description="Are you sure you want to delete the selected invoices? This action is not reversible."
      />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Billed</h3>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalBilled)}</p>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Received</h3>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalReceived)}</p>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Balance</h3>
            <p className="text-2xl font-bold">{formatCurrency(summary.balance)}</p>
          </div>
        </div>

        <DataTable
          columns={invoiceColumns}
          data={party.invoices}
          loading={loading}
          onBulkDelete={handleBulkDelete}
          searchPlaceholder="Search invoices..."
        />
      </div>
    </>
  )
} 