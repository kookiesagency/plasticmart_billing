'use client'

import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useParties from './use-parties'
import { columns } from './columns'
import { PartyForm } from './party-form'
import { DataTable } from '@/components/data-table'
import { SetHeader } from '@/components/layout/header-context'
import type { Party } from '@/lib/types'

export default function PartyManager() {
  const supabase = createClient()
  const [isPartyFormOpen, setPartyFormOpen] = useState(false)
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null)
  const { activeParties, deletedParties, loading, refetch } = useParties()

  const openNewPartyForm = () => {
    setSelectedPartyId(null)
    setPartyFormOpen(true)
  }

  const openEditPartyForm = (id: string) => {
    setSelectedPartyId(id)
    setPartyFormOpen(true)
  }

  const closePartyForm = () => {
    setPartyFormOpen(false)
    setSelectedPartyId(null)
    refetch()
  }

  const handleBulkDelete = async (selectedParties: Party[]) => {
    const idsToDelete = selectedParties.map((p) => p.id)
    const { error } = await supabase
      .from('parties')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', idsToDelete)

    if (error) {
      toast.error(`Failed to delete ${idsToDelete.length} parties.`)
    } else {
      toast.success(`${idsToDelete.length} parties deleted successfully.`)
      refetch()
    }
  }

  return (
    <>
      <SetHeader 
        title="Parties"
        actions={
          <Button onClick={openNewPartyForm}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Party
          </Button>
        }
      />
      <PartyForm
        isOpen={isPartyFormOpen}
        onClose={closePartyForm}
        partyId={selectedPartyId}
      />
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <DataTable
            columns={columns({ onEdit: openEditPartyForm, refetch })}
            data={activeParties}
            loading={loading}
            searchPlaceholder="Search parties..."
            onBulkDelete={handleBulkDelete}
          />
        </TabsContent>
        <TabsContent value="deleted">
          <DataTable
            columns={columns({ onEdit: openEditPartyForm, refetch, isDeleted: true })}
            data={deletedParties}
            loading={loading}
            searchPlaceholder="Search parties..."
          />
        </TabsContent>
      </Tabs>
    </>
  )
} 