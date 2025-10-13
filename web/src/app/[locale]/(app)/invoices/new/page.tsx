'use client'

import { useTranslations } from 'next-intl'
import { SetHeader } from '@/components/layout/header-context'
import { InvoiceForm } from './invoice-form'

export default function NewInvoicePage() {
  const t = useTranslations('invoices')

  return (
    <>
      <SetHeader title={t('createInvoice')} />
      <InvoiceForm />
    </>
  )
} 