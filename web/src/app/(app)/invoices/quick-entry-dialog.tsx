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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
}

export function QuickEntryDialog({ isOpen, onClose, onSuccess }: QuickEntryDialogProps) {
  const supabase = createClient()
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(false)

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
      form.reset({
        party_id: 0,
        total_amount: 0,
        invoice_date: formatLocalDate(new Date()),
        payment_status: 'Pending',
        amount_received: 0,
        notes: '',
      })
    }
  }, [isOpen, supabase, form])

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
          <DialogTitle>Quick Offline Invoice Entry</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="party_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Party *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select party" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parties.map((party) => (
                        <SelectItem key={party.id} value={party.id.toString()}>
                          {party.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
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
                {loading ? 'Creating...' : 'Create Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
