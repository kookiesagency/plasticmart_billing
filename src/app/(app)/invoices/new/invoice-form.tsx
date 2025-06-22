'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CalendarIcon, Check, ChevronsUpDown, Trash2, PlusCircle } from 'lucide-react'
import { format } from 'date-fns'

import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const invoiceItemSchema = z.object({
  item_id: z.coerce.number().positive('Please select an item.'),
  quantity: z.coerce.number().min(1),
  rate: z.coerce.number(),
})

const invoiceSubmitSchema = z.object({
  party_id: z.coerce.number().positive('Please select a party.'),
  invoice_date: z.date(),
  bundle_rate: z.coerce.number().min(0),
  bundle_quantity: z.coerce.number().min(0),
  total_bundle_charge: z.coerce.number().min(0),
  items: z.array(invoiceItemSchema).min(1, 'Please add at least one item.'),
})

const invoiceSchema = z.object({
  party_id: z.coerce.number().positive('Please select a party.'),
  invoice_date: z.date(),
  bundle_rate: z.coerce.number().min(0),
  bundle_quantity: z.coerce.number().min(0),
  bundle_charge: z.coerce.number().min(0),
  items: z.array(invoiceItemSchema).min(1, 'Please add at least one item.'),
  subTotal: z.number().optional(),
  grandTotal: z.number().optional(),
})

type Party = { id: number; name: string; bundle_rate: number | null }
type Item = { id: number; name: string; default_rate: number; units: { name: string; abbreviation: string; } | null; item_party_prices: { party_id: number; price: number }[] }
type AppSettings = { key: string; value: string }

