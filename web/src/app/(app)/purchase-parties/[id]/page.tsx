'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { DataTable } from '@/components/data-table'
import { SetHeader } from '@/components/layout/header-context'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ItemCategory = {
  id: number
  name: string
}

type Item = {
  id: number
  name: string
  default_rate: number
  purchase_rate: number | null
  units: { name: string } | null
  item_categories: { name: string } | null
}

type PurchasePartyDetails = {
  party_code: string
  name: string
  items: Item[]
}

const itemColumns: ColumnDef<Item>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <div
        className="flex items-center cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Item Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
  },
  {
    accessorKey: 'item_categories.name',
    header: ({ column }) => (
      <div
        className="flex items-center cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Category
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => row.original.item_categories?.name || '-',
  },
  {
    accessorKey: 'purchase_rate',
    header: ({ column }) => (
      <div
        className="flex items-center cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Purchase Rate
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => formatCurrency(row.original.purchase_rate ?? row.original.default_rate),
  },
  {
    accessorKey: 'units.name',
    header: 'Unit',
    cell: ({ row }) => row.original.units?.name || 'N/A',
  },
]

export default function PurchasePartyDetailsPage() {
  const params = useParams<{ id: string }>()
  const supabase = createClient()
  const [party, setParty] = useState<PurchasePartyDetails | null>(null)
  const [categories, setCategories] = useState<ItemCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!params.id) return
    setLoading(true)

    // Fetch purchase party details
    const { data: partyData, error: partyError } = await supabase
      .from('purchase_parties')
      .select('party_code, name')
      .eq('id', params.id)
      .single()

    if (partyError) {
      console.error('Error fetching purchase party:', partyError)
      setParty(null)
      setLoading(false)
      return
    }

    // Fetch items for this purchase party
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('*, units(name), item_categories(name)')
      .eq('purchase_party_id', params.id)
      .is('deleted_at', null)
      .order('name')

    if (itemsError) {
      console.error('Error fetching items:', itemsError)
    }

    // Fetch all categories for filter
    const { data: categoriesData } = await supabase
      .from('item_categories')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')

    if (categoriesData) {
      setCategories(categoriesData)
    }

    setParty({
      party_code: partyData.party_code,
      name: partyData.name,
      items: itemsData || [],
    })

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [params.id])

  if (loading && !party) return <div className="p-6">Loading purchase party details...</div>
  if (!party) return <div className="p-6">Purchase party not found.</div>

  // Filter items by category
  const filteredItems = selectedCategoryId === 'all'
    ? party.items
    : party.items.filter(item => {
        if (selectedCategoryId === 'uncategorized') {
          return !item.item_categories
        }
        return item.item_categories?.name === categories.find(c => c.id === parseInt(selectedCategoryId))?.name
      })

  return (
    <>
      <SetHeader title={`${party.party_code} - ${party.name}`} />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Party Code</h3>
            <p className="text-2xl font-bold font-mono">{party.party_code}</p>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Party Name</h3>
            <p className="text-2xl font-bold">{party.name}</p>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Items</h3>
            <p className="text-2xl font-bold">{filteredItems.length}</p>
            {selectedCategoryId !== 'all' && (
              <p className="text-xs text-muted-foreground mt-1">
                Filtered from {party.items.length} total
              </p>
            )}
          </div>
        </div>

        <DataTable
          columns={itemColumns}
          data={filteredItems}
          loading={loading}
          searchPlaceholder="Search items..."
          customActions={
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>
    </>
  )
}
