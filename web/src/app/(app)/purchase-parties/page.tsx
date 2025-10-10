'use client'

import { useRef } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PurchasePartyManager, { PurchasePartyManagerRef } from './purchase-party-manager'
import { SetHeader } from '@/components/layout/header-context'

export default function PurchasePartiesPage() {
  const managerRef = useRef<PurchasePartyManagerRef>(null)

  return (
    <>
      <SetHeader
        title="Purchase Parties"
        actions={
          <Button onClick={() => managerRef.current?.openCreateDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Purchase Party
          </Button>
        }
      />
      <PurchasePartyManager ref={managerRef} />
    </>
  )
}
