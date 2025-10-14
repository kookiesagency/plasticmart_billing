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
import { Textarea } from '@/components/ui/textarea'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { DataTable } from '@/components/data-table'
import { columns, ItemCategory } from './category-columns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define the schema for the form validation
const getCategorySchema = (t: any) => z.object({
  name: z.string().min(1, t('nameRequired')).max(100, t('nameMaxLength')),
  description: z.string().optional(),
})

export interface CategoryManagerRef {
  openCreateDialog: () => void
}

const CategoryManager = forwardRef<CategoryManagerRef>((props, ref) => {
  const t = useTranslations('categories')
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

  const categorySchema = getCategorySchema(t)
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

    if (activeRes.error) toast.error(t('errorFetchingCategories', { error: activeRes.error.message }))
    else setCategories(activeRes.data as ItemCategory[])

    if (deletedRes.error) toast.error(t('errorFetchingDeletedCategories', { error: deletedRes.error.message }))
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
        return toast.error(t('validationCheckFailed', { error: checkError.message }))
      }

      const normalizedNew = normalizeName(values.name)
      const duplicate = allCategories.find(cat => normalizeName(cat.name) === normalizedNew && cat.id !== editingCategory?.id)
      if (duplicate) {
        if (duplicate.deleted_at) {
          return toast.error(t('categoryDeletedRestore'))
        } else {
          return toast.error(t('categoryAlreadyExists'))
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
        toast.error(t('failedToSaveCategory', { error: error.message }))
      } else {
        toast.success(t(editingCategory ? 'categoryUpdated' : 'categoryCreated'))
        setIsDialogOpen(false)
        fetchData()
      }
    } catch (error: any) {
      toast.error(t('failedToSaveCategory', { error: error.message }))
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
      return toast.error(t('failedToCheckItemUsage', { error: checkError.message }))
    }

    if (count && count > 0) {
      setIsConfirmOpen(false)
      setDeletingCategoryId(null)
      return toast.error(t('cannotDeleteInUse', { count }))
    }

    const { error } = await supabase.from('item_categories').update({ deleted_at: new Date().toISOString() }).eq('id', deletingCategoryId)
    if (error) {
      toast.error(t('failedToDeleteCategory', { error: error.message }))
    } else {
      toast.success(t('categoryDeletedSuccess'))
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
      toast.error(t('failedToPermanentlyDeleteCategory', { error: error.message }))
    } else {
      toast.success(t('categoryPermanentlyDeletedSuccess'))
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
      toast.error(t('failedToRestoreCategory', { error: error.message }))
    } else {
      toast.success(t('categoryRestoredSuccess'))
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
      return toast.error(t('failedToCheckItemUsage', { error: usageError.message }));
    }

    if (usageData && usageData.length > 0) {
      const usageCounts = usageData.reduce((acc, item) => {
        const categoryName = (item.item_categories as any)?.name || `ID ${item.category_id}`;
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const errorMessages = Object.entries(usageCounts)
        .map(([name, count]) => t('isUsedByItems', { name, count }))
        .join(', ');

      setIsConfirmOpen(false)
      setBulkDeleteIds(null)
      return toast.error(t('cannotDeleteCategoriesInUse', { details: errorMessages }));
    }

    const { error } = await supabase.from('item_categories').update({ deleted_at: new Date().toISOString() }).in('id', bulkDeleteIds)
    if (error) {
      toast.error(t('failedToDeleteCategories', { count: bulkDeleteIds.length, error: error.message }))
    } else {
      toast.success(t('categoriesDeletedSuccess', { count: bulkDeleteIds.length }))
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
      toast.error(t('failedToPermanentlyDeleteCategories', { count: bulkPermanentlyDeleteIds.length, error: error.message }))
    } else {
      toast.success(t('categoriesPermanentlyDeletedSuccess', { count: bulkPermanentlyDeleteIds.length }))
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
      toast.error(t('failedToRestoreCategories', { count: bulkRestoreIds.length, error: error.message }))
    } else {
      toast.success(t('categoriesRestoredSuccess', { count: bulkRestoreIds.length }))
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
          {t('name')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: t('description'),
      cell: ({ row }) => row.original.description || '-',
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
                <p>{t('restoreCategory')}</p>
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
    let description = t('proceedConfirm');

    if (deletingCategoryId) description = t('confirmDeleteDescription')
    if (restoringCategoryId) description = t('confirmRestoreDescription')
    if (permanentlyDeletingCategoryId) description = t('confirmPermanentDeleteDescription')
    if (bulkDeleteIds) description = t('confirmBulkDeleteDescription', { count: bulkDeleteIds.length })
    if (bulkRestoreIds) description = t('confirmBulkRestoreDescription', { count: bulkRestoreIds.length })
    if (bulkPermanentlyDeleteIds) description = t('confirmBulkPermanentDeleteDescription', { count: bulkPermanentlyDeleteIds.length })

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
          <TabsTrigger value="active">{t('active')}</TabsTrigger>
          <TabsTrigger value="deleted">{t('deleted')}</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <DataTable
            columns={columns(openDialog, handleDelete, t)}
            data={categories}
            loading={loading}
            onBulkDelete={handleBulkDelete}
            searchPlaceholder={t('searchCategories')}
          />
        </TabsContent>
        <TabsContent value="deleted">
          <DataTable
            columns={deletedCategoryColumns}
            data={deletedCategories as any}
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
            <DialogTitle>{t(editingCategory ? 'editCategory' : 'createCategory')}</DialogTitle>
            <DialogDescription>
              {t(editingCategory ? 'updateDetails' : 'addNewCategory')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('categoryName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('categoryNamePlaceholder')} {...field} />
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
                    <FormLabel>{t('descriptionOptional')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('descriptionPlaceholder')}
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
                  {t('cancel')}
                </Button>
                <Button type="submit">{t('saveCategory')}</Button>
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
        title={t('areYouSure')}
        description={getDialogInfo().description}
      />
    </div>
  )
})

CategoryManager.displayName = 'CategoryManager'

export default CategoryManager
