"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Settings, Calendar as CalendarIcon, Loader2, Server, ArrowUpRight, AlertCircle } from "lucide-react";
import { format, isAfter, isSameMonth, startOfMonth, isToday, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MonthPicker } from "@/components/ui/monthpicker";
import { ConfirmationDialog } from "@/components/provider/confirmation-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProcessPage() {
  const [tipo, setTipo] = useState("conciliacion");
  const [recaudador, setRecaudador] = useState("kashio");
  const [periodo, setPeriodo] = useState("DIA");
  const [date, setDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Funcion para validar la fecha
  const fechaEsValida = useMemo(() => {
    if (!date) return true;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizar la hora
    
    if (periodo === "DIA") {
      const fechaSeleccionada = new Date(date);
      fechaSeleccionada.setHours(0, 0, 0, 0);
      
      // Calcular limites segun tipo y recaudador
      let diasAtras = 1; // Por defecto para conciliacion (D-1)
      
      if (tipo === "liquidacion") {
        if (recaudador === "kashio") {
          diasAtras = 2; // Kashio hasta D-2
        } else if (recaudador === "tupay") {
          diasAtras = 7; // Tupay hasta D-7
        }
      }
      
      // Calcular la fecha limite
      const fechaLimite = new Date(hoy);
      fechaLimite.setDate(fechaLimite.getDate() - diasAtras);
      
      // La fecha debe ser menor o igual a la fecha limite y no debe ser futura
      return fechaSeleccionada <= fechaLimite && !isFuture(fechaSeleccionada);
      
    } else {
      // Para meses: no puede ser el mes actual ni meses futuros
      const mesSeleccionado = startOfMonth(date);
      const mesActual = startOfMonth(hoy);
      return !isSameMonth(mesSeleccionado, mesActual) && !isAfter(mesSeleccionado, mesActual);
    }
  }, [date, periodo, tipo, recaudador]);

  // Funcion para obtener el mensaje de error
  const getMensajeErrorFecha = () => {
    if (!date) return "";
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (periodo === "DIA") {
      const fechaSeleccionada = new Date(date);
      fechaSeleccionada.setHours(0, 0, 0, 0);
      
      if (isFuture(fechaSeleccionada)) {
        return "No puedes seleccionar una fecha futura";
      }
      
      // Calcular el limite segun el tipo y recaudador
      let diasAtras = 1;
      let mensajeLimite = "el dia de ayer";
      
      if (tipo === "liquidacion") {
        if (recaudador === "kashio") {
          diasAtras = 2;
          mensajeLimite = "hasta hace 2 dias";
        } else if (recaudador === "tupay") {
          diasAtras = 7;
          mensajeLimite = "hasta hace 7 dias";
        }
      }
      
      const fechaLimite = new Date(hoy);
      fechaLimite.setDate(fechaLimite.getDate() - diasAtras);
      
      if (fechaSeleccionada > fechaLimite) {
        if (tipo === "liquidacion") {
          return `Para liquidacion de ${recaudador.charAt(0).toUpperCase() + recaudador.slice(1)}, solo puedes seleccionar fechas ${mensajeLimite} o anteriores`;
        } else {
          return "No puedes seleccionar el dia de hoy";
        }
      }
      
    } else {
      const mesSeleccionado = startOfMonth(date);
      const mesActual = startOfMonth(hoy);
      
      if (isSameMonth(mesSeleccionado, mesActual)) return "No puedes seleccionar el mes actual";
      if (isAfter(mesSeleccionado, mesActual)) return "No puedes seleccionar un mes futuro";
    }
    
    return "";
  };

  const endpoints: Record<string, Record<string, string>> = {
    conciliacion: {
      kashio: "execute-getkashio",
      monnet: "execute-getmonnet",
      kushki: "execute-getkushki",
      niubiz: "execute-getniubiz",
      yape: "execute-getyape",
      nuvei: "execute-getnuvei",
      pagoefectivo: "execute-getpagoefectivo",
      safetypay: "execute-getsafetypay",
      tupay: "execute-gettupay",
    },
    liquidacion: {
      kashio: "execute-liqkashio",
      tupay: "execute-liqtupay",
    },
  };

  const formatearFecha = (date: Date) => {
    return format(date, "ddMMyyyy");
  };

  const formatearMes = (date: Date) => {
    return format(date, "MMyyyy");
  };

  // Funcion para deshabilitar fechas en el calendario
  const deshabilitarFechas = (date: Date) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaCheck = new Date(date);
    fechaCheck.setHours(0, 0, 0, 0);
    
    if (periodo === "DIA") {
      // Deshabilitar fechas futuras
      if (isFuture(fechaCheck)) return true;
      
      // Calcular el limite segun tipo y recaudador
      let diasAtras = 1;
      
      if (tipo === "liquidacion") {
        if (recaudador === "kashio") {
          diasAtras = 2;
        } else if (recaudador === "tupay") {
          diasAtras = 7;
        }
      }
      
      const fechaLimite = new Date(hoy);
      fechaLimite.setDate(fechaLimite.getDate() - diasAtras);
      
      // Deshabilitar si la fecha es mayor que el limite permitido
      return fechaCheck > fechaLimite;
      
    } else {
      // Para el month picker, deshabilitar meses
      const mesSeleccionado = startOfMonth(date);
      const mesActual = startOfMonth(hoy);
      return isSameMonth(mesSeleccionado, mesActual) || isAfter(mesSeleccionado, mesActual);
    }
  };

  // Funcion que se llama al hacer clic en "Ejecutar Proceso"
  const handleOpenConfirmation = () => {
    if (!date) {
      toast.error("Por favor selecciona una fecha");
      return;
    }

    if (!fechaEsValida) {
      toast.error("Fecha no valida", {
        description: getMensajeErrorFecha()
      });
      return;
    }

    const endpoint = endpoints[tipo]?.[recaudador.toLowerCase()];
    if (!endpoint) {
      toast.error("Este recaudador aun no tiene endpoint configurado");
      return;
    }

    setShowConfirmation(true);
  };

  // Funcion que se ejecuta cuando se confirma en el dialogo
  const handleConfirmProcesar = async () => {
    setShowConfirmation(false);
    
    let periodoFinal = periodo;
    if (tipo === 'liquidacion' && recaudador === 'kashio') {
      periodoFinal = "DIA2";
    }

    if (tipo === 'liquidacion' && recaudador === 'tupay') {
      periodoFinal = "DIA2";
    }

    const endpoint = endpoints[tipo]?.[recaudador.toLowerCase()];
    const dateParam = periodoFinal === "DIA" || periodoFinal === "DIA2" 
      ? formatearFecha(date!) 
      : formatearMes(date!);
    const url = `${baseUrl}/digital/${endpoint}?period=${periodoFinal}&date_param=${dateParam}`;

    console.log("enviando url", url);

    setIsLoading(true);
    const toastId = toast.loading("Ejecutando proceso, por favor espere");

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "x-api-key": apiKey || "" },
      });

      if (res.ok) {
        toast.success("El proceso se ejecuto correctamente", {
          id: toastId
        });
      } else {
        throw new Error(`Error ${res.status}`);
      }
    } catch (error: any) {
      toast.error("Error de conexion", {
        id: toastId,
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generar el mensaje de confirmacion para procesos
  const getConfirmationMessage = () => {
    const tipoTexto = tipo === "conciliacion" ? "conciliacion" : "liquidacion";
    const fechaTexto = date ? (
      periodo === "DIA" 
        ? format(date, "dd/MM/yyyy", { locale: es })
        : format(date, "MMMM yyyy", { locale: es })
    ) : "fecha no seleccionada";
    
    return `Se esta enviando la ${tipoTexto} del recaudador ${recaudador.charAt(0).toUpperCase() + recaudador.slice(1)}, de la fecha ${fechaTexto}.`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">
          Modulo de  <span className="text-red-600">Conciliaciones</span>
        </h1>
        <p className="text-gray-600">Ejecuta procesos de conciliacion y liquidacion para lo recaudadores</p>
      </div>

      <Card className="border-red-100 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center border-2 border-red-600/40">
              <Server className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle>Gestion de procesos de conciliacion</CardTitle>
              <CardDescription>
                Ejecuta procesos de conciliacion y liquidacion segun el recaudador
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="tipo" className="text-sm font-semibold text-gray-700">
              Tipo
            </Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo" className="border-red-200 focus:ring-red-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conciliacion">Conciliacion</SelectItem>
                <SelectItem value="liquidacion">Liquidacion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recaudador */}
          <div className="space-y-2">
            <Label htmlFor="recaudador" className="text-sm font-semibold text-gray-700">
              Recaudador
            </Label>
            <Select value={recaudador} onValueChange={setRecaudador}>
              <SelectTrigger id="recaudador" className="border-red-200 focus:ring-red-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(endpoints.conciliacion).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Periodo */}
          <div className="space-y-2">
            <Label htmlFor="periodo" className="text-sm font-semibold text-gray-700">
              Periodo
            </Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger id="periodo" className="border-red-200 focus:ring-red-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIA">Dia</SelectItem>
                <SelectItem value="MES">Mes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              {periodo === "DIA" ? "Seleccionar Fecha" : "Seleccionar Mes"}
            </Label>
            
            {periodo === "DIA" ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-red-200",
                      !date && "text-muted-foreground",
                      !fechaEsValida && "border-red-500 text-red-600"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP", { locale: es })
                    ) : (
                      <span>Selecciona una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={es}
                    disabled={deshabilitarFechas}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-red-200",
                      !date && "text-muted-foreground",
                      !fechaEsValida && "border-red-500 text-red-600"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "MMMM yyyy", { locale: es })
                    ) : (
                      <span>Selecciona un mes</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <MonthPicker 
                    onMonthSelect={setDate} 
                    selectedMonth={date}
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* Alerta de fecha no valida */}
            {date && !fechaEsValida && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {getMensajeErrorFecha()}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Boton */}
          <Button
            onClick={handleOpenConfirmation}
            disabled={isLoading || !date || !fechaEsValida}
            className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-red-600 hover:to-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ejecutando...
              </>
            ) : (
              <>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Ejecutar Proceso
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Dialogo de confirmacion para procesos */}
      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleConfirmProcesar}
        title="Confirmar Proceso"
        description={getConfirmationMessage()}
        confirmText="Ejecutar"
        cancelText="Cancelar"
      />
    </div>
  );
}