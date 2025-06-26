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

// Define the schema for the form validation
const unitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

export default function UnitManager() {
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
    
    if (activeRes.error) toast.error('Error fetching units: ' + activeRes.error.message)
    else setUnits(activeRes.data as Unit[])

    if (deletedRes.error) toast.error('Error fetching deleted units: ' + deletedRes.error.message)
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
      // 1. Check for name collision
      let query = supabase
        .from('units')
        .select('id, name, deleted_at')
        .ilike('name', values.name)

      if (editingUnit?.id) {
        query = query.not('id', 'eq', editingUnit.id)
      }
      
      const { data: existing, error: checkError } = await query.maybeSingle()

      if (checkError) {
        return toast.error('Validation check failed: ' + checkError.message)
      }

      if (existing) {
        if (existing.deleted_at) {
          return toast.error('A unit with this name is currently deleted. Please restore it from the deleted tab.')
        } else {
          return toast.error('A unit with this name already exists.')
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
        toast.error('Failed to save unit: ' + error.message)
      } else {
        toast.success(`Unit ${editingUnit ? 'updated' : 'created'} successfully!`)
        setIsDialogOpen(false)
        fetchData()
      }
    } catch (error: any) {
      toast.error('Failed to save unit: ' + error.message)
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
      return toast.error('Failed to check item usage: ' + checkError.message)
    }

    if (count && count > 0) {
      setIsConfirmOpen(false)
      setDeletingUnitId(null)
      return toast.error(`Cannot delete. This unit is used by ${count} item(s). Please update those items first.`)
    }

    const { error } = await supabase.from('units').update({ deleted_at: new Date().toISOString() }).eq('id', deletingUnitId)
    if (error) {
      toast.error('Failed to delete unit: ' + error.message)
    } else {
      toast.success('Unit deleted successfully!')
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
      toast.error('Failed to permanently delete unit: ' + error.message)
    } else {
      toast.success('Unit permanently deleted successfully!')
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
      toast.error('Failed to restore unit: ' + error.message)
    } else {
      toast.success('Unit restored successfully!')
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
      return toast.error('Failed to check item usage: ' + usageError.message);
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
      return toast.error(`Cannot delete units in use: ${errorMessages}.`);
    }

    const { error } = await supabase.from('units').update({ deleted_at: new Date().toISOString() }).in('id', bulkDeleteIds)
    if (error) {
      toast.error(`Failed to delete ${bulkDeleteIds.length} units: ` + error.message)
    } else {
      toast.success(`${bulkDeleteIds.length} units deleted successfully!`)
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
      toast.error(`Failed to permanently delete ${bulkPermanentlyDeleteIds.length} units: ` + error.message)
    } else {
      toast.success(`${bulkPermanentlyDeleteIds.length} units permanently deleted successfully!`)
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
      toast.error(`Failed to restore ${bulkRestoreIds.length} units: ` + error.message)
    } else {
      toast.success(`${bulkRestoreIds.length} units restored successfully!`)
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
                <p>Restore Unit</p>
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
  ];

  const getDialogInfo = () => {
    let description = "Are you sure you want to proceed?";
    
    if (deletingUnitId) description = "This will mark the unit as deleted. You can restore it within 30 days. This action will fail if the unit is currently in use by any items."
    if (restoringUnitId) description = "This will restore the unit and make it active again."
    if (permanentlyDeletingUnitId) description = "This action is IRREVERSIBLE and will permanently delete the unit."
    if (bulkDeleteIds) description = `This will mark ${bulkDeleteIds.length} units as deleted. You can restore them within 30 days. This action will fail if any of the selected units are currently in use by items.`
    if (bulkRestoreIds) description = `This will restore ${bulkRestoreIds.length} units and make them active again.`
    if (bulkPermanentlyDeleteIds) description = `This action is IRREVERSIBLE and will permanently delete ${bulkPermanentlyDeleteIds.length} units.`

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
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="deleted">Deleted</TabsTrigger>
          </TabsList>
          <Button onClick={() => openDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Unit
          </Button>
        </div>
        <TabsContent value="active">
          <DataTable 
            columns={columns(openDialog, handleDelete)} 
            data={units} 
            loading={loading}
            onBulkDelete={handleBulkDelete}
            searchPlaceholder="Search units..." 
          />
        </TabsContent>
        <TabsContent value="deleted">
          <DataTable
            columns={deletedUnitColumns}
            data={deletedUnits as any}
            loading={loading}
            filterColumn="name"
            filterPlaceholder="Filter by name..."
            onBulkRestore={handleBulkRestore}
            onBulkPermanentDelete={handleBulkPermanentDelete}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Edit Unit' : 'Create Unit'}</DialogTitle>
            <DialogDescription>
              {editingUnit ? 'Update the details of your unit.' : 'Add a new unit to your list.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kilogram" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Unit</Button>
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
        title="Are you sure?"
        description={getDialogInfo().description}
      />
    </div>
  )
} 