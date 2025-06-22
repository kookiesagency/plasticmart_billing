'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

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

const bundleRateSchema = z.object({
  rate: z.coerce.number().min(0, 'Rate must be a positive number'),
})

export default function BundleRateManager() {
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
        toast.error('Failed to fetch bundle rate: ' + error.message)
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
      toast.error('Failed to save bundle rate: ' + error.message)
    } else {
      toast.success('Default bundle rate saved successfully!')
    }
  }

  return (
    <div>
      <h3 className="text-lg font-medium">Default Bundle Rate</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Set the default rate used for calculating invoice totals based on bundle quantity.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
          <FormField
            control={form.control}
            name="rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bundle Rate</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter default rate" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading || form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : 'Save Rate'}
          </Button>
        </form>
      </Form>
    </div>
  )
} 