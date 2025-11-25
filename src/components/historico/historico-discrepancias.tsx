"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, CheckCircle, Eye, Trash2, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PeriodPicker } from "@/components/ui/period-picker"
import { FileDetailsDialog } from "@/components/provider/data-table"
import { discrepanciesApi, liquidationsApi, conciliationsApi, type Discrepancy } from "@/lib/api"
import { toast } from "sonner"

export function HistoricoDiscrepancias() {
  const [discrepancies, setDiscrepancies] = React.useState<Discrepancy[]>([])
  const [loading, setLoading] = React.useState(false)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [dateRange, setDateRange] = React.useState("")
  const [selectedItem, setSelectedItem] = React.useState<any>(null)
  const [showDetails, setShowDetails] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const fetchDiscrepancies = async () => {
    try {
      setLoading(true)
      let data: Discrepancy[] = []
      
      if (statusFilter !== "all") {
        data = await discrepanciesApi.getByStatus(statusFilter as 'new' | 'pending' | 'closed')
      } else if (dateRange) {
        const [fromDate, toDate] = dateRange.includes('-') 
          ? dateRange.split('-') 
          : [dateRange, dateRange]
        data = await discrepanciesApi.getByDateRange(fromDate, toDate)
      } else {
        data = await discrepanciesApi.getAll()
      }
      
      setDiscrepancies(data)
    } catch (error) {
      console.error('Error fetching discrepancies:', error)
      toast.error('Error al cargar discrepancias')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchDiscrepancies()
  }, [statusFilter, dateRange])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nuevo'
      case 'pending': return 'Pendiente'
      case 'closed': return 'Cerrado'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'destructive'
      case 'pending': return 'secondary'
      case 'closed': return 'default'
      default: return 'default'
    }
  }

  const updateStatus = async (id: number, status: 'pending' | 'closed') => {
    try {
      await discrepanciesApi.updateStatus(id, status)
      await fetchDiscrepancies()
      toast.success('Estado actualizado correctamente')
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const deleteDiscrepancy = async (id: number) => {
    try {
      await discrepanciesApi.delete(id)
      await fetchDiscrepancies()
      toast.success('Discrepancia eliminada correctamente')
    } catch (error) {
      toast.error('Error al eliminar discrepancia')
    }
  }

  const handleViewDetails = async (discrepancy: Discrepancy) => {
    try {
      const api = discrepancy.methodProcess === 'liquidations' ? liquidationsApi : conciliationsApi
      const items = await api.getAll()
      const item = items.find(i => i.id === discrepancy.idReport)
      if (item) {
        setSelectedItem(item)
        setShowDetails(true)
      }
    } catch (error) {
      console.error('Error loading details:', error)
      toast.error('Error al cargar detalles')
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      {/*  */}

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Discrepancias ({discrepancies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Recaudador</TableHead>
                  <TableHead>Proceso</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Actualizado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : discrepancies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No hay discrepancias
                    </TableCell>
                  </TableRow>
                ) : (
                  discrepancies
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((discrepancy) => (
                    <TableRow key={discrepancy.id}>
                      <TableCell>
                        <Badge variant={getStatusColor(discrepancy.status)}>
                          {getStatusLabel(discrepancy.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {discrepancy.liquidation?.collector?.name || 
                         discrepancy.conciliation?.collector?.name || 
                         'N/A'}
                      </TableCell>
                      <TableCell>
                        {discrepancy.methodProcess === 'liquidations' ? 'Liquidaciones' : 'Conciliaciones'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        S/. {discrepancy.difference}
                      </TableCell>
                      <TableCell>
                        {format(new Date(discrepancy.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(discrepancy.updatedAT), "dd/MM/yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(discrepancy)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {discrepancy.status === 'new' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(discrepancy.id, 'pending')}
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                          )}
                          {discrepancy.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(discrepancy.id, 'closed')}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteDiscrepancy(discrepancy.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {discrepancies.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, discrepancies.length)} de {discrepancies.length} registros
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm">
                Pagina {currentPage} de {Math.ceil(discrepancies.length / itemsPerPage)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= Math.ceil(discrepancies.length / itemsPerPage)}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de detalles */}
      {selectedItem && (
        <FileDetailsDialog
          item={selectedItem}
          type={discrepancies.find(d => d.idReport === selectedItem.id)?.methodProcess === 'liquidations' ? 'liquidation' : 'conciliation'}
          open={showDetails}
          onOpenChange={setShowDetails}
        />
      )}
    </div>
  )
}