'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash, FilePenLine, FileDown, MoreHorizontal, Share2, MessageCircle, CreditCard, ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency, formatDate } from '@/lib/utils'
import { isSameDay, parseISO } from 'date-fns';
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { createRoot } from 'react-dom/client'
import { PrintableInvoice } from './printable-invoice'
import { PaymentForm } from './[id]/payment-form'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { useState } from 'react'
import { QuickEntryDialog } from './quick-entry-dialog'

export type Invoice = {
  id: number
  public_id: string
  invoice_number: string
  invoice_date: string
  created_at: string
  updated_at: string
  party?: {
    id?: number
    name: string
  }
  party_id?: number
  total_amount: number
  amount_received: number
  amount_pending: number
  status: 'Paid' | 'Pending' | 'Partial'
  party_name: string
  is_offline?: boolean
}

export const columns = (
  handleDelete: (id: number) => void,
  onPaymentAdded?: () => void
): ColumnDef<Invoice>[] => [
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
    accessorKey: 'invoice_number',
    header: ({ column }) => (
      <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Invoice #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium">
        {row.getValue('invoice_number') || 'N/A'}
      </div>
    ),
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
    accessorKey: 'party_name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Party
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const partyName = row.getValue('party_name') as string;
      const createdAtRaw = row.original.created_at;    // e.g., '2025-07-09T18:32:50.628496+00:00'
      const updatedAtRaw = row.original.updated_at;     // e.g., '2025-07-09T18:32:50.628496+00:00'
      const isOffline = row.original.is_offline;

      // Get today's date in local YYYY-MM-DD
      const todayStr = new Date().toISOString().slice(0, 10);

      // Convert created_at to local date string YYYY-MM-DD
      const createdAtLocal = new Date(createdAtRaw);
      const createdAtStr = new Date(
        createdAtLocal.getFullYear(),
        createdAtLocal.getMonth(),
        createdAtLocal.getDate()
      ).toISOString().slice(0, 10);

      const isNew = createdAtStr === todayStr;

      // Convert updated_at to local date string YYYY-MM-DD
      const updatedAtLocal = new Date(updatedAtRaw);
      const updatedAtStr = new Date(
        updatedAtLocal.getFullYear(),
        updatedAtLocal.getMonth(),
        updatedAtLocal.getDate()
      ).toISOString().slice(0, 10);

      const isUpdated = !isNew && updatedAtStr === todayStr;

      return (
        <span className="flex items-center gap-2">
          {partyName}
          {isOffline && (
            <span className="px-1.5 py-0 rounded text-orange-700 bg-orange-100 text-[10px] font-bold tracking-wide">OFFLINE</span>
          )}
          {isNew && (
            <span className="px-1.5 py-0 rounded text-green-700 bg-green-100 text-[10px] font-bold tracking-wide">NEW</span>
          )}
          {isUpdated && (
            <span className="px-1.5 py-0 rounded text-blue-700 bg-blue-100 text-[10px] font-bold tracking-wide">UPDATED</span>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: 'total_amount',
    header: ({ column }) => (
      <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Total
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('total_amount'))
      return (
        <div className="text-left font-medium">
          {formatCurrency(amount)}
        </div>
      )
    },
  },
  {
    accessorKey: 'amount_received',
    header: ({ column }) => (
      <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Received
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => formatCurrency(row.getValue('amount_received')),
  },
  {
    accessorKey: 'amount_pending',
    header: ({ column }) => (
      <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Pending
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => formatCurrency(row.getValue('amount_pending')),
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
      const status = row.getValue('status') as string
      const variant =
        status === 'Paid'
          ? 'paid'
          : status === 'Partial'
          ? 'partial'
          : 'destructive'

      return (
        <Badge variant={variant} className="capitalize">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'updated_at',
    header: ({ column }) => (
      <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Last Updated
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => formatDate(row.getValue('updated_at')),
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const invoice = row.original
      const [isConfirmOpen, setIsConfirmOpen] = useState(false)
      const [isQuickEditOpen, setIsQuickEditOpen] = useState(false)

      const handlePrint = () => {
        toast.loading("Preparing document...", { id: "print-toast" });

        // Create a temporary container for rendering the printable component
        const container = document.createElement("div");
        container.className = "printable-container" // Add a class for potential styling
        document.body.appendChild(container);
        const root = createRoot(container);
        
        // Define a cleanup function to run after printing
        const cleanup = () => {
          root.unmount();
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
          toast.dismiss("print-toast");
        };

        // This function will be called by PrintableInvoice when it's ready
        const onReady = () => {
          const originalTitle = document.title;
          document.title = `${invoice.party_name} ${invoice.invoice_date}`;
          window.print();
          setTimeout(() => {
            document.title = originalTitle;
            cleanup();
          }, 100);
        };

        // Render the invoice component. It will call onReady when data is fetched.
        root.render(
          <div className="printable-area">
            <PrintableInvoice invoiceId={invoice.id} onReady={onReady} />
          </div>
        );
      }

      const handleShareOnWhatsApp = () => {
        const publicUrl = `${window.location.origin}/invoices/view/${invoice.public_id}`;
        const message = `*Hello ${invoice.party_name}*,\n\nHere is your invoice from *${formatDate(invoice.invoice_date)}*.\n\nYou can view it here: ${publicUrl}\n\nThank you for your business!`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/invoices/${invoice.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View</span>
                </Link>
              </DropdownMenuItem>
              {invoice.is_offline ? (
                <DropdownMenuItem onClick={() => setIsQuickEditOpen(true)}>
                  <FilePenLine className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href={`/invoices/edit/${invoice.id}`}>
                    <FilePenLine className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </Link>
                </DropdownMenuItem>
              )}
              
              {onPaymentAdded && invoice.status !== 'Paid' && (
                <PaymentForm
                  invoiceId={invoice.id}
                  balanceDue={invoice.amount_pending}
                  onPaymentAdded={() => {
                    onPaymentAdded()
                    // @ts-ignore
                    table.options.meta?.fetchData()
                  }}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Add Payment</span>
                  </DropdownMenuItem>
                </PaymentForm>
              )}

              {!invoice.is_offline && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/invoices/view/${invoice.public_id}`} className="flex items-center cursor-pointer" target="_blank" rel="noopener noreferrer">
                      <Eye className="mr-2 h-4 w-4" />
                      <span>View Public Invoice</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareOnWhatsApp}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Share on WhatsApp</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint}>
                    <FileDown className="mr-2 h-4 w-4" />
                    <span>Download PDF</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(invoice.id)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {invoice.is_offline && (
            <QuickEntryDialog
              isOpen={isQuickEditOpen}
              onClose={() => setIsQuickEditOpen(false)}
              onSuccess={() => {
                // @ts-ignore
                table.options.meta?.fetchData()
              }}
              invoiceId={invoice.id}
              editData={{
                party_id: invoice.party_id || 0,
                total_amount: invoice.total_amount,
                invoice_date: invoice.invoice_date,
                amount_received: invoice.amount_received,
              }}
            />
          )}
        </>
      )
    },
  },
] 