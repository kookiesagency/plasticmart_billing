"use client"

import * as React from "react"
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

interface FinancialSummaryChartProps {
  totalReceived: number
  totalOutstanding: number
}

export function FinancialSummaryChart({
  totalReceived,
  totalOutstanding,
}: FinancialSummaryChartProps) {
  const chartData = [
    {
      name: "Received",
      value: totalReceived,
    },
    {
      name: "Outstanding",
      value: totalOutstanding,
    },
  ]

  const chartConfig = {
    value: { label: "Amount" },
    received: { label: "Received", color: "hsl(var(--chart-2))" },
    outstanding: { label: "Outstanding", color: "hsl(var(--chart-5))" },
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Financial Summary</CardTitle>
        <CardDescription>Total Received vs. Outstanding</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-video h-[300px]"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) =>
                `${formatCurrency(value as number).slice(0, -3)}`
              }
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideIndicator />}
            />
            <Bar dataKey="value" radius={8}>
              <Cell fill={chartConfig.received.color} />
              <Cell fill={chartConfig.outstanding.color} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 