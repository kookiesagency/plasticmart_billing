'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'

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
  id: z.number().optional(),
  name: z.string().min(1, { message: "Unit name is required." }),
  abbreviation: z.string().min(1, { message: "Abbreviation is required." }),
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

  const form = useForm<z.infer<typeof unitSchema>>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: '',
      abbreviation: '',
    },
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [activeRes, deletedRes] = await Promise.all([
      supabase.from('units').select('*').is('deleted_at', null).order('name', { ascending: true }),
      supabase.from('units').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
    ])
    
    if (activeRes.error) toast.error('Error fetching units: ' + activeRes.error.message)
    else setUnits(activeRes.data as Unit[])

    if (deletedRes.error) toast.error('Error fetching deleted units: ' + deletedRes.error.message)
    else setDeletedUnits(deletedRes.data as Unit[])
    
    setLoading(false)
  }

  const openDialog = (unit: Unit | null = null) => {
    if (unit) {
      setEditingUnit(unit)
      form.reset({ name: unit.name, abbreviation: unit.abbreviation })
    } else {
      setEditingUnit(null)
      form.reset({ name: '', abbreviation: '' })
    }
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof unitSchema>) => {
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
  }
  
  const handleDelete = (unitId: number) => {
    setDeletingUnitId(unitId)
    setIsConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingUnitId) return
    const { error } = await supabase.from('units').update({ deleted_at: new Date().toISOString() }).eq('id', deletingUnitId)
    if (error) {
      toast.error('Failed to delete unit: ' + error.message)
    } else {
      toast.success('Unit deleted successfully!')
      fetchData()
    }
    setDeletingUnitId(null)
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
    const { error } = await supabase.from('units').update({ deleted_at: new Date().toISOString() }).in('id', bulkDeleteIds)
    if (error) {
      toast.error(`Failed to delete ${bulkDeleteIds.length} units: ` + error.message)
    } else {
      toast.success(`${bulkDeleteIds.length} units deleted successfully!`)
      fetchData()
    }
    setBulkDeleteIds(null);
  }

  const deletedUnitColumns: ColumnDef<Unit & { deleted_at: string }>[] = [
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
      accessorKey: 'abbreviation', 
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Abbreviation
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    { 
      accessorKey: 'deleted_at', 
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Deleted At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }: { row: { original: { deleted_at: string } } }) => new Date(row.original.deleted_at).toLocaleDateString()
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Unit } }) => (
        <div className="text-right">
          <Button variant="outline" size="sm" onClick={() => handleRestore(row.original.id)}>
            Restore
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <Tabs defaultValue="active">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="deleted">Deleted</TabsTrigger>
          </TabsList>
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
            data={deletedUnits as (Unit & { deleted_at: string })[]} 
            loading={loading}
            searchPlaceholder="Search deleted units..." 
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
                      <Input placeholder="e.g. Pieces" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="abbreviation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abbreviation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. PCS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
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
        }}
        onConfirm={() => {
          if (deletingUnitId) { confirmDelete(); setDeletingUnitId(null); }
          else if (restoringUnitId) { confirmRestore(); setRestoringUnitId(null); }
          else if (bulkDeleteIds) { confirmBulkDelete(); setBulkDeleteIds(null); }
          setIsConfirmOpen(false)
        }}
        title="Are you sure?"
        description={
          bulkDeleteIds
            ? `This action cannot be undone. This will mark ${bulkDeleteIds.length} units as deleted.`
            : deletingUnitId
            ? "This action cannot be undone. This will mark the unit as deleted."
            : "This will restore the unit and make it active again."
        }
      />
    </div>
  )
} 