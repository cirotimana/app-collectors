"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter, useSearchParams } from "next/navigation"
import { conciliationReportsApi, calimacoRecordsApi, collectorRecordsApi, type ConciliatedRecord, type NonConciliatedRecord, type PaginatedResponse } from "@/lib/api"
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

export default function ReporteDetallePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = React.useState("conciliados")
  const [conciliatedData, setConciliatedData] = React.useState<PaginatedResponse<ConciliatedRecord> | null>(null)
  const [nonConciliatedData, setNonConciliatedData] = React.useState<PaginatedResponse<NonConciliatedRecord> | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(1)
  
  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [searchLoading, setSearchLoading] = React.useState(false)
  const [searchResult, setSearchResult] = React.useState<{
    calimaco: any[]
    collector: any[]
  } | null>(null)


  const collectorId = parseInt(searchParams.get("collectorId") || "1")
  const fromDate = searchParams.get("fromDate") || ""
  const toDate = searchParams.get("toDate") || ""

  const loadConciliatedRecords = async (page = 1) => {
    setLoading(true)
    try {
      const data = await conciliationReportsApi.getConciliatedRecords([collectorId], fromDate || "", toDate || "", page, 20)
      setConciliatedData(data)
      setCurrentPage(page)
      toast.success(`Se encontraron ${data.total} registros conciliados`)
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar registros conciliados")
    } finally {
      setLoading(false)
    }
  }

  const loadNonConciliatedRecords = async (page = 1) => {
    setLoading(true)
    try {
      const data = await conciliationReportsApi.getNonConciliatedRecords([collectorId], fromDate || "", toDate || "", page, 20)
      setNonConciliatedData(data)
      setCurrentPage(page)
      toast.success(`Se encontraron ${data.total} registros no conciliados`)
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar registros no conciliados")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    if (activeTab === "conciliados") {
      loadConciliatedRecords(page)
    } else {
      loadNonConciliatedRecords(page)
    }
  }

  const handleSearchDetails = async (record: ConciliatedRecord | NonConciliatedRecord) => {
    setIsSearchOpen(true)
    setSearchLoading(true)
    setSearchResult(null)

    try {
      const promises = []

      if (activeTab === "conciliados") {
        const conciliatedRecord = record as ConciliatedRecord
        
        // Calimaco by ID
        promises.push(
          calimacoRecordsApi.getById(conciliatedRecord.calimaco_id)
            .then(res => ({ source: 'calimaco', data: [res] }))
            .catch(err => {
              console.error("Error fetching calimaco by ID", err)
              return { source: 'calimaco', data: [] }
            })
        )

        // Collector by ID
        promises.push(
          collectorRecordsApi.getById(conciliatedRecord.collector_record_id)
            .then(res => ({ source: 'collector', data: [res] }))
            .catch(err => {
              console.error("Error fetching collector by ID", err)
              return { source: 'collector', data: [] }
            })
        )

      } else {
        const normalizedId = record.calimaco_normalized

        if (normalizedId) {
          // Calimaco by Normalized ID
          promises.push(
            calimacoRecordsApi.getByCalimacoId(normalizedId)
              .then(res => ({ source: 'calimaco', data: res }))
              .catch(err => {
                console.error("Error fetching calimaco by normalized ID", err)
                return { source: 'calimaco', data: [] }
              })
          )

          // Collector by Normalized ID
          promises.push(
            collectorRecordsApi.getByCalimacoId(normalizedId)
              .then(res => ({ source: 'collector', data: res }))
              .catch(err => {
                console.error("Error fetching collector by normalized ID", err)
                return { source: 'collector', data: [] }
              })
          )
        }
      }

      const results = await Promise.all(promises)
      
      const calimacoData = results
        .filter(r => r.source === 'calimaco')
        .flatMap(r => r.data as any[])
      
      const collectorData = results
        .filter(r => r.source === 'collector')
        .flatMap(r => r.data as any[])

      setSearchResult({
        calimaco: calimacoData,
        collector: collectorData
      })

    } catch (error) {
      console.error(error)
      toast.error("Error al buscar detalles")
      setSearchResult({ calimaco: [], collector: [] })
    } finally {
      setSearchLoading(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === "conciliados") {
      loadConciliatedRecords(1)
    } else {
      loadNonConciliatedRecords(1)
    }
  }, [activeTab])

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount)
    return `S/ ${num.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  const getCollectorName = (id: number) => {
    return COLLECTORS.find(c => c.id === id)?.name || `Collector ${id}`
  }

  const getStatusBadge = (status: string) => {
    const variant = status === "Válido" || status === "Aprobado" || status === "MATCH" ? "default" : "destructive"
    return <Badge variant={variant}>{status}</Badge>
  }

  const formatStatusMatch = (status: string) => {
    if (status === "SIN_MATCH_EN_RECAUDADOR") return "SIN REGISTRO EN RECAUDADOR"
    if (status === "SIN_MATCH_EN_CALIMACO") return "SIN REGISTRO EN CALIMACO"
    return status
  }

  const getOrigen = (record: NonConciliatedRecord) => {
    if (record.calimaco_id && !record.collector_record_id) return "CALIMACO"
    if (record.collector_record_id && !record.calimaco_id) return "RECAUDADOR"
    return "-"
  }

  const getEstadoByOrigen = (record: NonConciliatedRecord) => {
    const origen = getOrigen(record)
    if (origen === "CALIMACO") return record.status_calimaco || "-"
    if (origen === "RECAUDADOR") return record.status_collector || "-"
    return "-"
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-4xl font-black text-gray-900">
          Detalle de <span className="text-red-600">Reporte</span>
        </h1>
        <p className="text-gray-600 mt-1">
          {getCollectorName(collectorId)} - {fromDate ? fromDate.split('-').reverse().join('/') : ""}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conciliados">Registros Conciliados</TabsTrigger>
          <TabsTrigger value="no-conciliados">Registros No Conciliados</TabsTrigger>
        </TabsList>

        <TabsContent value="conciliados">
          <Card>
            <CardHeader>
              <CardTitle>Registros Conciliados</CardTitle>
              <CardDescription>
                {conciliatedData?.total || 0} registro(s) encontrado(s) - Página {conciliatedData?.page || 1} de {conciliatedData?.totalPages || 1}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Calimaco ID</th>
                      <th className="text-left p-2">Cliente</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-right p-2">Monto Calimaco</th>
                      <th className="text-right p-2">Monto Collector</th>
                      <th className="text-left p-2">Fecha Calimaco</th>
                      <th className="text-left p-2">Fecha Collector</th>
                      <th className="text-center p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conciliatedData?.data.map((record, index) => (
                      <tr key={`conciliated-${record.calimaco_id}-${index}`} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono">{record.calimaco_normalized}</td>
                        <td className="p-2">{record.client_name}</td>
                        <td className="p-2">{getStatusBadge(record.estado)}</td>
                        <td className="text-right p-2">{formatCurrency(record.calimaco_amount)}</td>
                        <td className="text-right p-2">{formatCurrency(record.collector_amount)}</td>
                        <td className="p-2">
                          {format(new Date(record.calimaco_date), "dd/MM/yyyy HH:mm")}
                        </td>
                        <td className="p-2">
                          {format(new Date(record.collector_date), "dd/MM/yyyy HH:mm")}
                        </td>
                        <td className="text-center p-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => handleSearchDetails(record)}
                            title="Buscar detalle"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            {conciliatedData && conciliatedData.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((conciliatedData.page - 1) * conciliatedData.limit) + 1} a {Math.min(conciliatedData.page * conciliatedData.limit, conciliatedData.total)} de {conciliatedData.total} registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(conciliatedData.page - 1)}
                    disabled={conciliatedData.page <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {conciliatedData.page} de {conciliatedData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(conciliatedData.page + 1)}
                    disabled={conciliatedData.page >= conciliatedData.totalPages || loading}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="no-conciliados">
          <Card>
            <CardHeader>
              <CardTitle>Registros No Conciliados</CardTitle>
              <CardDescription>
                {nonConciliatedData?.total || 0} registro(s) encontrado(s) - Página {nonConciliatedData?.page || 1} de {nonConciliatedData?.totalPages || 1}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Calimaco ID</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-left p-2">Estado Match</th>
                      <th className="text-left p-2">Origen</th>
                      <th className="text-right p-2">Monto</th>
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-center p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonConciliatedData?.data.map((record, index) => (
                      <tr key={`non-conciliated-${record.calimaco_id}-${index}`} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono">{record.calimaco_normalized}</td>
                        <td className="p-2">{getStatusBadge(getEstadoByOrigen(record))}</td>
                        <td className="p-2">{getStatusBadge(formatStatusMatch(record.status_match))}</td>
                        <td className="p-2">{getOrigen(record)}</td>
                        <td className="text-right p-2">{formatCurrency(record.amount)}</td>
                        <td className="p-2">
                          {format(new Date(record.record_date), "dd/MM/yyyy HH:mm")}
                        </td>
                        <td className="text-center p-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => handleSearchDetails(record)}
                            title="Buscar detalle"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            {nonConciliatedData && nonConciliatedData.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((nonConciliatedData.page - 1) * nonConciliatedData.limit) + 1} a {Math.min(nonConciliatedData.page * nonConciliatedData.limit, nonConciliatedData.total)} de {nonConciliatedData.total} registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(nonConciliatedData.page - 1)}
                    disabled={nonConciliatedData.page <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {nonConciliatedData.page} de {nonConciliatedData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(nonConciliatedData.page + 1)}
                    disabled={nonConciliatedData.page >= nonConciliatedData.totalPages || loading}
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

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="!max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Registros</DialogTitle>
            <DialogDescription>
              Información encontrada en Calimaco y Recaudador
            </DialogDescription>
          </DialogHeader>
          
          {searchLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : searchResult ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600">
                    Calimaco ({searchResult.calimaco.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {searchResult.calimaco.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            {/* <th className="text-left p-2">ID</th> */}
                            <th className="text-left p-2">Calimaco ID</th>
                            <th className="text-left p-2">Recaudador</th>
                            <th className="text-left p-2">Fecha Registro</th>
                            <th className="text-left p-2">Fecha Actualizacion</th>
                            <th className="text-left p-2">Estado</th>
                            <th className="text-left p-2">Usuario</th>
                            <th className="text-right p-2">Monto</th>
                            <th className="text-left p-2">External ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResult.calimaco.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              {/* <td className="p-2">{item.id}</td> */}
                              <td className="p-2 font-mono">{item.calimacoId}</td>
                              <td className="p-2">{item.collector.name}</td>
                              <td className="p-2">
                                {item.recordDate ? format(new Date(item.recordDate), "dd/MM/yyyy HH:mm:ss") : "-"}
                              </td>
                              <td className="p-2">
                                {item.modificationDate ? format(new Date(item.modificationDate), "dd/MM/yyyy HH:mm:ss") : "-"}
                              </td>
                              <td className="p-2">
                                <Badge variant={item.status === "Válido" ? "default" : "secondary"}>
                                  {item.status}
                                </Badge>
                              </td>
                              <td className="p-2">{item.userId}</td>
                              <td className="p-2 text-right font-medium">
                                {item.amount ? `S/ ${parseFloat(item.amount).toFixed(2)}` : "-"}
                              </td>
                              <td className="p-2 font-mono text-[10px]">{item.externalId}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-xs">No se encontraron registros en Calimaco</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">
                    Recaudador ({searchResult.collector.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {searchResult.collector.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            {/* <th className="text-left p-2">ID</th> */}
                            <th className="text-left p-2">Calimaco ID</th>
                            <th className="text-left p-2">Recaudador</th>
                            <th className="text-left p-2">Fecha Registro</th>
                            <th className="text-left p-2">Cliente</th>
                            <th className="text-left p-2">Estado</th>
                            <th className="text-right p-2">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResult.collector.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              {/* <td className="p-2">{item.id}</td> */}
                              <td className="p-2 font-mono">{item.calimacoId}</td>
                              <td className="p-2 font-mono">{item.collector.name}</td>
                              <td className="p-2">
                                {item.recordDate ? format(new Date(item.recordDate), "dd/MM/yyyy HH:mm:ss") : "-"}
                              </td>
                              <td className="p-2">{item.clientName}</td>
                              <td className="p-2">
                                <Badge variant={item.providerStatus === "Autorizado" ? "default" : "secondary"}>
                                  {item.providerStatus}
                                </Badge>
                              </td>
                              <td className="p-2 text-right font-medium">
                                {item.amount ? `S/ ${parseFloat(item.amount).toFixed(2)}` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-xs">No se encontraron registros en Collector</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}