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
import { format, isAfter, isBefore, addDays, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ConfirmationDialog } from "@/components/provider/confirmation-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateRange } from "react-day-picker";

export default function ProcessPage() {
  const [tipo, setTipo] = useState("conciliacion");
  const [recaudador, setRecaudador] = useState("kashio");
  const [range, setRange] = useState<DateRange | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

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

  const fromDate = range?.from;
  const toDate = range?.to || range?.from;

  // Validacion del rango
  const rangoEsValido = useMemo(() => {
    if (!fromDate) return true;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaDesde = new Date(fromDate);
    const fechaHasta = toDate ? new Date(toDate) : new Date(fromDate);
    fechaDesde.setHours(0, 0, 0, 0);
    fechaHasta.setHours(0, 0, 0, 0);

    // Reglas por tipo y recaudador
    let diasAtras = 1; // por defecto
    if (tipo === "liquidacion") {
      if (recaudador === "kashio") diasAtras = 2;
      else if (recaudador === "tupay") diasAtras = 7;
    }

    const fechaLimite = addDays(hoy, -diasAtras);

    // Validaciones:
    if (isFuture(fechaDesde) || isFuture(fechaHasta)) return false; // no futuras
    if (isAfter(fechaDesde, fechaHasta)) return false; // rango invertido
    if (isAfter(fechaDesde, fechaLimite) || isAfter(fechaHasta, fechaLimite)) return false; // no mas alla del limite
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
      } else if (recaudador === "tupay") {
        diasAtras = 7;
        mensajeLimite = "hasta hace 7 dias";
      }
    }

    const hoy = new Date();
    const fechaLimite = addDays(hoy, -diasAtras);

    if (isFuture(fromDate) || isFuture(toDate || fromDate)) return "No puedes seleccionar fechas futuras.";
    if (isAfter(fromDate, toDate || fromDate)) return "El rango esta invertido.";
    if (isAfter(fromDate, fechaLimite) || isAfter(toDate || fromDate, fechaLimite)) {
      return `Para ${tipo} de ${recaudador}, solo puedes seleccionar fechas ${mensajeLimite} o anteriores.`;
    }

    return "";
  };

  const formatear = (d: Date) => format(d, "ddMMyyyy");

  const handleOpenConfirmation = () => {
    if (!fromDate) {
      toast.error("Selecciona un rango de fechas");
      return;
    }
    if (!rangoEsValido) {
      toast.error("Rango invalido", { description: getMensajeErrorRango() });
      return;
    }

    const endpoint = endpoints[tipo]?.[recaudador];
    if (!endpoint) {
      toast.error("Recaudador sin endpoint configurado");
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmProcesar = async () => {
    setShowConfirmation(false);

    const endpoint = endpoints[tipo]?.[recaudador];
    if (!endpoint || !fromDate) return;

    const url = `${baseUrl}/digital/${endpoint}?from_date=${formatear(fromDate)}&to_date=${formatear(toDate || fromDate)}`;

    console.log("URL enviada:", url);

    setIsLoading(true);
    const toastId = toast.loading("Ejecutando proceso...");

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "x-api-key": apiKey || "" },
      });

      if (res.ok) {
        toast.success("Proceso ejecutado correctamente", { id: toastId });
      } else {
        throw new Error(`Error ${res.status}`);
      }
    } catch (error: any) {
      toast.error("Error de conexion", { id: toastId, description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const deshabilitarFechas = (date: Date) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let diasAtras = 1;
    if (tipo === "liquidacion") {
      if (recaudador === "kashio") diasAtras = 2;
      else if (recaudador === "tupay") diasAtras = 7;
    }

    const fechaLimite = addDays(hoy, -diasAtras);
    return isFuture(date) || isAfter(date, fechaLimite);
  };

  const getConfirmationMessage = () => {
    if (!fromDate) return "No se selecciono rango.";
    const desde = format(fromDate, "dd/MM/yyyy");
    const hasta = format(toDate || fromDate, "dd/MM/yyyy");
    return `Se enviara la ${tipo} del recaudador ${recaudador}, del ${desde} al ${hasta}.`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">
          Modulo de <span className="text-red-600">Conciliaciones</span>
        </h1>
        <p className="text-gray-600">Ejecuta procesos de conciliacion y liquidacion</p>
      </div>

      <Card className="border-red-100 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center border-2 border-red-600/40">
              <Server className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle>Gestion de procesos</CardTitle>
              <CardDescription>Selecciona tipo, recaudador y rango de fechas</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="border-red-200 focus:ring-red-600">
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
            <Label>Recaudador</Label>
            <Select value={recaudador} onValueChange={setRecaudador}>
              <SelectTrigger className="border-red-200 focus:ring-red-600">
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

          {/* Rango de Fechas */}
          <div className="space-y-2">
            <Label>Seleccionar rango de fechas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isLoading}
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
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  locale={es}
                  numberOfMonths={2}
                  disabled={isLoading ||deshabilitarFechas}
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

          {/* Boton ejecutar */}
          <Button
            onClick={handleOpenConfirmation}
            disabled={isLoading || !fromDate || !rangoEsValido}
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

      {/* Dialogo de confirmacion */}
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
