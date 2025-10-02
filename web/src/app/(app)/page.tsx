'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { SetHeader } from '@/components/layout/header-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, FileText, AlertCircle } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { startOfWeek, startOfMonth, startOfYear, endOfDay, formatISO } from 'date-fns'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SalesChart } from './sales-chart'
import { FinancialSummaryChart } from './financial-summary-chart'

type RecentInvoice = {
  id: number;
  party: { name: string } | { name: string }[] | null;
  total_amount: number;
  status: 'Paid' | 'Partial' | 'Pending';
};

export default function Dashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    totalReceived: 0,
    totalOutstanding: 0,
    totalBilled: 0,
    totalInvoices: 0,
  })
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: endOfDay(new Date()),
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      
      const params = {
        start_date: dateRange?.from ? formatISO(dateRange.from, { representation: 'date' }) : null,
        end_date: dateRange?.to ? formatISO(dateRange.to, { representation: 'date' }) : null,
      }

      const statsPromise = supabase.rpc('get_dashboard_stats', params)
      const invoicesPromise = supabase
        .from('invoices')
        .select('id, party:parties!inner(name), total_amount, status')
        .order('invoice_date', { ascending: false })
        .limit(5)

      const [statsResult, invoicesResult] = await Promise.all([statsPromise, invoicesPromise]);

      // Handle stats result
      const { data: statsData, error: statsError } = statsResult;
      if (statsError) {
        console.error('Error fetching dashboard stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        const stats = statsData[0]
        setStats({
          totalReceived: stats.total_received || 0,
          totalOutstanding: stats.total_outstanding || 0,
          totalBilled: stats.total_billed || 0,
          totalInvoices: stats.total_invoices || 0,
        });
      }

      // Handle invoices result
      const { data: invoicesData, error: invoicesError } = invoicesResult;
      if (invoicesError) {
        console.error('Error fetching recent invoices:', invoicesError);
      } else {
        setRecentInvoices(invoicesData as RecentInvoice[]);
      }

      setLoading(false)
    }

    fetchData()
  }, [dateRange])

  const handlePresetRangeChange = (value: string) => {
    const now = new Date()
    let fromDate: Date | undefined;

    if (value === 'week') fromDate = startOfWeek(now)
    else if (value === 'month') fromDate = startOfMonth(now)
    else if (value === 'year') fromDate = startOfYear(now)
    else {
      setDateRange(undefined)
      return
    }
    setDateRange({ from: fromDate, to: endOfDay(now) })
  }

  const statCards = [
    { title: 'Total Received', value: formatCurrency(stats.totalReceived), icon: DollarSign },
    { title: 'Total Outstanding', value: formatCurrency(stats.totalOutstanding), icon: AlertCircle },
    { title: 'Total Billed', value: formatCurrency(stats.totalBilled), icon: FileText },
    { title: 'Total Invoices', value: stats.totalInvoices, icon: FileText },
  ]

  return (
    <>
      <SetHeader title="Dashboard" />
      <div className="flex justify-end items-center space-x-2 mb-4">
        <Tabs defaultValue="year" onValueChange={handlePresetRangeChange}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
          </TabsList>
        </Tabs>
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-1/3 mt-1" />
                </CardContent>
              </Card>
            ))
          ) : (
            statCards.map((card, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SalesChart dateRange={dateRange} />
          <FinancialSummaryChart totalReceived={stats.totalReceived} totalOutstanding={stats.totalOutstanding} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center">
                    <div className="flex-grow">
                      <p className="font-medium">
                        {Array.isArray(invoice.party) ? invoice.party[0]?.name : invoice.party?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(invoice.total_amount)}
                      </p>
                    </div>
                    <Badge variant={
                      invoice.status === 'Paid' ? 'paid' :
                      invoice.status === 'Partial' ? 'partial' : 'destructive'
                    }>
                      {invoice.status}
                    </Badge>
                    <Button asChild variant="ghost" size="sm" className="ml-4">
                      <Link href={`/invoices/${invoice.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
