'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Party } from '@/lib/types'

export default function useParties() {
  const supabase = createClient()
  const [activeParties, setActiveParties] = useState<Party[]>([])
  const [deletedParties, setDeletedParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    const [activeRes, deletedRes] = await Promise.all([
      supabase.from('parties').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('parties').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
    ])

    if (activeRes.error) {
      toast.error('Error fetching parties: ' + activeRes.error.message)
      setActiveParties([])
    } else {
      setActiveParties(activeRes.data as Party[])
    }

    if (deletedRes.error) {
      toast.error('Error fetching deleted parties: ' + deletedRes.error.message)
      setDeletedParties([])
    } else {
      setDeletedParties(deletedRes.data as Party[])
    }
    
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { activeParties, deletedParties, loading, refetch: fetchData }
} 