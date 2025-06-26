'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { formatCurrency, parseLocalDate } from '@/lib/utils'
import { ArrowLeft, Edit, Trash } from 'lucide-react'

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

export type Payment = {
  id: number
  amount: number
  payment_date: string
  remark?: string
}

type Invoice = {
  id: string
  invoice_date: string
  total_amount: number
  party_name: string
  status: 'Paid' | 'Pending' | 'Partial'
  amount_pending: number
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
  const params = useParams<{ id: string }>()
  const supabase = createClient()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const fetchInvoice = async () => {
    if (!params.id) return

    const { data, error } = await supabase
      .from('invoices')
      .select(
        `
          id,
          invoice_date,
          total_amount,
          party_name,
          bundle_charge,
          bundle_quantity,
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
      toast.error('Failed to delete payment.')
      console.error('Error deleting payment:', error)
    } else {
      toast.success('Payment deleted successfully.')
      await fetchInvoice()
    }
    setPaymentToDelete(null)
  }

  useEffect(() => {
    setLoading(true)
    fetchInvoice()
  }, [params.id])

  if (loading) return <div className="p-6">Loading invoice details...</div>
  if (!invoice) return <div className="p-6">Invoice not found.</div>

  const subTotal = invoice.invoice_items.reduce((acc, item) => acc + item.quantity * item.rate, 0);

  const statusVariant = (status: string): 'paid' | 'partial' | 'destructive' => {
    if (status === 'Paid') return 'paid'
    if (status === 'Partial') return 'partial'
    return 'destructive'
  }

  return (
    <>
      <SetHeader 
        title={`Invoice #${invoice.id}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(invoice.status)} className="capitalize text-base">
              {invoice.status}
            </Badge>
            {invoice.status !== 'Paid' && (
              <>
                <Button onClick={() => setIsPaymentModalOpen(true)}>Add Payment</Button>
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
            <Button variant="outline" asChild>
              <Link href={`/invoices/edit/${invoice.id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Invoice
              </Link>
            </Button>
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
        title={`Delete Payment of ${formatCurrency(paymentToDelete?.amount || 0)}?`}
        description="This action cannot be undone."
      />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
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

          <Card>
            <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">No payments recorded.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="text-left">Payment Date</TableHead>
                      <TableHead className="text-left">Amount Paid</TableHead>
                      <TableHead className="text-left">Remark</TableHead>
                      <TableHead className="text-right w-[100px]">Actions</TableHead>
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
                                <Button variant="ghost" size="icon" onClick={() => setPaymentToEdit(payment)}><Edit className="h-4 w-4" /></Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Edit Payment</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setPaymentToDelete(payment)}><Trash className="h-4 w-4 text-red-500" /></Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Delete Payment</p></TooltipContent>
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
            <CardHeader><CardTitle>Billed To</CardTitle></CardHeader>
            <CardContent>
              <p className="font-bold">{invoice.party_name}</p>
              <p className="text-sm text-muted-foreground">{format(new Date(invoice.invoice_date), 'PPP')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Bundle ({invoice.bundle_quantity})</span>
                <span>{formatCurrency(invoice.bundle_charge)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t">
                <span >Paid</span>
                <span className="text-green-600">{formatCurrency(invoice.amount_received)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className={invoice.amount_pending > 0 ? "text-destructive" : "text-green-600"}>Balance Due</span>
                <span className={invoice.amount_pending > 0 ? "text-destructive" : "text-green-600"}>{formatCurrency(invoice.amount_pending)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
} 