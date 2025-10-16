'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Party } from '@/lib/types'

export default function useParties() {
  const t = useTranslations('parties')
  const supabase = createClient()
  const [activeParties, setActiveParties] = useState<Party[]>([])
  const [deletedParties, setDeletedParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)

    const [activeRes, deletedRes] = await Promise.all([
      supabase.from('parties').select('*, invoices!party_id(count)').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('parties').select('*, invoices!party_id(count)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
    ])

    if (activeRes.error) {
      toast.error(t('errorFetchingParties').replace('{error}', activeRes.error.message ))
      setActiveParties([])
    } else {
      // Transform data to add invoice_count
      const partiesWithCount = activeRes.data.map((party: any) => ({
        ...party,
        invoice_count: party.invoices?.[0]?.count || 0,
        invoices: undefined // Remove the nested invoices object
      }))
      setActiveParties(partiesWithCount as Party[])
    }

    if (deletedRes.error) {
      toast.error(t('errorFetchingDeletedParties').replace('{error}', deletedRes.error.message ))
      setDeletedParties([])
    } else {
      // Transform data to add invoice_count
      const partiesWithCount = deletedRes.data.map((party: any) => ({
        ...party,
        invoice_count: party.invoices?.[0]?.count || 0,
        invoices: undefined // Remove the nested invoices object
      }))
      setDeletedParties(partiesWithCount as Party[])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { activeParties, deletedParties, loading, refetch: fetchData }
} 