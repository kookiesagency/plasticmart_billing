'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Edit, Trash } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PaymentForm } from './payment-form'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { SetHeader } from '@/components/layout/header-context'

export type Payment = {
  id: number
  amount: number
  payment_date: string
}

type InvoiceDetails = {
  id: number
  invoice_date: string
  total_amount: number
  status: string
  party: { name: string; contact_details: any } | null
  invoice_items: {
    quantity: number
    rate: number
    items: { name: string; units: { abbreviation: string } | null } | null
  }[]
  payments: Payment[]
  amount_received: number
  amount_pending: number
}

export default function InvoiceDetailsPage() {
  const params = useParams<{ id: string }>()
  const supabase = createClient()
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null)

  const fetchInvoice = async () => {
    if (!params.id) return

    const { data, error } = await supabase
      .from('invoices')
      .select(`
          id,
          invoice_date,
          total_amount,
          party:parties(name, contact_details),
          invoice_items:invoice_items(quantity, rate, items:items(name, units:units(abbreviation))),
          payments(id, amount, payment_date)
        `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      setInvoice(null)
    } else if (data) {
      const amountReceived = data.payments.reduce((acc, p) => acc + p.amount, 0)
      const amountPending = data.total_amount - amountReceived
      let status = 'Pending'
      if (amountReceived >= data.total_amount) {
        status = 'Paid'
      } else if (amountReceived > 0) {
        status = 'Partial'
      }
      
      setInvoice({ ...(data as any), amount_received: amountReceived, amount_pending: amountPending, status })
    }
    setLoading(false)
  }

  const handlePaymentUpdate = () => {
    setPaymentToEdit(null);
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
              <PaymentForm 
                invoiceId={invoice.id} 
                balanceDue={invoice.amount_pending}
                onPaymentAdded={fetchInvoice}
              >
                <Button>Add Payment</Button>
              </PaymentForm>
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

      {paymentToEdit && (
        <PaymentForm
          invoiceId={invoice.id}
          balanceDue={invoice.amount_pending}
          onPaymentAdded={handlePaymentUpdate}
          paymentToEdit={paymentToEdit}
        />
      )}
      <ConfirmationDialog
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeletePayment}
        title="Delete Payment"
        description={`Are you sure you want to delete the payment of ${formatCurrency(paymentToDelete?.amount || 0)}? This action cannot be undone.`}
      />
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.invoice_items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.items?.name}</TableCell>
                        <TableCell className="text-center">
                          {item.quantity} {item.items?.units?.abbreviation}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.quantity * item.rate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                  {invoice.payments.length === 0 ? (
                      <p className="text-muted-foreground">No payments have been recorded for this invoice.</p>
                  ) : (
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Payment Date</TableHead>
                                  <TableHead className="text-right">Amount Paid</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {invoice.payments.map((payment) => (
                                  <TableRow key={payment.id}>
                                      <TableCell>{format(new Date(payment.payment_date), 'dd MMMM, yyyy')}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                                      <TableCell className="text-right space-x-2">
                                          <Button variant="ghost" size="icon" onClick={() => setPaymentToEdit(payment)}><Edit className="h-4 w-4" /></Button>
                                          <Button variant="ghost" size="icon" onClick={() => setPaymentToDelete(payment)}><Trash className="h-4 w-4 text-red-500" /></Button>
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
                <CardTitle>Billed To</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-lg">{invoice.party?.name}</p>
                {/* <pre>{JSON.stringify(invoice.party?.contact_details, null, 2)}</pre> */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Paid:</span>
                      <span className="font-medium">{formatCurrency(invoice.amount_received)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(invoice.amount_pending)}</span>
                  </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
} 