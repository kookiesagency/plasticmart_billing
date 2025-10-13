'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Pencil, Trash, Check, X, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export type Item = {
  id: number
  name: string
  default_rate: number
  purchase_rate?: number | null
  category_id?: number | null
  purchase_party_id?: number | null
  created_at: string
  units: {
    id: number
    name: string
  } | null
  item_categories?: {
    id: number
    name: string
  } | null
  purchase_party?: {
    id: number
    party_code: string
    name: string
  } | null
}

// Inline editable cell component
const InlineEditableCell = ({
  value,
  onSave,
  type = 'text',
  formatValue = (val: any) => val,
  parseValue = (val: string) => val
}: {
  value: any;
  onSave: (newValue: any) => Promise<void>;
  type?: 'text' | 'number';
  formatValue?: (val: any) => string;
  parseValue?: (val: string) => any;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(formatValue(value));
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (editValue === formatValue(value)) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(parseValue(editValue));
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(formatValue(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          type={type}
          step={type === 'number' ? '0.01' : undefined}
          className="h-8 text-sm"
          autoFocus
          disabled={isLoading}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isLoading}
          className="h-6 w-6 p-0"
        >
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isLoading}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[32px] flex items-center"
      onDoubleClick={() => setIsEditing(true)}
    >
      {formatValue(value)}
    </div>
  );
};

export const columns = (
  openDialog: (item: Item) => void,
  handleDelete: (itemId: number) => void,
  handleDuplicate: (item: Item) => void,
  onItemUpdate?: () => void
): ColumnDef<Item>[] => {
  const supabase = createClient();

  const updateItem = async (itemId: number, field: string, value: any) => {
    const { error } = await supabase
      .from('items')
      .update({ [field]: value })
      .eq('id', itemId);
    
    if (error) {
      throw new Error(error.message);
    }
    
    toast.success('Item updated successfully!');
    onItemUpdate?.();
  };

  return [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <div
        className="flex items-center cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <InlineEditableCell
        value={row.original.name}
        onSave={(newValue) => updateItem(row.original.id, 'name', newValue)}
        type="text"
      />
    ),
  },
  {
    accessorKey: 'default_rate',
    header: ({ column }) => (
        <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            Rate
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("default_rate"))
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)

      return (
        <InlineEditableCell
          value={amount}
          onSave={(newValue) => updateItem(row.original.id, 'default_rate', newValue)}
          type="number"
          formatValue={(val) => val.toString()}
          parseValue={(val) => parseFloat(val) || 0}
        />
      )
    },
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
    cell: ({ row }) => {
      const amount = row.getValue("purchase_rate")
      if (amount == null || amount === '') {
        return (
          <InlineEditableCell
            value=""
            onSave={(newValue) => updateItem(row.original.id, 'purchase_rate', newValue || null)}
            type="number"
            formatValue={() => "-"}
            parseValue={(val) => val ? parseFloat(val) : null}
          />
        )
      }

      return (
        <InlineEditableCell
          value={Number(amount)}
          onSave={(newValue) => updateItem(row.original.id, 'purchase_rate', newValue)}
          type="number"
          formatValue={(val) => val.toString()}
          parseValue={(val) => parseFloat(val) || 0}
        />
      )
    },
  },
  {
    accessorKey: 'units.name',
    header: ({ column }) => (
        <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            Unit
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
    ),
    cell: ({ row }) => row.original.units?.name ?? 'N/A',
  },
  {
    accessorKey: 'purchase_party.party_code',
    header: ({ column }) => (
        <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            Purchase Party
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
    ),
    cell: ({ row }) => {
      const party = row.original.purchase_party
      if (!party) return '-'

      // Show party code if available, otherwise show party name
      return party.party_code ? (
        <span className="font-mono font-semibold">{party.party_code}</span>
      ) : (
        <span>{party.name}</span>
      )
    },
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
    cell: ({ row }) => row.original.item_categories?.name ?? '-',
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <div
        className="flex items-center cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Created At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleDuplicate(item)}>
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Duplicate Item</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Item</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                <Trash className="h-4 w-4 text-red-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Item</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
  ]
} 