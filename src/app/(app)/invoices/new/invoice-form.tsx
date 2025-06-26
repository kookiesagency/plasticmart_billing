'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CalendarIcon, Check, ChevronsUpDown, Trash2, PlusCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

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

const invoiceItemSchema = z.object({
  item_id: z.coerce.number().nullable(),
  quantity: z.coerce.number().min(1),
  rate: z.coerce.number(),
  item_name: z.string(),
  item_unit: z.string(),
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
  
  const { fields, append, remove, update } = useFieldArray({
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
      const [partiesRes, itemsRes, settingsRes] = await Promise.all([
        supabase.from('parties').select('*').is('deleted_at', null),
        supabase.from('items').select('*, units(name), item_party_prices(party_id, price)').is('deleted_at', null),
        supabase.from('app_settings').select('*'),
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
            items: invoiceData.invoice_items,
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
    setItemSearch('')
  }

  const subTotal = form.watch('subTotal') || 0
  const grandTotal = form.watch('grandTotal') || 0

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
        const itemsToInsert = items.map(item => ({ ...item, invoice_id: parseInt(invoiceId, 10) }))
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
        const itemsToInsert = items.map(item => ({ ...item, invoice_id: newInvoice.id }))
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
                        return (
                          <TableRow key={field.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              <FormField
                                control={form.control}
                                name={`items.${index}.item_name`}
                                render={({ field: itemNameField }) => (
                                  <Input {...itemNameField} className="h-9 font-medium"/>
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field: quantityField }) => (
                                  <Input type="number" {...quantityField} className="text-right" onChange={e => quantityField.onChange(parseInt(e.target.value, 10) || 0)} />
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {field.item_unit}
                            </TableCell>
                            <TableCell className="text-right">
                              <FormField
                                control={form.control}
                                name={`items.${index}.rate`}
                                render={({ field: rateField }) => (
                                  <Input type="number" step="0.01" {...rateField} className="text-right" onChange={e => rateField.onChange(parseFloat(e.target.value) || 0)} />
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
                    <div className="flex items-center justify-between">
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
  const addedItemIds = fields.map(f => f.item_id)
  const availableItems = itemsData.filter(i => !addedItemIds.includes(i.id))
  
  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase())
  )
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && filteredItems.length > 0) {
      event.preventDefault();
      quickAddItem(filteredItems[0].id);
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
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <TableRow 
                      key={item.id} 
                      onClick={() => quickAddItem(item.id)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(getItemPrice(item.id))}</TableCell>
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