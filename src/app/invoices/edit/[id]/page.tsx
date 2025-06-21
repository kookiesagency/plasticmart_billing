'use client'

import { InvoiceForm } from '@/app/invoices/new/invoice-form'
import { useParams } from 'next/navigation'

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>()
  
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Invoice #{params.id}</h1>
      <InvoiceForm invoiceId={params.id} />
    </div>
  )
} 