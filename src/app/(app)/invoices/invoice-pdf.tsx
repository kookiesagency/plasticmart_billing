import { formatCurrency, formatDate } from '@/lib/utils'

type InvoicePDFProps = {
  invoice: {
    invoice_date: string
    party_name: string
    invoice_items: {
      quantity: number
      rate: number
      item_name: string
      item_unit: string
    }[]
    sub_total: number
    bundle_quantity: number
    bundle_charge: number
    total_amount: number
  }
  settings: { company_name?: string; company_address?: string; company_phone?: string }
}

export const InvoicePDF = ({ invoice, settings }: InvoicePDFProps) => {
  return (
    <div className="bg-white text-black p-8 font-sans text-sm">
      <header className="text-center mb-8">
        <h2 className="text-xl font-bold mt-4 underline underline-offset-4">CASH MEMO</h2>
      </header>

      {/* Bill To and Date Section */}
      <table className="w-full mb-6 text-sm">
        <tbody>
          <tr>
            <td className="w-1/2">
              <span className="font-bold">Bill To:</span> <span className="font-bold">{invoice.party_name}</span>
            </td>
            <td className="w-1/2 text-right">
              <span className="font-bold">Date:</span> {formatDate(invoice.invoice_date)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <section className="mt-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-y border-gray-800 font-bold">
              <th className="p-2 w-[10%] text-center">SR. NO</th>
              <th className="p-2 w-[40%]">ITEM</th>
              <th className="p-2 w-[10%] text-left">QTY</th>
              <th className="p-2 w-[10%] text-left">UNIT</th>
              <th className="p-2 w-[15%] text-left">RATE</th>
              <th className="p-2 w-[15%] text-left">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoice_items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-2 text-center">{index + 1}</td>
                <td className="p-2">{item.item_name}</td>
                <td className="p-2 text-left">{item.quantity}</td>
                <td className="p-2 text-left">{item.item_unit || 'N/A'}</td>
                <td className="p-2 text-left">{formatCurrency(item.rate)}</td>
                <td className="p-2 text-left">{formatCurrency(item.quantity * item.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Totals Section */}
      <table className="w-full mt-6">
        <tbody>
          <tr>
            <td className="w-1/2"></td>
            <td className="w-1/4 p-2 font-bold">Subtotal:</td>
            <td className="w-1/4 p-2 text-right">{formatCurrency(invoice.sub_total || 0)}</td>
          </tr>
          <tr>
            <td className="w-1/2"></td>
            <td className="w-1/4 p-2 font-bold">Bundle ({invoice.bundle_quantity}):</td>
            <td className="w-1/4 p-2 text-right">{formatCurrency(invoice.bundle_charge || 0)}</td>
          </tr>
          <tr className="font-bold text-lg">
            <td className="w-1/2"></td>
            <td className="w-1/4 p-2 border-t-2 border-black">Total:</td>
            <td className="w-1/4 p-2 text-right border-t-2 border-black">{formatCurrency(invoice.total_amount)}</td>
          </tr>
        </tbody>
      </table>

      <footer className="mt-12 pt-4 border-t text-center text-xs text-gray-500">
        <p>This is a computer-generated cash memo.</p>
        <p>Thank you for your business!</p>
      </footer>
    </div>
  )
} 