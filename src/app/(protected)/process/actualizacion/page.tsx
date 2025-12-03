"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2, Server, Play, Trash2, Clock, CheckCircle2, AlertTriangle, Check, X, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { fetchWithAuth } from "@/lib/api-client"

interface Collector {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  createdBy: {
    firstName: string
    lastName: string
  }
  updatedBy: {
    firstName: string
    lastName: string
  }
}

type ProcesoEstado = "pendiente" | "ejecutando" | "completado" | "error"

interface ProcesoActualizacion {
  id: string
  collectorName: string
  estado: ProcesoEstado
  progreso: number
  mensaje?: string
  timestamp: number
  recuperado?: boolean
}

export default function ProcesosActualizacionPage() {
  const [collectors, setCollectors] = React.useState<Collector[]>([])
  const [loading, setLoading] = React.useState(false)
  const [procesos, setProcesos] = React.useState<ProcesoActualizacion[]>([])
  const [isInitialized, setIsInitialized] = React.useState(false)

  const fetchCollectors = async () => {
    try {
      setLoading(true)
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/collectors`)
      if (!response.ok) throw new Error('Error al obtener recaudadores')
      const data = await response.json()
      setCollectors(data)
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar recaudadores')
    } finally {
      setLoading(false)
    }
  }

  // cargar procesos desde localStorage
  React.useEffect(() => {
    try {
      const procesosGuardados = localStorage.getItem('procesos-actualizacion')
      if (procesosGuardados) {
        const procesosParseados = JSON.parse(procesosGuardados)
        const procesosConRecuperados = procesosParseados.map((p: any) => ({
          ...p,
          recuperado: p.estado === "ejecutando" ? true : false,
        }))
        setProcesos(procesosConRecuperados)
      }
    } catch (error) {
      console.error('Error al cargar procesos desde localStorage:', error)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // guardar procesos en localStorage
  React.useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('procesos-actualizacion', JSON.stringify(procesos))
      } catch (error) {
        console.error('Error al guardar procesos en localStorage:', error)
      }
    }
  }, [procesos, isInitialized])

  React.useEffect(() => {
    fetchCollectors()
  }, [])

  const agregarProceso = (collectorName: string) => {
    const nuevoProceso: ProcesoActualizacion = {
      id: `${Date.now()}-${Math.random()}`,
      collectorName,
      estado: "pendiente",
      progreso: 0,
      timestamp: Date.now(),
    }

    setProcesos(prev => [...prev, nuevoProceso])
    toast.success(`${collectorName} agregado a la cola`)
  }

  const ejecutarProceso = async (procesoId: string) => {
    const proceso = procesos.find(p => p.id === procesoId)
    if (!proceso) return

    const endpointMap: Record<string, string> = {
      'Kashio': 'execute-updated-kashio',
      'Monnet': 'execute-updated-monnet',
      'Kushki': 'execute-updated-kushki',
      'Niubiz': 'execute-updated-niubiz',
      'Yape': 'execute-updated-yape',
      'Nuvei': 'execute-updated-nuvei',
      'PagoEfectivo': 'execute-updated-pagoefectivo',
      'Safetypay': 'execute-updated-safetypay',
      'Tupay': 'execute-updated-tupay'
    }

    const endpoint = endpointMap[proceso.collectorName]
    if (!endpoint) {
      toast.error(`Endpoint no encontrado para ${proceso.collectorName}`)
      return
    }

    setProcesos(prev => prev.map(p => 
      p.id === procesoId ? { ...p, estado: "ejecutando" as ProcesoEstado, progreso: 0, recuperado: false } : p
    ))

    const intervalo = setInterval(() => {
      setProcesos(prev => prev.map(p => {
        if (p.id === procesoId && p.estado === "ejecutando") {
          const incremento = Math.random() * 3 + 1
          const nuevoProgreso = Math.min(p.progreso + incremento, 70)
          return { ...p, progreso: nuevoProgreso }
        }
        return p
      }))
    }, 800)

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/digital/${endpoint}`, {
        method: 'GET',
        headers: { 'x-api-key': apiKey || '' }
      })

      clearInterval(intervalo)

      const data = await response.json()
      
      if (response.ok) {
        setProcesos(prev => prev.map(p => 
          p.id === procesoId 
            ? { 
                ...p, 
                estado: "completado" as ProcesoEstado, 
                progreso: 100, 
                mensaje: data.message || "Completado exitosamente" 
              }
            : p
        ))
        toast.success(`${proceso.collectorName} actualizado exitosamente`)
        // actualizar lista de recaudadores
        await fetchCollectors()
      } else {
        const errorMessage = data.detail?.message || data.message || `Error ${response.status}`
        setProcesos(prev => prev.map(p => 
          p.id === procesoId 
            ? { 
                ...p, 
                estado: "error" as ProcesoEstado, 
                progreso: 0,
                mensaje: errorMessage
              }
            : p
        ))
        toast.error(`Error al actualizar ${proceso.collectorName}: ${errorMessage}`)
      }
    } catch (error: any) {
      clearInterval(intervalo)
      
      setProcesos(prev => prev.map(p => 
        p.id === procesoId 
          ? { 
              ...p, 
              estado: "error" as ProcesoEstado, 
              progreso: 0,
              mensaje: error.message || "Error de conexion"
            }
          : p
      ))
      
      toast.error(`Error de conexion al actualizar ${proceso.collectorName}`)
    }
  }

  const ejecutarTodos = () => {
    const pendientes = procesos.filter(p => p.estado === "pendiente")
    pendientes.forEach(p => ejecutarProceso(p.id))
  }

  const eliminarProceso = (id: string) => {
    setProcesos(prev => prev.filter(p => p.id !== id))
  }

  const limpiarCompletados = () => {
    setProcesos(prev => prev.filter(p => p.estado !== "completado" && p.estado !== "error"))
    toast.success("Procesos completados y fallidos eliminados")
  }

  const marcarComoCompletado = (procesoId: string) => {
    setProcesos(prev => prev.map(p => 
      p.id === procesoId 
        ? { 
            ...p, 
            estado: "completado" as ProcesoEstado, 
            progreso: 100,
            recuperado: false,
            mensaje: "Marcado como completado manualmente" 
          }
        : p
    ))
    toast.success("Proceso marcado como completado")
  }

  const marcarComoFallido = (procesoId: string) => {
    setProcesos(prev => prev.map(p => 
      p.id === procesoId 
        ? { 
            ...p, 
            estado: "error" as ProcesoEstado, 
            progreso: 0,
            recuperado: false,
            mensaje: "Marcado como fallido manualmente" 
          }
        : p
    ))
    toast.error("Proceso marcado como fallido")
  }

  const limpiarTodo = () => {
    setProcesos([])
    localStorage.removeItem('procesos-actualizacion')
    toast.success("Todos los procesos eliminados")
  }

  const getEstadoColor = (estado: ProcesoEstado) => {
    switch (estado) {
      case "pendiente": return "bg-gray-100 border-gray-300 text-gray-700"
      case "ejecutando": return "bg-blue-50 border-blue-300 text-blue-700"
      case "completado": return "bg-green-50 border-green-300 text-green-700"
      case "error": return "bg-red-50 border-red-300 text-red-700"
    }
  }

  const getEstadoIcon = (estado: ProcesoEstado) => {
    switch (estado) {
      case "pendiente": return <Clock className="w-5 h-5" />
      case "ejecutando": return <Loader2 className="w-5 h-5 animate-spin" />
      case "completado": return <CheckCircle2 className="w-5 h-5" />
      case "error": return <AlertTriangle className="w-5 h-5" />
    }
  }

  const procesosPendientes = procesos.filter(p => p.estado === "pendiente").length
  const procesosEjecutando = procesos.filter(p => p.estado === "ejecutando").length
  const procesosCompletados = procesos.filter(p => p.estado === "completado").length
  const procesosFallidos = procesos.filter(p => p.estado === "error").length

  return (
    <>
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-gray-900">
            Procesos de <span className="text-red-600">Actualizacion</span>
          </h1>
          <p className="text-gray-600">Ejecuta multiples actualizaciones de recaudadores en paralelo</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de recaudadores */}
          <Card className="lg:col-span-1 border-red-100 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center border-2 border-red-600/40">
                  <RefreshCw className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle>Recaudadores</CardTitle>
                  <CardDescription>Seleccionar para actualizar</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : (
                collectors.map((collector) => (
                  <div key={collector.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm">{collector.name}</h3>
                      <div className="text-xs text-muted-foreground">
                        <div>Actualizado: {format(new Date(collector.updatedAt), "dd/MM/yyyy HH:mm", { locale: es })}</div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => agregarProceso(collector.name)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                ))
              )}

              {/* estadisticas */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pendientes:
                  </span>
                  <span className="font-semibold text-gray-900">{procesosPendientes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4" />
                    Ejecutando:
                  </span>
                  <span className="font-semibold text-blue-700">{procesosEjecutando}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Completados:
                  </span>
                  <span className="font-semibold text-green-700">{procesosCompletados}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Fallidos:
                  </span>
                  <span className="font-semibold text-red-700">{procesosFallidos}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Panel de procesos */}
          <Card className="lg:col-span-2 border-gray-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cola de Procesos</CardTitle>
                  <CardDescription>
                    {procesos.length === 0 ? "No hay procesos en cola" : `${procesos.length} proceso(s) en total`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {procesosPendientes > 0 && (
                    <Button
                      onClick={ejecutarTodos}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Ejecutar Todos ({procesosPendientes})
                    </Button>
                  )}
                  {(procesosCompletados > 0 || procesos.some(p => p.estado === "error")) && (
                    <Button
                      onClick={limpiarCompletados}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Limpiar
                    </Button>
                  )}
                  {procesos.length > 0 && (
                    <Button
                      onClick={limpiarTodo}
                      size="sm"
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Limpiar Todo
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 scrollbar-thin">
              {procesos.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Server className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Sin procesos</p>
                  <p className="text-sm">Agrega recaudadores a la cola</p>
                </div>
              ) : (
                procesos.map((proceso) => (
                  <div
                    key={proceso.id}
                    className={cn(
                      "border-2 rounded-lg p-4 transition-all duration-300",
                      getEstadoColor(proceso.estado)
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getEstadoIcon(proceso.estado)}
                        <div>
                          <h3 className="font-semibold text-lg">
                            {proceso.collectorName}
                          </h3>
                          <p className="text-sm opacity-75">
                            Actualizacion • {format(new Date(proceso.timestamp), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {proceso.estado === "pendiente" && (
                          <Button
                            onClick={() => ejecutarProceso(proceso.id)}
                            size="sm"
                            variant="ghost"
                            className="h-8"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {proceso.estado === "ejecutando" && !proceso.recuperado && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 cursor-not-allowed opacity-50"
                            disabled
                          >
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </Button>
                        )}
                        {proceso.estado !== "ejecutando" && (
                          <Button
                            onClick={() => eliminarProceso(proceso.id)}
                            size="sm"
                            variant="ghost"
                            className="h-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {proceso.estado === "ejecutando" && (
                      <div className="space-y-2">
                        {proceso.recuperado ? (
                          <>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-amber-800">
                                  <p className="font-semibold mb-1">Proceso recuperado de sesion anterior</p>
                                  <p className="opacity-90">
                                    El proceso se envio al backend pero no se puede mostrar el progreso en tiempo real.
                                    Es posible que ya haya finalizado en el servidor.
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                onClick={() => marcarComoCompletado(proceso.id)}
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Marcar Completado
                              </Button>
                              <Button
                                onClick={() => marcarComoFallido(proceso.id)}
                                size="sm"
                                variant="outline"
                                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Marcar Fallido
                              </Button>
                              <Button
                                onClick={() => eliminarProceso(proceso.id)}
                                size="sm"
                                variant="outline"
                                className="border-gray-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between text-sm">
                              <span>Progreso</span>
                              <span className="font-semibold">{Math.round(proceso.progreso)}%</span>
                            </div>
                            <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full transition-all duration-500 ease-out rounded-full"
                                style={{ width: `${proceso.progreso}%` }}
                              />
                            </div>
                            <p className="text-xs opacity-75 mt-1">Procesando actualizacion...</p>
                          </>
                        )}
                      </div>
                    )}

                    {proceso.mensaje && (
                      <div className="text-sm mt-2 opacity-90 whitespace-pre-line">
                        {proceso.mensaje}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}