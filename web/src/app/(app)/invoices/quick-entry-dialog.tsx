'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { cn, formatLocalDate, parseLocalDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'

const quickEntrySchema = z.object({
  party_id: z.coerce.number().min(1, 'Party is required'),
  total_amount: z.coerce.number().positive('Amount must be greater than 0'),
  invoice_date: z.string().min(1, 'Date is required'),
  payment_status: z.enum(['Paid', 'Pending', 'Partial'], {
    required_error: 'Payment status is required',
  }),
  amount_received: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})

type QuickEntryFormValues = z.infer<typeof quickEntrySchema>

type Party = {
  id: number
  name: string
}

interface QuickEntryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  invoiceId?: number
  editData?: {
    party_id: number
    total_amount: number
    invoice_date: string
    amount_received: number
  }
}

export function QuickEntryDialog({ isOpen, onClose, onSuccess, invoiceId, editData }: QuickEntryDialogProps) {
  const supabase = createClient()
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(false)
  const isEditMode = !!invoiceId

  const form = useForm<QuickEntryFormValues>({
    resolver: zodResolver(quickEntrySchema),
    defaultValues: {
      party_id: 0,
      total_amount: 0,
      invoice_date: formatLocalDate(new Date()),
      payment_status: 'Pending',
      amount_received: 0,
      notes: '',
    },
  })

  const paymentStatus = form.watch('payment_status')
  const totalAmount = form.watch('total_amount')

  useEffect(() => {
    const fetchParties = async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('id, name')
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (error) {
        toast.error('Failed to fetch parties: ' + error.message)
      } else if (data) {
        setParties(data)
      }
    }

    if (isOpen) {
      fetchParties()
      if (editData) {
        // Determine payment status from edit data
        let status: 'Paid' | 'Pending' | 'Partial' = 'Pending'
        if (editData.amount_received >= editData.total_amount && editData.total_amount > 0) {
          status = 'Paid'
        } else if (editData.amount_received > 0) {
          status = 'Partial'
        }

        form.reset({
          party_id: editData.party_id,
          total_amount: editData.total_amount,
          invoice_date: editData.invoice_date,
          payment_status: status,
          amount_received: editData.amount_received,
          notes: '',
        })
      } else {
        form.reset({
          party_id: 0,
          total_amount: 0,
          invoice_date: formatLocalDate(new Date()),
          payment_status: 'Pending',
          amount_received: 0,
          notes: '',
        })
      }
    }
  }, [isOpen, supabase, form, editData])

  // Auto-set amount_received based on payment_status
  useEffect(() => {
    if (paymentStatus === 'Paid') {
      form.setValue('amount_received', totalAmount)
    } else if (paymentStatus === 'Pending') {
      form.setValue('amount_received', 0)
    }
  }, [paymentStatus, totalAmount, form])

  const onSubmit = async (values: QuickEntryFormValues) => {
    setLoading(true)

    try {
      // Get party name for snapshot
      const party = parties.find((p) => p.id === values.party_id)
      if (!party) {
        toast.error('Party not found')
        setLoading(false)
        return
      }

      // Validate amount_received for Partial status
      if (values.payment_status === 'Partial') {
        const amountReceived = values.amount_received || 0
        if (amountReceived <= 0 || amountReceived >= values.total_amount) {
          toast.error('Amount received must be between 0 and total amount for Partial payment')
          setLoading(false)
          return
        }
      }

      if (isEditMode && invoiceId) {
        // Update existing invoice
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update({
            party_id: values.party_id,
            party_name: party.name,
            invoice_date: values.invoice_date,
            total_amount: values.total_amount,
          })
          .eq('id', invoiceId)

        if (invoiceError) {
          toast.error('Failed to update invoice: ' + invoiceError.message)
          setLoading(false)
          return
        }

        // Delete existing payments and create new one
        await supabase.from('payments').delete().eq('invoice_id', invoiceId)

        const amountReceived = values.payment_status === 'Paid'
          ? values.total_amount
          : values.payment_status === 'Partial'
          ? (values.amount_received || 0)
          : 0

        if (amountReceived > 0) {
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              invoice_id: invoiceId,
              amount: amountReceived,
              payment_date: values.invoice_date,
              notes: values.notes || 'Quick entry payment',
            })

          if (paymentError) {
            toast.error('Invoice updated but failed to update payment: ' + paymentError.message)
          }
        }

        toast.success('Offline invoice updated successfully!')
        setLoading(false)
        onSuccess()
        onClose()
        return
      }

      // Create invoice with is_offline flag
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          party_id: values.party_id,
          party_name: party.name,
          invoice_date: values.invoice_date,
          total_amount: values.total_amount,
          bundle_rate: 0,
          bundle_quantity: 0,
          bundle_charge: 0,
          is_offline: true,
        })
        .select('id')
        .single()

      if (invoiceError) {
        toast.error('Failed to create invoice: ' + invoiceError.message)
        setLoading(false)
        return
      }

      // Create payment record if amount_received > 0
      const amountReceived = values.payment_status === 'Paid'
        ? values.total_amount
        : values.payment_status === 'Partial'
        ? (values.amount_received || 0)
        : 0

      if (amountReceived > 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            invoice_id: newInvoice.id,
            amount: amountReceived,
            payment_date: values.invoice_date,
            notes: values.notes || 'Quick entry payment',
          })

        if (paymentError) {
          toast.error('Invoice created but failed to add payment: ' + paymentError.message)
          setLoading(false)
          onSuccess()
          onClose()
          return
        }
      }

      toast.success('Offline invoice created successfully!')
      setLoading(false)
      onSuccess()
      onClose()
    } catch (error) {
      toast.error('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Offline Invoice' : 'Create Offline Invoice'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="party_id"
              render={({ field }) => {
                const [open, setOpen] = useState(false)
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Party *</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? parties.find((p) => p.id === field.value)?.name
                              : "Select party"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search party..." />
                          <CommandList>
                            <CommandEmpty>No party found.</CommandEmpty>
                            <CommandGroup>
                              {parties.map((p) => (
                                <CommandItem
                                  value={p.name}
                                  key={p.id}
                                  onSelect={() => {
                                    form.setValue("party_id", p.id)
                                    setOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      p.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
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
                )
              }}
            />

            <FormField
              control={form.control}
              name="total_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter total amount"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoice_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(parseLocalDate(field.value), 'dd/MM/yyyy')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? parseLocalDate(field.value) : undefined}
                        onSelect={(date) =>
                          field.onChange(date ? formatLocalDate(date) : '')
                        }
                        disabled={(date) => date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_status"
              render={({ field }) => {
                const [open, setOpen] = useState(false)
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Payment Status *</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value || "Select payment status"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search payment status..." />
                          <CommandList>
                            <CommandEmpty>No payment status found.</CommandEmpty>
                            <CommandGroup>
                              {['Paid', 'Pending', 'Partial'].map((status) => (
                                <CommandItem
                                  value={status}
                                  key={status}
                                  onSelect={() => {
                                    form.setValue("payment_status", status as 'Paid' | 'Pending' | 'Partial')
                                    setOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      status === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {status}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            {paymentStatus === 'Partial' && (
              <FormField
                control={form.control}
                name="amount_received"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Received *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter amount received"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Invoice' : 'Create Invoice')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
