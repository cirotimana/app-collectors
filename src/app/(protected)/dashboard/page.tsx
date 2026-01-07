"use client"

import * as React from "react"
import { format, subDays } from "date-fns"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { Filters } from "@/components/dashboard/filters"
import { ReconciliationTable } from "@/components/dashboard/reconciliation-table"
import { PieChartCard } from "@/components/dashboard/pie-chart-card"
import { BarChartCard } from "@/components/dashboard/bar-chart-card"
import { RoleGuard } from "@/components/auth/RoleGuard"
import { ROLES } from "@/lib/permissions"

export default function DashboardPage() {
  /* const [filters, setFilters] = React.useState({
    proceso: "liquidacion",
    metodo: "kashio",
    fromDate: "",
    toDate: ""
  }) */

  const [filters, setFilters] = React.useState(() => {
     const today = new Date()
     const lastWeek = subDays(today, 7)
     return {
       proceso: "liquidacion",
       metodo: "kashio",
       fromDate: format(lastWeek, "yyyyMMdd"),
       toDate: format(today, "yyyyMMdd")
     }
  })

  const [stats, setStats] = React.useState({
    ventaCalimaco: 0,
    ventaProveedor: 0,
    t1: "",
    t2: ""
  })

  const [chartData, setChartData] = React.useState<
    { metodo: string; calimaco: number; proveedor: number; proceso: string }[]
  >([])

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const collectorMap: Record<string, number> = {
          kashio: 1,
          monnet: 2,
          kushki: 3,
          niubiz: 4,
          yape: 5,
          nuvei: 6,
          "pago-efectivo": 7,
          safetypay: 8,
          tupay: 9,
          prometeo: 10
        }

        const proceso =
          filters.proceso === "liquidacion" ? "liquidations" : "conciliations"

        const today = new Date()
        const lastWeek = new Date(today)
        lastWeek.setDate(today.getDate() - 7)

        const fromDate = filters.fromDate || lastWeek.toISOString().split("T")[0]
        const toDate = filters.toDate || today.toISOString().split("T")[0]

        const metodos = filters.metodo.split(",").map(m => m.trim())

        let totalVentaCalimaco = 0
        let totalVentaProveedor = 0
        const chartRows: { metodo: string; calimaco: number; proveedor: number; proceso: string }[] = []

        // console.log("proceso: ", proceso)
        // console.log("metodos: ", metodos)


        for (const metodo of metodos) {
          const collectorId = collectorMap[metodo]
          if (!collectorId) continue

          try {
            const { dashboardApi } = await import('@/lib/api')
            const data = await dashboardApi.getStats(collectorId, fromDate, toDate, proceso as 'liquidations' | 'conciliations')

          let calimaco = 0
          let proveedor = 0

          if (proceso === "conciliations") {
            calimaco = data.totalAmount || 0
            proveedor = data.totalAmountCollector || 0
          } else {
            calimaco = data.totalAmountCollector || 0
            proveedor = data.totalAmountLiquidation || 0
          }

          totalVentaCalimaco += calimaco
          totalVentaProveedor += proveedor

            chartRows.push({
              metodo,
              calimaco,
              proveedor,
              proceso
            })
          } catch (error) {
            console.error(`Error al obtener stats para ${metodo}:`, error)
            continue
          }
        }

        setStats({
          ventaCalimaco: totalVentaCalimaco,
          ventaProveedor: totalVentaProveedor,
          t1: proceso === "conciliations" ? "VENTA CALIMACO" : "MONTO NETO RECAUDADOR",
          t2: proceso === "conciliations" ? "VENTA RECAUDADOR" : "MONTO NETO LIQUIDACION"
        })

        setChartData(chartRows)
      } catch (err) {
        console.error(err)
      }
    }

    fetchStats()
  }, [filters])

  return (
    <RoleGuard allowedRoles={[ROLES.ADMINISTRATOR, ROLES.ANALISTA_TESORERIA]} redirectTo403={true}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              Dashboard de{" "}
              <span className="text-red-600 capitalize">{filters.proceso}</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Resumen de los procesos de ventas y liquidaciones
            </p>
          </div>
        </div>

        <StatsCards
          t1={stats.t1}
          t2={stats.t2}
          ventaCalimaco={stats.ventaCalimaco}
          ventaProveedor={stats.ventaProveedor}
        />

        <Filters filters={filters} onFiltersChange={setFilters} />

        <div className="space-y-6">
          <ReconciliationTable
            proceso={filters.proceso}
            metodo={filters.metodo}
            fromDate={filters.fromDate}
            toDate={filters.toDate}
          />
          
          {/* Graficos uno al lado del otro al final */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChartCard
              data={chartData.map(item => ({
                name: item.metodo,
                value: item.calimaco,
                process : item.proceso
              }))}
            />
            <BarChartCard data={chartData} proceso={filters.proceso}/>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
