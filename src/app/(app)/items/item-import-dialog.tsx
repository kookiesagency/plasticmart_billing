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

    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const requiredFields = ['name', 'default_rate', 'unit_name']
        const headers = results.meta.fields || []
        if (!requiredFields.every(field => headers.includes(field))) {
          return toast.error(`CSV must contain the following headers: ${requiredFields.join(', ')}`)
        }

        const parsedNames = results.data.map(row => row.name?.trim()).filter(Boolean)
        const { data: existingItems, error: dbError } = await supabase
          .from('items')
          .select('name')
          .in('name', parsedNames)

        if (dbError) {
          return toast.error('Could not check for existing items: ' + dbError.message)
        }
        
        const namesInDb = new Set(existingItems.map(item => item.name))
        const namesInCsv = new Set<string>()

        const data = results.data.map(row => {
          const matchingUnit = units.find(u => u.name.toLowerCase() === row.unit_name?.toLowerCase())
          const itemName = row.name?.trim()
          
          let isDuplicate = false;
          if (itemName && (namesInDb.has(itemName) || namesInCsv.has(itemName))) {
            isDuplicate = true;
          }
          if (itemName) {
            namesInCsv.add(itemName);
          }

          const rate = parseFloat(row.default_rate)
          const isInvalid = isNaN(rate)

          return {
            name: itemName,
            default_rate: isInvalid ? 0 : rate,
            unit_name: row.unit_name,
            unit_id: matchingUnit ? matchingUnit.id : `new::${row.unit_name}`,
            is_new_unit: !matchingUnit,
            is_duplicate: isDuplicate,
            is_invalid: isInvalid,
            error_message: isInvalid ? 'Invalid rate value. Rate must be a number.' : undefined,
          }
        })
        onPreview(data)
      },
      error: (error) => toast.error('Error parsing CSV: ' + error.message),
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
        <div>
          <p className="mb-2">Select a CSV file to import. The file must contain 'name', 'default_rate', and 'unit_name' columns.</p>
          <a href="/sample-items.csv" download className="text-sm text-blue-500 hover:underline mb-4 block">
            Download sample CSV template
          </a>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              ${isDragOver ? 'border-primary bg-primary-foreground' : 'border-border'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <Input id="file-upload-input" type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
            <FileUp className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            {file ? 
              <p className="text-muted-foreground"><span className="font-semibold text-primary">{file.name}</span> selected.</p> :
              <p className="text-muted-foreground">Drag & drop a CSV file here, or click to select a file.</p>
            }
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={handleFileParse} disabled={!file}>Parse File and Preview</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
} 