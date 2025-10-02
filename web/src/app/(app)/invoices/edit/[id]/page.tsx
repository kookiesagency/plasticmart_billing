'use client'

import { InvoiceForm } from '@/app/(app)/invoices/new/invoice-form'
import { SetHeader } from '@/components/layout/header-context'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    const fetchInvoiceNumber = async () => {
      if (!params.id) return

      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('id', params.id)
        .single()

      if (data && !error) {
        setInvoiceNumber(data.invoice_number)
      }
    }

    fetchInvoiceNumber()
  }, [params.id, supabase])

  return (
    <>
      <SetHeader
        title={
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span>{invoiceNumber ? `Edit Invoice - ${invoiceNumber}` : 'Edit Invoice'}</span>
          </div>
        }
      />
      <InvoiceForm invoiceId={params.id} />
    </>
  )
} 