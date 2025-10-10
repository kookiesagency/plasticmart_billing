'use client'

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Undo, Trash } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { DataTable } from '@/components/data-table'
import { columns, PurchaseParty } from './columns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SetHeader } from '@/components/layout/header-context'

// Define the schema for the form validation
const purchasePartySchema = z.object({
  party_code: z.string()
    .min(1, 'Party code is required')
    .max(10, 'Party code must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Party code must contain only uppercase letters and numbers'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
})

export interface PurchasePartyManagerRef {
  openCreateDialog: () => void
}

const PurchasePartyManager = forwardRef<PurchasePartyManagerRef>((props, ref) => {
  const supabase = createClient()
  const [parties, setParties] = useState<PurchaseParty[]>([])
  const [deletedParties, setDeletedParties] = useState<PurchaseParty[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<PurchaseParty | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deletingPartyId, setDeletingPartyId] = useState<number | null>(null)
  const [restoringPartyId, setRestoringPartyId] = useState<number | null>(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[] | null>(null)
  const [permanentlyDeletingPartyId, setPermanentlyDeletingPartyId] = useState<number | null>(null)
  const [bulkPermanentlyDeleteIds, setBulkPermanentlyDeleteIds] = useState<number[] | null>(null)
  const [bulkRestoreIds, setBulkRestoreIds] = useState<number[] | null>(null)

  const form = useForm<z.infer<typeof purchasePartySchema>>({
    resolver: zodResolver(purchasePartySchema),
    defaultValues: { party_code: '', name: '' },
  })

  useEffect(() => {
    fetchData()
  }, [])

  useImperativeHandle(ref, () => ({
    openCreateDialog: () => openDialog()
  }))

  const fetchData = async () => {
    setLoading(true)

    // Fetch active parties with item count
    const activeQuery = supabase
      .from('purchase_parties')
      .select('*, items(id)', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Fetch deleted parties with item count
    const deletedQuery = supabase
      .from('purchase_parties')
      .select('*, items(id)', { count: 'exact' })
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    const [activeRes, deletedRes] = await Promise.all([activeQuery, deletedQuery])

    if (activeRes.error) {
      toast.error('Error fetching purchase parties: ' + activeRes.error.message)
    } else {
      const partiesWithCount = (activeRes.data || []).map((party: any) => ({
        id: party.id,
        party_code: party.party_code,
        name: party.name,
        created_at: party.created_at,
        item_count: party.items?.length || 0,
      }))
      setParties(partiesWithCount)
    }

    if (deletedRes.error) {
      toast.error('Error fetching deleted purchase parties: ' + deletedRes.error.message)
    } else {
      const partiesWithCount = (deletedRes.data || []).map((party: any) => ({
        id: party.id,
        party_code: party.party_code,
        name: party.name,
        created_at: party.created_at,
        deleted_at: party.deleted_at,
        item_count: party.items?.length || 0,
      }))
      setDeletedParties(partiesWithCount as any)
    }

    setLoading(false)
  }

  const openDialog = (party: PurchaseParty | null = null) => {
    setEditingParty(party)
    if (party) {
      form.reset({ party_code: party.party_code, name: party.name })
    } else {
      form.reset({ party_code: '', name: '' })
    }
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof purchasePartySchema>) => {
    try {
      // The party_code will be auto-uppercased by the database trigger, but we validate uppercase in the form
      const trimmedValues = {
        party_code: values.party_code.trim().toUpperCase(),
        name: values.name.trim(),
      }

      // Check for duplicate party_code (normalized)
      const { data: allParties, error: checkError } = await supabase
        .from('purchase_parties')
        .select('id, party_code, deleted_at')

      if (checkError) {
        return toast.error('Validation check failed: ' + checkError.message)
      }

      const duplicate = allParties.find(
        p => p.party_code.toUpperCase() === trimmedValues.party_code && p.id !== editingParty?.id
      )

      if (duplicate) {
        if (duplicate.deleted_at) {
          return toast.error('A purchase party with this code is currently deleted. Please restore it from the deleted tab.')
        } else {
          return toast.error('A purchase party with this code already exists.')
        }
      }

      // Proceed with update or insert
      let error
      if (editingParty) {
        const { error: updateError } = await supabase
          .from('purchase_parties')
          .update(trimmedValues)
          .eq('id', editingParty.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('purchase_parties')
          .insert(trimmedValues)
        error = insertError
      }

      if (error) {
        toast.error('Failed to save purchase party: ' + error.message)
      } else {
        toast.success(`Purchase party ${editingParty ? 'updated' : 'created'} successfully!`)
        setIsDialogOpen(false)
        fetchData()
      }
    } catch (error: any) {
      toast.error('Failed to save purchase party: ' + error.message)
    }
  }

  const handleDelete = (partyId: number) => {
    setDeletingPartyId(partyId)
    setIsConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingPartyId) return

    const { count, error: checkError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('purchase_party_id', deletingPartyId)

    if (checkError) {
      return toast.error('Failed to check item usage: ' + checkError.message)
    }

    if (count && count > 0) {
      setIsConfirmOpen(false)
      setDeletingPartyId(null)
      return toast.error(`Cannot delete. This purchase party is used by ${count} item(s). Please update those items first.`)
    }

    const { error } = await supabase
      .from('purchase_parties')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deletingPartyId)

    if (error) {
      toast.error('Failed to delete purchase party: ' + error.message)
    } else {
      toast.success('Purchase party deleted successfully!')
      fetchData()
    }
    setDeletingPartyId(null)
  }

  const handlePermanentDelete = (partyId: number) => {
    setPermanentlyDeletingPartyId(partyId)
    setIsConfirmOpen(true)
  }

  const confirmPermanentDelete = async () => {
    if (!permanentlyDeletingPartyId) return
    const { error } = await supabase
      .from('purchase_parties')
      .delete()
      .eq('id', permanentlyDeletingPartyId)

    if (error) {
      toast.error('Failed to permanently delete purchase party: ' + error.message)
    } else {
      toast.success('Purchase party permanently deleted successfully!')
      fetchData()
    }
    setPermanentlyDeletingPartyId(null)
  }

  const handleRestore = (partyId: number) => {
    setRestoringPartyId(partyId)
    setIsConfirmOpen(true)
  }

  const confirmRestore = async () => {
    if (!restoringPartyId) return
    const { error } = await supabase
      .from('purchase_parties')
      .update({ deleted_at: null })
      .eq('id', restoringPartyId)

    if (error) {
      toast.error('Failed to restore purchase party: ' + error.message)
    } else {
      toast.success('Purchase party restored successfully!')
      fetchData()
    }
    setRestoringPartyId(null)
  }

  const handleBulkDelete = (selectedParties: PurchaseParty[]) => {
    setBulkDeleteIds(selectedParties.map(p => p.id))
    setIsConfirmOpen(true)
  }

  const confirmBulkDelete = async () => {
    if (!bulkDeleteIds) return

    // Check usage for all parties to be deleted
    const { data: usageData, error: usageError } = await supabase
      .from('items')
      .select('purchase_party_id, purchase_parties ( party_code, name )')
      .in('purchase_party_id', bulkDeleteIds)

    if (usageError) {
      setIsConfirmOpen(false)
      setBulkDeleteIds(null)
      return toast.error('Failed to check item usage: ' + usageError.message)
    }

    if (usageData && usageData.length > 0) {
      const usageCounts = usageData.reduce((acc, item) => {
        const partyName = (item.purchase_parties as any)?.name || `ID ${item.purchase_party_id}`
        acc[partyName] = (acc[partyName] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const errorMessages = Object.entries(usageCounts)
        .map(([name, count]) => `${name} is used by ${count} item(s)`)
        .join(', ')

      setIsConfirmOpen(false)
      setBulkDeleteIds(null)
      return toast.error(`Cannot delete purchase parties in use: ${errorMessages}.`)
    }

    const { error } = await supabase
      .from('purchase_parties')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', bulkDeleteIds)

    if (error) {
      toast.error(`Failed to delete ${bulkDeleteIds.length} purchase parties: ` + error.message)
    } else {
      toast.success(`${bulkDeleteIds.length} purchase parties deleted successfully!`)
      fetchData()
    }
    setBulkDeleteIds(null)
  }

  const handleBulkPermanentDelete = (selectedParties: PurchaseParty[]) => {
    setBulkPermanentlyDeleteIds(selectedParties.map(p => p.id))
    setIsConfirmOpen(true)
  }

  const confirmBulkPermanentDelete = async () => {
    if (!bulkPermanentlyDeleteIds) return
    const { error } = await supabase
      .from('purchase_parties')
      .delete()
      .in('id', bulkPermanentlyDeleteIds)

    if (error) {
      toast.error(`Failed to permanently delete ${bulkPermanentlyDeleteIds.length} purchase parties: ` + error.message)
    } else {
      toast.success(`${bulkPermanentlyDeleteIds.length} purchase parties permanently deleted successfully!`)
      fetchData()
    }
    setBulkPermanentlyDeleteIds(null)
  }

  const handleBulkRestore = (selectedParties: PurchaseParty[]) => {
    setBulkRestoreIds(selectedParties.map(p => p.id))
    setIsConfirmOpen(true)
  }

  const confirmBulkRestore = async () => {
    if (!bulkRestoreIds) return
    const { error } = await supabase
      .from('purchase_parties')
      .update({ deleted_at: null })
      .in('id', bulkRestoreIds)

    if (error) {
      toast.error(`Failed to restore ${bulkRestoreIds.length} purchase parties: ` + error.message)
    } else {
      toast.success(`${bulkRestoreIds.length} purchase parties restored successfully!`)
      fetchData()
    }
    setBulkRestoreIds(null)
  }

  const deletedPartyColumns: ColumnDef<PurchaseParty & { deleted_at: string }>[] = [
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
      accessorKey: 'party_code',
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Party Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.party_code}</span>,
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
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => handleRestore(row.original.id)}>
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Restore Purchase Party</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => handlePermanentDelete(row.original.id)}>
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Permanently</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )
      }
    },
  ]

  const getDialogInfo = () => {
    let description = "Are you sure you want to proceed?"

    if (deletingPartyId) description = "This will mark the purchase party as deleted. You can restore it within 30 days. This action will fail if the purchase party is currently in use by any items."
    if (restoringPartyId) description = "This will restore the purchase party and make it active again."
    if (permanentlyDeletingPartyId) description = "This action is IRREVERSIBLE and will permanently delete the purchase party."
    if (bulkDeleteIds) description = `This will mark ${bulkDeleteIds.length} purchase parties as deleted. You can restore them within 30 days. This action will fail if any of the selected purchase parties are currently in use by items.`
    if (bulkRestoreIds) description = `This will restore ${bulkRestoreIds.length} purchase parties and make them active again.`
    if (bulkPermanentlyDeleteIds) description = `This action is IRREVERSIBLE and will permanently delete ${bulkPermanentlyDeleteIds.length} purchase parties.`

    return { description }
  }

  const handleConfirmation = () => {
    if (deletingPartyId) confirmDelete()
    else if (restoringPartyId) confirmRestore()
    else if (permanentlyDeletingPartyId) confirmPermanentDelete()
    else if (bulkDeleteIds) confirmBulkDelete()
    else if (bulkRestoreIds) confirmBulkRestore()
    else if (bulkPermanentlyDeleteIds) confirmBulkPermanentDelete()
    setIsConfirmOpen(false)
  }

  return (
    <div>
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>
          <TabsContent value="active">
            <DataTable
              columns={columns({ onEdit: openDialog, onDelete: handleDelete })}
              data={parties}
              loading={loading}
              onBulkDelete={handleBulkDelete}
              searchPlaceholder="Search purchase parties..."
            />
          </TabsContent>
          <TabsContent value="deleted">
            <DataTable
              columns={deletedPartyColumns}
              data={deletedParties as any}
              loading={loading}
              filterColumn="party_code"
              filterPlaceholder="Filter by party code..."
              onBulkRestore={handleBulkRestore}
              onBulkPermanentDelete={handleBulkPermanentDelete}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingParty ? 'Edit Purchase Party' : 'Create Purchase Party'}</DialogTitle>
              <DialogDescription>
                {editingParty ? 'Update the details of your purchase party.' : 'Add a new purchase party for inventory sourcing.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="party_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Party Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., BPN, JY"
                          {...field}
                          className="font-mono"
                          onChange={(e) => {
                            // Auto-uppercase as user types
                            const upperValue = e.target.value.toUpperCase()
                            field.onChange(upperValue)
                          }}
                          disabled={!!editingParty}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Party Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Best Plastics Network" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Purchase Party</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <ConfirmationDialog
          isOpen={isConfirmOpen}
          onClose={() => {
            setIsConfirmOpen(false)
            setDeletingPartyId(null)
            setRestoringPartyId(null)
            setBulkDeleteIds(null)
            setPermanentlyDeletingPartyId(null)
            setBulkPermanentlyDeleteIds(null)
            setBulkRestoreIds(null)
          }}
          onConfirm={handleConfirmation}
          title="Are you sure?"
          description={getDialogInfo().description}
        />
    </div>
  )
})

PurchasePartyManager.displayName = 'PurchasePartyManager'

export default PurchasePartyManager
