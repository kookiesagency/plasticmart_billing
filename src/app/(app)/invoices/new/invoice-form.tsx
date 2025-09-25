'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CalendarIcon, Check, ChevronsUpDown, Trash, PlusCircle, Move } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import React from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency, parseLocalDate, formatLocalDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select'

const invoiceItemSchema = z.object({
  item_id: z.coerce.number().nullable(),
  quantity: z.coerce.number().min(1),
  rate: z.coerce.number(),
  item_name: z.string(),
  item_unit: z.string(),
  position: z.number().optional(),
})

const invoiceSchema = z.object({
  party_id: z.coerce.number().nullable(),
  invoice_date: z.string(),
  bundle_rate: z.coerce.number().min(0),
  bundle_quantity: z.coerce.number().min(0),
  bundle_charge: z.coerce.number().min(0),
  items: z.array(invoiceItemSchema).min(1, 'Please add at least one item.'),
  subTotal: z.number().optional(),
  grandTotal: z.number().optional(),
})

type Party = {
  id: number;
  name: string;
  bundle_rate: number | null;
}
type Item = { id: number; name: string; default_rate: number; units: { name: string; } | null; item_party_prices: { party_id: number; price: number }[] }
type AppSettings = { key: string; value: string }

function SortableRow({ id, index, children }: { id: string, index: number, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
    >
      <TableCell style={{ width: 32, cursor: 'grab' }}>
        <span {...listeners}>
          <Move size={16} className='text-muted-foreground' />
        </span>
      </TableCell>
      <TableCell className="font-medium" style={{ width: 40, paddingLeft: 8, paddingRight: 8 }}>{index + 1}</TableCell>
      {children}
    </tr>
  );
}

