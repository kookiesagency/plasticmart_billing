import UnitManager from './unit-manager'
import BundleRateManager from './bundle-rate-manager'

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col gap-8">
        <UnitManager />
        <BundleRateManager />
      </div>
    </div>
  )
} 