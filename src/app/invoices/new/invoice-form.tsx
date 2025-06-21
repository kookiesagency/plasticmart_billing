'use client'

import { useEffect, useState } from 'react'
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
  items: z.array(invoiceItemSchema).min(1, 'Please add at least one item.'),
})

const invoiceSchema = z.object({
  party_id: z.coerce.number().positive('Please select a party.'),
  invoice_date: z.date(),
  bundle_rate: z.coerce.number().min(0),
  bundle_quantity: z.coerce.number().min(0),
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

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name && (name.startsWith('items') || ['bundle_rate', 'bundle_quantity'].includes(name))) {
        const items = value.items || [];
        const subTotal = items.reduce((acc, item) => acc + (item?.quantity || 0) * (item?.rate || 0), 0);
        const totalBundleCharge = (value.bundle_rate || 0) * (value.bundle_quantity || 0);
        const grandTotal = subTotal + totalBundleCharge;

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
  }, [selectedPartyId, partiesData, settings, form])

  const getItemPrice = (itemId: number) => {
    const item = itemsData.find(i => i.id === itemId)
    if (!item) return 0

    if (selectedPartyId) {
      const partyPrice = item.item_party_prices.find(pp => pp.party_id === selectedPartyId)
      if (partyPrice) return partyPrice.price
    }
    return item.default_rate
  }
  
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Party and Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="party_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
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
               <FormField control={form.control} name="invoice_date" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Invoice Date</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                      <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                        {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date('1900-01-01')} initialFocus />
                    </PopoverContent></Popover>
                  <FormMessage /></FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoice Items</CardTitle>
            {fields.length > 0 && (
              <Button size="sm" type="button" onClick={() => setIsAddItemDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add More Items
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg">
                <p className="mb-4 text-muted-foreground">No items have been added yet.</p>
                <Button type="button" onClick={() => setIsAddItemDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-[40px_1fr_80px_80px_120px_120px_50px] gap-4 font-medium mb-2 pb-2 border-b">
                <div>No</div>
                <div>Item</div>
                <div className="text-right">Qty</div>
                <div className="text-right">Unit</div>
                <div className="text-right">Rate</div>
                <div className="text-right">Amount</div>
                <div></div>
              </div>
            )}
            {fields.map((field, index) => {
              const item = itemsData.find(i => i.id === field.item_id)
              return (
                <div key={field.id} className="grid grid-cols-[40px_1fr_80px_80px_120px_120px_50px] gap-4 items-center border-b last:border-b-0 py-2">
                  <div>{index + 1}</div>
                  <div>{item?.name || 'Unknown Item'}</div>
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <Input type="number" {...field} className="text-right" onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                    )}
                  />
                  <div className="text-right text-muted-foreground">{item?.units?.abbreviation || ''}</div>
                  <FormField
                    control={form.control}
                    name={`items.${index}.rate`}
                    render={({ field }) => (
                      <Input type="number" {...field} className="text-right" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    )}
                  />
                  <div className="text-right font-medium">{formatCurrency((form.getValues(`items.${index}.quantity`) || 0) * (form.getValues(`items.${index}.rate`) || 0))}</div>
                  <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <div className="w-full md:w-1/3 space-y-2">
                <div className="flex justify-between">
                  <span>Sub-Total</span>
                  <span>{formatCurrency(subTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <FormLabel>Bundle Rate</FormLabel>
                  <FormField control={form.control} name="bundle_rate" render={({ field }) => (
                    <Input type="number" {...field} className="w-24 text-right" />
                  )} />
                </div>
                <div className="flex justify-between items-center">
                  <FormLabel>Bundle Quantity</FormLabel>
                   <FormField control={form.control} name="bundle_quantity" render={({ field }) => (
                    <Input type="number" {...field} className="w-24 text-right" />
                  )} />
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting 
                ? (invoiceId ? 'Updating...' : 'Creating...') 
                : (invoiceId ? 'Update Invoice' : 'Create Invoice')}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Items to Invoice</DialogTitle>
          </DialogHeader>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search item by name..."
              value={itemSearch}
              onValueChange={setItemSearch}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {itemsData
                .filter(item => {
                  const alreadyAdded = fields.some(field => field.item_id === item.id);
                  const searchMatch = item.name.toLowerCase().includes(itemSearch.toLowerCase());
                  return !alreadyAdded && searchMatch;
                })
                .map(item => {
                  const specialPrice = item.item_party_prices?.find(sp => sp.party_id === selectedPartyId);
                  const rate = specialPrice ? specialPrice.price : item.default_rate;

                  return (
                    <CommandItem key={item.id} onSelect={() => quickAddItem(item.id)} value={item.name}>
                      <div className="flex justify-between w-full">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">{formatCurrency(rate)}</span>
                      </div>
                    </CommandItem>
                  )
                })}
            </CommandList>
          </Command>
          <DialogFooter>
            <Button type="button" onClick={() => setIsAddItemDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  )
} 