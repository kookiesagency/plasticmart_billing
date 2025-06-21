'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export type Invoice = {
  id: string
  invoice_date: string
  party: { name: string } | null
  invoice_items: { quantity: number; rate: number }[]
  bundle_rate: number | null
  bundle_quantity: number | null
  deleted_at?: string | null
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
    header: ({ column }) => (
      <div
        className="flex items-center cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Invoice Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => format(new Date(row.original.invoice_date), 'dd/MM/yyyy'),
  },
  {
    accessorKey: 'party.name',
    header: ({ column }) => (
      <div
        className="flex items-center cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Party
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => row.original.party?.name ?? 'N/A',
  },
  {
    id: 'total_amount',
    header: ({ column }) => (
      <div
        className="flex items-center cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => {
      const invoice = row.original
      const itemsTotal = (invoice.invoice_items || []).reduce(
        (acc, item) => acc + item.quantity * item.rate,
        0
      )
      const bundleTotal =
        (invoice.bundle_rate || 0) * (invoice.bundle_quantity || 0)
      const totalAmount = itemsTotal + bundleTotal
      return (
        <div className="text-left font-medium">
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
          }).format(totalAmount)}
        </div>
      )
    },
    sortingFn: (rowA, rowB, id) => {
        const getAmount = (row: any) => {
            const itemsTotal = (row.original.invoice_items || []).reduce(
                (acc: number, item: { quantity: number; rate: number; }) => acc + item.quantity * item.rate,
                0
            );
            const bundleTotal = (row.original.bundle_rate || 0) * (row.original.bundle_quantity || 0);
            return itemsTotal + bundleTotal;
        }
        return getAmount(rowA) - getAmount(rowB)
    }
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

export const deletedInvoicesColumns = (
  handleRestore: (invoiceId: string) => void
): ColumnDef<Invoice>[] => [
  {
    accessorKey: 'invoice_date',
    header: ({ column }) => (
        <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            Invoice Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
    ),
    cell: ({ row }) => format(new Date(row.original.invoice_date), 'dd/MM/yyyy'),
  },
  {
      accessorKey: "party.name",
      header: ({ column }) => (
          <div
              className="flex items-center cursor-pointer"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
              Party
              <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
      ),
      cell: ({ row }) => row.original.party?.name ?? "N/A",
  },
  {
      id: "total_amount",
      header: ({ column }) => (
          <div
              className="flex items-center cursor-pointer"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
      ),
      cell: ({ row }) => {
          const invoice = row.original
          const itemsTotal = (invoice.invoice_items || []).reduce(
            (acc, item) => acc + item.quantity * item.rate,
            0
          )
          const bundleTotal =
            (invoice.bundle_rate || 0) * (invoice.bundle_quantity || 0)
          const totalAmount = itemsTotal + bundleTotal
          return (
            <div className="text-left font-medium">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(totalAmount)}
            </div>
          )
      },
      sortingFn: (rowA, rowB, id) => {
        const getAmount = (row: any) => {
            const itemsTotal = (row.original.invoice_items || []).reduce(
                (acc: number, item: { quantity: number; rate: number; }) => acc + item.quantity * item.rate,
                0
            );
            const bundleTotal = (row.original.bundle_rate || 0) * (row.original.bundle_quantity || 0);
            return itemsTotal + bundleTotal;
        }
        return getAmount(rowA) - getAmount(rowB)
    }
  },
  {
      accessorKey: "deleted_at",
      header: ({ column }) => (
          <div
              className="flex items-center cursor-pointer"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
              Deleted At
              <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
      ),
      cell: ({ row }) =>
          row.original.deleted_at
              ? format(new Date(row.original.deleted_at), 'dd/MM/yyyy')
              : "N/A",
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const invoice = row.original
      return (
        <div className="text-right">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRestore(invoice.id)}
          >
            Restore
          </Button>
        </div>
      )
    },
  },
] 