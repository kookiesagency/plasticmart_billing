'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronsUpDown, PlusCircle, ArrowUpDown, FileUp, Undo, Trash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/data-table'
import { columns, Item } from './items-columns'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SetHeader } from '@/components/layout/header-context'
import { ItemImportDialog } from './item-import-dialog'
import { ItemPreviewDialog, ItemToImport } from './item-preview-dialog.tsx'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const partyPriceSchema = z.object({
  party_id: z.coerce.number().positive('Please select a party'),
  price: z.coerce.number().positive('Price must be a positive number'),
})

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  default_rate: z.coerce.number().positive('Rate must be a positive number'),
  purchase_rate: z.coerce.number().optional(),
  unit_id: z.coerce.number({
    required_error: "Unit is required.",
    invalid_type_error: "Unit is required.",
  }).positive('Unit is required.'),
  party_prices: z.array(partyPriceSchema).optional(),
})

type Unit = { id: number; name: string; }
type Party = { id: number; name: string }
type PartyPrice = { item_id: number; party_id: number; price: number }

export default function ItemManager() {
  const supabase = createClient()
  const [items, setItems] = useState<Item[]>([])
  const [deletedItems, setDeletedItems] = useState<Item[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [itemToRestore, setItemToRestore] = useState<number | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[] | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [dataToPreview, setDataToPreview] = useState<ItemToImport[]>([])
  const [itemToPermanentlyDelete, setItemToPermanentlyDelete] = useState<number | null>(null)
  const [bulkPermanentDeleteIds, setBulkPermanentDeleteIds] = useState<number[] | null>(null)
  const [bulkRestoreIds, setBulkRestoreIds] = useState<number[] | null>(null)
  const [partySearch, setPartySearch] = useState('')
  const [isPartySearchOpen, setIsPartySearchOpen] = useState(false)
  const unitTriggerRef = useRef<HTMLButtonElement>(null);
  const partyTriggerRef = useRef<HTMLButtonElement>(null);
  const [unitPopoverWidth, setUnitPopoverWidth] = useState<number | undefined>(undefined);
  const [partyPopoverWidth, setPartyPopoverWidth] = useState<number | undefined>(undefined);

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      default_rate: 0,
      purchase_rate: undefined,
      party_prices: [],
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "party_prices"
  });

  const filteredPartiesForSearch = parties
    .filter(p => !fields.some(f => f.party_id === p.id))
    .filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase()))

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [itemsRes, deletedItemsRes, unitsRes, partiesRes] = await Promise.all([
      supabase.from('items').select('*, units(id, name)').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('items').select('*, units(id, name)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
      supabase.from('units').select('id, name').is('deleted_at', null),
      supabase.from('parties').select('id, name').is('deleted_at', null),
    ])

    if (itemsRes.error) toast.error('Failed to fetch items: ' + itemsRes.error.message)
    else setItems(itemsRes.data as Item[])

    if (deletedItemsRes.error) toast.error('Failed to fetch deleted items: ' + deletedItemsRes.error.message)
    else setDeletedItems(deletedItemsRes.data as Item[])

    if (unitsRes.error) toast.error('Failed to fetch units: ' + unitsRes.error.message)
    else setUnits(unitsRes.data)

    if (partiesRes.error) toast.error('Failed to fetch parties: ' + partiesRes.error.message)
    else setParties(partiesRes.data)
    
    setLoading(false)
  }

  const openDialog = async (item: Item | null = null) => {
    setEditingItem(item)
    if (item) {
      const { data: partyPricesData, error } = await supabase
        .from('item_party_prices')
        .select('*')
        .eq('item_id', item.id)

      if (error) {
        toast.error('Failed to fetch party prices: ' + error.message)
      }
      
      form.reset({
        name: item.name,
        default_rate: item.default_rate,
        purchase_rate: item.purchase_rate ?? undefined,
        unit_id: item.units?.id,
        party_prices: partyPricesData || [],
      })
    } else {
      form.reset({ name: '', default_rate: 0, purchase_rate: undefined, unit_id: undefined, party_prices: [] })
    }
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    const trimmedName = values.name.trim()
    if (!trimmedName) {
      return toast.error('Item name cannot be empty.')
    }

    // Check for duplicate name before inserting or updating
    const { data: existingItem, error: checkError } = await supabase
      .from('items')
      .select('id, name, deleted_at')
      .ilike('name', trimmedName)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found)
      return toast.error('Error checking for duplicate item: ' + checkError.message)
    }

    // If an item with the same name exists AND it's not the item we are currently editing
    if (existingItem && existingItem.id !== editingItem?.id) {
      if (existingItem.deleted_at) {
        return toast.error('An item with this name exists in the "Deleted" tab. Please restore it or use a different name.')
      }
      return toast.error('An item with this name already exists.')
    }

    const { party_prices, ...itemData } = { ...values, name: trimmedName }
    
    let itemId = editingItem?.id

    if (editingItem) {
      const { error } = await supabase.from('items').update(itemData).eq('id', editingItem.id)
      if (error) return toast.error('Failed to update item: ' + error.message)
    } else {
      const { data, error } = await supabase.from('items').insert(itemData).select('id').single()
      if (error) return toast.error('Failed to create item: ' + error.message)
      itemId = data.id
    }
    
    if (!itemId) return toast.error('Could not get item ID.')

    const { error: deleteError } = await supabase.from('item_party_prices').delete().eq('item_id', itemId)
    if (deleteError) return toast.error('Failed to clear old party prices: ' + deleteError.message)

    if (party_prices && party_prices.length > 0) {
      const pricesToInsert = party_prices.map(pp => ({ ...pp, item_id: itemId }))
      const { error: insertPricesError } = await supabase.from('item_party_prices').insert(pricesToInsert)
      if (insertPricesError) return toast.error('Failed to save party prices: ' + insertPricesError.message)
    }

    toast.success(`Item ${editingItem ? 'updated' : 'created'} successfully!`)
    setIsDialogOpen(false)
    fetchData()
  }

  const handlePartySelectForPrice = (partyId: number) => {
    if (fields.some(f => f.party_id === partyId)) {
        return toast.error('This party already has a specific price.')
    }
    append({ party_id: partyId, price: 0 })
    setPartySearch('')
    setIsPartySearchOpen(false)
  }

  const handleDeleteRequest = (itemId: number) => {
    setItemToDelete(itemId)
    setIsConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    const { error } = await supabase.from('items').update({ deleted_at: new Date().toISOString() }).eq('id', itemToDelete)
    if (error) {
      toast.error('Failed to delete item: ' + error.message)
    } else {
      toast.success('Item deleted successfully!')
      fetchData()
    }
    setItemToDelete(null)
  }

  const handleRestoreRequest = (itemId: number) => {
    setItemToRestore(itemId)
    setIsConfirmOpen(true)
  }

  const confirmRestore = async () => {
    if (!itemToRestore) return
    const { error } = await supabase.from('items').update({ deleted_at: null }).eq('id', itemToRestore)
    if (error) {
      toast.error('Failed to restore item: ' + error.message)
    } else {
      toast.success('Item restored successfully!')
      fetchData()
    }
    setItemToRestore(null)
  }

  const handleBulkDelete = (selectedItems: Item[]) => {
    setBulkDeleteIds(selectedItems.map(i => i.id))
    setIsConfirmOpen(true)
  }

  const confirmBulkDelete = async () => {
    if (!bulkDeleteIds || bulkDeleteIds.length === 0) return;
    const { error } = await supabase.from('items').update({ deleted_at: new Date().toISOString() }).in('id', bulkDeleteIds)
    if (error) {
      toast.error(`Failed to delete ${bulkDeleteIds.length} items: ` + error.message)
    } else {
      toast.success(`${bulkDeleteIds.length} items deleted successfully!`)
      fetchData()
    }
    setBulkDeleteIds(null)
  }

  const handlePermanentDeleteRequest = (itemId: number) => {
    setItemToPermanentlyDelete(itemId)
    setIsConfirmOpen(true)
  }

  const confirmPermanentDelete = async () => {
    if (!itemToPermanentlyDelete) return
    
    // With 'ON DELETE SET NULL' on the foreign key, we can delete directly.
    // The database will handle setting invoice_items.item_id to NULL.

    // First, delete related party prices, as they don't have a cascading delete rule.
    const { error: pricesError } = await supabase.from('item_party_prices').delete().eq('item_id', itemToPermanentlyDelete)
    if (pricesError) {
      return toast.error('Failed to delete related party prices: ' + pricesError.message)
    }

    // Finally, delete the item itself
    const { error } = await supabase.from('items').delete().eq('id', itemToPermanentlyDelete)
    if (error) {
      toast.error('Failed to permanently delete item: ' + error.message)
    } else {
      toast.success('Item permanently deleted successfully!')
      fetchData()
    }
    setItemToPermanentlyDelete(null)
  }

  const handleBulkPermanentDelete = (selectedItems: Item[]) => {
    setBulkPermanentDeleteIds(selectedItems.map(i => i.id))
    setIsConfirmOpen(true)
  }

  const confirmBulkPermanentDelete = async () => {
    if (!bulkPermanentDeleteIds || bulkPermanentDeleteIds.length === 0) return

    // With 'ON DELETE SET NULL' on the foreign key, we can delete directly.
    // The database will handle setting invoice_items.item_id to NULL.
    
    // First, delete related party prices
    const { error: pricesError } = await supabase.from('item_party_prices').delete().in('item_id', bulkPermanentDeleteIds)
    if (pricesError) {
      return toast.error('Failed to delete related party prices: ' + pricesError.message)
    }

    const { error } = await supabase.from('items').delete().in('id', bulkPermanentDeleteIds)
    if (error) {
      toast.error(`Failed to permanently delete ${bulkPermanentDeleteIds.length} items: ` + error.message)
    } else {
      toast.success(`${bulkPermanentDeleteIds.length} items permanently deleted successfully!`)
      fetchData()
    }
    setBulkPermanentDeleteIds(null)
  }

  const handleBulkRestore = (selectedItems: Item[]) => {
    setBulkRestoreIds(selectedItems.map(i => i.id))
    setIsConfirmOpen(true)
  }

  const confirmBulkRestore = async () => {
    if (!bulkRestoreIds || bulkRestoreIds.length === 0) return
    const { error } = await supabase.from('items').update({ deleted_at: null }).in('id', bulkRestoreIds)
    if (error) {
      toast.error(`Failed to restore ${bulkRestoreIds.length} items: ` + error.message)
    } else {
      toast.success(`${bulkRestoreIds.length} items restored successfully!`)
      fetchData()
    }
    setBulkRestoreIds(null)
  }

  const handleImport = () => {
    setIsImporting(true)
  }

  const handlePreview = (data: ItemToImport[]) => {
    setDataToPreview(data)
    setIsImporting(false)
    setIsPreviewing(true)
  }

  const handlePreviewSuccess = () => {
    setIsPreviewing(false)
    fetchData()
  }

  const deletedItemColumns: ColumnDef<Item & { deleted_at: string }>[] = [
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
      accessorKey: 'units.name', 
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Unit
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => row.original.units?.name || 'N/A' 
    },
    { 
      accessorKey: 'default_rate', 
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Rate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
    },
    {
      accessorKey: 'purchase_rate',
      header: ({ column }) => (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Purchase Rate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => {
        const amount = row.getValue("purchase_rate")
        if (amount == null || amount === '') return <span className="text-muted-foreground">-</span>;
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(Number(amount))
        return <div className="font-medium">{formatted}</div>
      },
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
              <p>Restore Item</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handlePermanentDeleteRequest(row.original.id)}>
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
        title="Items"
        actions={
          <div className="flex gap-2">
            <Button onClick={handleImport} variant="outline">
              <FileUp className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => openDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        }
      />
      
      <ItemImportDialog
        isOpen={isImporting}
        onOpenChange={setIsImporting}
        onPreview={handlePreview}
        units={units}
      />
      
      {isPreviewing && (
        <ItemPreviewDialog
          isOpen={isPreviewing}
          onOpenChange={setIsPreviewing}
          onSuccess={handlePreviewSuccess}
          units={units}
          initialData={dataToPreview}
        />
      )}
      
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <DataTable
            columns={columns(openDialog, handleDeleteRequest)}
            data={items}
            loading={loading}
            onBulkDelete={handleBulkDelete}
            searchPlaceholder="Search items..."
          />
        </TabsContent>
        <TabsContent value="deleted">
          <DataTable
            columns={deletedItemColumns}
            data={deletedItems as (Item & { deleted_at: string })[]}
            loading={loading}
            onBulkRestore={handleBulkRestore}
            onBulkDelete={handleBulkPermanentDelete}
            searchPlaceholder="Search deleted items..."
            bulkActionLabel="Delete Permanently"
          />
        </TabsContent>
      </Tabs>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Create Item'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Plastic Bottle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="default_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter rate"
                          {...field}
                          onChange={e => {
                            const value = parseFloat(e.target.value)
                            field.onChange(isNaN(value) ? null : value)
                          }}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purchase_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Rate <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min={0} placeholder="e.g. 100" value={field.value ?? ''} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            ref={unitTriggerRef}
                            onClick={() => {
                              if (unitTriggerRef.current) setUnitPopoverWidth(unitTriggerRef.current.offsetWidth);
                            }}
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? units.find(
                                  (unit) => unit.id === field.value
                                )?.name
                              : "Select a unit"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="p-0"
                          align="start"
                          style={unitPopoverWidth ? { width: unitPopoverWidth } : {}}
                        >
                          <Command>
                            <CommandInput placeholder="Search unit..." />
                            <CommandEmpty>No unit found.</CommandEmpty>
                            <CommandGroup>
                              <CommandList>
                                {units.map((unit) => (
                                  <CommandItem
                                    value={`${unit.name}`}
                                    key={unit.id}
                                    onSelect={() => {
                                      form.setValue("unit_id", unit.id)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        unit.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {unit.name}
                                  </CommandItem>
                                ))}
                              </CommandList>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Party-Specific Prices</h4>
                <div className="mt-4">
                  <Popover open={isPartySearchOpen} onOpenChange={setIsPartySearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        ref={partyTriggerRef}
                        onClick={() => {
                          if (partyTriggerRef.current) setPartyPopoverWidth(partyTriggerRef.current.offsetWidth);
                        }}
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between border border-input data-[placeholder]:text-muted-foreground"
                        aria-expanded={isPartySearchOpen}
                        data-placeholder={fields.length === 0 ? true : undefined}
                      >
                        Select party to add price...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-0"
                      align="start"
                      style={partyPopoverWidth ? { width: partyPopoverWidth } : {}}
                    >
                      <Command>
                        <CommandInput 
                          placeholder="Search party..." 
                          value={partySearch}
                          onValueChange={setPartySearch}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && filteredPartiesForSearch.length > 0) {
                              e.preventDefault()
                              handlePartySelectForPrice(filteredPartiesForSearch[0].id)
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>No party found.</CommandEmpty>
                          <CommandGroup>
                            {filteredPartiesForSearch.map((party) => (
                              <CommandItem
                                key={party.id}
                                value={party.name}
                                onSelect={() => handlePartySelectForPrice(party.id)}
                              >
                                {party.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {fields.length > 0 && (
                  <div className="overflow-x-auto rounded-md border mt-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted text-muted-foreground">
                          <th className="text-left px-3 py-2 font-medium text-xs">Party Name</th>
                          <th className="text-left px-3 py-2 font-medium text-xs">Rate</th>
                          <th className="text-center px-3 py-2 font-medium text-xs">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, index) => {
                          const partyName = parties.find(p => p.id === field.party_id)?.name || 'Unknown Party'
                          return (
                            <tr key={field.id} className="border-t">
                              <td className="px-3 py-2 align-middle">
                                <span className="text-xs text-foreground select-none">{partyName}</span>
                              </td>
                              <td className="px-3 py-2 align-middle">
                                <FormField
                                  control={form.control}
                                  name={`party_prices.${index}.price`}
                                  render={({ field: priceField }) => (
                                    <Input
                                      type="number"
                                      {...priceField}
                                      className="w-32"
                                      placeholder="Price"
                                    />
                                  )}
                                />
                              </td>
                              <td className="px-3 py-2 align-middle text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                      <Trash className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remove party price</TooltipContent>
                                </Tooltip>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>Save changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setItemToDelete(null)
          setItemToRestore(null)
          setBulkDeleteIds(null)
          setItemToPermanentlyDelete(null)
          setBulkPermanentDeleteIds(null)
          setBulkRestoreIds(null)
        }}
        onConfirm={() => {
          if (itemToDelete) confirmDelete()
          else if (itemToRestore) confirmRestore()
          else if (bulkDeleteIds) confirmBulkDelete()
          else if (itemToPermanentlyDelete) confirmPermanentDelete()
          else if (bulkPermanentDeleteIds) confirmBulkPermanentDelete()
          else if (bulkRestoreIds) confirmBulkRestore()
          setIsConfirmOpen(false)
        }}
        title="Are you sure?"
        description={
          bulkDeleteIds ? `This action will mark ${bulkDeleteIds.length} items as deleted. You can restore them from the 'Deleted' tab within 30 days.`
          : itemToDelete ? "This action will mark the item as deleted. You can restore it from the 'Deleted' tab within 30 days."
          : itemToRestore ? "This will restore the item and make it active again."
          : bulkRestoreIds ? `This will restore ${bulkRestoreIds.length} items and make them active again.`
          : bulkPermanentDeleteIds ? `This action is IRREVERSIBLE. This will permanently delete ${bulkPermanentDeleteIds.length} items and their associated party prices.`
          : itemToPermanentlyDelete ? "This action is IRREVERSIBLE. This will permanently delete the item and its associated party prices."
          : "Are you sure you want to proceed?"
        }
      />
    </>
  )
} 