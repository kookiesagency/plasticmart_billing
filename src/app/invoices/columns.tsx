'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export type Invoice = {
  id: string
  invoice_date: string
  party: { name: string } | null
  invoice_items: { quantity: number; rate: number }[]
  bundle_rate: number
  bundle_quantity: number
}

const calculateTotal = (invoice: Invoice) => {
    const itemsTotal = invoice.invoice_items.reduce((acc, item) => acc + item.quantity * item.rate, 0)
    const bundleCharge = (invoice.bundle_rate || 0) * (invoice.bundle_quantity || 0)
    return itemsTotal + bundleCharge
}

export const columns = (
    handleDelete: (invoiceId: string) => void
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
    accessorKey: 'invoice_date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => new Date(row.original.invoice_date).toLocaleDateString()
  },
  {
    accessorKey: 'partyName',
    accessorFn: row => row.party?.name,
    header: 'Party',
    cell: ({ row }) => row.original.party?.name || 'N/A'
  },
  {
    id: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = calculateTotal(row.original)
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const invoice = row.original
      return (
        <div className="text-right space-x-2">
            <Button variant="outline" size="sm" asChild>
                <Link href={`/invoices/${invoice.id}`}>View</Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(invoice.id)}>
                Delete
            </Button>
        </div>
      )
    },
  },
] 