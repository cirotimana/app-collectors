// import { DataTable } from "@/components/provider/data-table";

// export default function DetallesPage() {
//   return (
//       <div className="space-y-6">
//           <div>
//             <h1 className="text-4xl font-black text-gray-900">
//               Modulo de <span className="text-red-600">Detalles</span>
//             </h1>
//             <p className="text-gray-600 mt-1">
//               Gestion de documentos en las conciliaciones de ventas y liquidaciones
//             </p>
//           </div>      
//       <DataTable />
//     </div>
//   );
// }



"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { conciliationReportsApi, type SalesReport, type PaginatedResponse } from "@/lib/api"
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
]

export default function HistoricoEjecucionesPage() {
  const [selectedCollectors, setSelectedCollectors] = React.useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9])
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    const today = new Date()
    const sevenDaysAgo = subDays(today, 7)
    return { from: sevenDaysAgo, to: today }
  })
  const [salesData, setSalesData] = React.useState<PaginatedResponse<SalesReport> | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(1)

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
      
      const data = await conciliationReportsApi.getSalesReport(
        selectedCollectors,
        fromDate,
        toDate,
        currentPage,
        9
      )
      
      setSalesData(data)
      toast.success(`Se encontraron ${data.total} registros`)
    } catch (error) {
      console.error(error)
      toast.error("Error al obtener el reporte de ventas")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = async (page: number) => {
    if (!dateRange?.from || !dateRange?.to) return
    
    setLoading(true)
    try {
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")
      
      const data = await conciliationReportsApi.getSalesReport(
        selectedCollectors,
        fromDate,
        toDate,
        page,
        9
      )
      
      setSalesData(data)
      setCurrentPage(page)
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar la pagina")
    } finally {
      setLoading(false)
    }
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

          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading ? "Buscando..." : "Generar Reporte"}
          </Button>
        </CardContent>
      </Card>

      {/* tabla de ventas */}
      {salesData && (
        <Card>
          <CardHeader>
            <CardTitle>Historico de Ejecuciones por Recaudador</CardTitle>
            <CardDescription>
              {salesData.total} registro(s) encontrado(s) - Pagina {salesData.page} de {salesData.totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Recaudador</th>
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-right p-2">Venta Calimaco</th>
                    <th className="text-right p-2">Venta Recaudador</th>
                    <th className="text-right p-2">Diferencia</th>
                    <th className="text-right p-2">Cant. Calimaco</th>
                    <th className="text-right p-2">Cant. Recaudador</th>
                    <th className="text-right p-2">Dif. Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.data.map((record, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{record.recaudador_nombre}</td>
                      <td className="p-2">{record.fecha_desde}</td>
                      <td className="text-right p-2">{record.venta_calimaco}</td>
                      <td className="text-right p-2">{record.venta_recaudador}</td>
                      <td className={`text-right p-2 font-medium ${
                        record.diferencia.startsWith('-') 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {record.diferencia}
                      </td>
                      <td className="text-right p-2">{record.cantidad_calimaco}</td>
                      <td className="text-right p-2">{record.cantidad_recaudador}</td>
                      <td className={`text-right p-2 font-medium ${
                        parseInt(record.diferencia_cantidad) < 0 
                          ? 'text-red-600' 
                          : parseInt(record.diferencia_cantidad) > 0 
                          ? 'text-green-600' 
                          : 'text-gray-600'
                      }`}>
                        {record.diferencia_cantidad}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          {salesData.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {((salesData.page - 1) * salesData.limit) + 1} a {Math.min(salesData.page * salesData.limit, salesData.total)} de {salesData.total} registros
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(salesData.page - 1)}
                  disabled={salesData.page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm">
                  Pagina {salesData.page} de {salesData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(salesData.page + 1)}
                  disabled={salesData.page >= salesData.totalPages || loading}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}