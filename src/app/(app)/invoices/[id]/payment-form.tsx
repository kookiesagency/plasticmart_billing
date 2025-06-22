'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { type Payment } from './page'

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  payment_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  }),
})

interface PaymentFormProps {
  invoiceId: number
  balanceDue: number
  onPaymentAdded: () => void
  children?: React.ReactNode
  paymentToEdit?: Payment | null
}

export function PaymentForm({
  invoiceId,
  balanceDue,
  onPaymentAdded,
  children,
  paymentToEdit,
}: PaymentFormProps) {
  const [open, setOpen] = useState(false)
  const supabase = createClient()
  const isEditMode = !!paymentToEdit

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (isEditMode) {
      form.reset({
        amount: paymentToEdit.amount,
        payment_date: new Date(paymentToEdit.payment_date).toISOString().split('T')[0],
      })
    } else {
      form.reset({
        amount: balanceDue > 0 ? Number(balanceDue.toFixed(2)) : 0,
        payment_date: new Date().toISOString().split('T')[0],
      })
    }
  }, [isEditMode, paymentToEdit, balanceDue, form, open])
  
  // This useEffect will manage the dialog state when used for editing
  useEffect(() => {
    if (isEditMode) {
      setOpen(true);
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
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
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