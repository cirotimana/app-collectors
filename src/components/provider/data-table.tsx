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
// Funcion para formatear montos en formato bancario
function formatCurrency(amount: number | string | null | undefined): string {
  // Si es null, undefined o vacío, retornar valor por defecto
  if (amount === null || amount === undefined || amount === '') {
    return 'S/ 0.00';
  }
  
  // Convertir a numero si es string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Verificar si es un numero valido y finito
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return 'S/ 0.00';
  }
  
  // Formatear el numero con separadores de miles y 2 decimales
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
    // Verificar si estamos en un contexto seguro y el API esta disponible
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Usar fallback para entornos no seguros
      return fallbackCopyToClipboard(text)
    }
  } catch (error) {
    console.error('Error in safeCopyToClipboard:', error)
    return fallbackCopyToClipboard(text)
  }
}

// Funcion para limpiar la ruta S3 - MODIFICADA
function cleanS3Path(path: string): string {
  if (!path) return ''
  
  // Remover el prefijo s3://bucket-name/
  const cleanedPath = path.replace(/^s3:\/\/[^\/]+\//, '')
  return cleanedPath
}

function cleanS3Pathv(path: string): string {
  if (!path) return ''
  
  // Dividir por "/" y tomar el ultimo elemento (nombre del archivo)
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
      // Si hay redireccion, abrir la URL presigned en nueva pestaña
      const presignedUrl = response.headers.get('Location')
      if (presignedUrl) {
        window.open(presignedUrl, '_blank')
        toast.success('Descarga iniciada')
        return true
      }
    } else if (response.ok) {
      // Si la respuesta es OK, intentar procesar como JSON
      const data = await response.json()
      if (data.url) {
        window.open(data.url, '_blank')
        toast.success('Descarga iniciada')
        return true
      }
    }
    
    // Si no hay redireccion, intentar descargar directamente
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
  // liquidationsType: z.number(),
  fromDate: z.string(), // CAMBIO: period -> fromDate
  toDate: z.string(),   // NUEVO
  amountCollector: z.string(),
  amountLiquidation: z.string(),
  differenceAmounts: z.string(),
  recordsCollector: z.number().nullable().default(0),
  recordsLiquidation: z.number().nullable().default(0),
  debitAmountCollector: z.string().nullable().default('0.00'),
  debitAmountLiquidation: z.string().nullable().default('0.00'),
  creditAmountCollector: z.string().nullable().default('0.00'),
  creditAmountLiquidation: z.string().nullable().default('0.00'),
  // liquidationsState: z.boolean(),
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
  // NUEVAS COLUMNAS PARA CONCILIACIONES
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
  let endpoint = type === 'liquidations' ? '/liquidations' : '/conciliations'
  
  try {
    // Si hay filtro de rango de fechas
    if (dateRange && dateRange.trim()) {
      const range = dateRange.trim()
      
      if (range.includes('-')) {
        // Rango de fechas: 20251001-20251015
        const [fromDate, toDate] = range.split('-')
        const from = formatDateForAPI(fromDate)
        const to = formatDateForAPI(toDate)
        endpoint += `/range?from=${from}&to=${to}`
      } else {
        // Fecha unica: 20251001
        const from = formatDateForAPI(range)
        const to = from
        endpoint += `/range?from=${from}&to=${to}`
      }
    } 
    // Si hay filtro de recaudador
    else if (collector && collector.trim()) {
      endpoint += `/collector/${encodeURIComponent(collector.trim())}`
    }
    
    console.log('Fetching from:', `${API_URL}${endpoint}`)
    
    const response = await fetch(`${API_URL}${endpoint}`)
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching data:', error)
    toast.error('Error al cargar los datos')
    return []
  }
}


