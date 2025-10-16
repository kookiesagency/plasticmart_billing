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
import { useTranslations } from 'next-intl'

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
const getPurchasePartySchema = (t: any) => z.object({
  party_code: z.string()
    .min(1, t('partyCodeRequired'))
    .max(10, t('partyCodeMaxLength'))
    .regex(/^[A-Z0-9]+$/, t('partyCodeFormat')),
  name: z.string().min(1, t('nameRequired')).max(255, t('nameMaxLength')),
})

export interface PurchasePartyManagerRef {
  openCreateDialog: () => void
}

const PurchasePartyManager = forwardRef<PurchasePartyManagerRef>((props, ref) => {
  const t = useTranslations('purchaseParties')
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

  const purchasePartySchema = getPurchasePartySchema(t)
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
      toast.error(t('errorFetchingPurchaseParties').replace('{error}', activeRes.error.message ))
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
      toast.error(t('errorFetchingDeletedPurchaseParties').replace('{error}', deletedRes.error.message ))
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
        return toast.error(t('validationCheckFailed').replace('{error}', checkError.message ))
      }

      const duplicate = allParties.find(
        p => p.party_code.toUpperCase() === trimmedValues.party_code && p.id !== editingParty?.id
      )

      if (duplicate) {
        if (duplicate.deleted_at) {
          return toast.error(t('purchasePartyDeletedRestore'))
        } else {
          return toast.error(t('purchasePartyAlreadyExists'))
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
        toast.error(t('failedToSavePurchaseParty').replace('{error}', error.message ))
      } else {
        toast.success(t(editingParty ? 'purchasePartyUpdated' : 'purchasePartyCreated'))
        setIsDialogOpen(false)
        fetchData()
      }
    } catch (error: any) {
      toast.error(t('failedToSavePurchaseParty').replace('{error}', error.message ))
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
      return toast.error(t('failedToCheckItemUsage').replace('{error}', checkError.message ))
    }

    if (count && count > 0) {
      setIsConfirmOpen(false)
      setDeletingPartyId(null)
      return toast.error(t('cannotDeleteInUse').replace('{count}', count .toString()))
    }

    const { error } = await supabase
      .from('purchase_parties')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deletingPartyId)

    if (error) {
      toast.error(t('failedToDeletePurchaseParty').replace('{error}', error.message ))
    } else {
      toast.success(t('purchasePartyDeletedSuccess'))
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
      toast.error(t('failedToPermanentlyDeletePurchaseParty').replace('{error}', error.message ))
    } else {
      toast.success(t('purchasePartyPermanentlyDeletedSuccess'))
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
      toast.error(t('failedToRestorePurchaseParty').replace('{error}', error.message ))
    } else {
      toast.success(t('purchasePartyRestoredSuccess'))
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
      return toast.error(t('failedToCheckItemUsage').replace('{error}', usageError.message ))
    }

    if (usageData && usageData.length > 0) {
      const usageCounts = usageData.reduce((acc, item) => {
        const partyName = (item.purchase_parties as any)?.name || `ID ${item.purchase_party_id}`
        acc[partyName] = (acc[partyName] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const errorMessages = Object.entries(usageCounts)
        .map(([name, count]) => t('isUsedByItems').replace('{name}', name).replace('{count}', count.toString()))
        .join(', ')

      setIsConfirmOpen(false)
      setBulkDeleteIds(null)
      return toast.error(t('cannotDeletePartiesInUse').replace('{details}', errorMessages ))
    }

    const { error } = await supabase
      .from('purchase_parties')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', bulkDeleteIds)

    if (error) {
      toast.error(t('failedToDeletePurchaseParties').replace('{count}', bulkDeleteIds.length.toString()).replace('{error}', error.message))
    } else {
      toast.success(t('purchasePartiesDeletedSuccess').replace('{count}', bulkDeleteIds.length.toString()))
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
      toast.error(t('failedToPermanentlyDeletePurchaseParties').replace('{count}', bulkPermanentlyDeleteIds.length.toString()).replace('{error}', error.message))
    } else {
      toast.success(t('purchasePartiesPermanentlyDeletedSuccess').replace('{count}', bulkPermanentlyDeleteIds.length.toString()))
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
      toast.error(t('failedToRestorePurchaseParties').replace('{count}', bulkRestoreIds.length.toString()).replace('{error}', error.message))
    } else {
      toast.success(t('purchasePartiesRestoredSuccess').replace('{count}', bulkRestoreIds.length.toString()))
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
      accessorKey: 'name',
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('name')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
    },
    {
      accessorKey: 'party_code',
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('partyCode')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.party_code}</span>,
    },
    {
      accessorKey: 'deleted_at',
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('deletedAt')}
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
                <p>{t('restorePurchaseParty')}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => handlePermanentDelete(row.original.id)}>
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('deletePermanently')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )
      }
    },
  ]

  const getDialogInfo = () => {
    let description = t('proceedConfirm')

    if (deletingPartyId) description = t('confirmDeleteDescription')
    if (restoringPartyId) description = t('confirmRestoreDescription')
    if (permanentlyDeletingPartyId) description = t('confirmPermanentDeleteDescription')
    if (bulkDeleteIds) description = t('confirmBulkDeleteDescription').replace('{count}', bulkDeleteIds.length.toString())
    if (bulkRestoreIds) description = t('confirmBulkRestoreDescription').replace('{count}', bulkRestoreIds.length.toString())
    if (bulkPermanentlyDeleteIds) description = t('confirmBulkPermanentDeleteDescription').replace('{count}', bulkPermanentlyDeleteIds.length.toString())

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
          <TabsTrigger value="active">{t('active')}</TabsTrigger>
          <TabsTrigger value="deleted">{t('deleted')}</TabsTrigger>
        </TabsList>
          <TabsContent value="active">
            <DataTable
              columns={columns({ onEdit: openDialog, onDelete: handleDelete, t })}
              data={parties}
              loading={loading}
              onBulkDelete={handleBulkDelete}
              searchPlaceholder={t('searchPurchaseParties')}
            />
          </TabsContent>
          <TabsContent value="deleted">
            <DataTable
              columns={deletedPartyColumns}
              data={deletedParties as any}
              loading={loading}
              filterColumn="party_code"
              filterPlaceholder={t('filterByPartyCode')}
              onBulkRestore={handleBulkRestore}
              onBulkPermanentDelete={handleBulkPermanentDelete}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t(editingParty ? 'editPurchaseParty' : 'createPurchaseParty')}</DialogTitle>
              <DialogDescription>
                {t(editingParty ? 'updateDetails' : 'addNewForSourcing')}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partyName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('partyNamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="party_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partyCode')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('partyCodePlaceholder')}
                          {...field}
                          className="font-mono"
                          onChange={(e) => {
                            // Auto-uppercase as user types
                            const upperValue = e.target.value.toUpperCase()
                            field.onChange(upperValue)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit">{t('savePurchaseParty')}</Button>
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
          title={t('areYouSure')}
          description={getDialogInfo().description}
        />
    </div>
  )
})

PurchasePartyManager.displayName = 'PurchasePartyManager'

export default PurchasePartyManager
