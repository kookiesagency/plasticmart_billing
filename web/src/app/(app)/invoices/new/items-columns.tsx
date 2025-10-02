'use client'

import { ColumnDef } from '@tanstack/react-table'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

type Item = {
  id: number
  name: string
  default_rate: number
}

export const itemsColumns = (
  onSelect: (itemId: number) => void
): ColumnDef<Item>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'default_rate',
    header: () => <div className="text-right">Rate</div>,
    cell: ({ row }) => <div className="text-right">{formatCurrency(row.original.default_rate)}</div>,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="text-right">
        <Button size="sm" onClick={() => onSelect(row.original.id)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>
    ),
  },
] 