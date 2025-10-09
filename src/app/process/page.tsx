"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Settings, Calendar as CalendarIcon, Loader2, Server, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MonthPicker } from "@/components/ui/monthpicker";
import { ConfirmationDialog } from "@/components/provider/confirmation-dialog"; // Ajusta la ruta según tu estructura

export default function ProcessPage() {
  const [tipo, setTipo] = useState("conciliacion");
  const [recaudador, setRecaudador] = useState("kashio");
  const [periodo, setPeriodo] = useState("DIA");
  const [date, setDate] = useState<Date>();
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
    },
  };

  const formatearFecha = (date: Date) => {
    return format(date, "ddMMyyyy");
  };

  const formatearMes = (date: Date) => {
    return format(date, "MMyyyy");
  };

  // Función que se llama al hacer clic en "Ejecutar Proceso"
  const handleOpenConfirmation = () => {
    if (!date) {
      toast.error("Por favor selecciona una fecha");
      return;
    }

    const endpoint = endpoints[tipo]?.[recaudador.toLowerCase()];
    if (!endpoint) {
      toast.error("Este recaudador aún no tiene endpoint configurado");
      return;
    }

    setShowConfirmation(true);
  };

  // Función que se ejecuta cuando se confirma en el diálogo
  const handleConfirmProcesar = async () => {
    setShowConfirmation(false);
    
    let periodoFinal = periodo;
    if (tipo === 'liquidacion' && recaudador === 'kashio') {
      periodoFinal = "DIA2";
    }

    const endpoint = endpoints[tipo]?.[recaudador.toLowerCase()];
    // const dateParam = periodo === "DIA" ? formatearFecha(date!) : formatearMes(date!);
    const dateParam = periodoFinal === "DIA" || periodoFinal === "DIA2" 
    ? formatearFecha(date!) 
    : formatearMes(date!);
    const url = `${baseUrl}/digital/${endpoint}?period=${periodoFinal}&date_param=${dateParam}`;
    // const url = `${baseUrl}/digital/${endpoint}?period=${periodo}&date_param=${dateParam}`;

    console.log("enviando url", url);

    setIsLoading(true);
    const toastId = toast.loading("Ejecutando proceso, por favor espere");

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "x-api-key": apiKey || "" },
      });

      if (res.ok) {
        toast.success("El proceso se ejecutó correctamente", {
          id: toastId
        });
      } else {
        throw new Error(`Error ${res.status}`);
      }
    } catch (error: any) {
      toast.error("Error de conexión", {
        id: toastId,
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generar el mensaje de confirmación para procesos
  const getConfirmationMessage = () => {
  const tipoTexto = tipo === "conciliacion" ? "conciliación" : "liquidación";
  const fechaTexto = date ? (
    periodo === "DIA" 
      ? format(date, "dd/MM/yyyy", { locale: es })
      : format(date, "MMMM yyyy", { locale: es })
  ) : "fecha no seleccionada";
  
  return `Se está enviando la ${tipoTexto} del recaudador ${recaudador.charAt(0).toUpperCase() + recaudador.slice(1)}, de la fecha ${fechaTexto}.`;
};

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">
          Modulo de  <span className="text-red-600">Conciliaciones</span>
        </h1>
        <p className="text-gray-600">Ejecuta procesos de conciliación y liquidación para lo recaudadores</p>
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
                Ejecuta procesos de conciliación y liquidación segun el recaudador
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
                <SelectItem value="conciliacion">Conciliación</SelectItem>
                <SelectItem value="liquidacion">Liquidación</SelectItem>
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
                <SelectItem value="DIA">Día</SelectItem>
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
                      !date && "text-muted-foreground"
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
                      !date && "text-muted-foreground"
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
          </div>

          {/* Botón */}
          <Button
            onClick={handleOpenConfirmation}
            disabled={isLoading || !date}
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

      {/* Diálogo de confirmación para procesos */}
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