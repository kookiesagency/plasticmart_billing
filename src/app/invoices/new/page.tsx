import { InvoiceForm } from './invoice-form'

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create Invoice</h3>
        <p className="text-sm text-muted-foreground">
          Fill out the form below to create a new invoice.
        </p>
      </div>
      <div className="h-[1px] w-full bg-border" />
      <InvoiceForm />
    </div>
  )
} 