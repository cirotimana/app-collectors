"use client"

import * as React from "react"
import { AlertTriangle, X, Clock, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDiscrepancies } from "@/hooks/use-discrepancies"
import type { Discrepancy } from "@/lib/api"
import { liquidationsApi, conciliationsApi } from "@/lib/api"

import { FileDetailsDialog } from "@/components/provider/data-table"

export function DiscrepanciesAlert() {
  const { discrepancies, hasNewDiscrepancies, updateStatus, deleteDiscrepancy } = useDiscrepancies()
  const [showAlert, setShowAlert] = React.useState(false)
  const [showDialog, setShowDialog] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<any>(null)
  const [showDetails, setShowDetails] = React.useState(false)

  React.useEffect(() => {
    setShowAlert(hasNewDiscrepancies)
  }, [hasNewDiscrepancies])

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

  if (!showAlert) return null

  return (
    <>
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[500px]">
        <Alert className="border-red-200 bg-red-50 animate-pulse hover:animate-none shadow-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-red-800 font-medium text-base">
              {(() => {
                const newCount = discrepancies.filter(d => d.status === 'new').length
                const pendingCount = discrepancies.filter(d => d.status === 'pending').length
                const total = newCount + pendingCount
                
                if (total === 0) return ''
                
                let statusText = ''
                if (newCount > 0 && pendingCount > 0) {
                  statusText = `con estado nuevo (${newCount}) y pendiente (${pendingCount})`
                } else if (newCount > 0) {
                  statusText = `con estado nuevo`
                } else {
                  statusText = `con estado pendiente`
                }
                
                return `Hay ${total} ${total === 1 ? 'discrepancia' : 'discrepancias'} ${statusText} que ${total === 1 ? 'requiere' : 'requieren'} atencion`
              })()}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDialog(true)}
                className="font-medium"
              >
                Ver Todas
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAlert(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="!max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Discrepancias en las Conciliaciones</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {discrepancies.filter(d => d.status === 'new' || d.status === 'pending').map((discrepancy) => (
              <div key={discrepancy.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(discrepancy.status)}>
                      {getStatusLabel(discrepancy.status)}
                    </Badge>
                    {/* <span className="text-sm text-muted-foreground">
                      ID: {discrepancy.id}
                    </span> */}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
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
                        }
                      }}
                    >
                      Ver Detalles
                    </Button>
                    {discrepancy.status === 'new' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(discrepancy.id, 'pending')}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Marcar Pendiente
                      </Button>
                    )}
                    {discrepancy.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(discrepancy.id, 'closed')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Cerrar
                      </Button>
                    )}

                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* <div>
                    <span className="font-medium">ID Reporte:</span> {discrepancy.idReport}
                  </div> */}
                  <div>
                    <span className="font-medium">Recaudador:</span> {
                      discrepancy.liquidation?.collector?.name || 
                      discrepancy.conciliation?.collector?.name || 
                      'N/A'
                    }
                  </div>
                  <div>
                    <span className="font-medium">Diferencia:</span> S/. {discrepancy.difference}
                  </div>
                  <div>
                    <span className="font-medium">Proceso:</span> {discrepancy.methodProcess === 'liquidations' ? 'Liquidaciones' : 'Conciliaciones'}
                  </div>
                  <div>
                    <span className="font-medium">Creado:</span> {new Date(discrepancy.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalles usando FileDetailsDialog */}
      {selectedItem && (
        <FileDetailsDialog
          item={selectedItem}
          type={discrepancies.find(d => d.idReport === selectedItem.id)?.methodProcess === 'liquidations' ? 'liquidation' : 'conciliation'}
          open={showDetails}
          onOpenChange={setShowDetails}
        />
      )}
    </>
  )
}