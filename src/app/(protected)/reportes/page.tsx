"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, BarChart3, PieChart, TrendingUp, Users, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { conciliationReportsApi, type ConciliationReport, type PaginatedResponse } from "@/lib/api"
import { formatDateForDisplay } from "@/lib/date-utils"
import { toast } from "sonner"

const COLLECTORS = [
  { id: 1, name: "Kashio" },
  { id: 2, name: "Monnet" },
  { id: 3, name: "Kushki" },
  { id: 4, name: "Niubiz" },
  { id: 5, name: "Yape" },
  { id: 6, name: "Nuvei" },
  { id: 7, name: "PagoEfectivo" },
  { id: 8, name: "Safetypay" },
  { id: 9, name: "Tupay" },
  { id: 10, name: "Prometeo" },
]

export default function ReportesPage() {
  const router = useRouter()
  const [selectedCollectors, setSelectedCollectors] = React.useState<number[]>([1])
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    const today = new Date()
    const sevenDaysAgo = subDays(today, 7)
    return { from: sevenDaysAgo, to: today }
  })
  const [reports, setReports] = React.useState<PaginatedResponse<ConciliationReport> | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    handleSearch()
  }, [])

  const handleSearch = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Selecciona un rango de fechas")
      return
    }

    if (selectedCollectors.length === 0) {
      toast.error("Selecciona al menos un recaudador")
      return
    }

    setLoading(true)
    try {
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")
      
      const data = await conciliationReportsApi.getCompleteReport(
        selectedCollectors,
        fromDate,
        toDate,
        1,
        50
      )
      
      setReports(data)
      toast.success(`Se encontraron ${data.total} registros`)
    } catch (error) {
      console.error(error)
      toast.error("Error al obtener los reportes")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount)
    return `S/ ${num.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  const formatPercentage = (percentage: string) => {
    return `${percentage}%`
  }

  const getCollectorName = (id: number) => {
    return COLLECTORS.find(c => c.id === id)?.name || `Collector ${id}`
  }

  const handleViewDetail = (report: ConciliationReport) => {
    const fromDate = format(new Date(report.report_fecha), "yyyy-MM-dd")
    const toDate = format(new Date(report.report_fecha), "yyyy-MM-dd")
    const collectorId = report.report_collector_id
    
    // Navegar a pagina de detalle con parametros
    router.push(`/reportes/detalle?collectorId=${collectorId}&fromDate=${fromDate}&toDate=${toDate}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-gray-900">
          Modulo de <span className="text-red-600">Reportes</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Reportes detallados de conciliacion desde base de datos
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Busqueda</CardTitle>
          <CardDescription>
            Selecciona los parametros para generar el reporte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Recaudadores</Label>
              <Select
                value={selectedCollectors[0]?.toString() || ""}
                onValueChange={(value) => setSelectedCollectors([parseInt(value)])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar recaudador" />
                </SelectTrigger>
                <SelectContent>
                  {COLLECTORS.map((collector) => (
                    <SelectItem key={collector.id} value={collector.id.toString()}>
                      {collector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rango de fechas</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Seleccionar fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    locale={es}
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading ? "Buscando..." : "Generar Reporte"}
          </Button>
        </CardContent>
      </Card>

      {/* Tabla de Reportes */}
      {reports && reports.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reporte Detallado</CardTitle>
            <CardDescription>
              {reports.total} registro(s) encontrado(s) - Pagina {reports.page} de {reports.totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Recaudador</th>
                    <th className="text-right p-2">Monto Calimaco</th>
                    <th className="text-right p-2">Monto Recaudador</th>
                    <th className="text-right p-2">% Conciliado Calimaco</th>
                    <th className="text-right p-2">% Conciliado Recaudador</th>
                    <th className="text-center p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.data.map((report, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {formatDateForDisplay(report.report_fecha)}
                      </td>
                      <td className="p-2 font-medium">
                        {getCollectorName(report.report_collector_id)}
                      </td>
                      <td className="text-right p-2">
                        {formatCurrency(report.monto_total_calimaco)}
                      </td>
                      <td className="text-right p-2">
                        {formatCurrency(report.monto_total_collector)}
                      </td>
                      <td className="text-right p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          parseFloat(report.porcentaje_conciliado_calimaco) === 100 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatPercentage(report.porcentaje_conciliado_calimaco)}
                        </span>
                      </td>
                      <td className="text-right p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          parseFloat(report.porcentaje_conciliado_collector) === 100 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatPercentage(report.porcentaje_conciliado_collector)}
                        </span>
                      </td>
                      <td className="text-center p-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetail(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalle
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}