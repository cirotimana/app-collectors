"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconDownload,
  IconFileText,
  IconCopy,
  IconTrash,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { int, number, z } from "zod"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { liquidationsApi, conciliationsApi } from "@/lib/api"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PeriodPicker } from "@/components/ui/period-picker"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Funcion para formatear montos en formato bancario
function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'S/ 0.00';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return 'S/ 0.00';
  }
  
  return `S/ ${Math.abs(numAmount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

// Funcion de fallback para copiar al portapapeles
function fallbackCopyToClipboard(text: string): boolean {
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    return successful
  } catch (error) {
    console.error('Fallback copy failed:', error)
    return false
  }
}

// Funcion segura para copiar al portapapeles
const safeCopyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      return fallbackCopyToClipboard(text)
    }
  } catch (error) {
    console.error('Error in safeCopyToClipboard:', error)
    return fallbackCopyToClipboard(text)
  }
}

// Funcion para limpiar la ruta S3
function cleanS3Path(path: string): string {
  if (!path) return ''
  const cleanedPath = path.replace(/^s3:\/\/[^\/]+\//, '')
  return cleanedPath
}

function cleanS3Pathv(path: string): string {
  if (!path) return ''
  const parts = path.split('/')
  return parts[parts.length - 1]
}

// Funcion para descarga directa
const handleDirectDownload = async (filePath: string) => {
  try {
    const cleanedPath = cleanS3Path(filePath)
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
    const apiKey = process.env.NEXT_PUBLIC_API_KEY
    
    const downloadUrl = `${baseUrl}/digital/download/${cleanedPath}`
    
    console.log("Solicitando descarga de:", downloadUrl)
    
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey || '',
      },
      redirect: 'manual'
    })

    if (response.status === 302 || response.status === 307) {
      const presignedUrl = response.headers.get('Location')
      if (presignedUrl) {
        window.open(presignedUrl, '_blank')
        toast.success('Descarga iniciada')
        return true
      }
    } else if (response.ok) {
      const data = await response.json()
      if (data.url) {
        window.open(data.url, '_blank')
        toast.success('Descarga iniciada')
        return true
      }
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = cleanedPath.split('/').pop() || 'download'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast.success('Descarga iniciada')
    return true
    
  } catch (error) {
    console.error('Error en descarga directa:', error)
    toast.error('Error al descargar el archivo')
    return false
  }
}

function formatDateForAPI(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return ''
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
}

// Schema actualizado para Liquidaciones
export const liquidationSchema = z.object({
  id: z.number(),
  collector: z.object({
    name: z.string()
  }),
  fromDate: z.string(),
  toDate: z.string(),
  amountCollector: z.string(),
  amountLiquidation: z.string(),
  differenceAmounts: z.string(),
  recordsCollector: z.number().nullable().optional().default(0),
  recordsLiquidation: z.number().nullable().optional().default(0),
  debitAmountCollector: z.string().nullable().optional().default('0.00'),
  debitAmountLiquidation: z.string().nullable().optional().default('0.00'),
  creditAmountCollector: z.string().nullable().optional().default('0.00'),
  creditAmountLiquidation: z.string().nullable().optional().default('0.00'),
  unreconciledDebitAmountCollector: z.string().nullable().optional().default('0.00'),
  unreconciledDebitAmountLiquidation: z.string().nullable().optional().default('0.00'),
  unreconciledCreditAmountCollector: z.string().nullable().optional().default('0.00'),
  unreconciledCreditAmountLiquidation: z.string().nullable().optional().default('0.00'),
  unreconciledAmountCollector: z.string().nullable().optional().default('0.00'),
  unreconciledAmountLiquidation: z.string().nullable().optional().default('0.00'),
  createdAt: z.string(),
  createdBy: z.object({
    firstName: z.string(),
    lastName: z.string()
  }).optional(),
  files: z.array(z.object({
    id: z.number(),
    liquidationFilesType: z.number(),
    filePath: z.string(),
    createdAt: z.string()
  }))
})

// Schema actualizado para Conciliaciones
export const conciliationSchema = z.object({
  id: z.number(),
  collector: z.object({
    name: z.string()
  }),
  fromDate: z.string(),
  toDate: z.string(),
  amount: z.string(),
  amountCollector: z.string(),
  differenceAmounts: z.string(),
  recordsCalimaco: z.number().default(0),
  recordsCollector: z.number().default(0),
  unreconciledRecordsCalimaco: z.number().default(0),
  unreconciledRecordsCollector: z.number().default(0),
  unreconciledAmountCalimaco: z.string().default('0.00'),
  unreconciledAmountCollector: z.string().default('0.00'),
  createdAt: z.string(),
  createdBy: z.object({
    firstName: z.string(),
    lastName: z.string()
  }).optional(),
  files: z.array(z.object({
    id: z.number(),
    conciliationFilesType: z.number(),
    filePath: z.string(),
    createdAt: z.string()
  }))
})

type DataType = z.infer<typeof liquidationSchema> | z.infer<typeof conciliationSchema>

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040/api'

async function fetchData(
  type: string, 
  collector?: string, 
  dateRange?: string
): Promise<DataType[]> {
  try {
    if (type === 'liquidations') {
      if (dateRange && dateRange.trim()) {
        const range = dateRange.trim()
        if (range.includes('-')) {
          const [fromDate, toDate] = range.split('-')
          return await liquidationsApi.getByDateRange(fromDate, toDate) as DataType[]
        } else {
          return await liquidationsApi.getByDateRange(range, range) as DataType[]
        }
      } else if (collector && collector.trim()) {
        return await liquidationsApi.getByCollector(collector.trim()) as DataType[]
      } else {
        return await liquidationsApi.getAll() as DataType[]
      }
    } else {
      if (dateRange && dateRange.trim()) {
        const range = dateRange.trim()
        if (range.includes('-')) {
          const [fromDate, toDate] = range.split('-')
          return await conciliationsApi.getByDateRange(fromDate, toDate) as DataType[]
        } else {
          return await conciliationsApi.getByDateRange(range, range) as DataType[]
        }
      } else if (collector && collector.trim()) {
        return await conciliationsApi.getByCollector(collector.trim()) as DataType[]
      } else {
        return await conciliationsApi.getAll() as DataType[]
      }
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    toast.error('Error al cargar los datos')
    return []
  }
}

// Funcion para formatear el periodo en la tabla
function formatPeriod(fromDate: string, toDate?: string): string {
  if (!fromDate) return ''
  
  const formatDate = (date: string) => {
    if (date.length === 10 && date.includes('-')) {
      const [year, month, day] = date.split('-')
      return `${day}/${month}/${year}`
    }
    if (date.length === 8) {
      return `${date.slice(6, 8)}/${date.slice(4, 6)}/${date.slice(0, 4)}`
    }
    return date
  }
  
  const from = formatDate(fromDate)
  
  if (toDate && toDate !== fromDate) {
    const to = formatDate(toDate)
    return `${from} - ${to}`
  }
  
  return from
}

// Funcion para obtener el nombre completo del usuario
function getCreatedByName(createdBy: { firstName: string; lastName: string } | undefined): string {
  if (!createdBy) return 'N/A'
  return `${createdBy.firstName} ${createdBy.lastName}`
}

// Funcion para obtener el tipo de archivo
function getFileTypeName(type: number): string {
  return type === 1 ? 'Archivo de Origen' : 'Archivo Final'
}

// DragHandle Component
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// Actions Menu Component
function ActionsMenu({ item, type, onDelete }: { item: DataType; type: 'liquidation' | 'conciliation'; onDelete?: (id: number) => void; }) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [openAlert, setOpenAlert] = React.useState(false)
  const [openDetails, setOpenDetails] = React.useState(false)
  const [openDownloadDialog, setOpenDownloadDialog] = React.useState(false)

  const handleDownloadFile = async (filePath: string) => {
    const success = await handleDirectDownload(filePath)
    if (success) {
      setOpenDownloadDialog(false)
    }
  }

  const handleDownloadAction = () => {
    if (!item.files || item.files.length === 0) {
      toast.error('No hay archivos disponibles')
      return
    }

    if (item.files.length === 1) {
      handleDownloadFile(item.files[0].filePath)
    } else {
      setOpenDownloadDialog(true)
    }
  }

  const handleDelete = async () => {
    try {
      if (type === 'liquidation') {
        await liquidationsApi.delete(item.id)
      } else {
        await conciliationsApi.delete(item.id)
      }

      toast.success('Registro eliminado correctamente')
      setOpenAlert(false)

      if (onDelete) onDelete(item.id)
      else router.refresh()

    } catch (err) {
      toast.error('Error al eliminar el registro')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <IconDotsVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setOpenDetails(true)}>
            <IconFileText className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadAction}>
            <IconDownload className="mr-2 h-4 w-4" />
            Descargar Archivo{item.files && item.files.length > 1 && `s (${item.files.length})`}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenAlert(true)}
            className="text-red-600 focus:text-red-700"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Eliminar Registro
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogo para seleccionar archivo cuando hay multiples */}
      <Dialog open={openDownloadDialog} onOpenChange={setOpenDownloadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar archivo para descargar</DialogTitle>
            <DialogDescription>
              Este registro contiene {item.files?.length} archivos. Selecciona cual deseas descargar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {item.files?.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {cleanS3Pathv(file.filePath)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getFileTypeName(
                      type === 'liquidation' && 'liquidationFilesType' in file
                        ? file.liquidationFilesType
                        : 'conciliationFilesType' in file
                        ? file.conciliationFilesType
                        : 0
                    )} • {format(new Date(file.createdAt), "PP", { locale: es })}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownloadFile(file.filePath)}
                  className="ml-2"
                >
                  <IconDownload className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Ver Detalles */}
      <FileDetailsDialog 
        item={item} 
        type={type} 
        open={openDetails} 
        onOpenChange={setOpenDetails} 
      />

      {/* Alert Dialog para confirmar eliminacion */}
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar registro</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente el registro y sus archivos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function FileDetailsDialog({ 
  item, 
  type, 
  open, 
  onOpenChange 
}: { 
  item: DataType; 
  type: 'liquidation' | 'conciliation';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter()

  const handleDownload = async (path: string) => {
    const success = await handleDirectDownload(path)
  }

  const isLiquidation = type === 'liquidation'
  const liquidationItem = isLiquidation ? item as z.infer<typeof liquidationSchema> : null
  const conciliationItem = !isLiquidation ? item as z.infer<typeof conciliationSchema> : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Detalles del Registro - {isLiquidation ? 'Liquidacion' : 'Ventas'}
          </DialogTitle>
          <DialogDescription>
            {item.collector.name} • {formatPeriod(item.fromDate, item.toDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informacion General */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacion General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Recaudador</Label>
                  <p className="text-sm font-medium">{item.collector.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Creado Por</Label>
                  <p className="text-sm font-medium">{getCreatedByName(item.createdBy)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fecha Desde</Label>
                  <p className="text-sm font-medium">{formatPeriod(item.fromDate)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fecha Hasta</Label>
                  <p className="text-sm font-medium">{formatPeriod(item.toDate)}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Fecha de Creacion</Label>
                  <p className="text-sm font-medium">
                    {format(new Date(item.createdAt), "PPP 'a las' p", { locale: es })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles segun tipo */}
          {isLiquidation && liquidationItem && (
            <>
              {/* Montos de Venta (Creditos) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Montos de Venta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Venta Recaudador</Label>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(liquidationItem.creditAmountCollector)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Venta Liquidacion</Label>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(liquidationItem.creditAmountLiquidation)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Diferencia</Label>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency((parseFloat(liquidationItem.creditAmountCollector || '0')) - (parseFloat(liquidationItem.creditAmountLiquidation || '0')))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Montos de Comision (Debitos) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Montos de Comision</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Comision Recaudador</Label>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency(liquidationItem.debitAmountCollector)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Comision Liquidacion</Label>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency(liquidationItem.debitAmountLiquidation)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Diferencia</Label>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency((parseFloat(liquidationItem.debitAmountCollector || '0'))-(parseFloat(liquidationItem.debitAmountLiquidation || '0')))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Montos Netos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Montos Netos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Neto Recaudador</Label>
                      <p className="text-lg font-bold">{formatCurrency(liquidationItem.amountCollector)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Neto Liquidacion</Label>
                      <p className="text-lg font-bold">{formatCurrency(liquidationItem.amountLiquidation)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Diferencia</Label>
                      <p className={`text-lg font-bold ${
                        parseFloat(liquidationItem.differenceAmounts || '0') !== 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {formatCurrency(liquidationItem.differenceAmounts)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registros */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cantidad de Registros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Registros Recaudador</Label>
                      <p className="text-lg font-bold">{liquidationItem.recordsCollector || 0}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Registros Liquidacion</Label>
                      <p className="text-lg font-bold">{liquidationItem.recordsLiquidation || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Montos No Conciliados */}
              {(liquidationItem.unreconciledAmountCollector || liquidationItem.unreconciledAmountLiquidation) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Montos No Conciliados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Monto Venta No Conciliada - Recaudador</Label>
                        <p className={`text-base font-bold ${
                          parseFloat(liquidationItem.unreconciledCreditAmountCollector || '0') !== 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {formatCurrency(liquidationItem.unreconciledCreditAmountCollector)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Monto Venta No Conciliada - Liquidacion</Label>
                        <p className={`text-base font-bold ${
                          parseFloat(liquidationItem.unreconciledCreditAmountLiquidation || '0') !== 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {formatCurrency(liquidationItem.unreconciledCreditAmountLiquidation)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Monto Comision No Conciliada - Recaudador</Label>
                        <p className={`text-base font-bold ${
                          parseFloat(liquidationItem.unreconciledDebitAmountCollector || '0') !== 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {formatCurrency(liquidationItem.unreconciledDebitAmountCollector)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Monto Comision No Conciliada - Liquidacion</Label>
                        <p className={`text-base font-bold ${
                          parseFloat(liquidationItem.unreconciledDebitAmountLiquidation || '0') !== 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {formatCurrency(liquidationItem.unreconciledDebitAmountLiquidation)}
                        </p>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Monto Neto No Conciliado - Recaudador</Label>
                        <p className={`text-base font-bold ${
                          parseFloat(liquidationItem.unreconciledAmountCollector || '0') !== 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {formatCurrency(liquidationItem.unreconciledAmountCollector)}
                        </p>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Monto Neto No Conciliado - Liquidacion</Label>
                        <p className={`text-base font-bold ${
                          parseFloat(liquidationItem.unreconciledAmountLiquidation || '0') !== 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {formatCurrency(liquidationItem.unreconciledAmountLiquidation)}
                        </p>
                      </div>
                      
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!isLiquidation && conciliationItem && (
            <>
              {/* Montos de Venta */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Montos de Venta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Venta Calimaco</Label>
                      <p className="text-lg font-bold">{formatCurrency(conciliationItem.amount)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Venta Recaudador</Label>
                      <p className="text-lg font-bold">{formatCurrency(conciliationItem.amountCollector)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Diferencia</Label>
                      <p className={`text-lg font-bold ${
                        parseFloat(conciliationItem.differenceAmounts) !== 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {formatCurrency(conciliationItem.differenceAmounts)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registros */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cantidad de Registros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Registros Calimaco</Label>
                      <p className="text-lg font-bold">{conciliationItem.recordsCalimaco || 0}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Registros Recaudador</Label>
                      <p className="text-lg font-bold">{conciliationItem.recordsCollector || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registros No Conciliados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Registros No Conciliados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">No Conciliados Calimaco</Label>
                      <p className={`text-lg font-bold ${
(conciliationItem.unreconciledRecordsCalimaco || 0) !== 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {conciliationItem.unreconciledRecordsCalimaco}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">No Conciliados Recaudador</Label>
                      <p className={`text-lg font-bold ${
(conciliationItem.unreconciledRecordsCollector || 0) !== 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {conciliationItem.unreconciledRecordsCollector}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Montos No Conciliados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Montos No Conciliados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Venta No Conciliada Calimaco</Label>
                      <p className={`text-lg font-bold ${
                        parseFloat(conciliationItem.unreconciledAmountCalimaco) !== 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {formatCurrency(conciliationItem.unreconciledAmountCalimaco)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Venta No Conciliada Recaudador</Label>
                      <p className={`text-lg font-bold ${
                        parseFloat(conciliationItem.unreconciledAmountCollector) !== 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {formatCurrency(conciliationItem.unreconciledAmountCollector)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Archivos */}
          {item.files && item.files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Archivos ({item.files.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.files
                  .sort((a, b) => {
                    const aType = type === 'liquidation' && 'liquidationFilesType' in a
                      ? a.liquidationFilesType
                      : 'conciliationFilesType' in a
                      ? a.conciliationFilesType
                      : 0
                    const bType = type === 'liquidation' && 'liquidationFilesType' in b
                      ? b.liquidationFilesType
                      : 'conciliationFilesType' in b
                      ? b.conciliationFilesType
                      : 0
                    // Tipo 2 primero, luego el resto
                    if (aType === 2 && bType !== 2) return -1
                    if (aType !== 2 && bType === 2) return 1
                    return 0
                  })
                  .map((file, index) => {
                  const fileType = type === 'liquidation' && 'liquidationFilesType' in file
                    ? file.liquidationFilesType
                    : 'conciliationFilesType' in file
                    ? file.conciliationFilesType
                    : 0
                  const isFinalFile = fileType === 2
                  
                  return (
                    <div key={index} className={`p-4 border rounded-lg ${
                      isFinalFile ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`${
                                isFinalFile 
                                  ? 'bg-green-600 text-white border-green-600' 
                                  : 'bg-red-400 text-white border-red-400'
                              }`}
                            >
                              {getFileTypeName(fileType)}
                            </Badge>
                          </div>
                          
                          <div>
                            <p className="text-sm font-mono font-medium break-all">
                              {cleanS3Pathv(file.filePath)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(file.createdAt), "PPP 'a las' p", { locale: es })}
                            </p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleDownload(file.filePath)}
                          className={isFinalFile ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          <IconDownload className="mr-2 h-4 w-4" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DraggableRow({ row, type }: { row: Row<DataType>, type: string }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

// TableCellViewer Component
function TableCellViewer({ item, type }: { item: DataType; type: 'liquidation' | 'conciliation' }) {
  return (
    <div className="font-semibold">
      {item.collector.name}
    </div>
  )
}

// Main DataTable Component
export function DataTable() {
  const [currentView, setCurrentView] = React.useState<'liquidations' | 'conciliations'>('conciliations')
  const [data, setData] = React.useState<DataType[]>([])
  const [loading, setLoading] = React.useState(false)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )
  const [searchCollector, setSearchCollector] = React.useState('')
  const [searchPeriod, setSearchPeriod] = React.useState('')

  const handleDeleteItem = (deletedId: number) => {
    setData(prevData => prevData.filter(item => item.id !== deletedId))
  }

  React.useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const result = await fetchData(currentView, searchCollector, searchPeriod)
        setData(result)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentView, searchCollector, searchPeriod])

  // Columnas simplificadas para liquidaciones
  const liquidationColumns = React.useMemo((): ColumnDef<z.infer<typeof liquidationSchema>>[] => [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.original.id} />,
    },
    {
      accessorKey: "collector.name",
      header: "Recaudador",
      cell: ({ row }) => <TableCellViewer item={row.original} type="liquidation" />,
      enableHiding: false,
    },
    {
      accessorKey: "fromDate",
      header: "Desde",
      cell: ({ row }) => (
        <div className="w-24 font-mono text-sm">
          {formatPeriod(row.original.fromDate)}
        </div>
      ),
    },
    {
      accessorKey: "toDate",
      header: "Hasta",
      cell: ({ row }) => (
        <div className="w-24 font-mono text-sm">
          {formatPeriod(row.original.toDate)}
        </div>
      ),
    },
    {
      accessorKey: "amountCollector",
      header: () => <div className="text-right">Neto Recaudador</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">{formatCurrency(row.original.amountCollector)}</div>
      ),
    },
    {
      accessorKey: "amountLiquidation",
      header: () => <div className="text-right">Neto Liquidacion</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">{formatCurrency(row.original.amountLiquidation)}</div>
      ),
    },
    {
      accessorKey: "differenceAmounts",
      header: () => <div className="text-right">Diferencia</div>,
      cell: ({ row }) => {
        const diff = parseFloat(row.original.differenceAmounts || '0')
        return (
          <div className={`text-right font-medium ${diff !== 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(row.original.differenceAmounts)}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: () => <div className="text-right">Fecha de Creacion</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ActionsMenu 
          item={row.original} 
          type="liquidation" 
          onDelete={handleDeleteItem}
        />
      ),
    },
  ], [])

  // Columnas simplificadas para conciliaciones
  const conciliationColumns = React.useMemo((): ColumnDef<z.infer<typeof conciliationSchema>>[] => [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.original.id} />,
    },
    {
      accessorKey: "collector.name",
      header: "Recaudador",
      cell: ({ row }) => <TableCellViewer item={row.original} type="conciliation" />,
      enableHiding: false,
    },
    {
      accessorKey: "fromDate",
      header: "Desde",
      cell: ({ row }) => (
        <div className="w-24 font-mono text-sm">
          {formatPeriod(row.original.fromDate)}
        </div>
      ),
    },
    {
      accessorKey: "toDate",
      header: "Hasta",
      cell: ({ row }) => (
        <div className="w-24 font-mono text-sm">
          {formatPeriod(row.original.toDate)}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Venta Calimaco</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">{formatCurrency(row.original.amount)}</div>
      ),
    },
    {
      accessorKey: "amountCollector",
      header: () => <div className="text-right">Venta Recaudador</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">{formatCurrency(row.original.amountCollector)}</div>
      ),
    },
    {
      accessorKey: "differenceAmounts",
      header: () => <div className="text-right">Diferencia</div>,
      cell: ({ row }) => {
        const diff = parseFloat(row.original.differenceAmounts)
        return (
          <div className={`text-right font-medium ${diff !== 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(row.original.differenceAmounts)}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: () => <div className="text-right">Fecha de Creacion</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ActionsMenu 
          item={row.original} 
          type="conciliation" 
          onDelete={handleDeleteItem}
        />
      ),
    },
  ], [])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const columns = currentView === 'liquidations' 
    ? liquidationColumns 
    : currentView === 'conciliations'
    ? conciliationColumns
    : liquidationColumns

  const table = useReactTable({
    data,
    columns: columns as any,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)} className="w-full">
      <div className="flex items-center justify-between px-4 lg:px-6 mb-4">
        <Select value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
          <SelectTrigger className="w-[180px] lg:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="conciliations">Ventas</SelectItem>
            <SelectItem value="liquidations">Liquidaciones</SelectItem>
          </SelectContent>
        </Select>

        <TabsList className="hidden lg:flex">
          <TabsTrigger value="conciliations">Ventas</TabsTrigger>
          <TabsTrigger value="liquidations">Liquidaciones</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Buscar por recaudador..."
            value={searchCollector}
            onChange={(e) => setSearchCollector(e.target.value)}
            className="w-48 border-2 border-gray-400 focus:border-red-500 focus:ring-red-500"
          />
          <PeriodPicker
            value={searchPeriod}
            onChange={setSearchPeriod}
          />
          {(searchCollector || searchPeriod) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchCollector('')
                setSearchPeriod('')
              }}
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      <TabsContent value={currentView} className="m-0">
        <div className="rounded-md border">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                      {table.getRowModel().rows.map((row) => (
                        <DraggableRow key={row.id} row={row} type={currentView} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No hay resultados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="hidden lg:flex"
            >
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="hidden lg:flex"
            >
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}