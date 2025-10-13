'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DateRange } from 'react-day-picker'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useTranslations } from 'next-intl'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'

interface SalesChartProps {
  dateRange?: DateRange
}

type ChartData = {
  date: string
  total_billed: number
}

export function SalesChart({ dateRange }: SalesChartProps) {
  const t = useTranslations('dashboard')
  const supabase = createClient()
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChartData() {
      if (!dateRange?.from || !dateRange?.to) return

      setLoading(true)
      const { data: chartData, error } = await supabase.rpc('get_chart_data', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      })

      if (error) {
        console.error('Error fetching chart data:', error)
        setData([])
      } else {
        setData(chartData)
      }
      setLoading(false)
    }

    fetchChartData()
  }, [dateRange])

  const chartConfig = {
    total_billed: {
      label: t('sales'),
      color: 'hsl(var(--primary))',
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('salesOverview')}</CardTitle>
        <CardDescription>
          {t('salesOverviewDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  width={80}
                />
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2 bg-background border rounded-md shadow-lg">
                           <p className="font-bold">{format(parseISO(payload[0].payload.date), 'PPP')}</p>
                           <p style={{ color: chartConfig.total_billed.color }}>
                            {t('sales')}: {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total_billed" fill="var(--color-total_billed)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
} 