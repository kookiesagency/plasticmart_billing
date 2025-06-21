'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash, ArrowUpDown } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { DataTable } from '@/components/data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from '@/components/ui/checkbox'

// Schema for form validation
const partySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bundle_rate: z.coerce.number().min(0).optional(),
  contact_details: z.string().optional(),
})

export type Party = {
  id: number
  name: string
  bundle_rate: number | null
  contact_details: string | null
}

export default function PartyManager() {
  const supabase = createClient()
  const [parties, setParties] = useState<Party[]>([])
  const [deletedParties, setDeletedParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<Party | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deletingPartyId, setDeletingPartyId] = useState<number | null>(null)
  const [restoringPartyId, setRestoringPartyId] = useState<number | null>(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[] | null>(null)

  const columns = (
    openDialog: (party: Party) => void,
    handleDelete: (partyId: number) => void
  ): ColumnDef<Party>[] => [
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
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
    },
    {
      accessorKey: 'bundle_rate',
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Bundle Rate
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => row.original.bundle_rate ?? 'Default',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const party = row.original;
        return (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="icon" onClick={() => openDialog(party)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDelete(party.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const form = useForm<z.infer<typeof partySchema>>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: '',
      bundle_rate: 0,
      contact_details: '',
    },
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [activeRes, deletedRes] = await Promise.all([
      supabase.from('parties').select('*').is('deleted_at', null).order('name', { ascending: true }),
      supabase.from('parties').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
    ])

    if (activeRes.error) toast.error('Error fetching parties: ' + activeRes.error.message)
    else setParties(activeRes.data as Party[])

    if (deletedRes.error) toast.error('Error fetching deleted parties: ' + deletedRes.error.message)
    else setDeletedParties(deletedRes.data as Party[])
    
    setLoading(false)
  }

  const openDialog = (party: Party | null = null) => {
    setEditingParty(party)
    if (party) {
      form.reset({
        name: party.name,
        bundle_rate: party.bundle_rate || 0,
        contact_details: party.contact_details || '',
      })
    } else {
      form.reset({ name: '', bundle_rate: 0, contact_details: '' })
    }
    setIsDialogOpen(true)
  }
  
  const onSubmit = async (values: z.infer<typeof partySchema>) => {
    const partyData = {
        name: values.name,
        bundle_rate: values.bundle_rate,
        contact_details: values.contact_details,
    }

    let error
    if (editingParty) {
      const { error: updateError } = await supabase
        .from('parties')
        .update(partyData)
        .eq('id', editingParty.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('parties').insert(partyData)
      error = insertError
    }

    if (error) {
      toast.error('Failed to save party: ' + error.message)
    } else {
      toast.success(`Party ${editingParty ? 'updated' : 'created'} successfully!`)
      setIsDialogOpen(false)
      fetchData()
    }
  }

  const handleDelete = (partyId: number) => {
    setDeletingPartyId(partyId)
    setIsConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingPartyId) return
    const { error } = await supabase.from('parties').update({ deleted_at: new Date().toISOString() }).eq('id', deletingPartyId)
    if (error) {
      toast.error('Failed to delete party: ' + error.message)
    } else {
      toast.success('Party deleted successfully!')
      fetchData()
    }
    setDeletingPartyId(null)
  }

  const handleBulkDelete = (selectedParties: Party[]) => {
    setBulkDeleteIds(selectedParties.map(p => p.id))
    setIsConfirmOpen(true)
  }

  const confirmBulkDelete = async () => {
    if (!bulkDeleteIds) return
    const { error } = await supabase.from('parties').update({ deleted_at: new Date().toISOString() }).in('id', bulkDeleteIds)
    if (error) {
      toast.error(`Failed to delete ${bulkDeleteIds.length} parties: ` + error.message)
    } else {
      toast.success(`${bulkDeleteIds.length} parties deleted successfully!`)
      fetchData()
    }
    setBulkDeleteIds(null)
  }

  const handleRestore = (partyId: number) => {
    setRestoringPartyId(partyId)
    setIsConfirmOpen(true)
  }

  const confirmRestore = async () => {
    if (!restoringPartyId) return
    const { error } = await supabase.from('parties').update({ deleted_at: null }).eq('id', restoringPartyId)
    if (error) {
      toast.error('Failed to restore party: ' + error.message)
    } else {
      toast.success('Party restored successfully!')
      fetchData()
    }
    setRestoringPartyId(null)
  }

  const deletedPartyColumns: ColumnDef<Party & { deleted_at: string }>[] = [
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
    },
    {
      accessorKey: 'bundle_rate',
      header: ({ column }) => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Bundle Rate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => row.original.bundle_rate ?? 'Default',
    },
    {
      accessorKey: 'deleted_at',
      header: ({ column }) => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Deleted At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => new Date(row.original.deleted_at).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRestore(row.original.id)}
          >
            Restore
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="border rounded-lg p-4">
      <Tabs defaultValue="active">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="deleted">Deleted</TabsTrigger>
          </TabsList>
          <Button onClick={() => openDialog()}>Create Party</Button>
        </div>
        <TabsContent value="active">
          {loading ? <p>Loading...</p> : <DataTable columns={columns(openDialog, handleDelete)} data={parties} searchKey="name" onBulkDelete={handleBulkDelete} initialSorting={[{ id: 'name', desc: false }]} />}
        </TabsContent>
        <TabsContent value="deleted">
          {loading ? <p>Loading...</p> : <DataTable columns={deletedPartyColumns} data={deletedParties as (Party & { deleted_at: string })[]} searchKey="name" initialSorting={[{ id: 'deleted_at', desc: true }]} />}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingParty ? 'Edit Party' : 'Create Party'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Name</FormLabel>
                    <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bundle_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Bundle Rate (Optional)</FormLabel>
                    <FormControl><Input type="number" placeholder="Enter bundle rate" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Details</FormLabel>
                    <FormControl><Textarea placeholder='e.g., Phone: 123-456-7890, Email: user@example.com' {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setDeletingPartyId(null)
          setRestoringPartyId(null)
          setBulkDeleteIds(null)
        }}
        onConfirm={() => {
          if (deletingPartyId) confirmDelete()
          else if (restoringPartyId) confirmRestore()
          else if (bulkDeleteIds) confirmBulkDelete()
        }}
        title="Are you sure?"
        description={
          bulkDeleteIds
            ? `This action cannot be undone. This will mark ${bulkDeleteIds.length} parties as deleted.`
            : deletingPartyId
            ? "This action cannot be undone. This will mark the party as deleted."
            : "This will restore the party and make it active again."
        }
      />
    </div>
  )
} 