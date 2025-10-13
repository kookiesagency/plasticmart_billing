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
import { Textarea } from '@/components/ui/textarea'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { DataTable } from '@/components/data-table'
import { columns, ItemCategory } from './category-columns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define the schema for the form validation
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
})

export interface CategoryManagerRef {
  openCreateDialog: () => void
}

const CategoryManager = forwardRef<CategoryManagerRef>((props, ref) => {
  const supabase = createClient()
  const [categories, setCategories] = useState<ItemCategory[]>([])
  const [deletedCategories, setDeletedCategories] = useState<ItemCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [restoringCategoryId, setRestoringCategoryId] = useState<number | null>(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[] | null>(null)
  const [permanentlyDeletingCategoryId, setPermanentlyDeletingCategoryId] = useState<number | null>(null)
  const [bulkPermanentlyDeleteIds, setBulkPermanentlyDeleteIds] = useState<number[] | null>(null)
  const [bulkRestoreIds, setBulkRestoreIds] = useState<number[] | null>(null)

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  })

  useEffect(() => {
    fetchData()
  }, [])

  useImperativeHandle(ref, () => ({
    openCreateDialog: () => openDialog()
  }))

  const fetchData = async () => {
    setLoading(true)
    const [activeRes, deletedRes] = await Promise.all([
      supabase.from('item_categories').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('item_categories').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
    ])

    if (activeRes.error) toast.error('Error fetching categories: ' + activeRes.error.message)
    else setCategories(activeRes.data as ItemCategory[])

    if (deletedRes.error) toast.error('Error fetching deleted categories: ' + deletedRes.error.message)
    else setDeletedCategories(deletedRes.data as ItemCategory[])

    setLoading(false)
  }

  const openDialog = (category: ItemCategory | null = null) => {
    setEditingCategory(category)
    if (category) {
      form.reset({ name: category.name, description: category.description || '' })
    } else {
      form.reset({ name: '', description: '' })
    }
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    try {
      // Helper to normalize names (remove spaces, lowercase)
      function normalizeName(name: string) {
        return name.replace(/\s+/g, '').toLowerCase();
      }
      // 1. Check for name collision (normalized)
      const { data: allCategories, error: checkError } = await supabase
        .from('item_categories')
        .select('id, name, deleted_at')

      if (checkError) {
        return toast.error('Validation check failed: ' + checkError.message)
      }

      const normalizedNew = normalizeName(values.name)
      const duplicate = allCategories.find(cat => normalizeName(cat.name) === normalizedNew && cat.id !== editingCategory?.id)
      if (duplicate) {
        if (duplicate.deleted_at) {
          return toast.error('A category with this name is currently deleted. Please restore it from the deleted tab.')
        } else {
          return toast.error('A category with this name already exists.')
        }
      }
      // 2. Proceed with update or insert
      let error
      if (editingCategory) {
        const { error: updateError } = await supabase.from('item_categories').update(values).eq('id', editingCategory.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase.from('item_categories').insert(values)
        error = insertError
      }
      if (error) {
        toast.error('Failed to save category: ' + error.message)
      } else {
        toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully!`)
        setIsDialogOpen(false)
        fetchData()
      }
    } catch (error: any) {
      toast.error('Failed to save category: ' + error.message)
    }
  }

  const handleDelete = (categoryId: number) => {
    setDeletingCategoryId(categoryId)
    setIsConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingCategoryId) return

    const { count, error: checkError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', deletingCategoryId)

    if (checkError) {
      return toast.error('Failed to check item usage: ' + checkError.message)
    }

    if (count && count > 0) {
      setIsConfirmOpen(false)
      setDeletingCategoryId(null)
      return toast.error(`Cannot delete. This category is used by ${count} item(s). Please update those items first.`)
    }

    const { error } = await supabase.from('item_categories').update({ deleted_at: new Date().toISOString() }).eq('id', deletingCategoryId)
    if (error) {
      toast.error('Failed to delete category: ' + error.message)
    } else {
      toast.success('Category deleted successfully!')
      fetchData()
    }
    setDeletingCategoryId(null)
  }

  const handlePermanentDelete = (categoryId: number) => {
    setPermanentlyDeletingCategoryId(categoryId)
    setIsConfirmOpen(true)
  }

  const confirmPermanentDelete = async () => {
    if (!permanentlyDeletingCategoryId) return
    const { error } = await supabase.from('item_categories').delete().eq('id', permanentlyDeletingCategoryId)
    if (error) {
      toast.error('Failed to permanently delete category: ' + error.message)
    } else {
      toast.success('Category permanently deleted successfully!')
      fetchData()
    }
    setPermanentlyDeletingCategoryId(null)
  }

  const handleRestore = (categoryId: number) => {
    setRestoringCategoryId(categoryId)
    setIsConfirmOpen(true)
  }

  const confirmRestore = async () => {
    if (!restoringCategoryId) return
    const { error } = await supabase.from('item_categories').update({ deleted_at: null }).eq('id', restoringCategoryId)
    if (error) {
      toast.error('Failed to restore category: ' + error.message)
    } else {
      toast.success('Category restored successfully!')
      fetchData()
    }
    setRestoringCategoryId(null)
  }

  const handleBulkDelete = (selectedCategories: ItemCategory[]) => {
    setBulkDeleteIds(selectedCategories.map(c => c.id));
    setIsConfirmOpen(true);
  }

  const confirmBulkDelete = async () => {
    if (!bulkDeleteIds) return;

    // Check usage for all categories to be deleted
    const { data: usageData, error: usageError } = await supabase
      .from('items')
      .select('category_id, item_categories ( name )')
      .in('category_id', bulkDeleteIds);

    if (usageError) {
      setIsConfirmOpen(false)
      setBulkDeleteIds(null)
      return toast.error('Failed to check item usage: ' + usageError.message);
    }

    if (usageData && usageData.length > 0) {
      const usageCounts = usageData.reduce((acc, item) => {
        const categoryName = (item.item_categories as any)?.name || `ID ${item.category_id}`;
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const errorMessages = Object.entries(usageCounts)
        .map(([name, count]) => `${name} is used by ${count} item(s)`)
        .join(', ');

      setIsConfirmOpen(false)
      setBulkDeleteIds(null)
      return toast.error(`Cannot delete categories in use: ${errorMessages}.`);
    }

    const { error } = await supabase.from('item_categories').update({ deleted_at: new Date().toISOString() }).in('id', bulkDeleteIds)
    if (error) {
      toast.error(`Failed to delete ${bulkDeleteIds.length} categories: ` + error.message)
    } else {
      toast.success(`${bulkDeleteIds.length} categories deleted successfully!`)
      fetchData()
    }
    setBulkDeleteIds(null);
  }

  const handleBulkPermanentDelete = (selectedCategories: ItemCategory[]) => {
    setBulkPermanentlyDeleteIds(selectedCategories.map(c => c.id))
    setIsConfirmOpen(true)
  }

  const confirmBulkPermanentDelete = async () => {
    if (!bulkPermanentlyDeleteIds) return
    const { error } = await supabase.from('item_categories').delete().in('id', bulkPermanentlyDeleteIds)
    if (error) {
      toast.error(`Failed to permanently delete ${bulkPermanentlyDeleteIds.length} categories: ` + error.message)
    } else {
      toast.success(`${bulkPermanentlyDeleteIds.length} categories permanently deleted successfully!`)
      fetchData()
    }
    setBulkPermanentlyDeleteIds(null)
  }

  const handleBulkRestore = (selectedCategories: ItemCategory[]) => {
    setBulkRestoreIds(selectedCategories.map(c => c.id));
    setIsConfirmOpen(true);
  }

  const confirmBulkRestore = async () => {
    if (!bulkRestoreIds) return;
    const { error } = await supabase.from('item_categories').update({ deleted_at: null }).in('id', bulkRestoreIds)
    if (error) {
      toast.error(`Failed to restore ${bulkRestoreIds.length} categories: ` + error.message)
    } else {
      toast.success(`${bulkRestoreIds.length} categories restored successfully!`)
      fetchData()
    }
    setBulkRestoreIds(null);
  }

  const deletedCategoryColumns: ColumnDef<ItemCategory & { deleted_at: string }>[] = [
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
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description || '-',
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
                <p>Restore Category</p>
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

    if (deletingCategoryId) description = "This will mark the category as deleted. You can restore it within 30 days. This action will fail if the category is currently in use by any items."
    if (restoringCategoryId) description = "This will restore the category and make it active again."
    if (permanentlyDeletingCategoryId) description = "This action is IRREVERSIBLE and will permanently delete the category."
    if (bulkDeleteIds) description = `This will mark ${bulkDeleteIds.length} categories as deleted. You can restore them within 30 days. This action will fail if any of the selected categories are currently in use by items.`
    if (bulkRestoreIds) description = `This will restore ${bulkRestoreIds.length} categories and make them active again.`
    if (bulkPermanentlyDeleteIds) description = `This action is IRREVERSIBLE and will permanently delete ${bulkPermanentlyDeleteIds.length} categories.`

    return { description };
  }

  const handleConfirmation = () => {
    if (deletingCategoryId) confirmDelete()
    else if (restoringCategoryId) confirmRestore()
    else if (permanentlyDeletingCategoryId) confirmPermanentDelete()
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
            columns={columns(openDialog, handleDelete)}
            data={categories}
            loading={loading}
            onBulkDelete={handleBulkDelete}
            searchPlaceholder="Search categories..."
          />
        </TabsContent>
        <TabsContent value="deleted">
          <DataTable
            columns={deletedCategoryColumns}
            data={deletedCategories as any}
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
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update the details of your category.' : 'Add a new category to organize your items.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Plastic Bags" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the category..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Category</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setDeletingCategoryId(null)
          setRestoringCategoryId(null)
          setBulkDeleteIds(null)
          setPermanentlyDeletingCategoryId(null)
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

CategoryManager.displayName = 'CategoryManager'

export default CategoryManager
