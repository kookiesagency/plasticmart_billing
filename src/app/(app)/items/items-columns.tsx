'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Pencil, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type Item = {
  id: number
  name: string
  default_rate: number
  created_at: string
  units: {
    id: number
    name: string
  } | null
}

export const columns = (
  openDialog: (item: Item) => void,
  handleDelete: (itemId: number) => void
): ColumnDef<Item>[] => [
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
    accessorKey: 'name',
    header: ({ column }) => (
      <div
        className="flex items-center cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
  },
  {
    accessorKey: 'units.name',
    header: ({ column }) => (
        <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            Unit
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
    ),
    cell: ({ row }) => row.original.units?.name ?? 'N/A',
  },
  {
    accessorKey: 'default_rate',
    header: ({ column }) => (
        <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            Rate
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("default_rate"))
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)
 
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <div
        className="flex items-center cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Created At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Item</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                <Trash className="h-4 w-4 text-red-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Item</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
] 