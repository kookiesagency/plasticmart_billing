'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { InvoicePDF } from './invoice-pdf'

type PrintableInvoiceItem = {
  quantity: number
  rate: number
  item_name: string
  item_unit: string
}

type FullInvoice = {
  id: number
  invoice_number: string
  invoice_date: string
  party_name: string
  invoice_items: PrintableInvoiceItem[]
  sub_total: number
  bundle_quantity: number
  bundle_charge: number
  total_amount: number
}

type PrintableInvoiceProps = {
  invoiceId: number
  onReady: () => void
}

export function PrintableInvoice({ invoiceId, onReady }: PrintableInvoiceProps) {
  const supabase = createClient()
  const [invoice, setInvoice] = useState<FullInvoice | null>(null)
  const [settings, setSettings] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const fetchInvoice = async () => {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, invoice_items(quantity, rate, item_name, item_unit)')
        .eq('id', invoiceId)
        .single()

      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('*')

      if (invoiceError || settingsError || !invoiceData || !settingsData) {
        toast.error('Failed to fetch invoice data for printing: ' + (invoiceError?.message || settingsError?.message))
        return
      }
      
      const sub_total = invoiceData.invoice_items.reduce((acc: number, item: { quantity: number; rate: number; }) => acc + (item.quantity * item.rate), 0)
      
      const fullInvoiceData = { ...invoiceData, sub_total }
      setInvoice(fullInvoiceData as FullInvoice)

      const appSettings = settingsData.reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      }, {} as { [key: string]: string })
      setSettings(appSettings)
    }

    fetchInvoice()
  }, [invoiceId, supabase])

  useEffect(() => {
    // If invoice data is loaded, we are ready to print.
    if (invoice) {
      onReady()
    }
  }, [invoice, onReady])

  if (!invoice) {
    return null // Render nothing until data is loaded
  }

  return <InvoicePDF invoice={invoice} settings={settings} />
} 