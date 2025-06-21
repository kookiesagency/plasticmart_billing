import PartyManager from './party-manager'

export default function PartiesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Parties</h1>
      <PartyManager />
    </div>
  )
} 