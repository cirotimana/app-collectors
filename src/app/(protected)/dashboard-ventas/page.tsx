"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, BarChart3, Download } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, LineChart, Line, Legend } from "recharts"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { conciliationReportsApi, type ConciliationReport, type PaginatedResponse } from "@/lib/api"
import { toast } from "sonner"
import { generateExcelReport } from "@/lib/excel-utils"

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

export default function DashboardVentasPage() {
  const [selectedCollectors, setSelectedCollectors] = React.useState<number[]>([1])
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    const today = new Date()
    const sevenDaysAgo = subDays(today, 7)
    return { from: sevenDaysAgo, to: today }
  })
  const [reportsData, setReportsData] = React.useState<PaginatedResponse<ConciliationReport> | null>(null)
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
        1000
      )
      
      setReportsData(data)
      toast.success(`Se encontraron ${data.total} registros`)
    } catch (error) {
      console.error(error)
      toast.error("Error al obtener los datos")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount)
    return `S/ ${num.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  const getCollectorName = (id: number) => {
    return COLLECTORS.find(c => c.id === id)?.name || `Collector ${id}`
  }

  // calcular estadisticas generales
  const calculateStats = () => {
    if (!reportsData?.data.length) return null

    const totalCalimacoAmount = reportsData.data.reduce((sum, record) => sum + parseFloat(record.monto_total_calimaco), 0)
    const totalCollectorAmount = reportsData.data.reduce((sum, record) => sum + parseFloat(record.monto_total_collector), 0)
    const totalConciliatedCalimaco = reportsData.data.reduce((sum, record) => sum + parseFloat(record.monto_conciliado_calimaco), 0)
    const totalConciliatedCollector = reportsData.data.reduce((sum, record) => sum + parseFloat(record.monto_conciliado_collector), 0)
    const totalNoConciliatedCalimaco = reportsData.data.reduce((sum, record) => sum + parseFloat(record.monto_no_conciliado_calimaco), 0)
    const totalNoConciliatedCollector = reportsData.data.reduce((sum, record) => sum + parseFloat(record.monto_no_conciliado_collector), 0)

    const avgConciliationCalimaco = reportsData.data.reduce((sum, record) => sum + parseFloat(record.porcentaje_conciliado_calimaco), 0) / reportsData.data.length
    const avgConciliationCollector = reportsData.data.reduce((sum, record) => sum + parseFloat(record.porcentaje_conciliado_collector), 0) / reportsData.data.length

    return {
      totalCalimacoAmount,
      totalCollectorAmount,
      totalConciliatedCalimaco,
      totalConciliatedCollector,
      totalNoConciliatedCalimaco,
      totalNoConciliatedCollector,
      avgConciliationCalimaco,
      avgConciliationCollector,
      difference: totalCollectorAmount - totalCalimacoAmount
    }
  }

  // verificar coincidencia entre montos
  const checkMatch = (value1: number, value2: number): boolean => {
    return Math.abs(value1 - value2) < 0.01
  }

  // obtener color de fila segun coincidencia
  const getRowColor = (record: ConciliationReport, field1: string, field2: string): string => {
    const val1 = parseFloat(record[field1 as keyof ConciliationReport] as string)
    const val2 = parseFloat(record[field2 as keyof ConciliationReport] as string)
    return checkMatch(val1, val2) ? "bg-green-50" : "bg-red-50"
  }

  const stats = calculateStats()

  const handleExport = async () => {
    if (!reportsData || !reportsData.data.length) {
      toast.error("No hay datos para exportar")
      return
    }
    
    const currentStats = calculateStats()
    if (!currentStats) return

    const toastId = toast.loading("Procesando reporte...")

    try {
      // small delay to allow toast to show
      await new Promise(resolve => setTimeout(resolve, 100))
      generateExcelReport(currentStats, reportsData)
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
          Dashboard de <span className="text-red-600">Ventas</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Analisis completo de conciliacion y ventas por recaudador
        </p>
      </div>

      {/* filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Busqueda</CardTitle>
          <CardDescription>
            Selecciona los parametros para generar el dashboard
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
              {loading ? "Cargando..." : "Actualizar Dashboard"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport} 
              disabled={!reportsData || loading}
              className="flex-1 sm:flex-none bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* estadisticas generales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calimaco</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCalimacoAmount.toString())}</div>
              <p className="text-xs text-muted-foreground">
                Conciliado: {formatCurrency(stats.totalConciliatedCalimaco.toString())}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recaudador</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCollectorAmount.toString())}</div>
              <p className="text-xs text-muted-foreground">
                Conciliado: {formatCurrency(stats.totalConciliatedCollector.toString())}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diferencia</CardTitle>
              {stats.difference >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(stats.difference).toString())}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.difference >= 0 ? 'Exceso recaudador' : 'Faltante recaudador'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conciliacion Promedio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgConciliationCalimaco.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Recaudador: {stats.avgConciliationCollector.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4 tablas detalladas */}
      {reportsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* tabla 1: monto calimaco */}
          <Card>
            <CardHeader>
              <CardTitle>Monto Calimaco</CardTitle>
              <CardDescription>Detalle de montos totales Calimaco</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[380px] overflow-y-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-left p-2">Recaudador</th>
                      <th className="text-left p-2">Operaciones</th>
                      <th className="text-right p-2">Monto (S/.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsData.data.map((record, index) => (
                      <tr key={index} className={`border-b hover:bg-muted/50 ${getRowColor(record, 'monto_total_calimaco', 'monto_total_collector')}`}>
                        <td className="p-2">{format(new Date(record.report_fecha), "dd/MM/yyyy")}</td>
                        <td className="p-2">{getCollectorName(record.report_collector_id)}</td>
                        <td className="p-2">{record.aprobados_calimaco}</td>
                        <td className="text-right p-2 font-mono">
                          {parseFloat(record.monto_total_calimaco).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <span className="font-bold">
                Total: S/ {stats?.totalCalimacoAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </span>
            </CardFooter>
          </Card>

          {/* tabla 2: monto recaudador */}
          <Card>
            <CardHeader>
              <CardTitle>Monto Recaudador</CardTitle>
              <CardDescription>Detalle de montos totales recaudador</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[380px] overflow-y-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-left p-2">Recaudador</th>
                      <th className="text-left p-2">Operaciones</th>
                      <th className="text-right p-2">Monto (S/.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsData.data.map((record, index) => (
                      <tr key={index} className={`border-b hover:bg-muted/50 ${getRowColor(record, 'monto_total_collector', 'monto_total_calimaco')}`}>
                        <td className="p-2">{format(new Date(record.report_fecha), "dd/MM/yyyy")}</td>
                        <td className="p-2">{getCollectorName(record.report_collector_id)}</td>
                        <td className="p-2">{record.aprobados_collector}</td>
                        <td className="text-right p-2 font-mono">
                          {parseFloat(record.monto_total_collector).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <span className="font-bold">
                Total: S/ {stats?.totalCollectorAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </span>
            </CardFooter>
          </Card>

          {/* tabla 3: monto calimaco no conciliado */}
          <Card>
            <CardHeader>
              <CardTitle>Monto Calimaco No Conciliado</CardTitle>
              <CardDescription>Detalle de montos no conciliados Calimaco</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[380px] overflow-y-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-left p-2">Recaudador</th>
                      <th className="text-left p-2">Operaciones</th>
                      <th className="text-right p-2">Monto (S/.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsData.data.map((record, index) => (
                      <tr key={index} className={`border-b hover:bg-muted/50 ${getRowColor(record, 'monto_no_conciliado_calimaco', 'monto_no_conciliado_collector')}`}>
                        <td className="p-2">{format(new Date(record.report_fecha), "dd/MM/yyyy")}</td>
                        <td className="p-2">{getCollectorName(record.report_collector_id)}</td>
                        <td className="p-2">{record.no_conciliados_calimaco}</td>
                        <td className="text-right p-2 font-mono">
                          {parseFloat(record.monto_no_conciliado_calimaco).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <span className="font-bold">
                Total: S/ {stats?.totalNoConciliatedCalimaco.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </span>
            </CardFooter>
          </Card>

          {/* tabla 4: monto recaudador no conciliado */}
          <Card>
            <CardHeader>
              <CardTitle>Monto Recaudador No Conciliado</CardTitle>
              <CardDescription>Detalle de montos no conciliados recaudador</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[380px] overflow-y-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-left p-2">Recaudador</th>
                      <th className="text-left p-2">Operaciones</th>
                      <th className="text-right p-2">Monto (S/.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsData.data.map((record, index) => (
                      <tr key={index} className={`border-b hover:bg-muted/50 ${getRowColor(record, 'monto_no_conciliado_collector', 'monto_no_conciliado_calimaco')}`}>
                        <td className="p-2">{format(new Date(record.report_fecha), "dd/MM/yyyy")}</td>
                        <td className="p-2">{getCollectorName(record.report_collector_id)}</td>
                        <td className="p-2">{record.no_conciliados_collector}</td>
                        <td className="text-right p-2 font-mono">
                          {parseFloat(record.monto_no_conciliado_collector).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <span className="font-bold">
                Total: S/ {stats?.totalNoConciliatedCollector.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </span>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* graficos modernos */}
      {reportsData && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* grafico de barras moderno */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-800">Comparativo por Fecha</CardTitle>
                <CardDescription className="text-gray-600">Montos Calimaco vs Recaudador</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={reportsData.data.map(record => ({
                      fecha: format(new Date(record.report_fecha), "dd/MM"),
                      calimaco: parseFloat(record.monto_total_calimaco),
                      recaudador: parseFloat(record.monto_total_collector)
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="fecha" 
                      tick={{ fontSize: 12, fill: '#666' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#666' }}
                      tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name) => [
                        `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                        name === 'calimaco' ? 'Calimaco' : 'Recaudador'
                      ]}
                    />
                    <Bar 
                      dataKey="calimaco" 
                      fill="url(#calimacoGradient)" 
                      name="calimaco"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                    <Bar 
                      dataKey="recaudador" 
                      fill="url(#recaudadorGradient)" 
                      name="recaudador"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                    <defs>
                      <linearGradient id="calimacoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      <linearGradient id="recaudadorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* grafico pie moderno */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-800">Distribucion de Montos</CardTitle>
                <CardDescription className="text-gray-600">Total Calimaco vs Recaudador</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={[
                        { name: 'Calimaco', value: stats?.totalCalimacoAmount || 0, fill: '#dc2626' },
                        { name: 'Recaudador', value: stats?.totalCollectorAmount || 0, fill: '#16a34a' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name) => [
                        `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Calimaco</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Recaudador</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* grafico lineal moderno - ancho completo */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-800">Tendencia de Conciliacion</CardTitle>
              <CardDescription className="text-gray-600">Porcentajes de conciliacion por fecha</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart 
                  data={reportsData.data.map(record => ({
                    fecha: format(new Date(record.report_fecha), "dd/MM"),
                    calimaco: parseFloat(record.porcentaje_conciliado_calimaco),
                    recaudador: parseFloat(record.porcentaje_conciliado_collector)
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="fecha" 
                    tick={{ fontSize: 12, fill: '#666' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12, fill: '#666' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name) => [
                      `${value}%`,
                      name === 'calimaco' ? 'Calimaco' : 'Recaudador'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="calimaco" 
                    stroke="#dc2626" 
                    strokeWidth={3}
                    dot={{ fill: '#dc2626', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#dc2626', strokeWidth: 2 }}
                    name="calimaco"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="recaudador" 
                    stroke="#16a34a" 
                    strokeWidth={3}
                    dot={{ fill: '#16a34a', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#16a34a', strokeWidth: 2 }}
                    name="recaudador"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-red-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Calimaco</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Recaudador</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}