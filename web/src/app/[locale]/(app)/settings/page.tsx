import UnitManager from './unit-manager'
import BundleRateManager from './bundle-rate-manager'
import { SetHeader } from '@/components/layout/header-context'

export default function SettingsPage() {
  return (
    <>
      <SetHeader title="Settings" />
      <div className="space-y-8">
        <UnitManager />
        <BundleRateManager />
      </div>
    </>
  )
} 