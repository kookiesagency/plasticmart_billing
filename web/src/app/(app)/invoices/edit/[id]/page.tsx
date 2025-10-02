'use client'

import { InvoiceForm } from '@/app/(app)/invoices/new/invoice-form'
import { SetHeader } from '@/components/layout/header-context'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { FetchUpdatesDialog } from '@/components/invoice/fetch-updates-dialog'
import { toast } from 'sonner'

type ItemUpdate = {
  index: number
  itemId: number | null
  field: 'item_name' | 'rate' | 'item_unit'
  oldValue: string | number
  newValue: string | number
  convertedRate?: number
}

type PartyUpdate = {
  field: 'party_name'
  oldValue: string
  newValue: string
}

type UpdateItem = ItemUpdate | PartyUpdate

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [isFetchDialogOpen, setIsFetchDialogOpen] = useState(false)
  const [currentInvoiceData, setCurrentInvoiceData] = useState<any>(null)
  const [latestData, setLatestData] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)
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

  const handleFetchUpdates = async () => {
    if (!params.id) return

    // Fetch current invoice data
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', params.id)
      .single()

    if (invoiceError || !invoiceData) {
      toast.error('Failed to fetch invoice data')
      return
    }

    // Fetch latest items and party data
    const itemIds = invoiceData.invoice_items
      .map((item: any) => item.item_id)
      .filter((id: any) => id !== null)

    const [latestItemsRes, latestPartyRes] = await Promise.all([
      supabase
        .from('items')
        .select('*, units(name)')
        .in('id', itemIds),
      supabase
        .from('parties')
        .select('name')
        .eq('id', invoiceData.party_id)
        .single()
    ])

    if (latestItemsRes.error || latestPartyRes.error) {
      toast.error('Failed to fetch latest data')
      return
    }

    setCurrentInvoiceData({
      items: invoiceData.invoice_items,
      partyId: invoiceData.party_id,
      partyName: invoiceData.party_name,
    })

    setLatestData({
      items: latestItemsRes.data || [],
      partyName: latestPartyRes.data?.name || invoiceData.party_name,
    })

    setIsFetchDialogOpen(true)
  }

  const handleApplyUpdates = async (updates: UpdateItem[]) => {
    if (!params.id) return

    try {
      // Group updates by type
      const partyUpdate = updates.find(u => 'field' in u && u.field === 'party_name') as PartyUpdate | undefined
      const itemUpdates = updates.filter(u => 'index' in u) as ItemUpdate[]

      // Update party name if changed
      if (partyUpdate) {
        const { error } = await supabase
          .from('invoices')
          .update({ party_name: partyUpdate.newValue })
          .eq('id', params.id)

        if (error) throw error
      }

      // Update invoice items
      for (const update of itemUpdates) {
        const invoiceItem = currentInvoiceData.items[update.index]

        const updateData: any = {}

        if (update.field === 'item_name') {
          updateData.item_name = update.newValue
        } else if (update.field === 'rate') {
          updateData.rate = update.newValue
        } else if (update.field === 'item_unit') {
          updateData.item_unit = update.newValue
        }

        const { error } = await supabase
          .from('invoice_items')
          .update(updateData)
          .eq('id', invoiceItem.id)

        if (error) throw error
      }

      toast.success('Invoice updated successfully!')
      setIsFetchDialogOpen(false)
      setRefreshKey(prev => prev + 1)
    } catch (error: any) {
      toast.error('Failed to apply updates: ' + error.message)
    }
  }

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
        actions={
          <Button variant="outline" onClick={handleFetchUpdates}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Fetch Updates
          </Button>
        }
      />
      <InvoiceForm key={refreshKey} invoiceId={params.id} />

      {currentInvoiceData && latestData && (
        <FetchUpdatesDialog
          isOpen={isFetchDialogOpen}
          onOpenChange={setIsFetchDialogOpen}
          currentItems={currentInvoiceData.items}
          currentPartyId={currentInvoiceData.partyId}
          currentPartyName={currentInvoiceData.partyName}
          latestItems={latestData.items}
          latestPartyName={latestData.partyName}
          onApplyUpdates={handleApplyUpdates}
        />
      )}
    </>
  )
} 