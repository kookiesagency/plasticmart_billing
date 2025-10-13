'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CalendarIcon, Check, ChevronsUpDown, Trash, PlusCircle, Move } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency, parseLocalDate, formatLocalDate } from '@/lib/utils'
import { convertRate } from '@/lib/unit-conversions'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  original_rate: z.coerce.number().optional(),
  original_unit: z.string().optional(),
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
  invoice_number: z.string().optional(),
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
  const t = useTranslations('invoices')
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
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    const subscription = form.watch((value, { name }) => {
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
            invoice_number: invoiceData.invoice_number,
            items: (invoiceData.invoice_items || [])
              .sort((a: { position?: number; id: number }, b: { position?: number; id: number }) => {
                const ap = typeof a.position === 'number' ? a.position : Number.MAX_SAFE_INTEGER
                const bp = typeof b.position === 'number' ? b.position : Number.MAX_SAFE_INTEGER
                if (ap !== bp) return ap - bp
                return a.id - b.id
              })
              .map((it: { position?: number; [key: string]: unknown }, idx: number) => ({ ...it, position: typeof it.position === 'number' ? it.position : idx })),
          })
        } else if (error) {
          toast.error(t('failedToFetchInvoice').replace('{error}', error.message))
        }
      }
    }
    fetchInitialData()
  }, [invoiceId, form, supabase])

  // Update items when party changes to reflect new prices
  useEffect(() => {
    // This effect is intentionally separate to handle price updates
    // when the party selection changes, using itemsData for price calculations
  }, [selectedPartyId, itemsData, form, update, getItemPrice, isPartyLocked, partiesData, settings])

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
    const unit = item.units?.name || 'N/A'
    append({
      item_id: itemId,
      quantity: 1,
      rate: price,
      item_name: item.name,
      item_unit: unit,
      original_rate: price,
      original_unit: unit
    })
  }

  const subTotal = form.watch('subTotal') || 0
  const grandTotal = form.watch('grandTotal') || 0

  // DnD-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const onSubmit = async (values: z.infer<typeof invoiceSchema>) => {
    if (isSubmitting) return // Prevent double submission

    if (!isPartyLocked && !values.party_id) {
      form.setError('party_id', { message: t('partyIsRequired') })
      return
    }

    setIsSubmitting(true)

    const { items, subTotal, grandTotal, invoice_number, ...invoiceData } = values
    // invoice_date is already a string in YYYY-MM-DD format
    const invoiceDateString = invoiceData.invoice_date;

    const party = partiesData.find(p => p.id === values.party_id);
    if (!party && !isPartyLocked) {
        return toast.error(t('couldNotFindParty'));
    }

    const partyNameToSave = isPartyLocked ? snapshottedPartyName : party?.name;

    if (!partyNameToSave) {
        return toast.error(t('couldNotDeterminePartyName'));
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
        // Use the atomic function to update invoice items
        // This ensures both delete and insert happen in a transaction
        const itemsToInsert = items.map((item, idx) => ({ ...item, position: idx }))
        const { error: itemsError } = await supabase.rpc('update_invoice_items', {
          p_invoice_id: parseInt(invoiceId, 10),
          p_items: itemsToInsert
        })
        error = itemsError
      } else {
        error = updateError
      }
    } else {
      // For new invoices, let the database generate the invoice_number via SQL function
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
      toast.error(t('failedToSaveInvoice').replace('{error}', error.message))
      setIsSubmitting(false)
    } else {
      toast.success(invoiceId ? t('invoiceUpdatedSuccess') : t('invoiceCreatedSuccess'))
      router.push('/invoices')
      // Don't reset isSubmitting here as we're navigating away
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
              <h3 className="text-lg font-medium">{t('invoiceDetails')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="party_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partyClient')}</FormLabel>
                      {isPartyLocked && snapshottedPartyName ? (
                        <div className="flex items-center justify-between p-2 border rounded-md h-9">
                          <span className="font-semibold text-sm">{snapshottedPartyName}</span>
                          <Button variant="ghost" size="sm" onClick={() => setIsPartyLocked(false)}>{t('change')}</Button>
                        </div>
                      ) : (
                        <Popover open={isPartyPopoverOpen} onOpenChange={setIsPartyPopoverOpen}>
                          <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" aria-expanded={isPartyPopoverOpen} className="w-full justify-between">
                                {field.value
                                  ? (partiesData.find((p) => p.id === field.value)?.name || snapshottedPartyName)
                                  : t('selectParty')}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                            <Command>
                              <CommandInput placeholder={t('searchPartyPlaceholder')} />
                              <CommandList>
                                <CommandEmpty>{t('noPartyFound')}</CommandEmpty>
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
                      <FormLabel>{t('invoiceDate')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                            {field.value ? format(parseLocalDate(field.value), 'dd/MM/yyyy') : <span>{t('pickADate')}</span>}
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
                <h3 className="text-lg font-medium">{t('invoiceItems')}</h3>
                <Button type="button" variant="outline" onClick={() => setIsAddItemDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('addItem')}
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
                          <TableHead style={{ width: 40, paddingLeft: 8, paddingRight: 8 }}>{t('no')}</TableHead>
                          <TableHead>{t('item')}</TableHead>
                          <TableHead className="w-[80px] text-left">{t('qty')}</TableHead>
                          <TableHead className="w-[60px] text-left">{t('unit')}</TableHead>
                          <TableHead className="w-[100px] text-left">{t('rate')}</TableHead>
                          <TableHead className="text-right">{t('amount')}</TableHead>
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
                                  render={({ field: unitField }) => {
                                    const handleUnitChange = (newUnit: string) => {
                                      const item = form.getValues(`items.${index}`)

                                      // Use original rate and unit for conversion, or fallback to current values
                                      const baseRate = item.original_rate ?? item.rate
                                      const baseUnit = item.original_unit ?? unitField.value

                                      // Convert rate from original unit to new unit
                                      const convertedRate = convertRate(baseRate, baseUnit, newUnit)

                                      // Update unit and rate
                                      unitField.onChange(newUnit)
                                      form.setValue(`items.${index}.rate`, convertedRate)
                                    }

                                    return (
                                      <Select
                                        value={unitField.value}
                                        onValueChange={handleUnitChange}
                                      >
                                        <SelectTrigger className="w-full h-9 text-left">
                                          <SelectValue placeholder={t('selectUnit')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {unitsData.map(unit => (
                                            <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )
                                  }}
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
                              <p className="mb-4">{t('noItemsAdded')}</p>
                              <Button type="button" onClick={() => setIsAddItemDialogOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {t('addFirstItem')}
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
                <h3 className="text-lg font-medium">{t('summary')}</h3>
                <div className="space-y-2 rounded-md border p-4">
                  <div className="flex justify-between">
                    <span>{t('subTotal')}</span>
                    <span>{formatCurrency(subTotal)}</span>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <FormLabel>{t('bundleQty')}</FormLabel>
                      <FormField
                        control={form.control}
                        name="bundle_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} type="number" className="w-24 text-right" placeholder={t('qty')} onWheel={e => (e.target as HTMLInputElement).blur()} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <FormLabel>{t('bundleRate')}</FormLabel>
                      <FormField
                        control={form.control}
                        name="bundle_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} type="number" className="w-24 text-right" placeholder={t('rate')} onWheel={e => (e.target as HTMLInputElement).blur()} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <FormLabel>{t('totalBundleCharge')}</FormLabel>
                      <FormField
                        control={form.control}
                        name="bundle_charge"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} type="number" className="w-24 text-right font-semibold" placeholder={t('total')} onWheel={e => (e.target as HTMLInputElement).blur()} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{t('grandTotal')}</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('saving') : t('saveInvoice')}
              </Button>
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
        t={t}
        onItemsRefresh={() => {
          // Refresh items data
          const fetchItems = async () => {
            const { data } = await supabase
              .from('items')
              .select('*, units(name), item_party_prices(party_id, price)')
              .is('deleted_at', null);
            if (data) setItemsData(data);
          };
          fetchItems();
        }}
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
  t: (key: string) => string;
  onItemsRefresh: () => void;
}

const AddItemDialog = ({ isOpen, onOpenChange, itemsData, quickAddItem, getItemPrice, itemSearch, setItemSearch, fields, t, onItemsRefresh }: AddItemDialogProps) => {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [isCreateItemDialogOpen, setIsCreateItemDialogOpen] = useState(false);
  const [itemNameForCreation, setItemNameForCreation] = useState('');
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const addedItemIds = fields.map(f => f.item_id)

  // Filter out already added items from the list
  const availableItems = [...itemsData]
    .filter(i => !addedItemIds.includes(i.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  // Check if search matches an existing item (including already added ones)
  const exactMatch = itemsData.find(item =>
    item.name.toLowerCase() === itemSearch.toLowerCase().trim()
  );

  const isExactMatchAlreadyAdded = exactMatch && addedItemIds.includes(exactMatch.id);

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightedIndex(filteredItems.length > 0 ? 0 : null);
  }, [itemSearch, filteredItems.length]);
  
  useEffect(() => {
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
  
  const handleCreateNewItem = () => {
    setItemNameForCreation(itemSearch.trim());
    setIsCreateItemDialogOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredItems.length === 0) {
      if (event.key === 'Enter' && itemSearch.trim()) {
        event.preventDefault();
        handleCreateNewItem();
      }
      return;
    }

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
      const item = filteredItems[idx];
      if (item) {
        quickAddItem(item.id);
      } else if (exactMatch && !isExactMatchAlreadyAdded) {
        quickAddItem(exactMatch.id);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
        <DialogTitle>{t('addItemsToInvoice')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Input
            placeholder={t('searchItemsPlaceholder')}
            value={itemSearch}
            onChange={e => setItemSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div ref={listRef} className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('item')}</TableHead>
                  <TableHead className="text-right">{t('price')}</TableHead>
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
                    <TableCell colSpan={2} className="text-center">
                      {itemSearch.trim() ? (
                        isExactMatchAlreadyAdded ? (
                          <div className="flex flex-col items-center gap-4 py-6">
                            <p className="text-muted-foreground text-sm">
                              {t('itemAlreadyAdded').replace('{itemName}', itemSearch)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('modifyInTable')}
                            </p>
                          </div>
                        ) : exactMatch ? (
                          <div className="flex flex-col items-center gap-4 py-6">
                            <p className="text-muted-foreground text-sm">{t('itemFound').replace('{itemName}', itemSearch)}</p>
                            <Button
                              variant="default"
                              size="default"
                              onClick={() => quickAddItem(exactMatch.id)}
                              className="min-w-[200px] h-10"
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              {t('addToInvoice').replace('{itemName}', itemSearch)}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-4 py-6">
                            <p className="text-muted-foreground text-sm">{t('noItemsFound').replace('{searchTerm}', itemSearch)}</p>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={handleCreateNewItem}
                              className="min-w-[200px] h-10 bg-slate-900 text-white border-slate-900 hover:bg-slate-800 hover:border-slate-800 hover:text-white"
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              {t('createNewItem').replace('{itemName}', itemSearch)}
                            </Button>
                          </div>
                        )
                      ) : (
                        t('noItemsFoundGeneric')
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
      <CreateItemDialog
        isOpen={isCreateItemDialogOpen}
        onOpenChange={setIsCreateItemDialogOpen}
        onItemCreated={() => {
          onItemsRefresh();
          setIsCreateItemDialogOpen(false);
        }}
        initialName={itemNameForCreation}
        t={t}
      />
    </Dialog>
  )
}

// Full-featured Item Creation Dialog with party-specific prices
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

const CreateItemDialog = ({
  isOpen,
  onOpenChange,
  onItemCreated,
  initialName = '',
  t
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onItemCreated: () => void;
  initialName?: string;
  t: (key: string) => string;
}) => {
  const supabase = createClient();
  const [units, setUnits] = useState<Unit[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [partySearch, setPartySearch] = useState('');
  const [isPartySearchOpen, setIsPartySearchOpen] = useState(false);
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
    if (isOpen) {
      const fetchData = async () => {
        const [unitsRes, partiesRes] = await Promise.all([
          supabase.from('units').select('id, name').is('deleted_at', null),
          supabase.from('parties').select('*').is('deleted_at', null),
        ]);

        if (unitsRes.data) setUnits(unitsRes.data);
        if (partiesRes.data) setParties(partiesRes.data);
      };
      fetchData();

      // Set initial name when dialog opens
      if (initialName) {
        form.setValue('name', initialName);
      }
    }
  }, [isOpen, supabase, initialName, form]);

  // Helper to normalize names (remove spaces, lowercase)
  function normalizeName(name: string) {
    return name.replace(/\s+/g, '').toLowerCase();
  }

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    const trimmedName = values.name.trim()
    if (!trimmedName) {
      return toast.error(t('itemNameCannotBeEmpty'))
    }

    // Fetch all items and check for normalized duplicate
    const { data: allItems, error: checkError } = await supabase
      .from('items')
      .select('id, name, deleted_at')

    if (checkError) {
      return toast.error(t('errorCheckingDuplicate').replace('{error}', checkError.message))
    }

    // Check if an item with the same normalized name exists
    const normalizedNew = normalizeName(trimmedName)
    const duplicate = allItems.find(item => normalizeName(item.name) === normalizedNew)
    if (duplicate) {
      if (duplicate.deleted_at) {
        return toast.error(t('itemExistsInDeleted'))
      }
      return toast.error(t('itemAlreadyExists'))
    }

    const { party_prices, ...itemData } = { ...values, name: trimmedName }

    const { data, error } = await supabase.from('items').insert(itemData).select('id').single()
    if (error) return toast.error(t('failedToCreateItem').replace('{error}', error.message))

    const itemId = data.id

    if (party_prices && party_prices.length > 0) {
      const pricesToInsert = party_prices.map(pp => ({ ...pp, item_id: itemId }))
      const { error: insertPricesError } = await supabase.from('item_party_prices').insert(pricesToInsert)
      if (insertPricesError) return toast.error(t('failedToSavePartyPrices').replace('{error}', insertPricesError.message))
    }

    toast.success(t('itemCreatedSuccess'))
    onItemCreated()
    onOpenChange(false)

    // Reset form
    form.reset()
  }

  const handlePartySelectForPrice = (partyId: number) => {
    if (fields.some(f => f.party_id === partyId)) {
        return toast.error(t('partyAlreadyHasPrice'))
    }
    append({ party_id: partyId, price: 0 })
    setPartySearch('')
    setIsPartySearchOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{t('createItem')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('itemName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('itemNamePlaceholder')} {...field} />
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
                    <FormLabel>{t('rate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('enterRate')}
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
                    <FormLabel>{t('purchaseRate')} <span className="text-muted-foreground font-normal">({t('optional')})</span></FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} placeholder={t('enterPurchaseRate')} value={field.value ?? ''} onChange={field.onChange} />
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
                    <FormLabel>{t('unit')}</FormLabel>
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
                            : t('selectUnit')}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="p-0"
                        align="start"
                        style={unitPopoverWidth ? { width: unitPopoverWidth } : {}}
                      >
                        <Command>
                          <CommandInput placeholder={t('searchUnit')} />
                          <CommandEmpty>{t('noUnitFound')}</CommandEmpty>
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
              <h4 className="text-sm font-medium mb-2">{t('partySpecificPrices')}</h4>
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
                      {t('selectPartyToAdd')}
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
                        placeholder={t('searchPartyPlaceholder')}
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
                        <CommandEmpty>{t('noPartyFound')}</CommandEmpty>
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
                        <th className="text-left px-3 py-2 font-medium text-xs">{t('partyName')}</th>
                        <th className="text-left px-3 py-2 font-medium text-xs">{t('rate')}</th>
                        <th className="text-center px-3 py-2 font-medium text-xs">{t('action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => {
                        const partyName = parties.find(p => p.id === field.party_id)?.name || t('unknownParty')
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
                                    placeholder={t('price')}
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
                                <TooltipContent>{t('removePartyPrice')}</TooltipContent>
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>{t('saveChanges')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};