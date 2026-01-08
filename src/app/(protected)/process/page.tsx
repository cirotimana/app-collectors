"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, Loader2, Server, ArrowUpRight, AlertCircle, CheckCircle2, Play, Trash2, Clock, AlertTriangle, Check, X } from "lucide-react";
import { format, isAfter, addDays, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DateRange } from "react-day-picker";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ROLES } from "@/lib/permissions";

type ProcesoEstado = "pendiente" | "ejecutando" | "completado" | "error";

interface Proceso {
  id: string;
  tipo: string;
  recaudador: string;
  fromDate: Date;
  toDate: Date;
  estado: ProcesoEstado;
  progreso: number;
  mensaje?: string;
  timestamp: number;
  recuperado?: boolean;
}

export default function ProcessPage() {
  const [tipo, setTipo] = useState("conciliacion");
  const [recaudador, setRecaudador] = useState("kashio");
  const [range, setRange] = useState<DateRange | undefined>();
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProcesoId, setDeleteProcesoId] = useState<string | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // Cargar procesos desde localStorage al montar el componente
  useEffect(() => {
    try {
      const procesosGuardados = localStorage.getItem('procesos-conciliacion');
      if (procesosGuardados) {
        const procesosParseados = JSON.parse(procesosGuardados);
        // Convertir las fechas de string a Date y marcar los "ejecutando" como recuperados
        const procesosConFechas = procesosParseados.map((p: any) => ({
          ...p,
          fromDate: new Date(p.fromDate),
          toDate: new Date(p.toDate),
          recuperado: p.estado === "ejecutando" ? true : false,
        }));
        setProcesos(procesosConFechas);
      }
    } catch (error) {
      console.error('Error al cargar procesos desde localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Guardar procesos en localStorage cada vez que cambien
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('procesos-conciliacion', JSON.stringify(procesos));
      } catch (error) {
        console.error('Error al guardar procesos en localStorage:', error);
      }
    }
  }, [procesos, isInitialized]);

  // resetear recaudador cuando cambia el tipo si no es valido para el nuevo tipo
  useEffect(() => {
    const recaudadoresConciliacion = ["kashio", "monnet", "kushki", "niubiz", "yape", "nuvei", "pagoefectivo", "safetypay", "tupay"];
    const recaudadoresLiquidacion = ["kashio", "tupay", "pagoefectivo"];

    const recaudadoresValidos = tipo === "conciliacion" ? recaudadoresConciliacion : recaudadoresLiquidacion;

    if (!recaudadoresValidos.includes(recaudador)) {
      setRecaudador("kashio");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  // Endpoints ahora estn centralizados en /lib/api.ts

  const fromDate = range?.from;
  const toDate = range?.to || range?.from;

  const rangoEsValido = useMemo(() => {
    if (!fromDate) return true;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaDesde = new Date(fromDate);
    const fechaHasta = toDate ? new Date(toDate) : new Date(fromDate);
    fechaDesde.setHours(0, 0, 0, 0);
    fechaHasta.setHours(0, 0, 0, 0);

    let diasAtras = 1;
    if (tipo === "liquidacion") {
      if (recaudador === "kashio") diasAtras = 2;
      else if (recaudador === "tupay") diasAtras = 7;
      else if (recaudador === "pagoefectivo") diasAtras = 7;
    }

    const fechaLimite = addDays(hoy, -diasAtras);

    if (isFuture(fechaDesde) || isFuture(fechaHasta)) return false;
    if (isAfter(fechaDesde, fechaHasta)) return false;
    if (isAfter(fechaDesde, fechaLimite) || isAfter(fechaHasta, fechaLimite)) return false;
    return true;
  }, [fromDate, toDate, tipo, recaudador]);

  const getMensajeErrorRango = () => {
    if (!fromDate) return "";

    let diasAtras = 1;
    let mensajeLimite = "hasta ayer";

    if (tipo === "liquidacion") {
      if (recaudador === "kashio") {
        diasAtras = 2;
        mensajeLimite = "hasta hace 2 dias";
      } else if (recaudador === "tupay" || recaudador === "pagoefectivo") {
        diasAtras = 7;
        mensajeLimite = "hasta hace 7 dias";
      }
    }

    const hoy = new Date();
    const fechaLimite = addDays(hoy, -diasAtras);

    if (isFuture(fromDate) || isFuture(toDate || fromDate)) return "No puedes seleccionar fechas futuras.";
    if (isAfter(fromDate, toDate || fromDate)) return "El rango está invertido.";
    if (isAfter(fromDate, fechaLimite) || isAfter(toDate || fromDate, fechaLimite)) {
      return `Para ${tipo} de ${recaudador}, solo puedes seleccionar fechas ${mensajeLimite} o anteriores.`;
    }

    return "";
  };

  const formatear = (d: Date) => format(d, "ddMMyyyy");

  const agregarProceso = () => {
    if (!fromDate) {
      toast.error("Selecciona un rango de fechas");
      return;
    }

    // validar que haya un recaudador seleccionado y valido
    const recaudadoresConciliacion = ["kashio", "monnet", "kushki", "niubiz", "yape", "nuvei", "pagoefectivo", "safetypay", "tupay"];
    const recaudadoresLiquidacion = ["kashio", "tupay", "pagoefectivo"];
    const recaudadoresValidos = tipo === "conciliacion" ? recaudadoresConciliacion : recaudadoresLiquidacion;

    if (!recaudador || !recaudadoresValidos.includes(recaudador)) {
      toast.error("Selecciona un recaudador valido");
      return;
    }

    if (!rangoEsValido) {
      toast.error("Rango inválido", { description: getMensajeErrorRango() });
      return;
    }

    // Validacion se har en la API centralizada

    const nuevoProceso: Proceso = {
      id: `${Date.now()}-${Math.random()}`,
      tipo,
      recaudador,
      fromDate,
      toDate: toDate || fromDate,
      estado: "pendiente",
      progreso: 0,
      timestamp: Date.now(),
    };

    setProcesos(prev => [...prev, nuevoProceso]);
    toast.success("Proceso agregado a la cola");
  };



  const ejecutarProceso = async (procesoId: string) => {
    const proceso = procesos.find(p => p.id === procesoId);
    if (!proceso) return;

    setProcesos(prev => prev.map(p =>
      p.id === procesoId ? { ...p, estado: "ejecutando" as ProcesoEstado, progreso: 0, recuperado: false } : p
    ));

    const intervalo = setInterval(() => {
      setProcesos(prev => prev.map(p => {
        if (p.id === procesoId && p.estado === "ejecutando") {
          const incremento = Math.random() * 3 + 1;
          const nuevoProgreso = Math.min(p.progreso + incremento, 70);
          return { ...p, progreso: nuevoProgreso };
        }
        return p;
      }));
    }, 800);

    try {
      const { processApi } = await import('@/lib/api');
      const data = await processApi.executeProcess(
        proceso.tipo as 'conciliacion' | 'liquidacion',
        proceso.recaudador,
        formatear(proceso.fromDate),
        formatear(proceso.toDate)
      );

      clearInterval(intervalo);

      setProcesos(prev => prev.map(p =>
        p.id === procesoId
          ? {
            ...p,
            estado: "completado" as ProcesoEstado,
            progreso: 100,
            mensaje: data.message || "Completado exitosamente"
          }
          : p
      ));
      toast.success(`${proceso.recaudador} completado`, {
        description: data.message
      });
    } catch (error: any) {
      clearInterval(intervalo);

      let detailedMessage = error.message || "Error desconocido";

      setProcesos(prev => prev.map(p =>
        p.id === procesoId
          ? {
            ...p,
            estado: "error" as ProcesoEstado,
            progreso: 0,
            mensaje: detailedMessage
          }
          : p
      ));

      toast.error(`Error en ${proceso.recaudador}`, {
        description: (
          <div className="whitespace-pre-line text-left">
            {detailedMessage}
          </div>
        ),
        duration: 8000
      });
    }
  };

  const ejecutarTodos = () => {
    const pendientes = procesos.filter(p => p.estado === "pendiente");
    pendientes.forEach(p => ejecutarProceso(p.id));
  };

  const eliminarProceso = (id: string) => {
    const proceso = procesos.find(p => p.id === id);
    if (!proceso) return;
    
    setDeleteProcesoId(id);
    setDeleteDialogOpen(true);
  };

  const confirmarEliminarProceso = () => {
    if (deleteProcesoId) {
      setProcesos(prev => prev.filter(p => p.id !== deleteProcesoId));
      toast.success("Proceso eliminado de la cola");
    }
    setDeleteDialogOpen(false);
    setDeleteProcesoId(null);
  };

  const limpiarCompletados = () => {
    setClearDialogOpen(true);
  };

  const confirmarLimpiarCompletados = () => {
    setProcesos(prev => prev.filter(p => p.estado !== "completado" && p.estado !== "error"));
    toast.success("Procesos completados y fallidos eliminados");
    setClearDialogOpen(false);
  };

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
    ));
    toast.success("Proceso marcado como completado");
  };

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
    ));
    toast.error("Proceso marcado como fallido");
  };

  const limpiarTodo = () => {
    setClearAllDialogOpen(true);
  };

  const confirmarLimpiarTodo = () => {
    setProcesos([]);
    localStorage.removeItem('procesos-conciliacion');
    toast.success("Todos los procesos eliminados");
    setClearAllDialogOpen(false);
  };

  const deshabilitarFechas = (date: Date) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let diasAtras = 1;
    if (tipo === "liquidacion") {
      if (recaudador === "kashio") diasAtras = 2;
      else if (recaudador === "tupay" || recaudador === "pagoefectivo") diasAtras = 7;
    }

    const fechaLimite = addDays(hoy, -diasAtras);
    return isFuture(date) || isAfter(date, fechaLimite);
  };

  const getEstadoColor = (estado: ProcesoEstado) => {
    switch (estado) {
      case "pendiente": return "bg-gray-100 border-gray-300 text-gray-700";
      case "ejecutando": return "bg-blue-50 border-blue-300 text-blue-700";
      case "completado": return "bg-green-50 border-green-300 text-green-700";
      case "error": return "bg-red-50 border-red-300 text-red-700";
    }
  };

  const getEstadoIcon = (estado: ProcesoEstado) => {
    switch (estado) {
      case "pendiente": return <Clock className="w-5 h-5" />;
      case "ejecutando": return <Loader2 className="w-5 h-5 animate-spin" />;
      case "completado": return <CheckCircle2 className="w-5 h-5" />;
      case "error": return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const procesosPendientes = procesos.filter(p => p.estado === "pendiente").length;
  const procesosEjecutando = procesos.filter(p => p.estado === "ejecutando").length;
  const procesosCompletados = procesos.filter(p => p.estado === "completado").length;
  const procesosFallidos = procesos.filter(p => p.estado === "error").length;

  return (
    <RoleGuard allowedRoles={[ROLES.ADMINISTRATOR, ROLES.ANALISTA_TESORERIA, ROLES.ANALISTA_SOPORTE, ROLES.ANALISTA]} redirectTo403={true}>
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
            Modulo de <span className="text-red-600">Conciliaciones</span>
          </h1>
          <p className="text-gray-600">Ejecuta multiples procesos de conciliacion en paralelo</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de configuracion */}
          <Card className="lg:col-span-1 border-red-100 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center border-2 border-red-600/40">
                  <Server className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle>Nuevo Proceso</CardTitle>
                  <CardDescription>Configurar parámetros</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="border-red-200 focus:ring-red-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conciliacion">Venta</SelectItem>
                    <SelectItem value="liquidacion">Liquidacion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Recaudador</Label>
                <Select value={recaudador} onValueChange={setRecaudador}>
                  <SelectTrigger className="border-red-200 focus:ring-red-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipo === "conciliacion" ? [
                      "kashio", "monnet", "kushki", "niubiz", "yape", "nuvei", "pagoefectivo", "safetypay", "tupay"
                    ].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </SelectItem>
                    )) : [
                      "kashio", "tupay", "pagoefectivo"
                    ].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
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
                        "w-full justify-start text-left font-normal border-red-200",
                        !fromDate && "text-muted-foreground",
                        !rangoEsValido && "border-red-500 text-red-600"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? (
                        toDate ? (
                          `${format(fromDate, "dd/MM/yyyy")} → ${format(toDate, "dd/MM/yyyy")}`
                        ) : (
                          format(fromDate, "dd/MM/yyyy")
                        )
                      ) : (
                        <span>Seleccionar rango</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={range}
                      onSelect={setRange}
                      locale={es}
                      numberOfMonths={1}
                      disabled={deshabilitarFechas}
                    />
                  </PopoverContent>
                </Popover>

                {fromDate && !rangoEsValido && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{getMensajeErrorRango()}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                onClick={agregarProceso}
                disabled={!fromDate || !rangoEsValido}
                className="w-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold"
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Agregar a Cola
              </Button>

              {/* Estadisticas */}
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
                  <p className="text-sm">Configura y agrega procesos a la cola</p>
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
                          <h3 className="font-semibold text-lg capitalize">
                            {proceso.recaudador}
                          </h3>
                          <p className="text-sm opacity-75">
                            {proceso.tipo} • {format(proceso.fromDate, "dd/MM/yyyy")} - {format(proceso.toDate, "dd/MM/yyyy")}
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
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
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
                            <p className="text-xs opacity-75 mt-1">Procesando solicitud...</p>
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

      {/* dialogo confirmar eliminar proceso */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteProcesoId && procesos.find(p => p.id === deleteProcesoId)?.estado === "ejecutando"
                ? "¿Eliminar proceso en ejecucion?"
                : "¿Eliminar proceso de la cola?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteProcesoId && procesos.find(p => p.id === deleteProcesoId)?.estado === "ejecutando" ? (
                <>
                  El proceso se esta ejecutando actualmente. Si lo eliminas de la cola, no se anulara el proceso en el servidor.
                  <br />
                  <strong>¿Estas seguro de eliminarlo de la cola?</strong>
                </>
              ) : (
                "¿Estas seguro de que deseas eliminar este proceso de la cola? Esta accion no se puede deshacer."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminarProceso}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* dialogo confirmar limpiar completados */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Limpiar procesos completados y fallidos?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminaran todos los procesos con estado "completado" o "error" de la cola.
              <br />
              <strong>¿Estas seguro de continuar?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarLimpiarCompletados}
              className="bg-red-600 hover:bg-red-700"
            >
              Limpiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* dialogo confirmar limpiar todo */}
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Limpiar todos los procesos?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminaran <strong>todos</strong> los procesos de la cola, incluyendo los que estan ejecutandose.
              <br />
              <br />
              <strong className="text-red-600">Advertencia:</strong> Si hay procesos ejecutandose, eliminarlos de la cola no anulara el proceso en el servidor.
              <br />
              <br />
              <strong>¿Estas seguro de continuar?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarLimpiarTodo}
              className="bg-red-600 hover:bg-red-700"
            >
              Limpiar Todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
    </RoleGuard>
  );
}