export function InvoiceForm({ invoiceId }: { invoiceId?: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [partiesData, setPartiesData] = useState<Party[]>([])
  const [itemsData, setItemsData] = useState<Item[]>([])
  const [settings, setSettings] = useState<AppSettings[]>([])
  const [isPartyPopoverOpen, setIsPartyPopoverOpen] = useState(false)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [itemSearch, setItemSearch] = useState('')
  const [isPartyLocked, setIsPartyLocked] = useState(!!invoiceId)
  const [snapshottedPartyName, setSnapshottedPartyName] = useState<string | null>(null)
  const [unitsData, setUnitsData] = useState<{ id: number; name: string }[]>([])

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_date: formatLocalDate(new Date()),
      bundle_rate: 0,
      bundle_quantity: 1,
      bundle_charge: 0,
      items: [],
      subTotal: 0,
      grandTotal: 0,
    },
  })
  
  const { fields, append, remove, update, move } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const selectedPartyId = form.watch('party_id')

  const getItemPrice = useCallback((itemId: number) => {
    const item = itemsData.find(i => i.id === itemId)
    if (!item) return 0

    if (selectedPartyId) {
      const partyPrice = item.item_party_prices.find(pp => pp.party_id === selectedPartyId)
      if (partyPrice) return partyPrice.price
    }
    return item.default_rate
  }, [itemsData, selectedPartyId])

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name && (name.startsWith('items') || ['bundle_rate', 'bundle_quantity', 'bundle_charge'].includes(name))) {
        const items = value.items || [];
        const subTotal = items.reduce((acc, item) => acc + (item?.quantity || 0) * (item?.rate || 0), 0);
        
        if (name === 'bundle_rate' || name === 'bundle_quantity') {
          const calculatedBundleCharge = (value.bundle_rate || 0) * (value.bundle_quantity || 0);
          form.setValue('bundle_charge', calculatedBundleCharge);
        }

        const grandTotal = Number(subTotal) + Number(value.bundle_charge || 0);

        if (form.getValues('subTotal') !== subTotal) {
          form.setValue('subTotal', subTotal, { shouldValidate: true });
        }
        if (form.getValues('grandTotal') !== grandTotal) {
          form.setValue('grandTotal', grandTotal, { shouldValidate: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [partiesRes, itemsRes, settingsRes, unitsRes] = await Promise.all([
        supabase.from('parties').select('*').is('deleted_at', null),
        supabase.from('items').select('*, units(name), item_party_prices(party_id, price)').is('deleted_at', null),
        supabase.from('app_settings').select('*'),
        supabase.from('units').select('id, name').is('deleted_at', null),
      ])
      
      if (partiesRes.data) setPartiesData(partiesRes.data)
      if (itemsRes.data) setItemsData(itemsRes.data)
      if (settingsRes.data) {
        setSettings(settingsRes.data)
        // Set default bundle rate only for new invoices
        if (!invoiceId) {
          const defaultBundleRate = settingsRes.data.find(s => s.key === 'default_bundle_rate')?.value || '0'
          form.setValue('bundle_rate', parseFloat(defaultBundleRate))
        }
      }
      if (unitsRes.data) setUnitsData(unitsRes.data)
      
      if (invoiceId) {
        const { data: invoiceData, error } = await supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('id', invoiceId)
          .single()
        
        if (invoiceData) {
          setSnapshottedPartyName(invoiceData.party_name)
          setIsPartyLocked(true)

          form.reset({
            party_id: invoiceData.party_id,
            invoice_date: invoiceData.invoice_date,
            bundle_rate: invoiceData.bundle_rate,
            bundle_quantity: invoiceData.bundle_quantity,
            bundle_charge: invoiceData.bundle_charge,
            items: (invoiceData.invoice_items || [])
              .sort((a: any, b: any) => {
                const ap = typeof a.position === 'number' ? a.position : Number.MAX_SAFE_INTEGER
                const bp = typeof b.position === 'number' ? b.position : Number.MAX_SAFE_INTEGER
                if (ap !== bp) return ap - bp
                return a.id - b.id
              })
              .map((it: any, idx: number) => ({ ...it, position: typeof it.position === 'number' ? it.position : idx })),
          })
        } else if (error) {
          toast.error('Failed to fetch invoice data: ' + error.message)
        }
      }
    }
    fetchInitialData()
  }, [invoiceId, form, supabase])

  useEffect(() => {
    if (isPartyLocked) return; // Don't run this logic if the party is locked

    const party = partiesData.find(p => p.id === selectedPartyId)
    const defaultBundleRate = settings.find(s => s.key === 'default_bundle_rate')?.value || '0'
    
    const newBundleRate = (party?.bundle_rate && party.bundle_rate > 0)
      ? party.bundle_rate
      : parseFloat(defaultBundleRate)

    form.setValue('bundle_rate', newBundleRate)
    
    const calculatedBundleCharge = newBundleRate * (form.getValues('bundle_quantity') || 0);
    form.setValue('bundle_charge', calculatedBundleCharge);
    
    // Recalculate prices for existing active items when party changes
    const currentItems = form.getValues('items')
    currentItems.forEach((item, index) => {
      // Only update prices for items that still exist in the master list
      if (item.item_id && itemsData.some(i => i.id === item.item_id)) {
        const newPrice = getItemPrice(item.item_id)
        if (item.rate !== newPrice) {
          update(index, { ...item, rate: newPrice })
        }
      }
    })

  }, [selectedPartyId, partiesData, settings, form, update, getItemPrice, isPartyLocked])

  const quickAddItem = (itemId: number) => {
    const item = itemsData.find(i => i.id === itemId)
    if (!item) return
    const price = getItemPrice(itemId)
    append({ 
      item_id: itemId, 
      quantity: 1, 
      rate: price,
      item_name: item.name,
      item_unit: item.units?.name || 'N/A'
    })
  }

  const subTotal = form.watch('subTotal') || 0
  const grandTotal = form.watch('grandTotal') || 0

  // DnD-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const onSubmit = async (values: z.infer<typeof invoiceSchema>) => {
    if (!isPartyLocked && !values.party_id) {
      form.setError('party_id', { message: 'Party is required.' })
      return
    }

    const { items, subTotal, grandTotal, ...invoiceData } = values
    // invoice_date is already a string in YYYY-MM-DD format
    const invoiceDateString = invoiceData.invoice_date;
    
    const party = partiesData.find(p => p.id === values.party_id);
    if (!party && !isPartyLocked) {
        return toast.error("Could not find active party details to save.");
    }
    
    const partyNameToSave = isPartyLocked ? snapshottedPartyName : party?.name;

    if (!partyNameToSave) {
        return toast.error("Could not determine party name to save.");
    }

    const snapshotData = {
      party_name: partyNameToSave,
    }
    
    let error = null
    
    if (invoiceId) {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ ...invoiceData, invoice_date: invoiceDateString, ...snapshotData, total_amount: grandTotal })
        .eq('id', invoiceId)
      
      if (!updateError) {
        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)
        const itemsToInsert = items.map((item, idx) => ({ ...item, position: idx, invoice_id: parseInt(invoiceId, 10) }))
        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert)
        error = itemsError
      } else {
        error = updateError
      }
    } else {
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({ ...invoiceData, invoice_date: invoiceDateString, ...snapshotData, total_amount: grandTotal })
        .select('id')
        .single()
  
      if (!invoiceError && newInvoice) {
        const itemsToInsert = items.map((item, idx) => ({ ...item, position: idx, invoice_id: newInvoice.id }))
        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert)
        error = itemsError
      } else {
        error = invoiceError
      }
    }

    if (error) {
      toast.error('Failed to save invoice: ' + error.message)
    } else {
      toast.success(`Invoice ${invoiceId ? 'updated' : 'created'} successfully!`)
      router.push('/invoices')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-8">

          {/* Left Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Invoice Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Invoice Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="party_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Party / Client</FormLabel>
                      {isPartyLocked && snapshottedPartyName ? (
                        <div className="flex items-center justify-between p-2 border rounded-md h-9">
                          <span className="font-semibold text-sm">{snapshottedPartyName}</span>
                          <Button variant="ghost" size="sm" onClick={() => setIsPartyLocked(false)}>Change</Button>
                        </div>
                      ) : (
                        <Popover open={isPartyPopoverOpen} onOpenChange={setIsPartyPopoverOpen}>
                          <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" aria-expanded={isPartyPopoverOpen} className="w-full justify-between">
                                {field.value
                                  ? (partiesData.find((p) => p.id === field.value)?.name || snapshottedPartyName)
                                  : "Select party"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                            <Command>
                              <CommandInput placeholder="Search party..." />
                              <CommandList>
                                <CommandEmpty>No party found.</CommandEmpty>
                                <CommandGroup>
                                  {partiesData.map((p) => (
                                    <CommandItem value={p.name} key={p.id} onSelect={() => {
                                      form.setValue('party_id', p.id)
                                      setIsPartyPopoverOpen(false)
                                    }}>
                                      <Check className={cn('mr-2 h-4 w-4', p.id === field.value ? 'opacity-100' : 'opacity-0')} />
                                      {p.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoice_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                            {field.value ? format(parseLocalDate(field.value), 'dd/MM/yyyy') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? parseLocalDate(field.value) : undefined}
                            onSelect={date => field.onChange(date ? formatLocalDate(date) : '')}
                            disabled={date => date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Invoice Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Invoice Items</h3>
                <Button type="button" variant="outline" onClick={() => setIsAddItemDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
              <div className="border rounded-md">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={event => {
                    const { active, over } = event
                    if (active.id !== over?.id) {
                      const oldIndex = fields.findIndex(f => f.id === active.id)
                      const newIndex = fields.findIndex(f => f.id === over?.id)
                      move(oldIndex, newIndex)
                    }
                  }}
                >
                  <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead></TableHead>
                          <TableHead style={{ width: 40, paddingLeft: 8, paddingRight: 8 }}>No</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead className="w-[80px] text-left">Qty</TableHead>
                          <TableHead className="w-[60px] text-left">Unit</TableHead>
                          <TableHead className="w-[100px] text-left">Rate</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.length > 0 ? (
                          fields.map((field, index) => (
                            <SortableRow key={field.id} id={field.id} index={index}>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.item_name`}
                                  render={({ field: itemField }) => (
                                    <FormControl>
                                      <Input {...itemField} />
                                    </FormControl>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-left">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field: quantityField }) => (
                                    <Input
                                      type="number"
                                      {...quantityField}
                                      className="text-left"
                                      name={`items.${index}.quantity`}
                                      onChange={e => quantityField.onChange(parseInt(e.target.value, 10) || 0)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const rateInput = document.querySelector(
                                            `input[name='items.${index}.rate']`
                                          ) as HTMLInputElement | null;
                                          if (rateInput) {
                                            rateInput.focus();
                                            rateInput.select();
                                          }
                                        }
                                      }}
                                      onWheel={e => (e.target as HTMLInputElement).blur()}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-left">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.item_unit`}
                                  render={({ field: unitField }) => (
                                    <Select
                                      value={unitField.value}
                                      onValueChange={unitField.onChange}
                                    >
                                      <SelectTrigger className="w-full h-9 text-left">
                                        <SelectValue placeholder="Select unit" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {unitsData.map(unit => (
                                          <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-left">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.rate`}
                                  render={({ field: rateField }) => (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...rateField}
                                      className="text-left"
                                      name={`items.${index}.rate`}
                                      onChange={e => rateField.onChange(parseFloat(e.target.value) || 0)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const nextIndex = index + 1;
                                          const nextQtyInput = document.querySelector(
                                            `input[name='items.${nextIndex}.quantity']`
                                          ) as HTMLInputElement | null;
                                          if (nextQtyInput) {
                                            nextQtyInput.focus();
                                            nextQtyInput.select();
                                          }
                                        }
                                      }}
                                      onWheel={e => (e.target as HTMLInputElement).blur()}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.rate`) || 0))}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                  <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </SortableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center h-48">
                              <p className="mb-4">No items have been added yet.</p>
                              <Button type="button" onClick={() => setIsAddItemDialogOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add First Item
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
          
          {/* Right Column - Sticky */}
          <div className="md:col-span-1">
            <div className="sticky top-20 space-y-8">
              {/* Summary Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Summary</h3>
                <div className="space-y-2 rounded-md border p-4">
                  <div className="flex justify-between">
                    <span>Sub-Total</span>
                    <span>{formatCurrency(subTotal)}</span>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <FormLabel>Bundle Qty</FormLabel>
                      <FormField
                        control={form.control}
                        name="bundle_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} type="number" className="w-24 text-right" placeholder="Qty" onWheel={e => (e.target as HTMLInputElement).blur()} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <FormLabel>Bundle Rate</FormLabel>
                      <FormField
                        control={form.control}
                        name="bundle_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} type="number" className="w-24 text-right" placeholder="Rate" onWheel={e => (e.target as HTMLInputElement).blur()} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <FormLabel>Total Bundle Charge</FormLabel>
                      <FormField
                        control={form.control}
                        name="bundle_charge"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} type="number" className="w-24 text-right font-semibold" placeholder="Total" onWheel={e => (e.target as HTMLInputElement).blur()} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Grand Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full">Save Invoice</Button>
            </div>
          </div>
        </div>
      </form>
      <AddItemDialog 
        isOpen={isAddItemDialogOpen}
        onOpenChange={setIsAddItemDialogOpen}
        itemsData={itemsData}
        quickAddItem={quickAddItem}
        getItemPrice={getItemPrice}
        itemSearch={itemSearch}
        setItemSearch={setItemSearch}
        fields={fields}
      />
    </Form>
  )
}

type AddItemDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  itemsData: Item[];
  quickAddItem: (itemId: number) => void;
  getItemPrice: (itemId: number) => number;
  itemSearch: string;
  setItemSearch: (value: string) => void;
  fields: { item_id: number | null }[];
}

const AddItemDialog = ({ isOpen, onOpenChange, itemsData, quickAddItem, getItemPrice, itemSearch, setItemSearch, fields }: AddItemDialogProps) => {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const addedItemIds = fields.map(f => f.item_id)
  // Sort alphabetically
  const availableItems = [...itemsData]
    .filter(i => !addedItemIds.includes(i.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  // Reset highlight when search changes
  React.useEffect(() => {
    setHighlightedIndex(filteredItems.length > 0 ? 0 : null);
  }, [itemSearch, filteredItems.length]);
  
  React.useEffect(() => {
    // Keep the highlighted row in view when navigating
    if (highlightedIndex === null) return;
    const container = listRef.current;
    if (!container) return;
    const row = container.querySelectorAll('tr')[highlightedIndex] as HTMLElement | undefined;
    if (!row) return;
    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;
    if (rowTop < viewTop) {
      container.scrollTop = rowTop;
    } else if (rowBottom > viewBottom) {
      container.scrollTop = rowBottom - container.clientHeight;
    }
  }, [highlightedIndex]);
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredItems.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex(idx => {
        if (idx === null) return 0;
        return Math.min(idx + 1, filteredItems.length - 1);
      });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(idx => {
        if (idx === null) return filteredItems.length - 1;
        return Math.max(idx - 1, 0);
      });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = highlightedIndex ?? 0;
      if (filteredItems[idx]) quickAddItem(filteredItems[idx].id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
        <DialogTitle>Add Items to Invoice</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Input 
            placeholder="Search items and press Enter to add..." 
            value={itemSearch}
            onChange={e => setItemSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div ref={listRef} className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, idx) => (
                    <TableRow 
                      key={item.id} 
                      onClick={() => quickAddItem(item.id)}
                      className={`cursor-pointer hover:bg-muted/50 ${highlightedIndex === idx ? 'bg-primary/10' : ''}`}
                    >
                      <TableCell className="whitespace-normal">{item.name}</TableCell>
                      <TableCell className="text-right whitespace-normal">{formatCurrency(getItemPrice(item.id))}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">No items found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}