'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDebouncedCallback } from 'use-debounce'
import { toast } from 'sonner'
import { Trash, Undo } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useTranslations } from 'next-intl'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export type ItemToImport = {
  name: string
  default_rate: number
  purchase_rate?: number | null
  unit_name: string
  unit_id?: number | string
  is_new_unit: boolean
  is_duplicate: boolean
  is_invalid: boolean
  error_message?: string
  is_deleted_duplicate: boolean
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
  const t = useTranslations('items')
  const tCommon = useTranslations('common')
  const tInvoices = useTranslations('invoices')
  const supabase = createClient()
  const [parsedData, setParsedData] = useState<ItemToImport[]>(initialData)
  const [restoringIndex, setRestoringIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setParsedData(initialData)
  }, [initialData])

  // Helper to normalize names (remove spaces, lowercase)
  function normalizeName(name: string) {
    return name.replace(/\s+/g, '').toLowerCase();
  }

  // Helper to update duplicate status for all rows
  function updateDuplicateStatus(data: ItemToImport[], dbNames: Set<string> = new Set()) {
    // Count normalized names in the preview list
    const nameCounts: Record<string, number> = {};
    data.forEach(item => {
      const norm = normalizeName(item.name || '')
      nameCounts[norm] = (nameCounts[norm] || 0) + 1
    })
    return data.map(item => {
      const norm = normalizeName(item.name || '')
      const isDbDuplicate = dbNames.has(norm)
      const isPreviewDuplicate = nameCounts[norm] > 1
      return {
        ...item,
        is_duplicate: isDbDuplicate || isPreviewDuplicate,
        is_deleted_duplicate: item.is_deleted_duplicate // keep as is for now
      }
    })
  }

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
      item.is_duplicate = false
      item.is_deleted_duplicate = false
      // After changing the name, update duplicate status for all rows
      setParsedData(updateDuplicateStatus(updatedData))
      debouncedNameCheck(index, value)
    } else if (field === 'default_rate') {
      const rate = parseFloat(value)
      const isInvalid = isNaN(rate)
      item.is_invalid = isInvalid
      item.error_message = isInvalid ? 'Invalid rate value. Rate must be a number.' : undefined
      item.default_rate = isInvalid ? 0 : rate
      setParsedData(updatedData)
    }
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

  // Restore item by name (for deleted duplicates)
  const handleRestore = async (itemName: string, index: number) => {
    setRestoringIndex(index)
    const { data, error } = await supabase
      .from('items')
      .update({ deleted_at: null })
      .eq('name', itemName)
      .not('deleted_at', 'is', null)
      .select('id')
    if (error) {
      toast.error(t('failedToRestoreItem', { error: error.message }))
    } else {
      toast.success(t('itemRestoredSuccess'))
      // Update preview row: no longer a duplicate
      const updated = [...parsedData]
      updated[index].is_duplicate = false
      updated[index].is_deleted_duplicate = false
      setParsedData(updated)
    }
    setRestoringIndex(null)
  }

  // Helper to get normalized unit map
  function getNormalizedUnitMap(units: Unit[]) {
    const map = new Map<string, Unit>()
    units.forEach(u => map.set(normalizeName(u.name), u))
    return map
  }

  const handleImportConfirm = async () => {
    setIsLoading(true)
    try {
      if (parsedData.some(item => !item.unit_id)) {
        toast.error(t('mapAllItemsError'))
        return
      }
      // Use normalized names for duplicate check
      const finalItemNames = parsedData.map(item => item.name)
      const normalizedFinalNames = finalItemNames.map(normalizeName)
      const { data: existingItems, error: dbError } = await supabase
        .from('items')
        .select('name')
        .in('name', finalItemNames)

      if (dbError) {
        toast.error(t('couldNotVerifyNames', { error: dbError.message }))
        return
      }
      // Build normalized set of existing names
      const existingNames = new Set(existingItems.map(item => normalizeName(item.name)))
      // Update duplicate status for all rows (preview + db)
      const finalParsedData = updateDuplicateStatus(parsedData, existingNames)
      setParsedData(finalParsedData)

      // Build normalized unit map from existing units
      const normalizedUnitMap = getNormalizedUnitMap(units)
      // Collect new unit names (normalized, deduped)
      const newUnitNames = Array.from(
        new Set(
          finalParsedData
            .filter(item => {
              const norm = normalizeName(item.unit_name)
              return !normalizedUnitMap.has(norm)
            })
            .map(item => item.unit_name)
        )
      )
      let newUnits: Unit[] = []
      if (newUnitNames.length > 0) {
        const { data, error } = await supabase.from('units').insert(newUnitNames.map(name => ({ name: name }))).select()
        if (error) { toast.error(t('failedToCreateUnits', { error: error.message })); return }
        newUnits = data as Unit[]
      }
      // Merge all units (existing + new) into normalized map
      const allUnits = units.concat(newUnits)
      const allUnitMap = getNormalizedUnitMap(allUnits)
      const itemsToInsert = finalParsedData.filter(item => !item.is_duplicate && !item.is_invalid).map(item => {
        const base = {
          name: item.name,
          default_rate: item.default_rate,
          unit_id: typeof item.unit_id === 'number' ? item.unit_id : allUnitMap.get(normalizeName(item.unit_name))?.id,
        };
        if (item.purchase_rate !== undefined) {
          return { ...base, purchase_rate: item.purchase_rate };
        }
        return base;
      })

      if (itemsToInsert.some(item => !item.unit_id)) {
          toast.error(t('unitsCouldNotBeMapped'));
          return
      }

      const { error: insertError, data: insertedItems } = await supabase.from('items').insert(itemsToInsert).select('id, name');
      if (insertError) { toast.error(t('failedToCreateItem', { error: insertError.message })); return }

      // Patch activity_logs for each imported item to add imported_via: 'import'
      if (insertedItems && Array.isArray(insertedItems)) {
        for (const item of insertedItems) {
          // Find the log for this item (created in the last 2 minutes)
          const { data: logs, error: findLogError } = await supabase
            .from('activity_logs')
            .select('id, details, created_at')
            .eq('target_table', 'items')
            .eq('action', 'INSERT')
            .eq('target_id', String(item.id))
            .order('created_at', { ascending: false })
            .limit(1);
          if (findLogError) {
            toast.error(`Error finding log for item ${item.name}: ${findLogError.message}`);
            continue;
          }
          if (logs && logs.length > 0) {
            const log = logs[0];
            // Deep clone details to avoid mutation issues
            const details = JSON.parse(JSON.stringify(log.details || {}));
            if (details.new_data) {
              details.new_data.imported_via = 'import';
              const { error: updateError } = await supabase.from('activity_logs').update({ details }).eq('id', log.id);
              if (updateError) {
                toast.error(`Error updating log for item ${item.name}: ${updateError.message}`);
              }
            }
          }
        }
      }

      // Restore the dialog UI
      const finalDuplicates = finalParsedData.filter(item => item.is_duplicate).length
      const finalErrors = finalParsedData.filter(item => item.is_invalid).length
      toast.success(t('itemsImportedSuccess', { count: itemsToInsert.length }))
      if (finalDuplicates > 0) toast.info(t('duplicateItemsSkipped', { count: finalDuplicates }))
      if (finalErrors > 0) toast.warning(t('itemsWithErrorsSkipped', { count: finalErrors }))
      onSuccess()
    } finally {
      setIsLoading(false)
    }
  }

  // Refs for each input field per row
  const nameRefs = useRef<(HTMLInputElement | null)[]>([])
  const rateRefs = useRef<(HTMLInputElement | null)[]>([])
  const purchaseRateRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-select effect for each input (runs on every render)
  useEffect(() => {
    parsedData.forEach((_, index) => {
      const nameInput = nameRefs.current[index]
      const rateInput = rateRefs.current[index]
      const purchaseRateInput = purchaseRateRefs.current[index]
      if (nameInput) {
        const onFocus = () => nameInput.select()
        nameInput.addEventListener('focus', onFocus)
        return () => nameInput.removeEventListener('focus', onFocus)
      }
      if (rateInput) {
        const onFocus = () => rateInput.select()
        rateInput.addEventListener('focus', onFocus)
        return () => rateInput.removeEventListener('focus', onFocus)
      }
      if (purchaseRateInput) {
        const onFocus = () => purchaseRateInput.select()
        purchaseRateInput.addEventListener('focus', onFocus)
        return () => purchaseRateInput.removeEventListener('focus', onFocus)
      }
    })
    // No cleanup needed since listeners are re-attached on every render
  }, [parsedData])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col">
        <div className="flex flex-col h-full relative">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80">
              <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </div>
          )}
          <div className="flex flex-col h-full p-6">
            <DialogHeader className="p-0 pb-6">
              <DialogTitle>{t('previewMapUnits')}</DialogTitle>
              <DialogDescription>
                {t('previewMapDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">{t('name')}</TableHead>
                    <TableHead className="w-[15%]">{t('defaultRate')}</TableHead>
                    <TableHead className="w-[15%]">{t('purchaseRate')}</TableHead>
                    <TableHead className="w-[15%]">{t('unitNameFromCsv')}</TableHead>
                    <TableHead className="w-[20%]">{t('mapToUnit')}</TableHead>
                    <TableHead className="w-[15%]">{tInvoices('status')}</TableHead>
                    <TableHead className="w-[5%] text-right">{tCommon('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((item, index) => (
                    <TableRow key={index} className={item.is_invalid ? 'bg-orange-100' : item.is_duplicate ? 'bg-red-100' : item.is_new_unit ? 'bg-yellow-100' : ''}>
                      <TableCell>
                        <Input
                          ref={el => { nameRefs.current[index] = el; }}
                          value={item.name}
                          onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                          className="border-transparent focus:border-primary bg-transparent"
                          onFocus={e => setTimeout(() => e.target.select(), 0)}
                          onMouseDown={e => {
                            if (document.activeElement !== e.currentTarget) {
                              e.preventDefault();
                              e.currentTarget.focus();
                              e.currentTarget.select();
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          ref={el => { rateRefs.current[index] = el; }}
                          value={item.default_rate ? String(item.default_rate) : ''}
                          onChange={(e) => handleRowChange(index, 'default_rate', e.target.value.replace(/[^\d.]/g, ''))}
                          className={item.is_invalid ? 'border-red-500' : 'border-transparent focus:border-primary bg-transparent'}
                          placeholder={t('enterRate')}
                          type="text"
                          onFocus={e => setTimeout(() => e.target.select(), 0)}
                          onMouseDown={e => {
                            if (document.activeElement !== e.currentTarget) {
                              e.preventDefault();
                              e.currentTarget.focus();
                              e.currentTarget.select();
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          ref={el => { purchaseRateRefs.current[index] = el; }}
                          value={item.purchase_rate != null ? String(item.purchase_rate) : ''}
                          onChange={e => {
                            const updatedData = [...parsedData];
                            const val = e.target.value.replace(/[^\d.]/g, '');
                            updatedData[index].purchase_rate = val === '' ? undefined : parseFloat(val);
                            setParsedData(updatedData);
                          }}
                          className="border-transparent focus:border-primary bg-transparent"
                          placeholder={t('enterPurchaseRate')}
                          type="text"
                          onFocus={e => setTimeout(() => e.target.select(), 0)}
                          onMouseDown={e => {
                            if (document.activeElement !== e.currentTarget) {
                              e.preventDefault();
                              e.currentTarget.focus();
                              e.currentTarget.select();
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{item.unit_name}</TableCell>
                      <TableCell>
                        <Select onValueChange={(value) => handleUnitChange(index, value.startsWith('new::') ? value : parseInt(value, 10))} defaultValue={String(item.unit_id)} disabled={item.is_duplicate || item.is_invalid}>
                          <SelectTrigger><SelectValue placeholder={t('selectUnit')} /></SelectTrigger>
                          <SelectContent>
                            {/* Only show 'Create new unit' if not present in normalized units */}
                            {!units.some(u => normalizeName(u.name) === normalizeName(item.unit_name)) && (
                              <SelectItem value={String(item.unit_id)}>{t('createNewUnit')}: "{item.unit_name}"</SelectItem>
                            )}
                            {units.map(unit => <SelectItem key={unit.id} value={String(unit.id)}>{unit.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          {item.is_duplicate && !item.is_deleted_duplicate && <Badge variant="destructive" className="text-xs">{t('duplicate')}</Badge>}
                          {item.is_deleted_duplicate && (
                            <span className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium border border-yellow-300 bg-yellow-100 text-yellow-800">{t('duplicateInDeleted')}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="ml-1"
                                    disabled={restoringIndex === index}
                                    onClick={() => handleRestore(item.name, index)}
                                  >
                                    {restoringIndex === index ? (
                                      <span className="animate-spin"><Undo className="h-4 w-4 text-yellow-700" /></span>
                                    ) : (
                                      <Undo className="h-4 w-4 text-yellow-700" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('restoreItem')}</TooltipContent>
                              </Tooltip>
                            </span>
                          )}
                          {item.is_invalid && <Badge variant="destructive" className="text-xs">{item.error_message}</Badge>}
                          {item.is_new_unit && !item.is_duplicate && !item.is_invalid && <Badge variant="secondary" className="text-xs">{t('newUnit')}</Badge>}
                          {!item.is_duplicate && !item.is_invalid && !item.is_new_unit && <Badge variant="success" className="text-xs">{t('ready')}</Badge>}
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
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>{tCommon('close')}</Button>
              <Button onClick={handleImportConfirm} disabled={isLoading}>
                {isLoading ? t('importing') : t('confirmImport')}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}