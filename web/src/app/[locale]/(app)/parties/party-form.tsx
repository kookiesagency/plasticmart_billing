'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
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
  opening_balance: z.coerce.number().optional(),
})

type PartyFormValues = z.infer<typeof partySchema>

interface PartyFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: PartyFormValues, partyId?: string | null) => void
  partyId?: string | null
}

export function PartyForm({ isOpen, onClose, onSubmit, partyId }: PartyFormProps) {
  const t = useTranslations('partyForm')
  const tCommon = useTranslations('common')
  const supabase = createClient()
  const form = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: '',
      bundle_rate: 0,
      opening_balance: 0,
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
          toast.error(t('failedToFetchParty'))
        } else if (data) {
          form.reset({
            name: data.name,
            bundle_rate: data.bundle_rate ?? 0,
            opening_balance: data.opening_balance ?? 0,
          })
        }
      }
      fetchParty()
    } else if (!partyId) {
      form.reset({
        name: '',
        bundle_rate: 0,
        opening_balance: 0,
      })
    }
  }, [partyId, isOpen, form, supabase])

  const handleFormSubmit = (values: PartyFormValues) => {
    onSubmit(values, partyId)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{partyId ? t('editParty') : t('createParty')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('partyName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('partyNamePlaceholder')} {...field} />
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
                  <FormLabel>{t('specificBundleRate')}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={t('enterBundleRate')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="opening_balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('openingBalance')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={t('enterOpeningBalance')}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t('openingBalanceHint')}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{tCommon('cancel')}</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('saving') : tCommon('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 