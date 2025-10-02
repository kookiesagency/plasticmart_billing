'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { convertRate } from '@/lib/unit-conversions'

type ItemUpdate = {
  index: number
  itemId: number | null
  field: 'item_name' | 'rate' | 'item_unit'
  oldValue: string | number
  newValue: string | number
}

type PartyUpdate = {
  field: 'party_name'
  oldValue: string
  newValue: string
}

type UpdateItem = ItemUpdate | PartyUpdate

interface FetchUpdatesDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentItems: any[]
  currentPartyId: number | null
  currentPartyName: string
  latestItems: any[]
  latestPartyName: string
  onApplyUpdates: (updates: UpdateItem[]) => void
}

export function FetchUpdatesDialog({
  isOpen,
  onOpenChange,
  currentItems,
  currentPartyId,
  currentPartyName,
  latestItems,
  latestPartyName,
  onApplyUpdates,
}: FetchUpdatesDialogProps) {
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set())

  // Find all updates
  const updates: UpdateItem[] = []

  // Check party name update
  if (currentPartyName !== latestPartyName) {
    updates.push({
      field: 'party_name',
      oldValue: currentPartyName,
      newValue: latestPartyName,
    })
  }

  // Check item updates
  currentItems.forEach((currentItem, index) => {
    if (!currentItem.item_id) return

    const latestItem = latestItems.find(item => item.id === currentItem.item_id)
    if (!latestItem) return

    // Check item name
    if (currentItem.item_name !== latestItem.name) {
      updates.push({
        index,
        itemId: currentItem.item_id,
        field: 'item_name',
        oldValue: currentItem.item_name,
        newValue: latestItem.name,
      })
    }

    // Check unit
    const currentUnit = currentItem.item_unit
    const latestUnit = latestItem.units?.name || 'N/A'

    if (currentUnit !== latestUnit) {
      updates.push({
        index,
        itemId: currentItem.item_id,
        field: 'item_unit',
        oldValue: currentUnit,
        newValue: latestUnit,
      })
    }

    // Check rate (exact master value, no conversion)
    if (currentItem.rate !== latestItem.default_rate) {
      updates.push({
        index,
        itemId: currentItem.item_id,
        field: 'rate',
        oldValue: currentItem.rate,
        newValue: latestItem.default_rate,
      })
    }
  })

  const toggleUpdate = (updateKey: string) => {
    const newSelected = new Set(selectedUpdates)
    if (newSelected.has(updateKey)) {
      newSelected.delete(updateKey)
    } else {
      newSelected.add(updateKey)
    }
    setSelectedUpdates(newSelected)
  }

  const selectAll = () => {
    setSelectedUpdates(new Set(updates.map((_, i) => `update-${i}`)))
  }

  const deselectAll = () => {
    setSelectedUpdates(new Set())
  }

  const applySelected = () => {
    const selected = updates.filter((_, i) => selectedUpdates.has(`update-${i}`))
    onApplyUpdates(selected)
    onOpenChange(false)
    setSelectedUpdates(new Set())
  }

  const getUpdateLabel = (update: UpdateItem) => {
    if ('index' in update) {
      const itemNum = update.index + 1
      switch (update.field) {
        case 'item_name':
          return `Item #${itemNum} Name`
        case 'rate':
          return `Item #${itemNum} Rate`
        case 'item_unit':
          return `Item #${itemNum} Unit`
      }
    } else {
      return 'Party Name'
    }
  }

  const formatValue = (value: string | number, field: string) => {
    if (field === 'rate' || (typeof value === 'number' && field !== 'item_name')) {
      return `₹${Number(value).toFixed(2)}`
    }
    return value
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Fetch Updated Data
          </DialogTitle>
          <DialogDescription>
            Compare current invoice data with latest database values. Select the updates you want to apply.
          </DialogDescription>
        </DialogHeader>

        {updates.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No updates found. All data is up to date.
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 w-12"></th>
                    <th className="text-left p-3">Field</th>
                    <th className="text-left p-3">Current Value</th>
                    <th className="text-center p-3 w-12"></th>
                    <th className="text-left p-3">New Value</th>
                  </tr>
                </thead>
                <tbody>
                  {updates.map((update, index) => {
                    const updateKey = `update-${index}`
                    const isSelected = selectedUpdates.has(updateKey)

                    return (
                      <tr key={updateKey} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleUpdate(updateKey)}
                          />
                        </td>
                        <td className="p-3 font-medium">{getUpdateLabel(update)}</td>
                        <td className="p-3 text-muted-foreground">
                          {formatValue(update.oldValue, update.field)}
                        </td>
                        <td className="p-3 text-center">
                          <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="p-3 font-medium text-green-600">
                          {formatValue(update.newValue, update.field)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {updates.length > 0 && (
            <Button onClick={applySelected} disabled={selectedUpdates.size === 0}>
              Apply Selected ({selectedUpdates.size})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
