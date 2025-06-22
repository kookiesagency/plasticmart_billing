'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronsUpDown, PlusCircle, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from '@/components/ui/command'
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

const partyPriceSchema = z.object({
  party_id: z.coerce.number(),
  price: z.coerce.number().min(0),
})

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  default_rate: z.coerce.number().min(0, 'Default rate must be a positive number'),
  unit_id: z.coerce.number().positive('Please select a unit'),
  party_prices: z.array(partyPriceSchema).optional(),
})

type Unit = { id: number; name: string; abbreviation: string }
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

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      default_rate: 0,
      party_prices: [],
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "party_prices"
  });

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [itemsRes, deletedItemsRes, unitsRes, partiesRes] = await Promise.all([
      supabase.from('items').select('*, units(id, name, abbreviation)').is('deleted_at', null).order('name'),
      supabase.from('items').select('*, units(id, name, abbreviation)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
      supabase.from('units').select('id, name, abbreviation'),
      supabase.from('parties').select('id, name'),
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
        unit_id: item.units?.id,
        party_prices: partyPricesData || [],
      })
    } else {
      form.reset({ name: '', default_rate: 0, unit_id: undefined, party_prices: [] })
    }
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    if (!editingItem) {
      const { data: existing, error: checkError } = await supabase
        .from('items')
        .select('name')
        .eq('name', values.name)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        return toast.error('Error checking for existing item: ' + checkError.message);
      }
      if (existing) {
        return toast.error('An item with this name already exists.');
      }
    }

    const { party_prices, ...itemData } = values
    
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
    if (!bulkDeleteIds) return
    const { error } = await supabase.from('items').update({ deleted_at: new Date().toISOString() }).in('id', bulkDeleteIds)
    if (error) {
      toast.error(`Failed to delete ${bulkDeleteIds.length} items: ` + error.message)
    } else {
      toast.success(`${bulkDeleteIds.length} items deleted successfully!`)
      fetchData()
    }
    setBulkDeleteIds(null)
  }
  
  const deletedItemColumns: ColumnDef<Item & { deleted_at: string }>[] = [
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
      accessorKey: 'default_rate', 
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Default Rate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    { 
      accessorKey: 'units.abbreviation', 
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Unit
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.units?.abbreviation || 'N/A' 
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
      cell: ({ row }) => new Date(row.original.deleted_at).toLocaleDateString()
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="outline" size="sm" onClick={() => handleRestoreRequest(row.original.id)}>
            Restore
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <SetHeader 
        title="Items"
        actions={
          <Button onClick={() => openDialog()}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Item
          </Button>
        }
      />
      
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
            searchPlaceholder="Search deleted items..."
          />
        </TabsContent>
      </Tabs>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader><DialogTitle>{editingItem ? 'Edit Item' : 'Create Item'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Plastic Chair" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="default_rate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Rate</FormLabel>
                      <FormControl><Input {...field} type="number" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit_id"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Unit</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
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
                                  )?.abbreviation
                                : "Select a unit"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search unit..." />
                            <CommandEmpty>No unit found.</CommandEmpty>
                            <CommandGroup>
                              <CommandList>
                                {units.map((unit) => (
                                  <CommandItem
                                    value={`${unit.name} ${unit.abbreviation}`}
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
                                    {unit.abbreviation}
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
                <h3 className="text-lg font-medium mb-2">Party-Specific Prices</h3>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2 mt-2">
                    <FormField
                      control={form.control}
                      name={`party_prices.${index}.party_id`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? parties.find(
                                        (party) => party.id === field.value
                                      )?.name
                                    : "Select party"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                              <Command>
                                <CommandInput placeholder="Search party..." />
                                <CommandList>
                                  <CommandEmpty>No party found.</CommandEmpty>
                                  <CommandGroup>
                                    {parties.map((party) => (
                                      <CommandItem
                                        value={party.name}
                                        key={party.id}
                                        onSelect={() => {
                                          form.setValue(`party_prices.${index}.party_id`, party.id)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            party.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {party.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`party_prices.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" placeholder="Price" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" onClick={() => remove(index)}>Remove</Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append({ party_id: 0, price: 0 })}
                >
                  Add Party Price
                </Button>
              </div>

              <DialogFooter>
                <Button type="submit">Save changes</Button>
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
        }}
        onConfirm={() => {
          if (itemToDelete) confirmDelete()
          else if (itemToRestore) confirmRestore()
          else if (bulkDeleteIds) confirmBulkDelete()
          setIsConfirmOpen(false)
        }}
        title="Are you sure?"
        description={
          bulkDeleteIds
            ? `This action cannot be undone. This will mark ${bulkDeleteIds.length} items as deleted.`
            : itemToDelete
            ? "This action cannot be undone. This will mark the item as deleted."
            : "This will restore the item and make it active again."
        }
      />
    </>
  )
} 