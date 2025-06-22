'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { PlusCircle, ArrowUpDown } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { columns, Invoice } from './columns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { toast } from 'sonner'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { SetHeader } from '@/components/layout/header-context'

export default function InvoicesPage() {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [deletedInvoices, setDeletedInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<number | null>(null)
  const [restoringInvoiceId, setRestoringInvoiceId] = useState<number | null>(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[] | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    const baseQuery = `
      id,
      public_id,
      invoice_date,
      updated_at,
      party:parties (name),
      invoice_items (quantity, rate),
      bundle_rate,
      bundle_quantity,
      total_amount,
      payments (amount)
    `
    
    const { data: activeData, error: activeError } = await supabase
      .from('invoices')
      .select(baseQuery)
      .is('deleted_at', null)
      .order('invoice_date', { ascending: false })
    
    const { data: deletedData, error: deletedError } = await supabase
      .from('invoices')
      .select(`${baseQuery}, deleted_at`)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (activeError || deletedError) {
      toast.error('Failed to fetch invoices: ' + (activeError?.message || deletedError?.message))
    } else {
        const parseData = (data: any[]) => data.map(d => {
            const totalAmount = d.total_amount || 0;
            const amountReceived = d.payments.reduce((acc: number, p: { amount: number }) => acc + p.amount, 0)
            const amountPending = totalAmount - amountReceived
            let status = 'Pending'
            if (amountReceived >= totalAmount) {
                status = 'Paid'
            } else if (amountReceived > 0) {
                status = 'Partial'
            }

            return {
                ...d,
                party: Array.isArray(d.party) ? d.party[0] : d.party,
                total_amount: totalAmount,
                amount_received: amountReceived,
                amount_pending: amountPending,
                status: status
            }
        })
        
        setInvoices(parseData(activeData) as Invoice[])
        setDeletedInvoices(parseData(deletedData) as Invoice[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = (invoiceId: number) => {
    setDeletingInvoiceId(invoiceId)
    setIsConfirmOpen(true)
  }

  const handleRestore = (invoiceId: number) => {
    setRestoringInvoiceId(invoiceId)
    setIsConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingInvoiceId) return;
    const { error } = await supabase.from('invoices').update({ deleted_at: new Date().toISOString() }).eq('id', deletingInvoiceId);
    if (error) {
      toast.error('Failed to delete invoice: ' + error.message);
    } else {
      toast.success('Invoice deleted successfully!');
      fetchData();
    }
    setIsConfirmOpen(false)
    setDeletingInvoiceId(null)
  }

  const confirmRestore = async () => {
    if (!restoringInvoiceId) return;
    const { error } = await supabase.from('invoices').update({ deleted_at: null }).eq('id', restoringInvoiceId);
    if (error) {
      toast.error('Failed to restore invoice: ' + error.message);
    } else {
      toast.success('Invoice restored successfully!');
      fetchData();
    }
    setRestoringInvoiceId(null);
    setIsConfirmOpen(false);
  }
  
  const handleBulkDelete = (selectedInvoices: Invoice[]) => {
    const ids = selectedInvoices.map((inv) => inv.id);
    setBulkDeleteIds(ids);
    setIsConfirmOpen(true);
  }

  const confirmBulkDelete = async () => {
    if (!bulkDeleteIds || bulkDeleteIds.length === 0) return;
    
    const { error } = await supabase
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', bulkDeleteIds)

    if (error) {
      toast.error(`Failed to delete ${bulkDeleteIds.length} invoices: ${error.message}`)
    } else {
      toast.success(`${bulkDeleteIds.length} invoices deleted successfully!`)
      fetchData()
    }
    setIsConfirmOpen(false)
    setBulkDeleteIds(null)
  }
  
  const deletedInvoiceColumns: ColumnDef<Invoice & { deleted_at: string }>[] = [
    {
      accessorKey: 'invoice_date',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(new Date(row.original.invoice_date), 'dd/MM/yyyy')
    },
    {
      accessorKey: 'party.name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Party
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.party?.name || 'N/A'
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
    },
    {
      accessorKey: 'amount_received',
      header: 'Received',
    },
    {
      accessorKey: 'amount_pending',
      header: 'Pending',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
    { 
      accessorKey: 'deleted_at', 
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Deleted At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(new Date(row.original.deleted_at), 'dd/MM/yyyy, hh:mm a')
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="outline" size="sm" onClick={() => handleRestore(row.original.id)}>Restore</Button>
        </div>
      )
    }
  ];

  return (
    <>
      <SetHeader 
        title="Invoices"
        actions={
          <Button asChild>
            <Link href="/invoices/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Invoice
            </Link>
          </Button>
        }
      />
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <DataTable
            columns={columns(handleDelete, fetchData)}
            data={invoices}
            loading={loading}
            onBulkDelete={handleBulkDelete}
            searchPlaceholder="Search invoices..."
          />
        </TabsContent>
        <TabsContent value="deleted">
          <DataTable
            columns={deletedInvoiceColumns}
            data={deletedInvoices as (Invoice & { deleted_at: string })[]}
            loading={loading}
            searchPlaceholder="Search deleted invoices..."
          />
        </TabsContent>
      </Tabs>
      
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setDeletingInvoiceId(null);
          setRestoringInvoiceId(null);
          setBulkDeleteIds(null);
        }}
        onConfirm={() => {
          if (deletingInvoiceId) confirmDelete();
          else if (restoringInvoiceId) confirmRestore();
          else if (bulkDeleteIds) confirmBulkDelete();
        }}
        title="Are you sure?"
        description={
          bulkDeleteIds
            ? `This action cannot be undone. This will mark ${bulkDeleteIds.length} invoices as deleted.`
            : deletingInvoiceId
            ? "This action cannot be undone. This will mark the invoice as deleted."
            : "This will restore the invoice and make it active again."
        }
      />
    </>
  );
} 