// Funcion para formatear el periodo en la tabla
function formatPeriod(fromDate: string, toDate?: string): string {
  if (!fromDate) return ''
  
  // Formato: YYYY-MM-DD
  const formatDate = (date: string) => {
    if (date.length === 10 && date.includes('-')) {
      // Ya esta en formato YYYY-MM-DD
      const [year, month, day] = date.split('-')
      return `${day}/${month}/${year}`
    }
    // Si es formato YYYYMMDD
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

  // Funcion para manejar la descarga de un archivo especifico
  const handleDownloadFile = async (filePath: string) => {
    const success = await handleDirectDownload(filePath)
    if (success) {
      setOpenDownloadDialog(false)
    }
  }

  // Funcion para el boton de descarga principal
  const handleDownloadAction = () => {
    if (!item.files || item.files.length === 0) {
      toast.error('No hay archivos disponibles')
      return
    }

    if (item.files.length === 1) {
      // Si solo hay un archivo, descargar directamente
      handleDownloadFile(item.files[0].filePath)
    } else {
      // Si hay multiples archivos, abrir el dialogo
      setOpenDownloadDialog(true)
    }
  }

  const handleDelete = async () => {
    try {
      const endpoint = `${API_URL}/${type === 'liquidation' ? 'liquidations' : 'conciliations'}/${item.id}`
      const res = await fetch(endpoint, { method: 'DELETE' })

      if (!res.ok) throw new Error('Error al eliminar registro')

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
      {/* Version Desktop */}
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

      {/* Drawer para Ver Detalles */}
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


function FileDetailsDialog({ 
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

  const handleCopyPath = async (path: string) => {
    try {
      const success = await safeCopyToClipboard(path)
      if (success) {
        toast.success('Ruta copiada al portapapeles')
      } else {
        toast.error('No se pudo copiar la ruta')
      }
    } catch (error) {
      console.error('Error al copiar:', error)
      toast.error('Error al copiar la ruta')
    }
  }

  const handleDownload = async (path: string) => {
    const success = await handleDirectDownload(path)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Detalles del Registro</DrawerTitle>
          <DrawerDescription>
            {item.collector.name} - {formatPeriod(item.fromDate, item.toDate)}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informacion General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Recaudador</Label>
                  <p className="text-sm font-medium">{item.collector.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Fecha Desde</Label>
                    <p className="text-sm font-medium">{formatPeriod(item.fromDate)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Fecha Hasta</Label>
                    <p className="text-sm font-medium">{formatPeriod(item.toDate)}</p>
                  </div>
                </div>
                {/* <div>
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  <Badge variant={
                    type === 'liquidation' 
                      ? ('liquidationsState' in item && item.liquidationsState ? 'default' : 'secondary')
                      : ('conciliationsState' in item && item.conciliationsState ? 'default' : 'secondary')
                  }>
                    {type === 'liquidation'
                      ? ('liquidationsState' in item && item.liquidationsState ? 'Completado' : 'Pendiente')
                      : ('conciliationsState' in item && item.conciliationsState ? 'Completado' : 'Pendiente')
                    }
                  </Badge>
                </div> */}
                <div>
                  <Label className="text-xs text-muted-foreground">Creado Por</Label>
                  <p className="text-sm font-medium">{getCreatedByName(item.createdBy)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fecha de Creacion</Label>
                  <p className="text-sm font-medium">
                    {format(new Date(item.createdAt), "PPP 'a las' p", { locale: es })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {item.files && item.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Archivos ({item.files.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.files.map((file, index) => (
                    <div key={index} className="space-y-3 p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Tipo de Archivo</Label>
                            <Badge 
                              variant="outline" 
                              className={`mt-1 ${
                                (type === 'liquidation' && 'liquidationFilesType' in file ? file.liquidationFilesType : 
                                'conciliationFilesType' in file ? file.conciliationFilesType : 0) === 2 
                                  ? 'bg-green-600 text-white border-green-600' 
                                  : 'bg-red-400 text-white border-red-400'
                              }`}
                            >
                              {getFileTypeName(
                                type === 'liquidation' && 'liquidationFilesType' in file
                                  ? file.liquidationFilesType
                                  : 'conciliationFilesType' in file
                                  ? file.conciliationFilesType
                                  : 0
                              )}
                            </Badge>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Nombre del Archivo</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs font-mono bg-background p-2 rounded border flex-1 break-all">
                                {cleanS3Pathv(file.filePath)}
                              </p>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">Fecha de Creacion</Label>
                            <p className="text-sm">
                              {format(new Date(file.createdAt), "PPP 'a las' p", { locale: es })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleDownload(file.filePath)}
                      >
                        <IconDownload className="mr-2 h-4 w-4" />
                        Descargar este Archivo
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DrawerFooter className="border-t">
          <DrawerClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
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

  // Funcion para eliminar items
  const handleDeleteItem = (deletedId: number) => {
    setData(prevData => prevData.filter(item => item.id !== deletedId))
  }

  // Cargar datos segun la vista
  // Actualizar el useEffect de carga de datos
  React.useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Ahora usamos dateRange en lugar de period
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



  // Actualizar las columnas de liquidaciones
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
  
  // CRÉDITOS
  {
    accessorKey: "creditAmountCollector",
    header: () => <div className="text-center">Venta<br />Recaudador</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium text-blue-600">
        {formatCurrency(row.original.creditAmountCollector || '0.00')}
      </div>
    ),
  },
  {
    accessorKey: "creditAmountLiquidation",
    header: () => <div className="text-center">Venta<br />Liquidacion</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium text-blue-600">
        {formatCurrency(row.original.creditAmountLiquidation || '0.00')}
      </div>
    ),
  },
  // DÉBITOS
  {
    accessorKey: "debitAmountCollector",
    header: () => <div className="text-center">Comision<br />Recaudador</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium text-orange-600">
        {formatCurrency(row.original.debitAmountCollector || '0.00')}
      </div>
    ),
  },
  {
    accessorKey: "debitAmountLiquidation",
    header: () => <div className="text-center">Comision<br />Liquidacion</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium text-orange-600">
        {formatCurrency(row.original.debitAmountLiquidation || '0.00')}
      </div>
    ),
  },
  // MONTOS NETOS
  {
    accessorKey: "amountCollector",
    header: () => <div className="w-full text-center">Neto<br />Recaudador</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">{formatCurrency(row.original.amountCollector)}</div>
    ),
  },
  {
    accessorKey: "amountLiquidation",
    header: () => <div className="w-full text-center">Neto<br />Liquidacion</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">{formatCurrency(row.original.amountLiquidation)}</div>
    ),
  },
  {
    accessorKey: "differenceAmounts",
    header: () => <div className="w-full text-right">Diferencia</div>,
    cell: ({ row }) => {
      const diff = parseFloat(row.original.differenceAmounts || '0')
      return (
        <div className={`text-right font-medium ${diff !== 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(row.original.differenceAmounts)}
        </div>
      )
    },
  },
  // REGISTROS
  {
    accessorKey: "recordsCollector",
    header: () => <div className="text-center">Registros<br />Recaudador</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {row.original.recordsCollector || 0}
      </div>
    ),
  },
  {
    accessorKey: "recordsLiquidation",
    header: () => <div className="text-center">Registros<br />Liquidacion</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {row.original.recordsLiquidation || 0}
      </div>
    ),
  },
  // {
  //   accessorKey: "createdBy",
  //   header: "Creado Por",
  //   cell: ({ row }) => getCreatedByName(row.original.createdBy),
  // },
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
  // ELIMINADO: Columna de tipo de conciliación
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
    header: () => <div className="w-full text-right">Venta Calimaco</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">{formatCurrency(row.original.amount)}</div>
    ),
  },
  {
    accessorKey: "amountCollector",
    header: () => <div className="w-full text-right">Venta Recaudador</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">{formatCurrency(row.original.amountCollector)}</div>
    ),
  },
   {
    accessorKey: "differenceAmounts",
    header: () => <div className="w-full text-right">Diferencia</div>,
    cell: ({ row }) => {
      const diff = parseFloat(row.original.differenceAmounts)
      return (
        <div className={`text-right font-medium ${diff !== 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(row.original.differenceAmounts)}
        </div>
      )
    },
  },
  // ELIMINADO: Columna de estado de conciliación
  // NUEVAS COLUMNAS PARA CONCILIACIONES
  {
    accessorKey: "recordsCalimaco",
    header: () => <div className="text-center">Registros<br />Calimaco</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.original.recordsCalimaco || '0'}</div>
    ),
  },
  {
    accessorKey: "recordsCollector",
    header: () => <div className="text-center">Registros<br />Recaudador</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.original.recordsCollector || '0'}</div>
    ),
  },
  {
    accessorKey: "unreconciledRecordsCalimaco",
    header: () => <div className="text-center">No Conciliados<br />Calimaco</div>,
    cell: ({ row }) => {
      // <div className="text-center font-medium">{row.original.unreconciledRecordsCalimaco}</div>
      const noconc = (row.original.unreconciledRecordsCalimaco)
      return(
        <div className={`text-right font-medium ${noconc !== 0 ? 'text-red-600' : 'text-green-600'}`}>
          {(row.original.unreconciledRecordsCalimaco || '0')}
        </div>
      )
    },
  },
  {
    accessorKey: "unreconciledRecordsCollector",
    header: () => <div className="text-center">No Conciliados<br />Recaudador</div>,
    cell: ({ row }) => {
      // <div className="text-center font-medium">{row.original.unreconciledRecordsCollector}</div>
      const noconr = (row.original.unreconciledRecordsCollector)
      return(
        <div className={`text-right font-medium ${noconr !== 0 ? 'text-red-600' : 'text-green-600'}`}>
          {(row.original.unreconciledRecordsCollector || '0')}
        </div>
      )
    },
  },
  {
    accessorKey: "unreconciledAmountCalimaco",
    header: () => <div className="text-center">No Conciliados<br />Venta Calimaco</div>,
    cell: ({ row }) => {
      const amountncc = parseFloat(row.original.unreconciledAmountCalimaco)
      return(
        <div className={`text-right font-medium ${amountncc !== 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(row.original.unreconciledAmountCalimaco)}
        </div>
      )
    },
  },
  {
    accessorKey: "unreconciledAmountCollector",
    header: () => <div className="text-center">No Conciliados<br />Venta Recaudador</div>,
    cell: ({ row }) => {
      // <div className="text-right font-medium">{formatCurrency(row.original.unreconciledAmountCollector)}</div>
      const amountncr = parseFloat(row.original.unreconciledAmountCollector)
      return(
        <div className={`text-right font-medium ${amountncr !== 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(row.original.unreconciledAmountCollector)}
        </div>
      )
    },
  },
  
 
  // {
  //   accessorKey: "createdBy",
  //   header: "Creado Por",
  //   cell: ({ row }) => getCreatedByName(row.original.createdBy),
  // },
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

  // Determinar columnas segun el tipo actual
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
        {/* Selector movil */}
        <Select value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
          <SelectTrigger className="w-[180px] lg:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="conciliations">Ventas</SelectItem>
            <SelectItem value="liquidations">Liquidaciones</SelectItem>
          </SelectContent>
        </Select>

        {/* Tabs desktop */}
        <TabsList className="hidden lg:flex">
          <TabsTrigger value="conciliations">Ventas</TabsTrigger>
          <TabsTrigger value="liquidations">Liquidaciones</TabsTrigger>
        </TabsList>

        {/* Acciones y filtros */}
        <div className="flex items-center gap-2">
          <Input
              type="text"
              placeholder="Buscar por recaudador..."
              value={searchCollector}
              onChange={(e) => setSearchCollector(e.target.value)}
              className="w-48"
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="h-4 w-4 mr-2" />
                Columnas
                <IconChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
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

        {/* Paginacion */}
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