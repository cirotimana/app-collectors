"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type ChartItem = {
  metodo: string
  calimaco: number
  proveedor: number
  proceso: string
}

interface BarChartCardProps {
  data: ChartItem[]
  proceso: string
}

export function BarChartCard({ data, proceso }: BarChartCardProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparativa por Recaudador</CardTitle>
          <CardDescription>Sin datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // console.log("data: ",data)

  const t1 = proceso === "venta" ? "Calimaco" : "Recaudador"
  const t2 = proceso === "venta" ? "Recaudador" : "Liquidacion"

  const chartConfig = {
    calimaco: {
      label: t1,
      color: "var(--chart-1)",
    },
    proveedor: {
      label: t2,
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader className="text-lg font-semibold mb-2 text-gray-800">
        <CardTitle>Comparativa por Recaudador</CardTitle>
        <CardDescription>
          Comparativa {t1} vs {t2}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="metodo"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  labelFormatter={(label) => `Metodo: ${label}`}
                //   formatter={(value: unknown) => {
                //   const val = Array.isArray(value) ? value[0] : value
                //   return new Intl.NumberFormat("es-PE", {
                //     style: "currency",
                //     currency: "PEN",
                //   }).format(Number(val))
                // }}


                />
              }
            />
            <Bar dataKey="calimaco" fill="var(--color-calimaco)" radius={6} />
            <Bar dataKey="proveedor" fill="var(--color-proveedor)" radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="text-sm text-gray-500 mt-4">
          Comparativa total por recaudador — Datos segun el filtro aplicado
        </div>
      </CardFooter>
    </Card>
  )
}
