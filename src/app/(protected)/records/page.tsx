"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { calimacoRecordsApi, collectorRecordsApi, type CalimacoRecord, type CollectorRecord, type PaginatedResponse } from "@/lib/api"
import { formatDateTimeForDisplay } from "@/lib/date-utils"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import { RoleGuard } from "@/components/auth/RoleGuard"
import { ROLES } from "@/lib/permissions"

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

export default function RegistrosPage() {
  const [activeTab, setActiveTab] = React.useState("calimaco")
  const [calimacoData, setCalimacoData] = React.useState<PaginatedResponse<CalimacoRecord> | null>(null)
  const [collectorData, setCollectorData] = React.useState<PaginatedResponse<CollectorRecord> | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [searchId, setSearchId] = React.useState("")
  const [selectedCollector, setSelectedCollector] = React.useState("1")
  const [selectedStatus, setSelectedStatus] = React.useState("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    const today = new Date()
    const fiveDaysAgo = subDays(today, 5)
    return { from: fiveDaysAgo, to: today }
  })
  const [viewModalOpen, setViewModalOpen] = React.useState(false)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedRecord, setSelectedRecord] = React.useState<CalimacoRecord | CollectorRecord | null>(null)
  const [editForm, setEditForm] = React.useState<any>({})
  const { canDelete } = useAuthStore()

  const handleView = async (id: number) => {
    try {
      let record
      if (activeTab === "calimaco") {
        record = await calimacoRecordsApi.getById(id)
      } else {
        record = await collectorRecordsApi.getById(id)
      }
      setSelectedRecord(record)
      setViewModalOpen(true)
    } catch (error) {
      toast.error("Error al cargar el registro")
    }
  }

  const handleEdit = async (id: number) => {
    try {
      let record
      if (activeTab === "calimaco") {
        record = await calimacoRecordsApi.getById(id)
      } else {
        record = await collectorRecordsApi.getById(id)
      }
      setSelectedRecord(record)
      setEditForm(record)
      setEditModalOpen(true)
    } catch (error) {
      toast.error("Error al cargar el registro")
    }
  }

  const handleDelete = (record: CalimacoRecord | CollectorRecord) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedRecord) return
    try {
      if (activeTab === "calimaco") {
        await calimacoRecordsApi.delete(selectedRecord.id)
      } else {
        await collectorRecordsApi.delete(selectedRecord.id)
      }
      toast.success("Registro eliminado")
      setDeleteDialogOpen(false)
      // Recargar datos
      if (activeTab === "calimaco") {
        loadCalimacoRecords(currentPage)
      } else {
        loadCollectorRecords(currentPage)
      }
    } catch (error) {
      toast.error("Error al eliminar el registro")
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedRecord) return
    try {
      if (activeTab === "calimaco") {
        await calimacoRecordsApi.update(selectedRecord.id, editForm)
      } else {
        await collectorRecordsApi.update(selectedRecord.id, editForm)
      }
      toast.success("Registro actualizado")
      setEditModalOpen(false)
      // Recargar datos
      if (activeTab === "calimaco") {
        loadCalimacoRecords(currentPage)
      } else {
        loadCollectorRecords(currentPage)
      }
    } catch (error) {
      toast.error("Error al actualizar el registro")
    }
  }

  const loadCalimacoRecords = async (page = 1) => {
    setLoading(true)
    try {
      let data: PaginatedResponse<CalimacoRecord>
      
      if (searchId.trim()) {
        // Buscar por calimacoId usando la API
        const records = await calimacoRecordsApi.getByCalimacoId(searchId.trim())
        if (records.length === 0) {
          toast.error(`No se encontro el Calimaco ID: ${searchId.trim()}`)
        }
        // Convertir array a formato paginado
        data = {
          data: records,
          total: records.length,
          page: 1,
          limit: records.length,
          totalPages: 1
        }
      } else {
        const collectorId = selectedCollector !== "all" ? parseInt(selectedCollector) : undefined
        const fromDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
        const toDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined
        
        const status = selectedStatus !== "all" ? selectedStatus : undefined
        data = await calimacoRecordsApi.getAll(page, 20, collectorId, fromDate, toDate, status)
      }
      
      setCalimacoData(data)
      setCurrentPage(page)
      toast.success(`Se encontraron ${data.total} registros Calimaco (pagina ${data.page}/${data.totalPages})`)
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar registros Calimaco")
    } finally {
      setLoading(false)
    }
  }

  const loadCollectorRecords = async (page = 1) => {
    setLoading(true)
    try {
      let data: PaginatedResponse<CollectorRecord>
      
      if (searchId.trim()) {
        // Buscar por calimacoId usando la API
        const records = await collectorRecordsApi.getByCalimacoId(searchId.trim())
        if (records.length === 0) {
          toast.error(`No se encontro el Calimaco ID: ${searchId.trim()}`)
        }
        // Convertir array a formato paginado
        data = {
          data: records,
          total: records.length,
          page: 1,
          limit: records.length,
          totalPages: 1
        }
      } else {
        const collectorId = selectedCollector !== "all" ? parseInt(selectedCollector) : undefined
        const fromDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
        const toDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined
        
        let providerStatus = undefined
        if (selectedStatus === "approved") {
          // Mapear estados aprobados por recaudador
          const approvedStatusByCollector: { [key: number]: string } = {
            1: "Aprobado", // Kashio
            2: "Autorizado,Liquidado", // Monnet
            3: "APPROVAL", // Kushki
            4: "Venta", // Niubiz
            5: "Venta", // Yape
            6: "Approved", // Nuvei
            7: "Cancelada", // PagoEfectivo
            8: "Compra completada", // Safetypay
            9: "COMPLETED", // Tupay
            10: "" // Prometeo (sin estados definidos)
          }
          providerStatus = approvedStatusByCollector[collectorId || 1] || ""
        } else if (selectedStatus === "others") {
          // Mapear otros estados por recaudador
          const otherStatusByCollector: { [key: number]: string } = {
            1: "", // Kashio (solo tiene Aprobado)
            2: "Denegado,Expirado,Pendiente de pago", // Monnet
            3: "INITIALIZED,DECLINED", // Kushki
            4: "", // Niubiz (solo tiene Venta)
            5: "", // Yape (solo tiene Venta)
            6: "Declined,Error,Filter Error", // Nuvei
            7: "Expirado", // PagoEfectivo
            8: "Compra pendiente,Notificacion confirmada a comercio,Transacción expirada", // Safetypay
            9: "EXPIRED,DECLINED,CANCELLED", // Tupay
            10: "" // Prometeo (sin estados definidos)
          }
          providerStatus = otherStatusByCollector[collectorId || 1] || ""
        } else if (selectedStatus !== "all") {
          providerStatus = selectedStatus
        }
        data = await collectorRecordsApi.getAll(page, 20, collectorId, fromDate, toDate, providerStatus)
      }
      
      setCollectorData(data)
      setCurrentPage(page)
      toast.success(`Se encontraron ${data.total} registros Collector (pagina ${data.page}/${data.totalPages})`)
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar registros Collector")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    if (activeTab === "calimaco") {
      loadCalimacoRecords(1)
    } else {
      loadCollectorRecords(1)
    }
  }

  const handlePageChange = (page: number) => {
    if (activeTab === "calimaco") {
      loadCalimacoRecords(page)
    } else {
      loadCollectorRecords(page)
    }
  }

  // Cargar datos por defecto al montar el componente y al cambiar de tab
  React.useEffect(() => {
    if (activeTab === "calimaco") {
      loadCalimacoRecords(1)
    } else {
      loadCollectorRecords(1)
    }
  }, [activeTab])

  const clearFilters = async () => {
    setSearchId("")
    setSelectedCollector("1")
    setSelectedStatus("all")
    const today = new Date()
    const fiveDaysAgo = subDays(today, 5)
    setDateRange({ from: fiveDaysAgo, to: today })
    setCurrentPage(1)
    
    // Cargar datos por defecto directamente con los valores resetados
    setLoading(true)
    try {
      const data = await calimacoRecordsApi.getAll(1, 20, 1, format(fiveDaysAgo, "yyyy-MM-dd"), format(today, "yyyy-MM-dd"), undefined)
      if (activeTab === "calimaco") {
        setCalimacoData(data)
      } else {
        const collectorData = await collectorRecordsApi.getAll(1, 20, 1, format(fiveDaysAgo, "yyyy-MM-dd"), format(today, "yyyy-MM-dd"), undefined)
        setCollectorData(collectorData)
      }
      toast.success("Filtros restablecidos y datos cargados")
    } catch (error) {
      toast.error("Error al cargar datos por defecto")
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

  const getStatusBadge = (status: string) => {
    const variant = status === "Válido" || status === "Aprobado" ? "default" : "destructive"
    return <Badge variant={variant}>{status}</Badge>
  }

  return (
    <RoleGuard allowedRoles={[ROLES.ADMINISTRATOR, ROLES.ANALISTA_TESORERIA, ROLES.ANALISTA_SOPORTE, ROLES.ANALISTA]} redirectTo403={true}>
      <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-gray-900">
          Modulo de <span className="text-red-600">Registros</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Gestion de registros Calimaco y Collector desde base de datos
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calimaco">Registros Calimaco</TabsTrigger>
          <TabsTrigger value="collector">Registros Collector</TabsTrigger>
        </TabsList>

        {/* Filtros */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Filtros de Búsqueda</CardTitle>
            <CardDescription>
              Busca registros por ID, recaudador o estado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Buscar por Calimaco ID</Label>
                <Input
                  type="text"
                  placeholder="Ej: 2.2060226760"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Recaudador</Label>
                <Select value={selectedCollector} onValueChange={setSelectedCollector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar recaudador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
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
                        "w-full justify-start text-left font-normal text-xs",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`
                        ) : (
                          format(dateRange.from, "dd/MM")
                        )
                      ) : (
                        <span>Fechas</span>
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

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {activeTab === "calimaco" ? (
                      <>
                        <SelectItem value="Válido">Válido</SelectItem>
                        <SelectItem value="Denegado">Denegado</SelectItem>
                        <SelectItem value="Nuevo">Nuevo</SelectItem>
                        <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                        <SelectItem value="Límites excedidos">Límites excedidos</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="approved">Aprobados</SelectItem>
                        <SelectItem value="others">Otros</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex gap-2">
                  <Button onClick={handleSearch} disabled={loading} className="flex-1">
                    <Search className="mr-2 h-4 w-4" />
                    {loading ? "..." : "Buscar"}
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="calimaco">
          <Card>
            <CardHeader>
              <CardTitle>Registros Calimaco</CardTitle>
              <CardDescription>
                {calimacoData?.total || 0} registro(s) encontrado(s) - Página {calimacoData?.page || 1} de {calimacoData?.totalPages || 1}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Calimaco ID</th>
                      <th className="text-left p-2">Recaudador</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-right p-2">Monto</th>
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-left p-2">Fecha Modificación</th>
                      <th className="text-left p-2">Comentarios</th>
                      <th className="text-center p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calimacoData?.data.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono">{record.calimacoId}</td>
                        <td className="p-2">{record.collector.name}</td>
                        <td className="p-2">{getStatusBadge(record.status)}</td>
                        <td className="text-right p-2">{formatCurrency(record.amount)}</td>
                        <td className="p-2">
                          {formatDateTimeForDisplay(record.recordDate)}
                        </td>
                        <td className="p-2">
                          {record.modificationDate ? formatDateTimeForDisplay(record.modificationDate) : "-"}
                        </td>
                        <td className="p-2">
                          {record.comments && record.comments !== "nan" && record.comments !== "None" && record.comments.trim() !== "" ? record.comments : "Sin comentarios"}
                        </td>
                        <td className="text-center p-2">
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleView(record.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canDelete() && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleEdit(record.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDelete(record)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            {calimacoData && calimacoData.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((calimacoData.page - 1) * calimacoData.limit) + 1} a {Math.min(calimacoData.page * calimacoData.limit, calimacoData.total)} de {calimacoData.total} registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(calimacoData.page - 1)}
                    disabled={calimacoData.page <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {calimacoData.page} de {calimacoData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(calimacoData.page + 1)}
                    disabled={calimacoData.page >= calimacoData.totalPages || loading}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="collector">
          <Card>
            <CardHeader>
              <CardTitle>Registros Collector</CardTitle>
              <CardDescription>
                {collectorData?.total || 0} registro(s) encontrado(s) - Página {collectorData?.page || 1} de {collectorData?.totalPages || 1}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Calimaco ID</th>
                      <th className="text-left p-2">Recaudador</th>
                      <th className="text-left p-2">Cliente</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-right p-2">Monto</th>
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-center p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectorData?.data.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono">{record.calimacoId}</td>
                        <td className="p-2">{record.collector.name}</td>
                        <td className="p-2">{record.clientName}</td>
                        <td className="p-2">{getStatusBadge(record.providerStatus)}</td>
                        <td className="text-right p-2">{formatCurrency(record.amount)}</td>
                        <td className="p-2">
                          {formatDateTimeForDisplay(record.recordDate)}
                        </td>
                        <td className="text-center p-2">
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleView(record.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canDelete() && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleEdit(record.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDelete(record)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            {collectorData && collectorData.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((collectorData.page - 1) * collectorData.limit) + 1} a {Math.min(collectorData.page * collectorData.limit, collectorData.total)} de {collectorData.total} registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(collectorData.page - 1)}
                    disabled={collectorData.page <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {collectorData.page} de {collectorData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(collectorData.page + 1)}
                    disabled={collectorData.page >= collectorData.totalPages || loading}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Ver */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="!max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Registro</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="grid grid-cols-2 gap-4">
              <div><strong>ID:</strong> {selectedRecord.id}</div>
              <div><strong>Calimaco ID:</strong> {(selectedRecord as any).calimacoId}</div>
              <div><strong>Recaudador:</strong> {(selectedRecord as any).collector?.name}</div>
              <div><strong>Monto:</strong> {formatCurrency((selectedRecord as any).amount)}</div>
              <div><strong>Fecha:</strong> {formatDateTimeForDisplay((selectedRecord as any).recordDate)}</div>
              {activeTab === "calimaco" ? (
                <>
                  <div><strong>Estado:</strong> {(selectedRecord as CalimacoRecord).status}</div>
                  <div><strong>Usuario:</strong> {(selectedRecord as CalimacoRecord).userId}</div>
                  {/* <div><strong>External ID:</strong> {(selectedRecord as CalimacoRecord).externalId}</div> */}
                  <div><strong>External ID:</strong> {["nan", "None"].includes((selectedRecord as CalimacoRecord).externalId) ? "Sin Data" : (selectedRecord as CalimacoRecord).externalId}</div>
                  {/* <div><strong>Comentarios:</strong> {(selectedRecord as CalimacoRecord).comments}</div> */}
                  <div><strong>Comentarios:</strong> {["nan", "None"].includes((selectedRecord as CalimacoRecord).comments) ? "Sin Comentarios" : (selectedRecord as CalimacoRecord).comments}</div>
                </>
              ) : (
                <>
                  <div><strong>Cliente:</strong> {["nan", "None"].includes((selectedRecord as CollectorRecord).clientName) ? "Sin Data" : (selectedRecord as CollectorRecord).clientName}</div>
                  <div><strong>Estado:</strong> {["nan", "None"].includes((selectedRecord as CollectorRecord).providerStatus) ? "Sin Data" : (selectedRecord as CollectorRecord).providerStatus}</div>
                  <div><strong>Provider ID:</strong> {["nan", "None"].includes((selectedRecord as CollectorRecord).providerId) ? "Sin Data" : (selectedRecord as CollectorRecord).providerId}</div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="!max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Calimaco ID</Label>
                <Input value={editForm.calimacoId || ""} onChange={(e) => setEditForm({...editForm, calimacoId: e.target.value})} />
              </div>
              <div>
                <Label>Monto</Label>
                <Input type="number" value={editForm.amount || ""} onChange={(e) => setEditForm({...editForm, amount: e.target.value})} />
              </div>
              {activeTab === "calimaco" ? (
                <>
                  <div>
                    <Label>Estado</Label>
                    <Select value={editForm.status || ""} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Válido">Válido</SelectItem>
                        <SelectItem value="Denegado">Denegado</SelectItem>
                        <SelectItem value="Nuevo">Nuevo</SelectItem>
                        <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                        <SelectItem value="Límites excedidos">Límites excedidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Usuario</Label>
                    <Input value={editForm.userId || ""} onChange={(e) => setEditForm({...editForm, userId: e.target.value})} />
                  </div>
                  <div>
                    <Label>External ID</Label>
                    <Input value={editForm.externalId || ""} onChange={(e) => setEditForm({...editForm, externalId: e.target.value})} />
                  </div>
                  <div>
                    <Label>Comentarios</Label>
                    <Input value={editForm.comments || ""} onChange={(e) => setEditForm({...editForm, comments: e.target.value})} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Cliente</Label>
                    <Input value={editForm.clientName || ""} onChange={(e) => setEditForm({...editForm, clientName: e.target.value})} />
                  </div>
                  <div>
                    <Label>Provider ID</Label>
                    <Input value={editForm.providerId || ""} onChange={(e) => setEditForm({...editForm, providerId: e.target.value})} />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminacion</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </RoleGuard>
  )
}