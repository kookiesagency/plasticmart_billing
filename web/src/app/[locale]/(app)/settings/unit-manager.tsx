'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, RotateCw, Undo, PlusCircle, Trash } from 'lucide-react'
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
import { columns, Unit } from './unit-columns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Schema will be created with translations inside the component

export default function UnitManager() {
  const t = useTranslations('settings')
  const supabase = createClient()
  const [units, setUnits] = useState<Unit[]>([])
  const [deletedUnits, setDeletedUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deletingUnitId, setDeletingUnitId] = useState<number | null>(null)
  const [restoringUnitId, setRestoringUnitId] = useState<number | null>(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[] | null>(null)
  const [permanentlyDeletingUnitId, setPermanentlyDeletingUnitId] = useState<number | null>(null)
  const [bulkPermanentlyDeleteIds, setBulkPermanentlyDeleteIds] = useState<number[] | null>(null)
  const [bulkRestoreIds, setBulkRestoreIds] = useState<number[] | null>(null)

  const unitSchema = z.object({
    name: z.string().min(1, t('nameRequired')),
  })

  const form = useForm<z.infer<typeof unitSchema>>({
    resolver: zodResolver(unitSchema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [activeRes, deletedRes] = await Promise.all([
      supabase.from('units').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('units').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
    ])

    if (activeRes.error) toast.error(t('errorFetchingUnits') + activeRes.error.message)
    else setUnits(activeRes.data as Unit[])

    if (deletedRes.error) toast.error(t('errorFetchingDeletedUnits') + deletedRes.error.message)
    else setDeletedUnits(deletedRes.data as Unit[])

    setLoading(false)
  }

  const openDialog = (unit: Unit | null = null) => {
    setEditingUnit(unit)
    if (unit) {
      form.reset({ name: unit.name })
    } else {
      form.reset({ name: '' })
    }
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof unitSchema>) => {
    try {
      // Helper to normalize names (remove spaces, lowercase)
      function normalizeName(name: string) {
        return name.replace(/\s+/g, '').toLowerCase();
      }
      // 1. Check for name collision (normalized)
      const { data: allUnits, error: checkError } = await supabase
        .from('units')
        .select('id, name, deleted_at')

      if (checkError) {
        return toast.error(t('validationCheckFailed') + checkError.message)
      }

      const normalizedNew = normalizeName(values.name)
      const duplicate = allUnits.find(unit => normalizeName(unit.name) === normalizedNew && unit.id !== editingUnit?.id)
      if (duplicate) {
        if (duplicate.deleted_at) {
          return toast.error(t('unitDeletedRestore'))
        } else {
          return toast.error(t('unitAlreadyExists'))
        }
      }
      // 2. Proceed with update or insert
      let error
      if (editingUnit) {
        const { error: updateError } = await supabase.from('units').update(values).eq('id', editingUnit.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase.from('units').insert(values)
        error = insertError
      }
      if (error) {
        toast.error(t('failedToSaveUnit') + error.message)
      } else {
        toast.success(editingUnit ? t('unitUpdatedSuccess') : t('unitCreatedSuccess'))
        setIsDialogOpen(false)
        fetchData()
      }
    } catch (error: any) {
      toast.error(t('failedToSaveUnit') + error.message)
    }
  }
  
  const handleDelete = (unitId: number) => {
    setDeletingUnitId(unitId)
    setIsConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingUnitId) return

    const { count, error: checkError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('unit_id', deletingUnitId)

    if (checkError) {
      return toast.error(t('failedToCheckItemUsage') + checkError.message)
    }

    if (count && count > 0) {
      setIsConfirmOpen(false)
      setDeletingUnitId(null)
      return toast.error(t('cannotDeleteUnitInUse', { count: count.toString()}))
    }

    const { error } = await supabase.from('units').update({ deleted_at: new Date().toISOString() }).eq('id', deletingUnitId)
    if (error) {
      toast.error(t('failedToDeleteUnit') + error.message)
    } else {
      toast.success(t('unitDeletedSuccess'))
      fetchData()
    }
    setDeletingUnitId(null)
  }

  const handlePermanentDelete = (unitId: number) => {
    setPermanentlyDeletingUnitId(unitId)
    setIsConfirmOpen(true)
  }

  const confirmPermanentDelete = async () => {
    if (!permanentlyDeletingUnitId) return
    const { error } = await supabase.from('units').delete().eq('id', permanentlyDeletingUnitId)
    if (error) {
      toast.error(t('failedToPermanentlyDeleteUnit') + error.message)
    } else {
      toast.success(t('unitPermanentlyDeletedSuccess'))
      fetchData()
    }
    setPermanentlyDeletingUnitId(null)
  }

  const handleRestore = (unitId: number) => {
    setRestoringUnitId(unitId)
    setIsConfirmOpen(true)
  }

  const confirmRestore = async () => {
    if (!restoringUnitId) return
    const { error } = await supabase.from('units').update({ deleted_at: null }).eq('id', restoringUnitId)
    if (error) {
      toast.error(t('failedToRestoreUnit') + error.message)
    } else {
      toast.success(t('unitRestoredSuccess'))
      fetchData()
    }
    setRestoringUnitId(null)
  }

  const handleBulkDelete = (selectedUnits: Unit[]) => {
    setBulkDeleteIds(selectedUnits.map(u => u.id));
    setIsConfirmOpen(true);
  }

  const confirmBulkDelete = async () => {
    if (!bulkDeleteIds) return;

    // Check usage for all units to be deleted
    const { data: usageData, error: usageError } = await supabase
      .from('items')
      .select('unit_id, units ( name )')
      .in('unit_id', bulkDeleteIds);

    if (usageError) {
      setIsConfirmOpen(false)
      setBulkDeleteIds(null)
      return toast.error(t('failedToCheckItemUsage') + usageError.message);
    }

    if (usageData && usageData.length > 0) {
      const usageCounts = usageData.reduce((acc, item) => {
        const unitName = (item.units as any)?.name || `ID ${item.unit_id}`;
        acc[unitName] = (acc[unitName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const errorMessages = Object.entries(usageCounts)
        .map(([name, count]) => `${name} is used by ${count} item(s)`)
        .join(', ');

      setIsConfirmOpen(false)
      setBulkDeleteIds(null)
      return toast.error(t('cannotDeleteUnitsInUse', { details: errorMessages }));
    }

    const { error } = await supabase.from('units').update({ deleted_at: new Date().toISOString() }).in('id', bulkDeleteIds)
    if (error) {
      toast.error(t('failedToDeleteUnits', { count: bulkDeleteIds.length.toString()}) + error.message)
    } else {
      toast.success(t('unitsDeletedSuccess', { count: bulkDeleteIds.length.toString()}))
      fetchData()
    }
    setBulkDeleteIds(null);
  }

  const handleBulkPermanentDelete = (selectedUnits: Unit[]) => {
    setBulkPermanentlyDeleteIds(selectedUnits.map(u => u.id))
    setIsConfirmOpen(true)
  }

  const confirmBulkPermanentDelete = async () => {
    if (!bulkPermanentlyDeleteIds) return
    const { error } = await supabase.from('units').delete().in('id', bulkPermanentlyDeleteIds)
    if (error) {
      toast.error(t('failedToPermanentlyDeleteUnits', { count: bulkPermanentlyDeleteIds.length.toString()}) + error.message)
    } else {
      toast.success(t('unitsPermanentlyDeletedSuccess', { count: bulkPermanentlyDeleteIds.length.toString()}))
      fetchData()
    }
    setBulkPermanentlyDeleteIds(null)
  }

  const handleBulkRestore = (selectedUnits: Unit[]) => {
    setBulkRestoreIds(selectedUnits.map(u => u.id));
    setIsConfirmOpen(true);
  }

  const confirmBulkRestore = async () => {
    if (!bulkRestoreIds) return;
    const { error } = await supabase.from('units').update({ deleted_at: null }).in('id', bulkRestoreIds)
    if (error) {
      toast.error(t('failedToRestoreUnits', { count: bulkRestoreIds.length.toString()}) + error.message)
    } else {
      toast.success(t('unitsRestoredSuccess', { count: bulkRestoreIds.length.toString()}))
      fetchData()
    }
    setBulkRestoreIds(null);
  }

  const deletedUnitColumns: ColumnDef<Unit & { deleted_at: string }>[] = [
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
          {t('unitName')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
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
                <p>{t('restoreUnit')}</p>
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
  ];

  const getDialogInfo = () => {
    let description = "Are you sure you want to proceed?";

    if (deletingUnitId) description = t('confirmDeleteDescription')
    if (restoringUnitId) description = t('confirmRestoreDescription')
    if (permanentlyDeletingUnitId) description = t('confirmPermanentDeleteDescription')
    if (bulkDeleteIds) description = t('confirmBulkDeleteDescription', { count: bulkDeleteIds.length.toString()})
    if (bulkRestoreIds) description = t('confirmBulkRestoreDescription', { count: bulkRestoreIds.length.toString()})
    if (bulkPermanentlyDeleteIds) description = t('confirmBulkPermanentDeleteDescription', { count: bulkPermanentlyDeleteIds.length.toString()})

    return { description };
  }

  const handleConfirmation = () => {
    if (deletingUnitId) confirmDelete()
    else if (restoringUnitId) confirmRestore()
    else if (permanentlyDeletingUnitId) confirmPermanentDelete()
    else if (bulkDeleteIds) confirmBulkDelete()
    else if (bulkRestoreIds) confirmBulkRestore()
    else if (bulkPermanentlyDeleteIds) confirmBulkPermanentDelete()
    setIsConfirmOpen(false)
  }

  return (
    <div>
      <Tabs defaultValue="active">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="active">{t('active')}</TabsTrigger>
            <TabsTrigger value="deleted">{t('deleted')}</TabsTrigger>
          </TabsList>
          <Button onClick={() => openDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('createUnit')}
          </Button>
        </div>
        <TabsContent value="active">
          <DataTable
            columns={columns(openDialog, handleDelete, t)}
            data={units}
            loading={loading}
            onBulkDelete={handleBulkDelete}
            searchPlaceholder={t('searchUnits')}
          />
        </TabsContent>
        <TabsContent value="deleted">
          <DataTable
            columns={deletedUnitColumns}
            data={deletedUnits as any}
            loading={loading}
            filterColumn="name"
            filterPlaceholder={t('filterByName')}
            onBulkRestore={handleBulkRestore}
            onBulkPermanentDelete={handleBulkPermanentDelete}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUnit ? t('editUnit') : t('createUnit')}</DialogTitle>
            <DialogDescription>
              {editingUnit ? t('updateUnitDetails') : t('addNewUnit')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('unitName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('unitNamePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit">{t('saveUnit')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setDeletingUnitId(null)
          setRestoringUnitId(null)
          setBulkDeleteIds(null)
          setPermanentlyDeletingUnitId(null)
          setBulkPermanentlyDeleteIds(null)
          setBulkRestoreIds(null)
        }}
        onConfirm={handleConfirmation}
        title={t('areYouSure')}
        description={getDialogInfo().description}
      />
    </div>
  )
} 