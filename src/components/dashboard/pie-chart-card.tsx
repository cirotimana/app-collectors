"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"

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

export const description = "A pie chart with a label"

const chartData = [
  { browser: "Kashio", visitors: 275, fill: "var(--color-Kashio)" },
  { browser: "Monnet", visitors: 200, fill: "var(--color-Monnet)" },
  { browser: "PagoEfectivo", visitors: 187, fill: "var(--color-PagoEfectivo)" },
  { browser: "Tupay", visitors: 173, fill: "var(--color-Tupay)" },
  { browser: "Kushki", visitors: 90, fill: "var(--color-Kushki)" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  Kashio: {
    label: "Kashio",
    color: "var(--chart-1)",
  },
  PagoEfectivo: {
    label: "PagoEfectivo",
    color: "var(--chart-2)",
  },
  Tupay: {
    label: "Tupay",
    color: "var(--chart-3)",
  },
  Kushki: {
    label: "Kushki",
    color: "var(--chart-4)",
  },
  Monnet: {
    label: "Monnet",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function PieChartCard() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Resumen de venta/liquidacion para Recaudador</CardTitle>
        <CardDescription>01 Oct -15 Oct</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="visitors" label nameKey="browser" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Procentaje establecido segun el filtro aplicado <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Carga automatica de la Ultima Semana
        </div>
      </CardFooter>
    </Card>
  )
}
