'use client'
import React, { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Pencil, Trash, Undo } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { Party } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface ColumnsProps {
  onEdit: (id: string) => void;
  refetch: () => void;
  isDeleted?: boolean;
}

const ActionsCell = ({ row, onEdit, refetch, isDeleted }: { row: any, onEdit: (id: string) => void, refetch: () => void, isDeleted?: boolean }) => {
  const supabase = createClient()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  
  const party = row.original as Party

  const handleConfirm = async () => {
    const actionPromise = new Promise(async (resolve, reject) => {
      const { error } = isDeleted
        ? await supabase.from('parties').update({ deleted_at: null }).eq('id', party.id)
        : await supabase.from('parties').update({ deleted_at: new Date().toISOString() }).eq('id', party.id);
      
      if (error) {
        reject(error);
      } else {
        resolve(null);
      }
    });

    toast.promise(actionPromise, {
      loading: isDeleted ? 'Restoring party...' : 'Deleting party...',
      success: () => {
        refetch();
        setIsConfirmOpen(false);
        return `Party ${isDeleted ? 'restored' : 'deleted'} successfully.`;
      },
      error: (err) => `Failed to ${isDeleted ? 'restore' : 'delete'} party: ${err.message}`,
    });
  };

  return (
    <>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        title={`Are you sure you want to ${isDeleted ? 'restore' : 'delete'} this party?`}
        description="This action can be modified later."
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {!isDeleted && (
            <>
              <DropdownMenuItem asChild>
                <Link href={`/parties/${party.id}`}>View Report</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(party.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsConfirmOpen(true)} className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
          {isDeleted && (
            <DropdownMenuItem onClick={() => setIsConfirmOpen(true)}>
              <Undo className="mr-2 h-4 w-4" />
              Restore
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export const columns = ({ onEdit, refetch, isDeleted = false }: ColumnsProps): ColumnDef<Party>[] => {
  const baseColumns: ColumnDef<Party>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
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
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'bundle_rate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Bundle Rate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.bundle_rate ?? 'N/A',
    },
    {
      accessorKey: 'contact_details',
      header: 'Contact',
    },
  ];

  if (isDeleted) {
    baseColumns.push({
      accessorKey: 'deleted_at',
      header: 'Deleted At',
      cell: ({ row }) => row.original.deleted_at ? new Date(row.original.deleted_at).toLocaleDateString() : 'N/A',
    });
  }
  
  baseColumns.push({
    id: 'actions',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} refetch={refetch} isDeleted={isDeleted} />,
  });

  return baseColumns;
}; 