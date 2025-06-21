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

export default function InvoicesPage() {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [deletedInvoices, setDeletedInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null)
  const [restoringInvoiceId, setRestoringInvoiceId] = useState<string | null>(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    const baseQuery = `
      id,
      invoice_date,
      party:parties (name),
      invoice_items (quantity, rate),
      bundle_rate,
      bundle_quantity
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
        const parsedActiveData = activeData.map(d => ({...d, party: Array.isArray(d.party) ? d.party[0] : d.party}))
        const parsedDeletedData = deletedData.map(d => ({...d, party: Array.isArray(d.party) ? d.party[0] : d.party}))
        setInvoices(parsedActiveData as Invoice[])
        setDeletedInvoices(parsedDeletedData as Invoice[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = (invoiceId: string) => {
    setDeletingInvoiceId(invoiceId);
    setIsConfirmOpen(true);
  }

  const handleRestore = (invoiceId: string) => {
    setRestoringInvoiceId(invoiceId);
    setIsConfirmOpen(true);
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
    setDeletingInvoiceId(null);
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
  }
  
  const handleBulkDelete = (selectedInvoices: Invoice[]) => {
    setBulkDeleteIds(selectedInvoices.map(i => i.id));
    setIsConfirmOpen(true);
  }

  const confirmBulkDelete = async () => {
    if (!bulkDeleteIds) return;
    const { error } = await supabase.from('invoices').update({ deleted_at: new Date().toISOString() }).in('id', bulkDeleteIds);
    if (error) {
      toast.error(`Failed to delete ${bulkDeleteIds.length} invoices: ` + error.message);
    } else {
      toast.success(`${bulkDeleteIds.length} invoices deleted successfully!`);
      fetchData();
    }
    setBulkDeleteIds(null);
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
        id: 'amount',
        header: () => <div className="text-left">Amount</div>,
        cell: ({ row }) => {
          const amount = (row.original.invoice_items || []).reduce((acc, item) => acc + item.quantity * item.rate, 0) + (row.original.bundle_rate || 0) * (row.original.bundle_quantity || 0)
          return <div className="text-left font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)}</div>
        },
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
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Button asChild>
          <Link href="/invoices/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {loading ? <p>Loading...</p> : <DataTable columns={columns(handleDelete)} data={invoices} searchKey="party.name" onBulkDelete={handleBulkDelete} initialSorting={[{ id: 'invoice_date', desc: true }]} />}
        </TabsContent>
        <TabsContent value="deleted">
          {loading ? <p>Loading...</p> : <DataTable columns={deletedInvoiceColumns} data={deletedInvoices as (Invoice & { deleted_at: string })[]} searchKey="party.name" initialSorting={[{ id: 'deleted_at', desc: true }]} />}
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
    </div>
  )
} 