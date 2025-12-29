"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, BarChart3, PieChart, TrendingUp, Users, Eye, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { conciliationReportsApi, type ConciliationReport, type PaginatedResponse } from "@/lib/api"
import { formatDateForDisplay } from "@/lib/date-utils"
import { toast } from "sonner"
import { generateConciliationReportExcel } from "@/lib/excel-utils"

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    try {
      return format(new Date(dateStr), "dd/MM/yyyy")
    } catch (e) {
      return "-"
    }
  }

  const handleViewDetail = (report: ConciliationReport) => {
    if (!report.report_fecha) {
      toast.error("Fecha de reporte no disponible")
      return
    }
    const fromDate = format(new Date(report.report_fecha), "yyyy-MM-dd")
    const toDate = format(new Date(report.report_fecha), "yyyy-MM-dd")
    const collectorId = report.report_collector_id
    
    // Navegar a pagina de detalle con parametros
    router.push(`/reportes/detalle?collectorId=${collectorId}&fromDate=${fromDate}&toDate=${toDate}`)
  }

  const handleExport = async () => {
    if (!reports || !reports.data.length) {
      toast.error("No hay datos para exportar")
      return
    }

    const toastId = toast.loading("Obteniendo datos completos...")

    try {
      const fromDate = format(dateRange!.from!, "yyyy-MM-dd")
      const toDate = format(dateRange!.to!, "yyyy-MM-dd")

      // Fetch all detailed records
      const [conciliated, nonConciliated] = await Promise.all([
        conciliationReportsApi.fetchAllConciliatedRecords(selectedCollectors, fromDate, toDate),
        conciliationReportsApi.fetchAllNonConciliatedRecords(selectedCollectors, fromDate, toDate)
      ])

      toast.loading("Generando Excel...", { id: toastId })
      
      // small delay to allow toast to update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      generateConciliationReportExcel(reports.data, conciliated, nonConciliated)
      
      toast.dismiss(toastId)
      toast.success("Reporte descargado con exito")
    } catch (error) {
      console.error(error)
      toast.dismiss(toastId)
      toast.error("Error al exportar el reporte")
    }
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
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>
            Selecciona los parámetros para generar el reporte
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

          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleSearch} disabled={loading} className="flex-1">
              {loading ? "Buscando..." : "Generar Reporte"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport} 
              disabled={!reports || loading}
              className="flex-1 sm:flex-none bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Reportes */}
      {reports && reports.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reporte Detallado</CardTitle>
            <CardDescription>
              {reports.total} registro(s) encontrado(s) - Página {reports.page} de {reports.totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 border-r" colSpan={2}>General</th>
                    <th className="text-center p-2 border-r bg-blue-50/50" colSpan={5}>Calimaco</th>
                    <th className="text-center p-2 border-r bg-green-50/50" colSpan={5}>Recaudador</th>
                    <th className="text-center p-2"></th>
                  </tr>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left p-2 font-medium">Recaudador</th>
                    <th className="text-left p-2 font-medium border-r">Fecha</th>
                    
                    {/* Calimaco Columns */}
                    <th className="text-right p-2 bg-blue-50/30">Venta</th>
                    <th className="text-right p-2 bg-blue-50/30">Cant.</th>
                    <th className="text-right p-2 bg-blue-50/30">Conciliado</th>
                    <th className="text-right p-2 bg-blue-50/30">No Conc.</th>
                    <th className="text-right p-2 bg-blue-50/30 border-r">% Conc.</th>

                    {/* Collector Columns */}
                    <th className="text-right p-2 bg-green-50/30">Venta</th>
                    <th className="text-right p-2 bg-green-50/30">Cant.</th>
                    <th className="text-right p-2 bg-green-50/30">Conciliado</th>
                    <th className="text-right p-2 bg-green-50/30">No Conc.</th>
                    <th className="text-right p-2 bg-green-50/30 border-r">% Conc.</th>

                    <th className="text-center p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.data.map((report, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50 text-xs">
                      <td className="p-2 font-medium">
                        {getCollectorName(report.report_collector_id)}
                      </td>
                      <td className="p-2 border-r">
                        {formatDate(report.report_fecha || "")}
                      </td>
                      
                      {/* Calimaco Data */}
                      <td className="text-right p-2 bg-blue-50/10">
                        {formatCurrency(report.monto_total_calimaco)}
                      </td>
                      <td className="text-right p-2 bg-blue-50/10">
                        {report.aprobados_calimaco}
                      </td>
                      <td className="text-right p-2 bg-blue-50/10">
                        <div className="flex flex-col">
                          <span>{report.conciliados_calimaco}</span>
                          <span className="text-[10px] text-muted-foreground">{formatCurrency(report.monto_conciliado_calimaco)}</span>
                        </div>
                      </td>
                      <td className="text-right p-2 bg-blue-50/10">
                        <div className="flex flex-col">
                          <span className={report.no_conciliados_calimaco > 0 ? "text-red-600 font-bold" : ""}>{report.no_conciliados_calimaco}</span>
                          <span className="text-[10px] text-muted-foreground">{formatCurrency(report.monto_no_conciliado_calimaco)}</span>
                        </div>
                      </td>
                      <td className="text-right p-2 bg-blue-50/10 border-r">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          parseFloat(report.porcentaje_conciliado_calimaco) === 100 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatPercentage(report.porcentaje_conciliado_calimaco)}
                        </span>
                      </td>

                      {/* Collector Data */}
                      <td className="text-right p-2 bg-green-50/10">
                        {formatCurrency(report.monto_total_collector)}
                      </td>
                      <td className="text-right p-2 bg-green-50/10">
                        {report.aprobados_collector}
                      </td>
                      <td className="text-right p-2 bg-green-50/10">
                        <div className="flex flex-col">
                          <span>{report.conciliados_collector}</span>
                          <span className="text-[10px] text-muted-foreground">{formatCurrency(report.monto_conciliado_collector)}</span>
                        </div>
                      </td>
                      <td className="text-right p-2 bg-green-50/10">
                        <div className="flex flex-col">
                          <span className={report.no_conciliados_collector > 0 ? "text-red-600 font-bold" : ""}>{report.no_conciliados_collector}</span>
                          <span className="text-[10px] text-muted-foreground">{formatCurrency(report.monto_no_conciliado_collector)}</span>
                        </div>
                      </td>
                      <td className="text-right p-2 bg-green-50/10 border-r">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          parseFloat(report.porcentaje_conciliado_collector) === 100 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatPercentage(report.porcentaje_conciliado_collector)}
                        </span>
                      </td>

                      <td className="text-center p-2">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleViewDetail(report)}
                          title="Ver Detalle"
                        >
                          <Eye className="h-4 w-4" />
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