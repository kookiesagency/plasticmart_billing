'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { PlusCircle, ArrowUpDown, Undo, Trash, Zap } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { columns as activeInvoiceColumns, Invoice } from './columns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { toast } from 'sonner'
import { ColumnDef } from '@tanstack/react-table'
import { SetHeader } from '@/components/layout/header-context'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { QuickEntryDialog } from './quick-entry-dialog'


export default function InvoicesPage() {
  const supabase = createClient()
  const [activeInvoices, setActiveInvoices] = useState<Invoice[]>([])
  const [deletedInvoices, setDeletedInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  // State for confirmation dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null)
  const [invoiceToRestore, setInvoiceToRestore] = useState<number | null>(null)
  const [invoiceToPermanentlyDelete, setInvoiceToPermanentlyDelete] = useState<number | null>(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[] | null>(null)
  const [bulkRestoreIds, setBulkRestoreIds] = useState<number[] | null>(null)
  const [bulkPermanentDeleteIds, setBulkPermanentDeleteIds] = useState<number[] | null>(null)

  // State for quick entry dialog
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false)


  const fetchData = useCallback(async () => {
    setLoading(true)
    
    const baseQuery = `
      id,
      public_id,
      invoice_date,
      updated_at,
      party_name,
      total_amount,
      is_offline,
      payments (amount)
    `
    
    // Fetch active invoices
    const { data: activeData, error: activeError } = await supabase
      .from('invoices')
      .select(baseQuery)
      .is('deleted_at', null)
      .order('invoice_date', { ascending: false })
    
    // Fetch deleted invoices
    const { data: deletedData, error: deletedError } = await supabase
      .from('invoices')
      .select(`*, ${baseQuery}, deleted_at`)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (activeError || deletedError) {
      toast.error('Failed to fetch invoices: ' + (activeError?.message || deletedError?.message))
    } else {
        const parseData = (data: any[]) => data.map(d => {
            const totalAmount = d.total_amount || 0;
            const amountReceived = d.payments.reduce((acc: number, p: { amount: number }) => acc + p.amount, 0)
            const amountPending = totalAmount - amountReceived
            let status: 'Paid' | 'Partial' | 'Pending' = 'Pending'
            if (amountReceived >= totalAmount && totalAmount > 0) {
                status = 'Paid'
            } else if (amountReceived > 0) {
                status = 'Partial'
            }

            return {
                ...d,
                party: { name: d.party_name }, // Keep the structure consistent with Invoice type
                total_amount: totalAmount,
                amount_received: amountReceived,
                amount_pending: amountPending,
                status: status
            }
        })
        
        setActiveInvoices(parseData(activeData) as Invoice[])
        setDeletedInvoices(parseData(deletedData) as Invoice[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const closeConfirmation = () => {
    setIsConfirmOpen(false);
    setInvoiceToDelete(null);
    setInvoiceToRestore(null);
    setInvoiceToPermanentlyDelete(null);
    setBulkDeleteIds(null);
    setBulkRestoreIds(null);
    setBulkPermanentDeleteIds(null);
  };


  // --- Soft Delete ---
  const handleDeleteRequest = (id: number) => {
    setInvoiceToDelete(id)
    setIsConfirmOpen(true)
  }
  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    const { error } = await supabase.from('invoices').update({ deleted_at: new Date().toISOString() }).eq('id', invoiceToDelete);
    if (error) toast.error('Failed to delete invoice.');
    else {
      toast.success('Invoice moved to deleted tab.');
      fetchData();
    }
  };

  // --- Bulk Soft Delete ---
  const handleBulkDelete = (selectedInvoices: Invoice[]) => {
    setBulkDeleteIds(selectedInvoices.map((inv) => inv.id));
    setIsConfirmOpen(true);
  }
  const confirmBulkDelete = async () => {
    if (!bulkDeleteIds) return;
    const { error } = await supabase.from('invoices').update({ deleted_at: new Date().toISOString() }).in('id', bulkDeleteIds);
    if (error) toast.error(`Failed to delete ${bulkDeleteIds.length} invoices.`);
    else {
      toast.success(`${bulkDeleteIds.length} invoices moved to deleted tab.`);
      fetchData();
    }
  };

  // --- Restore ---
  const handleRestoreRequest = (id: number) => {
    setInvoiceToRestore(id)
    setIsConfirmOpen(true)
  }
  const confirmRestore = async () => {
    if (!invoiceToRestore) return;
    const { error } = await supabase.from('invoices').update({ deleted_at: null }).eq('id', invoiceToRestore);
    if (error) toast.error('Failed to restore invoice.');
    else {
      toast.success('Invoice restored successfully.');
      fetchData();
    }
  };
  
  // --- Bulk Restore ---
  const handleBulkRestore = (selectedInvoices: Invoice[]) => {
    setBulkRestoreIds(selectedInvoices.map((inv) => inv.id));
    setIsConfirmOpen(true);
  };
  const confirmBulkRestore = async () => {
    if (!bulkRestoreIds) return;
    const { error } = await supabase.from('invoices').update({ deleted_at: null }).in('id', bulkRestoreIds);
    if (error) toast.error(`Failed to restore ${bulkRestoreIds.length} invoices.`);
    else {
      toast.success(`${bulkRestoreIds.length} invoices restored successfully.`);
      fetchData();
    }
  };

  // --- Permanent Delete ---
  const handlePermanentDeleteRequest = (id: number) => {
    setInvoiceToPermanentlyDelete(id);
    setIsConfirmOpen(true);
  };
  const confirmPermanentDelete = async () => {
    if (!invoiceToPermanentlyDelete) return;
    // Order of deletion matters due to foreign keys
    await supabase.from('payments').delete().eq('invoice_id', invoiceToPermanentlyDelete);
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceToPermanentlyDelete);
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceToPermanentlyDelete);
    
    if (error) toast.error('Failed to permanently delete invoice.');
    else {
      toast.success('Invoice permanently deleted.');
      fetchData();
    }
  };

  // --- Bulk Permanent Delete ---
  const handleBulkPermanentDelete = (selectedInvoices: Invoice[]) => {
    setBulkPermanentDeleteIds(selectedInvoices.map((inv) => inv.id));
    setIsConfirmOpen(true);
  };
  const confirmBulkPermanentDelete = async () => {
    if (!bulkPermanentDeleteIds) return;
    // Order of deletion matters
    await supabase.from('payments').delete().in('invoice_id', bulkPermanentDeleteIds);
    await supabase.from('invoice_items').delete().in('invoice_id', bulkPermanentDeleteIds);
    const { error } = await supabase.from('invoices').delete().in('id', bulkPermanentDeleteIds);

    if (error) toast.error(`Failed to delete ${bulkPermanentDeleteIds.length} invoices permanently.`);
    else {
      toast.success(`${bulkPermanentDeleteIds.length} invoices permanently deleted.`);
      fetchData();
    }
  };


  const onConfirm = () => {
    if (invoiceToDelete) confirmDelete();
    else if (bulkDeleteIds) confirmBulkDelete();
    else if (invoiceToRestore) confirmRestore();
    else if (bulkRestoreIds) confirmBulkRestore();
    else if (invoiceToPermanentlyDelete) confirmPermanentDelete();
    else if (bulkPermanentDeleteIds) confirmBulkPermanentDelete();
    closeConfirmation();
  };

  const confirmationDescription = () => {
    if (bulkDeleteIds) return `This action will mark ${bulkDeleteIds.length} invoices as deleted. You can restore them from the 'Deleted' tab within 30 days.`
    if (invoiceToDelete) return "This action will mark the invoice as deleted. You can restore it from the 'Deleted' tab within 30 days."
    if (bulkRestoreIds) return `This will restore ${bulkRestoreIds.length} invoices and make them active again.`
    if (invoiceToRestore) return "This will restore the invoice and make it active again."
    if (bulkPermanentDeleteIds) return `This action is IRREVERSIBLE. This will permanently delete ${bulkPermanentDeleteIds.length} invoices and all their associated data.`
    if (invoiceToPermanentlyDelete) return "This action is IRREVERSIBLE. This will permanently delete the invoice and all its associated data."
    return "Are you sure you want to proceed?"
  }

  
  const deletedInvoiceColumns: ColumnDef<Invoice & { deleted_at: string }>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'invoice_date',
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Invoice Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => formatDate(row.getValue('invoice_date')),
    },
    {
      accessorKey: 'party.name',
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Party
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => row.original.party?.name || 'N/A'
    },
    {
      accessorKey: 'total_amount',
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => formatCurrency(row.getValue('total_amount')),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return <Badge variant={ status === 'Paid' ? 'paid' : status === 'Partial' ? 'partial' : 'destructive' } className="capitalize">{status}</Badge>
      },
    },
    { 
      accessorKey: 'deleted_at', 
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Deleted At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => formatDate(row.original.deleted_at)
    },
    {
      id: 'actions',
      cell: ({ row, table }) => (
        <div className="text-right">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => {
                handleRestoreRequest(row.original.id)
                table.resetRowSelection()
              }}>
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Restore Invoice</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => {
                handlePermanentDeleteRequest(row.original.id)
                table.resetRowSelection()
              }}>
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Permanently</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <>
      <SetHeader
        title="Invoices"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsQuickEntryOpen(true)}>
              <Zap className="h-4 w-4 mr-2" />
              Quick Entry
            </Button>
            <Button asChild>
              <Link href="/invoices/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Invoice
              </Link>
            </Button>
          </div>
        }
      />
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <DataTable
            columns={activeInvoiceColumns(handleDeleteRequest, fetchData)}
            data={activeInvoices}
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
            onBulkRestore={handleBulkRestore}
            onBulkDelete={handleBulkPermanentDelete}
            bulkActionLabel="Delete Permanently"
          />
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmation}
        onConfirm={onConfirm}
        title="Are you sure?"
        description={confirmationDescription()}
      />

      <QuickEntryDialog
        isOpen={isQuickEntryOpen}
        onClose={() => setIsQuickEntryOpen(false)}
        onSuccess={fetchData}
      />
    </>
  )
} 