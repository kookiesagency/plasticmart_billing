'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileUp } from 'lucide-react'
import { ItemToImport } from './item-preview-dialog.tsx'

type Unit = { id: number; name: string; }

interface ItemImportDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onPreview: (data: ItemToImport[]) => void
  units: Unit[]
}

export function ItemImportDialog({ isOpen, onOpenChange, onPreview, units }: ItemImportDialogProps) {
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Helper to normalize names (remove spaces, lowercase)
  function normalizeName(name: string) {
    return name.replace(/\s+/g, '').toLowerCase();
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile)
    } else {
      toast.error('Please drop a valid CSV file.')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleFileParse = () => {
    if (!file) return toast.error('Please select a file to parse.')
    setIsLoading(true)
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const requiredFields = ['name', 'rate', 'unit']
          const headers = results.meta.fields || []
          if (!requiredFields.every(field => headers.includes(field))) {
            toast.error(`CSV must contain the following headers: ${requiredFields.join(', ')}`)
            setIsLoading(false)
            return
          }

          // Normalize all parsed names for duplicate check
          const parsedNames = results.data.map(row => row.name?.trim()).filter(Boolean)
          const normalizedParsedNames = parsedNames.map(normalizeName)
          const { data: existingItems, error: dbError } = await supabase
            .from('items')
            .select('name, deleted_at')
            .in('name', parsedNames)

          if (dbError) {
            toast.error('Could not check for existing items: ' + dbError.message)
            setIsLoading(false)
            return
          }

          // Build normalized sets for active and deleted names
          const activeNames = new Set(existingItems.filter(item => !item.deleted_at).map(item => normalizeName(item.name)))
          const deletedNames = new Set(existingItems.filter(item => !!item.deleted_at).map(item => normalizeName(item.name)))
          const namesInCsv = new Set<string>()

          const data = results.data.map(row => {
            // Use normalized matching for units
            const matchingUnit = units.find(u => normalizeName(u.name) === normalizeName(row.unit))
            const itemName = row.name?.trim()
            const normalized = itemName ? normalizeName(itemName) : ''

            let isDuplicate = false;
            let isDeletedDuplicate = false;
            if (itemName && (activeNames.has(normalized) || namesInCsv.has(normalized))) {
              isDuplicate = true;
            } else if (itemName && deletedNames.has(normalized)) {
              isDuplicate = true;
              isDeletedDuplicate = true;
            }
            if (itemName) {
              namesInCsv.add(normalized);
            }

            const rate = parseFloat(row.rate)
            const isInvalid = isNaN(rate)

            // Parse purchase_rate if present
            let purchaseRate: number | undefined = undefined;
            if (row.purchase_rate !== undefined && row.purchase_rate !== null && row.purchase_rate !== '') {
              const pr = parseFloat(row.purchase_rate)
              if (!isNaN(pr)) purchaseRate = pr
            }

            return {
              name: itemName,
              default_rate: isInvalid ? 0 : rate,
              purchase_rate: purchaseRate,
              unit_name: row.unit,
              unit_id: matchingUnit ? matchingUnit.id : `new::${row.unit}`,
              is_new_unit: !matchingUnit,
              is_duplicate: isDuplicate,
              is_deleted_duplicate: isDeletedDuplicate,
              is_invalid: isInvalid,
              error_message: isInvalid ? 'Invalid rate value. Rate must be a number.' : undefined,
            }
          })
          onPreview(data)
        } finally {
          setIsLoading(false)
        }
      },
      error: (error) => {
        toast.error('Error parsing CSV: ' + error.message)
        setIsLoading(false)
      },
    })
  }

  const resetAndClose = () => {
    setFile(null)
    setIsDragOver(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Items from CSV</DialogTitle>
        </DialogHeader>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </div>
          )}
          <p className="mb-2">Select a CSV file to import. The file must contain <b>'name'</b>, <b>'rate'</b>, <b>'purchase_rate'</b> (optional), and <b>'unit'</b> columns.</p>
          <a href="/sample-items.csv" download className="text-sm text-blue-500 hover:underline mb-4 block">
            Download sample CSV template
          </a>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              ${isDragOver ? 'border-primary bg-primary-foreground' : 'border-border'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => !isLoading && document.getElementById('file-upload-input')?.click()}
            style={isLoading ? { pointerEvents: 'none', opacity: 0.6 } : {}}
          >
            <Input id="file-upload-input" type="file" accept=".csv" className="hidden" onChange={handleFileSelect} disabled={isLoading} />
            <FileUp className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            {file ? 
              <p className="text-muted-foreground"><span className="font-semibold text-primary">{file.name}</span> selected.</p> :
              <p className="text-muted-foreground">Drag & drop a CSV file here, or click to select a file.</p>
            }
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={handleFileParse} disabled={!file || isLoading}>
              {isLoading ? 'Parsing...' : 'Parse File and Preview'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
} 