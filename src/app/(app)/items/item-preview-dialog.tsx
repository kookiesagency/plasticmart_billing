'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDebouncedCallback } from 'use-debounce'
import { toast } from 'sonner'
import { Trash } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export type ItemToImport = {
  name: string
  default_rate: number
  unit_name: string
  unit_id?: number | string
  is_new_unit: boolean
  is_duplicate: boolean
  is_invalid: boolean
  error_message?: string
}

type Unit = { id: number; name: string; }

interface ItemPreviewDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSuccess: () => void
  units: Unit[]
  initialData: ItemToImport[]
}

export function ItemPreviewDialog({ isOpen, onOpenChange, onSuccess, units, initialData }: ItemPreviewDialogProps) {
  const supabase = createClient()
  const [parsedData, setParsedData] = useState<ItemToImport[]>(initialData)

  useEffect(() => {
    setParsedData(initialData)
  }, [initialData])

  const debouncedNameCheck = useDebouncedCallback(async (index: number, name: string) => {
    const { data } = await supabase.from('items').select('id').eq('name', name).maybeSingle()
    const updatedData = [...parsedData]
    const item = updatedData[index]
    if (item) {
      item.is_duplicate = !!data
      setParsedData(updatedData)
    }
  }, 300)

  const handleRowChange = (index: number, field: 'name' | 'default_rate', value: string) => {
    const updatedData = [...parsedData]
    const item = updatedData[index]

    if (field === 'name') {
      item.name = value
      debouncedNameCheck(index, value)
    } else if (field === 'default_rate') {
      const rate = parseFloat(value)
      const isInvalid = isNaN(rate)
      item.is_invalid = isInvalid
      item.error_message = isInvalid ? 'Invalid rate value. Rate must be a number.' : undefined
      item.default_rate = isInvalid ? 0 : rate
    }

    setParsedData(updatedData)
  }

  const handleUnitChange = (index: number, unitId: number | string) => {
    const updatedData = [...parsedData]
    updatedData[index].unit_id = unitId
    updatedData[index].is_new_unit = typeof unitId === 'string' && unitId.startsWith('new::')
    setParsedData(updatedData)
  }

  const handleRemoveRow = (index: number) => {
    const updatedData = [...parsedData];
    updatedData.splice(index, 1);
    setParsedData(updatedData);
  };

  const handleImportConfirm = async () => {
    if (parsedData.some(item => !item.unit_id)) {
      return toast.error('Please map all items to a unit.')
    }
    
    const finalItemNames = parsedData.map(item => item.name);
    const { data: existingItems, error: dbError } = await supabase
      .from('items')
      .select('name')
      .in('name', finalItemNames);

    if (dbError) {
      return toast.error('Could not verify item names before import: ' + dbError.message);
    }
    const existingNames = new Set(existingItems.map(item => item.name));
    
    const finalParsedData = parsedData.map(item => ({ ...item, is_duplicate: existingNames.has(item.name) }))
    setParsedData(finalParsedData)

    const itemsToProcess = finalParsedData.filter(item => !item.is_duplicate && !item.is_invalid)
    if (itemsToProcess.length === 0) {
      return toast.info('No valid items to import.')
    }

    const newUnitNames = Array.from(new Set(itemsToProcess.filter(item => item.is_new_unit).map(item => item.unit_name)))
    let newUnits: Unit[] = []
    if (newUnitNames.length > 0) {
        const { data, error } = await supabase.from('units').insert(newUnitNames.map(name => ({ name: name }))).select()
        if (error) return toast.error('Failed to create new units: ' + error.message)
        newUnits = data as Unit[]
    }

    const unitMap = new Map(units.concat(newUnits).map(u => [u.name.toLowerCase(), u.id]))
    const itemsToInsert = itemsToProcess.map(item => ({
        name: item.name,
        default_rate: item.default_rate,
        unit_id: typeof item.unit_id === 'number' ? item.unit_id : unitMap.get(item.unit_name.toLowerCase()),
    }))

    if (itemsToInsert.some(item => !item.unit_id)) {
        return toast.error("Some units couldn't be mapped. Please review your selections.");
    }

    const { error: insertError } = await supabase.from('items').insert(itemsToInsert)
    if (insertError) return toast.error('Failed to import items: ' + insertError.message)
    
    const finalDuplicates = finalParsedData.filter(item => item.is_duplicate).length
    const finalErrors = finalParsedData.filter(item => item.is_invalid).length
    
    toast.success(`${itemsToInsert.length} items imported successfully!`)
    if (finalDuplicates > 0) toast.info(`${finalDuplicates} duplicate items were skipped.`)
    if (finalErrors > 0) toast.warning(`${finalErrors} items with errors were skipped.`)
    
    onSuccess()
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col">
        <div className="flex flex-col h-full p-6">
          <DialogHeader className="p-0 pb-6">
            <DialogTitle>Preview and Map Units</DialogTitle>
            <DialogDescription>
              Preview and map units for the items you're importing.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-grow overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Name</TableHead>
                  <TableHead className="w-[15%]">Default Rate</TableHead>
                  <TableHead className="w-[15%]">Unit Name from CSV</TableHead>
                  <TableHead className="w-[20%]">Map to Unit</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                  <TableHead className="w-[5%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.map((item, index) => (
                  <TableRow key={index} className={item.is_invalid ? 'bg-orange-100' : item.is_duplicate ? 'bg-red-100' : item.is_new_unit ? 'bg-yellow-100' : ''}>
                    <TableCell>
                      <Input value={item.name} onChange={(e) => handleRowChange(index, 'name', e.target.value)} className="border-transparent focus:border-primary bg-transparent" />
                    </TableCell>
                    <TableCell>
                      <Input value={item.default_rate ? String(item.default_rate) : ''} onChange={(e) => handleRowChange(index, 'default_rate', e.target.value)} className={item.is_invalid ? 'border-red-500' : 'border-transparent focus:border-primary bg-transparent'} placeholder="Enter rate" />
                    </TableCell>
                    <TableCell>{item.unit_name}</TableCell>
                    <TableCell>
                      <Select onValueChange={(value) => handleUnitChange(index, value.startsWith('new::') ? value : parseInt(value, 10))} defaultValue={String(item.unit_id)} disabled={item.is_duplicate || item.is_invalid}>
                        <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                        <SelectContent>
                          {item.is_new_unit && <SelectItem value={String(item.unit_id)}>Create new unit: "{item.unit_name}"</SelectItem>}
                          {units.map(unit => <SelectItem key={unit.id} value={String(unit.id)}>{unit.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.is_duplicate && <Badge variant="destructive" className="text-xs">Duplicate</Badge>}
                        {item.is_invalid && <Badge variant="destructive" className="text-xs">{item.error_message}</Badge>}
                        {item.is_new_unit && !item.is_duplicate && !item.is_invalid && <Badge variant="secondary" className="text-xs">New Unit</Badge>}
                        {!item.is_duplicate && !item.is_invalid && !item.is_new_unit && <Badge variant="success" className="text-xs">Ready</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(index)}>
                            <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="mt-4 flex-shrink-0 p-0 pt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handleImportConfirm}>Confirm and Import</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
} 