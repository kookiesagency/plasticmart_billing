'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Party } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea'

const partySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bundle_rate: z.coerce.number().min(0).optional(),
  contact_details: z.string().optional(),
})

type PartyFormValues = z.infer<typeof partySchema>

interface PartyFormProps {
  isOpen: boolean
  onClose: () => void
  partyId?: string | null
}

export function PartyForm({ isOpen, onClose, partyId }: PartyFormProps) {
  const supabase = createClient()
  const form = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: '',
      bundle_rate: 0,
      contact_details: '',
    },
  })

  useEffect(() => {
    if (isOpen && partyId) {
      const fetchParty = async () => {
        const { data, error } = await supabase
          .from('parties')
          .select('*')
          .eq('id', partyId)
          .single()
        
        if (error) {
          toast.error('Failed to fetch party details.')
        } else if (data) {
          form.reset({
            name: data.name,
            bundle_rate: data.bundle_rate ?? 0,
            contact_details: data.contact_details ?? '',
          })
        }
      }
      fetchParty()
    } else if (!partyId) {
      form.reset({
        name: '',
        bundle_rate: 0,
        contact_details: '',
      })
    }
  }, [partyId, isOpen, form, supabase])

  const onSubmit = async (values: PartyFormValues) => {
    let error
    if (partyId) {
      const { error: updateError } = await supabase
        .from('parties')
        .update(values)
        .eq('id', partyId)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('parties').insert(values)
      error = insertError
    }

    if (error) {
      toast.error(`Failed to save party: ${error.message}`)
    } else {
      toast.success(`Party ${partyId ? 'updated' : 'created'} successfully.`)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{partyId ? 'Edit Party' : 'Create Party'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Party Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input type="number" placeholder="Enter bundle rate" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Phone: 123-456-7890"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 