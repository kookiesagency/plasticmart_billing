'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { type Payment } from './page'

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  payment_date: z.date({
    required_error: "A payment date is required.",
  }),
})

interface PaymentFormProps {
  invoiceId: number
  balanceDue: number
  onPaymentAdded: () => void
  children?: React.ReactNode
  paymentToEdit?: Payment | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PaymentForm({
  invoiceId,
  balanceDue,
  onPaymentAdded,
  children,
  paymentToEdit,
  open,
  onOpenChange
}: PaymentFormProps) {
  const supabase = createClient()
  const isEditMode = !!paymentToEdit

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_date: new Date(),
    },
  })

  useEffect(() => {
    if (isEditMode) {
      form.reset({
        amount: paymentToEdit.amount,
        payment_date: new Date(paymentToEdit.payment_date),
      })
    } else {
      form.reset({
        amount: balanceDue > 0 ? Number(balanceDue.toFixed(2)) : 0,
        payment_date: new Date(),
      })
    }
  }, [isEditMode, paymentToEdit, balanceDue, form, open])
  
  // This useEffect will manage the dialog state when used for editing
  useEffect(() => {
    if (isEditMode) {
      onOpenChange?.(true);
    }
  }, [paymentToEdit]);


  const onSubmit = async (values: z.infer<typeof paymentSchema>) => {
    if (isEditMode) {
      // Update logic
      const { error } = await supabase
        .from('payments')
        .update(values)
        .match({ id: paymentToEdit.id })

      if (error) {
        toast.error('Failed to update payment.')
      } else {
        toast.success('Payment updated successfully!')
        onPaymentAdded() // This is the refresh function
      }
    } else {
      // Insert logic
      const { error } = await supabase.from('payments').insert([
        {
          ...values,
          invoice_id: invoiceId,
        },
      ])

      if (error) {
        toast.error('Failed to add payment.')
      } else {
        toast.success('Payment added successfully!')
        onPaymentAdded()
      }
    }
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Add'} Payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
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
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 