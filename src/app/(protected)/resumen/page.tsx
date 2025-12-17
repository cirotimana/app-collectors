"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Eye, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { conciliationReportsApi, type ConciliationReport } from "@/lib/api"
import { toast } from "sonner"
import { generateSummaryExcelReport } from "@/lib/excel-utils"

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
]

////Version 

export default function HistoricoEjecucionesPage() {
  const router = useRouter()
  const [selectedCollectors, setSelectedCollectors] = React.useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9])
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    const today = new Date()
    return { from: today, to: today }
  })
  const [salesData, setSalesData] = React.useState<ConciliationReport[] | null>(null)
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
      
      const data = await conciliationReportsApi.getAccumulatedReport(
        selectedCollectors,
        fromDate,
        toDate
      )
      
      setSalesData(data)
      toast.success(`Se encontraron ${data.length} registros`)
    } catch (error) {
      console.error(error)
      toast.error("Error al obtener el reporte de ventas")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!salesData || salesData.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }

    const toastId = toast.loading("Generando archivo Excel...")

    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      generateSummaryExcelReport(salesData)
      toast.dismiss(toastId)
      toast.success("Archivo descargado exitosamente")
    } catch (error) {
      console.error(error)
      toast.dismiss(toastId)
      toast.error("Error al exportar el reporte")
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    try {
      return format(new Date(dateStr), "dd/MM/yyyy")
    } catch (e) {
      return "-"
    }
  }

  const handleViewDetail = (report: ConciliationReport) => {
    try {
      const fromDate = report.fecha_desde ? format(new Date(report.fecha_desde), "yyyy-MM-dd") : ""
      const toDate = report.fecha_hasta ? format(new Date(report.fecha_hasta), "yyyy-MM-dd") : ""
      const collectorId = report.report_collector_id
      
      if (!fromDate || !toDate) {
        toast.error("Fecha invalida en el reporte")
        return
      }
      
      router.push(`/reportes/detalle?collectorId=${collectorId}&fromDate=${fromDate}&toDate=${toDate}`)
    } catch (e) {
      toast.error("Fecha invalida en el reporte")
    }
  }

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount)
    return `S/ ${num.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  const getCollectorName = (id: number) => {
    return COLLECTORS.find(c => c.id === id)?.name || `Collector ${id}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-gray-900">
          Resumen de <span className="text-red-600">Conciliaciones</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Comparativo de ventas entre Calimaco y recaudadores
        </p>
      </div>

      {/* filtros */}
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
                value="all"
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedCollectors([1, 2, 3, 4, 5, 6, 7, 8, 9])
                  } else {
                    setSelectedCollectors([parseInt(value)])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar recaudadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los recaudadores</SelectItem>
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
              disabled={!salesData || loading}
              className="flex-1 sm:flex-none bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* tabla de ventas */}
      {salesData && (
        <Card>
          <CardHeader>
          <CardTitle>Resumen Acumulado por Recaudador</CardTitle>
          <CardDescription>
            {salesData.length} recaudador(es) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 border-r" colSpan={2}>General</th>
                    <th className="text-center p-2 border-r bg-blue-50/50" colSpan={4}>Calimaco</th>
                    <th className="text-center p-2 border-r bg-green-50/50" colSpan={4}>Recaudador</th>
                    <th className="text-center p-2"></th>
                  </tr>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left p-2 font-medium">Recaudador</th>
                    <th className="text-left p-2 font-medium border-r">Rango de Fechas</th>
                    
                    {/* Calimaco Columns */}
                    <th className="text-right p-2 bg-blue-50/30">Venta</th>
                    <th className="text-right p-2 bg-blue-50/30">Cant.</th>
                    <th className="text-right p-2 bg-blue-50/30">Conciliado</th>
                    <th className="text-right p-2 bg-blue-50/30 border-r">No Conc.</th>

                    {/* Collector Columns */}
                    <th className="text-right p-2 bg-green-50/30">Venta</th>
                    <th className="text-right p-2 bg-green-50/30">Cant.</th>
                    <th className="text-right p-2 bg-green-50/30">Conciliado</th>
                    <th className="text-right p-2 bg-green-50/30 border-r">No Conc.</th>

                    <th className="text-center p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData
                    .sort((a, b) => a.report_collector_id - b.report_collector_id)
                    .map((record, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50 text-xs">
                      <td className="p-2 font-medium">{getCollectorName(record.report_collector_id)}</td>
                      <td className="p-2 border-r">
                        {formatDate(record.fecha_desde)} - {formatDate(record.fecha_hasta)}
                      </td>
                      
                      {/* Calimaco Data */}
                      <td className="text-right p-2 bg-blue-50/10">{formatCurrency(record.monto_total_calimaco)}</td>
                      <td className="text-right p-2 bg-blue-50/10">{record.aprobados_calimaco}</td>
                      <td className="text-right p-2 bg-blue-50/10">
                        <div className="flex flex-col">
                          <span>{record.conciliados_calimaco}</span>
                          <span className="text-[10px] text-muted-foreground">{formatCurrency(record.monto_conciliado_calimaco)}</span>
                        </div>
                      </td>
                      <td className="text-right p-2 bg-blue-50/10 border-r">
                        <div className="flex flex-col">
                          <span className={record.no_conciliados_calimaco > 0 ? "text-red-600 font-bold" : ""}>{record.no_conciliados_calimaco}</span>
                          <span className="text-[10px] text-muted-foreground">{formatCurrency(record.monto_no_conciliado_calimaco)}</span>
                        </div>
                      </td>

                      {/* Collector Data */}
                      <td className="text-right p-2 bg-green-50/10">{formatCurrency(record.monto_total_collector)}</td>
                      <td className="text-right p-2 bg-green-50/10">{record.aprobados_collector}</td>
                      <td className="text-right p-2 bg-green-50/10">
                        <div className="flex flex-col">
                          <span>{record.conciliados_collector}</span>
                          <span className="text-[10px] text-muted-foreground">{formatCurrency(record.monto_conciliado_collector)}</span>
                        </div>
                      </td>
                      <td className="text-right p-2 bg-green-50/10 border-r">
                        <div className="flex flex-col">
                          <span className={record.no_conciliados_collector > 0 ? "text-red-600 font-bold" : ""}>{record.no_conciliados_collector}</span>
                          <span className="text-[10px] text-muted-foreground">{formatCurrency(record.monto_no_conciliado_collector)}</span>
                        </div>
                      </td>

                      <td className="text-center p-2">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleViewDetail(record)}
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