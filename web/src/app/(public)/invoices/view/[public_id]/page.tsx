import { createClient } from '@/lib/supabase/client'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { InvoiceActions } from './invoice-actions'

type Invoice = {
  id: number
  invoice_number: string
  invoice_date: string
  total_amount: number
  party_name: string
  invoice_items: {
    quantity: number
    rate: number
    item_name: string
    item_unit: string
  }[]
  bundle_quantity: number
  bundle_charge: number
}

type PublicInvoicePageParams = { params: { public_id: string } }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function PublicInvoicePage({ params }: any) {
  const supabase = createClient()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(quantity, rate, item_name, item_unit)')
    .eq('public_id', params.public_id)
    .single()

  if (error || !invoice) {
    notFound()
  }

  const sub_total = invoice.invoice_items.reduce((acc: number, item: { quantity: number; rate: number; }) => acc + (item.quantity * item.rate), 0);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">CASH MEMO</CardTitle>
            </div>
            <InvoiceActions 
              invoiceId={invoice.id}
              party_name={invoice.party_name}
              invoice_date={invoice.invoice_date}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Bill To:</h3>
              <p className="font-bold">{invoice.party_name}</p>
            </div>
            <div className="text-right space-y-1">
              <p><strong>Invoice #:</strong> <span className="font-mono">{invoice.invoice_number}</span></p>
              <p><strong>Date:</strong> {format(new Date(invoice.invoice_date), 'PPP')}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.invoice_items.map((item: { item_name: string; quantity: number; item_unit: string; rate: number }, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell>{item.quantity} {item.item_unit}</TableCell>
                  <TableCell>{formatCurrency(item.rate)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.quantity * item.rate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-semibold">Subtotal</TableCell>
                <TableCell className="text-right">{formatCurrency(sub_total)}</TableCell>
              </TableRow>
              {invoice.bundle_charge > 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-right">Bundles ({invoice.bundle_quantity})</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.bundle_charge)}</TableCell>
                </TableRow>
              )}
              <TableRow className="text-lg font-bold">
                <TableCell colSpan={4} className="text-right">Grand Total</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.total_amount)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
        <CardFooter className="text-center text-xs text-gray-500">
          Thank you for your business!
        </CardFooter>
      </Card>
    </div>
  )
} 