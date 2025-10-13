'use client'

import UnitManager from './unit-manager'
import BundleRateManager from './bundle-rate-manager'
import { SetHeader } from '@/components/layout/header-context'
import { useTranslations } from 'next-intl'

export default function SettingsPage() {
  const t = useTranslations('settings')

  return (
    <>
      <SetHeader title={t('title')} />
      <div className="space-y-8">
        <UnitManager />
        <BundleRateManager />
      </div>
    </>
  )
} 