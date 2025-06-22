'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash, FilePenLine, FileDown, MoreHorizontal, Share2, MessageCircle } from 'lucide-react'
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
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { createRoot } from 'react-dom/client'
import { PrintableInvoice } from './printable-invoice'

export type Invoice = {
  id: number
  public_id: string
  invoice_date: string
  party: {
    name: string
  }
  total_amount: number
  amount_received: number
  amount_pending: number
  status: 'Paid' | 'Pending' | 'Partial'
}

export const columns = (
  handleDelete: (id: number) => void
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
    accessorKey: 'id',
    header: 'Invoice ID',
  },
  {
    accessorKey: 'invoice_date',
    header: 'Invoice Date',
  },
  {
    accessorKey: 'party.name',
    header: 'Party',
  },
  {
    accessorKey: 'total_amount',
    header: ({ column }) => {
      return <div className="text-left">Total</div>
    },
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
    header: 'Received',
    cell: ({ row }) => formatCurrency(row.getValue('amount_received')),
  },
  {
    accessorKey: 'amount_pending',
    header: 'Pending',
    cell: ({ row }) => formatCurrency(row.getValue('amount_pending')),
  },
  {
    accessorKey: 'status',
    header: 'Status',
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
    id: 'actions',
    cell: ({ row }) => {
      const invoice = row.original
      const supabase = createClient()

      const deleteInvoice = async () => {
        const { error } = await supabase
          .from("invoices")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", invoice.id)

        if (error) {
          toast.error("Failed to delete invoice.")
        } else {
          toast.success("Invoice deleted successfully!")
          handleDelete(invoice.id)
        }
      }

      const handlePrint = () => {
        toast.loading("Preparing document...", { id: "print-toast" });

        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        
        const cleanup = () => {
          root.unmount();
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
          toast.dismiss("print-toast");
        };

        const onReady = () => {
          window.print();
          cleanup();
        };

        root.render(<PrintableInvoice invoiceId={invoice.id} onReady={onReady} />);
      }

      const handleShareOnWhatsApp = () => {
        const publicUrl = `${window.location.origin}/invoices/view/${invoice.public_id}`;
        const message = `Hello ${invoice.party.name},\n\nHere is your invoice from ${formatDate(invoice.invoice_date)}.\n\nYou can view it here: ${publicUrl}\n\nThank you.`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/invoices/${invoice.id}`} className="flex items-center cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                <span>View</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/invoices/edit/${invoice.id}`} className="flex items-center cursor-pointer">
                <FilePenLine className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/invoices/view/${invoice.public_id}`} className="flex items-center cursor-pointer" target="_blank" rel="noopener noreferrer">
                <Share2 className="mr-2 h-4 w-4" />
                <span>Share</span>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={deleteInvoice}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 