'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { formatCurrency, parseLocalDate } from '@/lib/utils'
import { ArrowLeft, Pencil, Trash } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PaymentForm } from './payment-form'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { SetHeader } from '@/components/layout/header-context'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { QuickEntryDialog } from '../quick-entry-dialog'

export type Payment = {
  id: number
  amount: number
  payment_date: string
  remark?: string
}

type Invoice = {
  id: string
  invoice_number: string
  invoice_date: string
  total_amount: number
  party_id: number
  party_name: string
  status: 'Paid' | 'Pending' | 'Partial'
  amount_pending: number
  is_offline?: boolean
  invoice_items: {
    quantity: number
    rate: number
    item_name: string
    item_unit: string
  }[]
  payments: Payment[]
  amount_received: number
  bundle_charge: number
  bundle_quantity: number
}

export default function InvoiceDetailsPage() {
  const t = useTranslations('invoiceView')
  const tInvoices = useTranslations('invoices')
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false)

  const fetchInvoice = async () => {
    if (!params.id) return

    const { data, error } = await supabase
      .from('invoices')
      .select(
        `
          id,
          invoice_number,
          invoice_date,
          total_amount,
          party_id,
          party_name,
          bundle_charge,
          bundle_quantity,
          is_offline,
          invoice_items(quantity, rate, item_name, item_unit),
          payments(id, amount, payment_date, remark)
        `
      )
      .eq('id', params.id)
      .single()

    if (error || !data) {
      console.error('Error fetching invoice:', error)
      setInvoice(null)
    } else {
      const amount_received = data.payments.reduce((acc, p) => acc + p.amount, 0)
      const amount_pending = data.total_amount - amount_received
      
      let status: 'Paid' | 'Partial' | 'Pending' = 'Pending'
      if (amount_pending <= 0) {
        status = 'Paid'
      } else if (amount_received > 0 && amount_received < data.total_amount) {
        status = 'Partial'
      } else if (amount_received === 0) {
        status = 'Pending'
      }

      setInvoice({ ...data, amount_received, amount_pending, status } as Invoice)
    }
    setLoading(false)
  }

  const handlePaymentUpdate = () => {
    setPaymentToEdit(null);
    setIsPaymentModalOpen(false);
    fetchInvoice();
  }

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return

    const { error } = await supabase
      .from('payments')
      .delete()
      .match({ id: paymentToDelete.id })

    if (error) {
      toast.error(t('failedToDeletePayment'))
      console.error('Error deleting payment:', error)
    } else {
      toast.success(t('paymentDeletedSuccess'))
      await fetchInvoice()
    }
    setPaymentToDelete(null)
  }

  useEffect(() => {
    setLoading(true)
    fetchInvoice()
  }, [params.id])

  if (loading) return <div className="p-6">{t('loadingInvoice')}</div>
  if (!invoice) return <div className="p-6">{t('invoiceNotFound')}</div>

  const subTotal = invoice.invoice_items.reduce((acc, item) => acc + item.quantity * item.rate, 0);

  const statusVariant = (status: string): 'paid' | 'partial' | 'destructive' => {
    if (status === 'Paid') return 'paid'
    if (status === 'Partial') return 'partial'
    return 'destructive'
  }

  return (
    <>
      <SetHeader
        title={
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span>{t('invoice')} - {invoice.invoice_number}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(invoice.status)} className="capitalize text-base">
              {invoice.status}
            </Badge>
            {invoice.status !== 'Paid' && (
              <>
                <Button onClick={() => setIsPaymentModalOpen(true)}>{t('addPayment')}</Button>
                <PaymentForm
                  invoiceId={parseInt(invoice.id)}
                  balanceDue={invoice.amount_pending}
                  onPaymentAdded={() => {
                    setIsPaymentModalOpen(false);
                    fetchInvoice();
                  }}
                  open={isPaymentModalOpen}
                  onOpenChange={setIsPaymentModalOpen}
                />
              </>
            )}
            {invoice.is_offline ? (
              <Button variant="outline" onClick={() => setIsQuickEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                {t('editInvoice')}
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={`/invoices/edit/${invoice.id}`}>
                  <Pencil className="h-4 w-4" />
                  {t('editInvoice')}
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <PaymentForm
        invoiceId={parseInt(invoice?.id || '0')}
        balanceDue={invoice?.amount_pending || 0}
        onPaymentAdded={handlePaymentUpdate}
        paymentToEdit={paymentToEdit}
        open={!!paymentToEdit}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPaymentToEdit(null)
          }
        }}
      />
      <ConfirmationDialog
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeletePayment}
        title={t('deletePaymentConfirm', { amount: formatCurrency(paymentToDelete?.amount || 0) })}
        description={t('deleteConfirmMessage')}
      />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {!invoice.is_offline && (
            <Card>
              <CardHeader><CardTitle>{t('items')}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="w-[50px]">{t('numberSign')}</TableHead>
                      <TableHead>{t('item')}</TableHead>
                      <TableHead>{t('quantity')}</TableHead>
                      <TableHead className="text-right">{t('rate')}</TableHead>
                      <TableHead className="text-right">{t('amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.invoice_items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.quantity} {item.item_unit}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.quantity * item.rate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>{t('paymentHistory')}</CardTitle></CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">{t('noPayments')}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="text-left">{t('paymentDate')}</TableHead>
                      <TableHead className="text-left">{t('amountPaid')}</TableHead>
                      <TableHead className="text-left">{t('remark')}</TableHead>
                      <TableHead className="text-right w-[100px]">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...invoice.payments]
                      .sort((a, b) => b.payment_date.localeCompare(a.payment_date))
                      .map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-left">{format(parseLocalDate(payment.payment_date), 'dd MMMM, yyyy')}</TableCell>
                          <TableCell className="text-left">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="max-w-xs whitespace-pre-line text-sm text-muted-foreground text-left">{payment.remark || '-'}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setPaymentToEdit(payment)}><Pencil className="h-4 w-4" /></Button>
                              </TooltipTrigger>
                              <TooltipContent><p>{t('editPayment')}</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setPaymentToDelete(payment)}><Trash className="h-4 w-4 text-red-500" /></Button>
                              </TooltipTrigger>
                              <TooltipContent><p>{t('deletePayment')}</p></TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('billedTo')}</CardTitle>
                {invoice.is_offline && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    {t('offline')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-bold">{invoice.party_name}</p>
              <p className="text-sm text-muted-foreground">{format(new Date(invoice.invoice_date), 'PPP')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!invoice.is_offline && (
                <>
                  <div className="flex justify-between">
                    <span>{t('subtotal')}</span>
                    <span>{formatCurrency(subTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('bundle')} ({invoice.bundle_quantity})</span>
                    <span>{formatCurrency(invoice.bundle_charge)}</span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex justify-between font-bold text-xl">
                <span>{t('total')}</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t">
                <span >{t('paid')}</span>
                <span className="text-green-600">{formatCurrency(invoice.amount_received)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className={invoice.amount_pending > 0 ? "text-destructive" : "text-green-600"}>{t('balanceDue')}</span>
                <span className={invoice.amount_pending > 0 ? "text-destructive" : "text-green-600"}>{formatCurrency(invoice.amount_pending)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {invoice.is_offline && (
        <QuickEntryDialog
          isOpen={isQuickEditOpen}
          onClose={() => setIsQuickEditOpen(false)}
          onSuccess={fetchInvoice}
          invoiceId={parseInt(invoice.id)}
          editData={{
            party_id: invoice.party_id,
            total_amount: invoice.total_amount,
            invoice_date: invoice.invoice_date,
            amount_received: invoice.amount_received,
          }}
        />
      )}
    </>
  )
} 