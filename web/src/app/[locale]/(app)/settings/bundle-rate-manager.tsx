'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export default function BundleRateManager() {
  const t = useTranslations('settings')

  const bundleRateSchema = z.object({
    rate: z.coerce.number().min(0, t('ratePositiveValidation')),
  })
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof bundleRateSchema>>({
    resolver: zodResolver(bundleRateSchema),
    defaultValues: {
      rate: 0,
    },
  })

  useEffect(() => {
    const fetchBundleRate = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'default_bundle_rate')
        .single()

      if (data) {
        form.setValue('rate', parseFloat(data.value))
      }
      if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error if no setting exists
        toast.error(t('failedToFetchBundleRate', { error: error.message }))
      }
      setLoading(false)
    }

    fetchBundleRate()
  }, [form, supabase])

  const onSubmit = async (values: z.infer<typeof bundleRateSchema>) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'default_bundle_rate', value: values.rate.toString() })

    if (error) {
      toast.error(t('failedToSaveBundleRate', { error: error.message }))
    } else {
      toast.success(t('bundleRateSavedSuccess'))
    }
  }

  return (
    <div>
      <h3 className="text-lg font-medium">{t('defaultBundleRate')}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {t('bundleRateDescription')}
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
          <FormField
            control={form.control}
            name="rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('bundleRateLabel')}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder={t('enterDefaultRatePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading || form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t('saving') : t('saveRate')}
          </Button>
        </form>
      </Form>
    </div>
  )
} 