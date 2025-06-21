'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Pencil, Trash } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export type Item = {
  id: number
  name: string
  default_rate: number
  units: {
    id: number
    name: string
    abbreviation: string
  } | null
}

export const columns = (
  openDialog: (item: Item) => void,
  handleDelete: (itemId: number) => void
): ColumnDef<Item>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'default_rate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Default Rate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('default_rate'))
      return <div className="text-left font-medium">{formatCurrency(amount)}</div>
    }
  },
  {
    accessorKey: 'units.abbreviation',
    header: 'Unit',
    cell: ({ row }) => {
        return row.original.units?.abbreviation || 'N/A'
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="text-right space-x-2 flex items-center justify-end">
          <Button variant="outline" size="icon" onClick={() => openDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
] 