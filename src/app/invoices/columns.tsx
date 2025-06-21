'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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
        <div className="flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/invoices/${invoice.id}`}><Eye className="h-4 w-4" /></Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Invoice</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/invoices/edit/${invoice.id}`}><Pencil className="h-4 w-4" /></Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Invoice</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(invoice.id)}>
                <Trash className="h-4 w-4 text-red-600" />
          </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Invoice</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
] 