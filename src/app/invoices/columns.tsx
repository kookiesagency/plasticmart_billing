'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
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
import { Badge } from '../../components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/utils'

export type Invoice = {
  id: number
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

      return (
        <div className="text-right space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/invoices/edit/${invoice.id}`}>Edit</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/invoices/${invoice.id}`}>View</Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(invoice.id)}
          >
            Delete
          </Button>
        </div>
      )
    },
  },
] 