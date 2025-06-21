'use client'

import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useParties from './use-parties'
import { columns } from './columns'
import { PartyForm } from './party-form'
import { DataTable } from '@/components/data-table'
import { SetHeader } from '@/components/layout/header-context'

export default function PartyManager() {
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
      <Tabs defaultValue="active" className="mt-4">
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