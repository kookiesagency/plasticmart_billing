'use client'

import { InvoiceForm } from '@/app/invoices/new/invoice-form'
import { SetHeader } from '@/components/layout/header-context'
import { useParams } from 'next/navigation'

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>()
  
  return (
    <>
      <SetHeader title={`Edit Invoice #${params.id}`} />
      <InvoiceForm invoiceId={params.id} />
    </>
  )
} 