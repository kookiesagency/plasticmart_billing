'use client'
import React, { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, FileText, Pencil, Trash, Undo } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
      <div className="flex items-center justify-end gap-2">
        {!isDeleted && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/parties/${party.id}`}><FileText className="h-4 w-4" /></Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Report</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onEdit(party.id)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Party</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsConfirmOpen(true)}>
                  <Trash className="h-4 w-4 text-red-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Party</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
        {isDeleted && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setIsConfirmOpen(true)}>
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Restore Party</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
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