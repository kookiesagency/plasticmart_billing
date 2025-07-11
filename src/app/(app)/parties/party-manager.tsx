'use client'

import { useState } from 'react'
import { PlusCircle, ArrowUpDown, Undo, Trash } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useParties from './use-parties'
import { columns as activePartyColumns } from './columns'
import { PartyForm } from './party-form'
import { DataTable } from '@/components/data-table'
import { SetHeader } from '@/components/layout/header-context'
import type { Party } from '@/lib/types'
import { ConfirmationDialog } from '@/components/confirmation-dialog'

export default function PartyManager() {
  const supabase = createClient()
  const [isPartyFormOpen, setPartyFormOpen] = useState(false)
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null)
  const { activeParties, deletedParties, loading, refetch } = useParties()
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [partyToDelete, setPartyToDelete] = useState<string | null>(null)
  const [partyToRestore, setPartyToRestore] = useState<string | null>(null)
  const [partyToPermanentlyDelete, setPartyToPermanentlyDelete] = useState<string | null>(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null)
  const [bulkRestoreIds, setBulkRestoreIds] = useState<string[] | null>(null)
  const [bulkPermanentDeleteIds, setBulkPermanentDeleteIds] = useState<string[] | null>(null)


  const openNewPartyForm = () => {
    setSelectedPartyId(null)
    setPartyFormOpen(true)
  }

  const openEditPartyForm = (id: string) => {
    setSelectedPartyId(id)
    setPartyFormOpen(true)
  }

  const closePartyForm = () => {
    setPartyFormOpen(false)
    setSelectedPartyId(null)
    refetch()
  }
  
  const handlePartySubmit = async (values: { name: string; bundle_rate?: number }, partyId?: string | null) => {
    // 1. Check for name collision
    let query = supabase
      .from('parties')
      .select('id, name, deleted_at')
      .ilike('name', values.name)

    if (partyId) {
      query = query.not('id', 'eq', partyId)
    }

    const { data: existingParty, error: checkError } = await query.maybeSingle()

    if (checkError) {
      return toast.error('Validation check failed: ' + checkError.message)
    }

    if (existingParty) {
      if (existingParty.deleted_at) {
        return toast.error('A party with this name is currently deleted. Please restore it from the deleted tab.')
      } else {
        return toast.error('A party with this name already exists.')
      }
    }

    // 2. Proceed with update or insert
    let error
    if (partyId) {
      const { error: updateError } = await supabase.from('parties').update(values).eq('id', partyId)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('parties').insert(values)
      error = insertError
    }

    if (error) {
      toast.error(`Failed to save party: ${error.message}`)
    } else {
      toast.success(`Party ${partyId ? 'updated' : 'created'} successfully.`)
      closePartyForm()
    }
  }

  const handleDeleteRequest = (id: string) => {
    setPartyToDelete(id)
    setIsConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!partyToDelete) return
    const { error } = await supabase.from('parties').update({ deleted_at: new Date().toISOString() }).eq('id', partyToDelete)
    if (error) {
      toast.error('Failed to delete party: ' + error.message)
    } else {
      toast.success('Party deleted successfully!')
      refetch()
    }
    setPartyToDelete(null)
  }

  const handleBulkDelete = async (selectedParties: Party[]) => {
    setBulkDeleteIds(selectedParties.map((p) => p.id))
    setIsConfirmOpen(true)
  }

  const confirmBulkDelete = async () => {
    if (!bulkDeleteIds || bulkDeleteIds.length === 0) return
    const { error } = await supabase.from('parties').update({ deleted_at: new Date().toISOString() }).in('id', bulkDeleteIds)

    if (error) {
      toast.error(`Failed to delete ${bulkDeleteIds.length} parties.`)
    } else {
      toast.success(`${bulkDeleteIds.length} parties deleted successfully.`)
      refetch()
    }
    setBulkDeleteIds(null)
  }

  const handleRestoreRequest = (id: string) => {
    setPartyToRestore(id)
    setIsConfirmOpen(true)
  }

  const confirmRestore = async () => {
    if (!partyToRestore) return
    const { error } = await supabase.from('parties').update({ deleted_at: null }).eq('id', partyToRestore)
    if (error) {
      toast.error('Failed to restore party: ' + error.message)
    } else {
      toast.success('Party restored successfully!')
      refetch()
    }
    setPartyToRestore(null)
  }

  const handleBulkRestore = (selectedItems: Party[]) => {
    setBulkRestoreIds(selectedItems.map(i => i.id))
    setIsConfirmOpen(true)
  }

  const confirmBulkRestore = async () => {
    if (!bulkRestoreIds || bulkRestoreIds.length === 0) return
    const { error } = await supabase.from('parties').update({ deleted_at: null }).in('id', bulkRestoreIds)
    if (error) {
      toast.error(`Failed to restore ${bulkRestoreIds.length} parties: ` + error.message)
    } else {
      toast.success(`${bulkRestoreIds.length} parties restored successfully!`)
      refetch()
    }
    setBulkRestoreIds(null)
  }

  const handlePermanentDeleteRequest = (id: string) => {
    setPartyToPermanentlyDelete(id)
    setIsConfirmOpen(true)
  }
  
  const confirmPermanentDelete = async () => {
    if (!partyToPermanentlyDelete) return
    
    // First, delete related party prices
    const { error: pricesError } = await supabase.from('item_party_prices').delete().eq('party_id', partyToPermanentlyDelete)
    if (pricesError) {
      return toast.error('Failed to delete related party prices: ' + pricesError.message)
    }

    // Then, delete the party itself
    const { error } = await supabase.from('parties').delete().eq('id', partyToPermanentlyDelete)
    if (error) {
      toast.error('Failed to permanently delete party: ' + error.message)
    } else {
      toast.success('Party permanently deleted successfully!')
      refetch()
    }
    setPartyToPermanentlyDelete(null)
  }
  
  const handleBulkPermanentDelete = (selectedParties: Party[]) => {
    setBulkPermanentDeleteIds(selectedParties.map(p => p.id))
    setIsConfirmOpen(true)
  }

  const confirmBulkPermanentDelete = async () => {
    if (!bulkPermanentDeleteIds || bulkPermanentDeleteIds.length === 0) return
    
    // First, delete related party prices
    const { error: pricesError } = await supabase.from('item_party_prices').delete().in('party_id', bulkPermanentDeleteIds)
    if (pricesError) {
      return toast.error('Failed to delete related party prices: ' + pricesError.message)
    }
    
    // Then, delete the parties themselves
    const { error } = await supabase.from('parties').delete().in('id', bulkPermanentDeleteIds)
    if (error) {
      toast.error(`Failed to permanently delete ${bulkPermanentDeleteIds.length} parties: ` + error.message)
    } else {
      toast.success(`${bulkPermanentDeleteIds.length} parties permanently deleted successfully!`)
      refetch()
    }
    setBulkPermanentDeleteIds(null)
  }

  const deletedPartyColumns: ColumnDef<Party & { deleted_at: string }>[] = [
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
      accessorKey: 'deleted_at', 
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Deleted At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => new Date(row.original.deleted_at).toLocaleDateString()
    },
    {
      id: 'actions',
      cell: ({ row, table }) => (
        <div className="text-right">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => {
                handleRestoreRequest(row.original.id)
                table.resetRowSelection()
              }}>
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Restore Party</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => {
                handlePermanentDeleteRequest(row.original.id)
                table.resetRowSelection()
              }}>
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Permanently</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ]


  return (
    <>
      <SetHeader 
        title="Parties"
        actions={
          <Button onClick={openNewPartyForm}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Party
          </Button>
        }
      />
      <PartyForm
        isOpen={isPartyFormOpen}
        onClose={closePartyForm}
        onSubmit={handlePartySubmit}
        partyId={selectedPartyId}
      />
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <DataTable
            columns={activePartyColumns({ onEdit: openEditPartyForm, onDelete: handleDeleteRequest })}
            data={activeParties}
            loading={loading}
            searchPlaceholder="Search parties..."
            onBulkDelete={handleBulkDelete}
          />
        </TabsContent>
        <TabsContent value="deleted">
          <DataTable
            columns={deletedPartyColumns}
            data={deletedParties as (Party & { deleted_at: string })[]}
            loading={loading}
            searchPlaceholder="Search deleted parties..."
            onBulkRestore={handleBulkRestore}
            onBulkDelete={handleBulkPermanentDelete}
            bulkActionLabel="Delete Permanently"
          />
        </TabsContent>
      </Tabs>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setPartyToDelete(null)
          setPartyToRestore(null)
          setPartyToPermanentlyDelete(null)
          setBulkDeleteIds(null)
          setBulkRestoreIds(null)
          setBulkPermanentDeleteIds(null)
        }}
        onConfirm={() => {
          if (partyToDelete) confirmDelete()
          else if (partyToRestore) confirmRestore()
          else if (bulkDeleteIds) confirmBulkDelete()
          else if (partyToPermanentlyDelete) confirmPermanentDelete()
          else if (bulkPermanentDeleteIds) confirmBulkPermanentDelete()
          else if (bulkRestoreIds) confirmBulkRestore()
          setIsConfirmOpen(false)
        }}
        title="Are you sure?"
        description={
          bulkDeleteIds ? `This action will mark ${bulkDeleteIds.length} parties as deleted. You can restore them within 30 days.`
          : partyToDelete ? "This action will mark the party as deleted. You can restore it within 30 days, after which it may be permanently deleted."
          : partyToRestore ? "This will restore the party and make it active again."
          : bulkRestoreIds ? `This will restore ${bulkRestoreIds.length} parties and make them active again.`
          : bulkPermanentDeleteIds ? `This action is IRREVERSIBLE. This will permanently delete ${bulkPermanentDeleteIds.length} parties and all associated data.`
          : partyToPermanentlyDelete ? "This action is IRREVERSIBLE. This will permanently delete the party and all associated data."
          : "Are you sure you want to proceed?"
        }
      />
    </>
  )
} 