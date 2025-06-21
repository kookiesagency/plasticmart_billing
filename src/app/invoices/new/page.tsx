'use client'

import { SetHeader } from '@/components/layout/header-context'
import { InvoiceForm } from './invoice-form'

export default function NewInvoicePage() {
  return (
    <>
      <SetHeader title="Create Invoice" />
      <InvoiceForm />
    </>
  )
} 