export function InvoiceForm({ invoiceId }: { invoiceId?: string }) {
  const supabase = createClient()
  const [partiesData, setPartiesData] = useState<Party[]>([])
  const [itemsData, setItemsData] = useState<Item[]>([])
  const [settings, setSettings] = useState<AppSettings[]>([])
  const [isPartyPopoverOpen, setIsPartyPopoverOpen] = useState(false)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [itemSearch, setItemSearch] = useState('')

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_date: new Date(),
      bundle_rate: 0,
      bundle_quantity: 1,
      bundle_charge: 0,
      items: [],
      subTotal: 0,
      grandTotal: 0,
    },
  })
  
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const selectedPartyId = form.watch('party_id')
  const invoiceItems = form.watch('items')
  const bundleRate = form.watch('bundle_rate')
  const bundleQuantity = form.watch('bundle_quantity')

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

        const grandTotal = subTotal + (value.bundle_charge || 0);

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
      const [partiesRes, itemsRes, settingsRes] = await Promise.all([
        supabase.from('parties').select('*'),
        supabase.from('items').select('*, units(name, abbreviation), item_party_prices(party_id, price)'),
        supabase.from('app_settings').select('*'),
      ])
      
      if (partiesRes.data) setPartiesData(partiesRes.data)
      if (itemsRes.data) setItemsData(itemsRes.data)
      if (settingsRes.data) {
        setSettings(settingsRes.data)
        const defaultBundleRate = settingsRes.data.find(s => s.key === 'default_bundle_rate')?.value || '0'
        form.setValue('bundle_rate', parseFloat(defaultBundleRate))
      }
      
      if (invoiceId) {
        const { data: invoiceData, error } = await supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('id', invoiceId)
          .single()
        
        if (invoiceData) {
          form.reset({
            ...invoiceData,
            invoice_date: new Date(invoiceData.invoice_date),
            items: invoiceData.invoice_items,
          })
        } else if (error) {
          toast.error('Failed to fetch invoice data: ' + error.message)
        }
      }
    }
    fetchInitialData()
  }, [invoiceId])

  useEffect(() => {
    const party = partiesData.find(p => p.id === selectedPartyId)
    if (party && party.bundle_rate !== null) {
      form.setValue('bundle_rate', party.bundle_rate)
    } else {
      const defaultBundleRate = settings.find(s => s.key === 'default_bundle_rate')?.value || '0'
      form.setValue('bundle_rate', parseFloat(defaultBundleRate))
    }
    
    const calculatedBundleCharge = (form.getValues('bundle_rate') || 0) * (form.getValues('bundle_quantity') || 0);
    form.setValue('bundle_charge', calculatedBundleCharge);
    
    // Recalculate prices for existing items when party changes
    const currentItems = form.getValues('items')
    currentItems.forEach((item, index) => {
      const newPrice = getItemPrice(item.item_id)
      if (item.rate !== newPrice) {
        update(index, { ...item, rate: newPrice })
      }
    })

  }, [selectedPartyId, partiesData, settings, form, update, getItemPrice])

  const quickAddItem = (itemId: number) => {
    const price = getItemPrice(itemId)
    append({ item_id: itemId, quantity: 1, rate: price })
    setItemSearch('')
  }

  const subTotal = form.watch('subTotal') || 0
  const grandTotal = form.watch('grandTotal') || 0

  const onSubmit = async (values: z.infer<typeof invoiceSchema>) => {
    const { items, subTotal, grandTotal, ...invoiceData } = values
    
    let error = null
    
    if (invoiceId) {
      // Update existing invoice
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ ...invoiceData, total_amount: grandTotal })
        .eq('id', invoiceId)
      
      if (!updateError) {
        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)
        const itemsToInsert = items.map(item => ({ ...item, invoice_id: invoiceId }))
        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert)
        error = itemsError
      } else {
        error = updateError
      }
    } else {
      // Create new invoice
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({ ...invoiceData, total_amount: grandTotal })
        .select('id')
        .single()
  
      if (!invoiceError && newInvoice) {
        const itemsToInsert = items.map(item => ({ ...item, invoice_id: newInvoice.id }))
        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert)
        error = itemsError
      } else {
        error = invoiceError
      }
    }

    if (error) {
      toast.error(`Failed to ${invoiceId ? 'update' : 'create'} invoice: ` + error.message)
    } else {
      toast.success(`Invoice ${invoiceId ? 'updated' : 'created'} successfully!`)
      if (!invoiceId) form.reset()
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
                      <Popover open={isPartyPopoverOpen} onOpenChange={setIsPartyPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isPartyPopoverOpen}
                            className="w-full justify-between"
                          >
                            {field.value
                              ? partiesData.find((p) => p.id === field.value)?.name
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
                            {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date('1900-01-01')} initialFocus />
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-[80px] text-right">Qty</TableHead>
                      <TableHead className="w-[60px] text-right">Unit</TableHead>
                      <TableHead className="w-[100px] text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length > 0 ? (
                      fields.map((field, index) => {
                        const item = itemsData.find(i => i.id === field.item_id)
                        return (
                          <TableRow key={field.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>{item?.name || 'Unknown Item'}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{item?.name || 'Unknown Item'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="text-right">
                               <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                  <Input type="number" {...field} className="text-right" onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-right">{item?.units?.abbreviation || ''}</TableCell>
                             <TableCell className="text-right">
                               <FormField
                                control={form.control}
                                name={`items.${index}.rate`}
                                render={({ field }) => (
                                  <Input type="number" step="0.01" {...field} className="text-right" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.rate`) || 0))}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-48">
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
                              <Input {...field} type="number" className="w-24 text-right" placeholder="Qty" />
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
                              <Input {...field} type="number" className="w-24 text-right" placeholder="Rate" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                     <div className="flex justify-between items-center">
                      <FormLabel>Total Bundle Charge</FormLabel>
                      <FormField
                        control={form.control}
                        name="bundle_charge"
                        render={({ field }) => (
                          <FormItem>
                             <FormControl>
                              <Input {...field} type="number" className="w-24 text-right font-semibold" placeholder="Total" />
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
        selectedPartyId={selectedPartyId}
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
  fields: { item_id: number }[];
  selectedPartyId?: number;
}

const AddItemDialog = ({ isOpen, onOpenChange, itemsData, quickAddItem, getItemPrice, itemSearch, setItemSearch, fields, selectedPartyId }: AddItemDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Add Items to Invoice</DialogTitle>
      </DialogHeader>
      <Command>
        <CommandInput 
          placeholder="Search for an item to add..."
          value={itemSearch}
          onValueChange={setItemSearch}
        />
        <CommandList>
          <CommandEmpty>No items found.</CommandEmpty>
          <CommandGroup>
            {itemsData.filter(item => !fields.some(f => f.item_id === item.id)).map(item => (
              <CommandItem
                key={item.id}
                onSelect={() => quickAddItem(item.id)}
                className="flex justify-between"
              >
                <span>{item.name} ({item.units?.name})</span>
                <span>{formatCurrency(getItemPrice(item.id))}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
) 