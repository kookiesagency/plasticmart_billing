'use client'

import { useRef } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PurchasePartyManager, { PurchasePartyManagerRef } from './purchase-party-manager'
import { SetHeader } from '@/components/layout/header-context'
import { useTranslations } from 'next-intl'

export default function PurchasePartiesPage() {
  const t = useTranslations('purchaseParties')
  const managerRef = useRef<PurchasePartyManagerRef>(null)

  return (
    <>
      <SetHeader
        title={t('title')}
        actions={
          <Button onClick={() => managerRef.current?.openCreateDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('createPurchaseParty')}
          </Button>
        }
      />
      <PurchasePartyManager ref={managerRef} />
    </>
  )
}
