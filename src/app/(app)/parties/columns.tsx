'use client'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, FileText, Pencil, Trash } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Party } from '@/lib/types'

interface ColumnsProps {
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export const columns = ({ onEdit, onDelete }: ColumnsProps): ColumnDef<Party>[] => [
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
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
    ),
  },
  {
    accessorKey: 'bundle_rate',
    header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Bundle Rate
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
    ),
    cell: ({ row }) => row.original.bundle_rate ?? 'N/A',
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Created On
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
    ),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const party = row.original
      return (
        <div className="flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/parties/${party.id}`}>
                  <FileText className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Report</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(party.id)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Party</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onDelete(party.id)
                  table.resetRowSelection()
                }}
              >
                <Trash className="h-4 w-4 text-red-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Party</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
]