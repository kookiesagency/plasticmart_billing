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
  const { public_id } = await params

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(quantity, rate, item_name, item_unit)')
    .eq('public_id', public_id)
    .single()

  if (error || !invoice) {
    notFound()
  }

  const sub_total = invoice.invoice_items.reduce((acc: number, item: { quantity: number; rate: number; }) => acc + (item.quantity * item.rate), 0);

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-12 px-2 sm:px-6 lg:px-8">
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex justify-between items-start gap-1 sm:gap-2">
            <div>
              <CardTitle className="text-sm sm:text-2xl font-bold">CASH MEMO</CardTitle>
            </div>
            <InvoiceActions
              invoiceId={invoice.id}
              party_name={invoice.party_name}
              invoice_date={invoice.invoice_date}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-4 text-[10px] sm:text-sm">
            <div>
              <h3 className="font-semibold mb-0.5 sm:mb-1 text-[9px] sm:text-sm">Bill To:</h3>
              <p className="font-bold text-[10px] sm:text-sm">{invoice.party_name}</p>
            </div>
            <div className="sm:text-right space-y-0.5 sm:space-y-1">
              <p className="text-[9px] sm:text-sm"><strong>Invoice #:</strong> <span className="font-mono text-[9px] sm:text-sm">{invoice.invoice_number}</span></p>
              <p className="text-[9px] sm:text-sm"><strong>Date:</strong> <span className="text-[9px] sm:text-sm">{format(new Date(invoice.invoice_date), 'PPP')}</span></p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle px-3 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[28px] sm:w-[50px] text-[9px] sm:text-sm px-1 sm:px-4 py-2">#</TableHead>
                    <TableHead className="min-w-[110px] sm:min-w-[180px] text-[9px] sm:text-sm px-1.5 sm:px-4 py-2">Item</TableHead>
                    <TableHead className="min-w-[65px] sm:min-w-[100px] text-[9px] sm:text-sm px-1.5 sm:px-4 py-2">Quantity</TableHead>
                    <TableHead className="min-w-[60px] sm:min-w-[100px] text-[9px] sm:text-sm px-1.5 sm:px-4 py-2">Rate</TableHead>
                    <TableHead className="text-right min-w-[70px] sm:min-w-[120px] text-[9px] sm:text-sm px-1.5 sm:px-4 py-2">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.invoice_items.map((item: { item_name: string; quantity: number; item_unit: string; rate: number }, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-[9px] sm:text-sm py-1 sm:py-4 px-1 sm:px-4">{index + 1}</TableCell>
                      <TableCell className="text-[9px] sm:text-sm py-1 sm:py-4 px-1.5 sm:px-4">{item.item_name}</TableCell>
                      <TableCell className="text-[9px] sm:text-sm py-1 sm:py-4 px-1.5 sm:px-4 whitespace-nowrap">{item.quantity} {item.item_unit}</TableCell>
                      <TableCell className="text-[9px] sm:text-sm py-1 sm:py-4 px-1.5 sm:px-4 whitespace-nowrap">{formatCurrency(item.rate)}</TableCell>
                      <TableCell className="text-right text-[9px] sm:text-sm py-1 sm:py-4 px-1.5 sm:px-4 whitespace-nowrap">{formatCurrency(item.quantity * item.rate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-semibold text-[9px] sm:text-sm py-1 sm:py-4 px-1.5 sm:px-4">Subtotal</TableCell>
                    <TableCell className="text-right text-[9px] sm:text-sm py-1 sm:py-4 px-1.5 sm:px-4 whitespace-nowrap">{formatCurrency(sub_total)}</TableCell>
                  </TableRow>
                  {invoice.bundle_charge > 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-right text-[9px] sm:text-sm py-1 sm:py-4 px-1.5 sm:px-4">Bundles ({invoice.bundle_quantity})</TableCell>
                      <TableCell className="text-right text-[9px] sm:text-sm py-1 sm:py-4 px-1.5 sm:px-4 whitespace-nowrap">{formatCurrency(invoice.bundle_charge)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow className="text-[10px] sm:text-lg font-bold">
                    <TableCell colSpan={4} className="text-right py-1 sm:py-4 px-1.5 sm:px-4">Grand Total</TableCell>
                    <TableCell className="text-right py-1 sm:py-4 px-1.5 sm:px-4 whitespace-nowrap">{formatCurrency(invoice.total_amount)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-center text-xs text-gray-500">
          Thank you for your business!
        </CardFooter>
      </Card>
    </div>
  )
} 