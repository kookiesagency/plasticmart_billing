'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
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
import { cn, parseLocalDate, formatLocalDate } from '@/lib/utils'
import { format } from 'date-fns'
import { type Payment } from './page'

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  payment_date: z.string(),
  remark: z.string().max(500, 'Remark must be 500 characters or less').optional(),
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
  const t = useTranslations('paymentForm')
  const tCommon = useTranslations('common')
  const supabase = createClient()
  const isEditMode = !!paymentToEdit

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_date: formatLocalDate(new Date()),
      remark: '',
    },
  })

  useEffect(() => {
    if (isEditMode) {
      form.reset({
        amount: paymentToEdit.amount,
        payment_date: paymentToEdit.payment_date,
        remark: paymentToEdit.remark || '',
      })
    } else {
      form.reset({
        amount: balanceDue > 0 ? Number(balanceDue.toFixed(2)) : 0,
        payment_date: formatLocalDate(new Date()),
        remark: '',
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
        toast.error(t('failedToUpdatePayment'))
      } else {
        toast.success(t('paymentUpdatedSuccess'))
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
        toast.error(t('failedToAddPayment'))
      } else {
        toast.success(t('paymentAddedSuccess'))
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
          <DialogTitle>{isEditMode ? t('editPayment') : t('addPayment')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('amount')}</FormLabel>
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
                  <FormLabel>{t('paymentDate')}</FormLabel>
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
                            format(parseLocalDate(field.value), "PPP")
                          ) : (
                            <span>{t('pickADate')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? parseLocalDate(field.value) : undefined}
                        onSelect={date => field.onChange(date ? formatLocalDate(date) : '')}
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
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('remarkNote')}</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder={t('addRemark')}
                    />
                  </FormControl>
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
                  {tCommon('cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('saving') : tCommon('save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 