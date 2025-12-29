"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";
import { Settings, Calendar as CalendarIcon, Loader2, Gpu, ArrowUpRight, AlertCircle } from "lucide-react";
import { ConfirmationDialog } from "@/components/provider/confirmation-dialog";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ROLES } from "@/lib/permissions";

function ProcessPageContent() {
  const [tipo, setTipo] = useState("dnicorrelativos");
  const [proceso, setProceso] = useState("proceso");

  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;


  // Funcion que se llama al hacer clic en "Ejecutar Proceso"
  const handleOpenConfirmation = () => {
    setShowConfirmation(true);
  };

  // Funcion que se ejecuta cuando se confirma en el dialogo
  const handleConfirmProcesar = async () => {
    setShowConfirmation(false);
    
    setIsLoading(true);
    const toastId = toast.loading("Ejecutando proceso, por favor espere");

    try {
      const { processApi } = await import('@/lib/api');
      await processApi.executeDigitalProcess(tipo as 'dnicorrelativos' | 'concentracionips');
      
      toast.success("El proceso se ejecuto correctamente", {
        id: toastId
      });
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
    const tipoTexto = tipo === "concentracionips" ? "Concentración IPs" : "DNI Correlativos";
    const tipoMensaje = tipo ==="concentracionips" ? "Últimas 72 Horas " : "Últimas 48 Horas"
    
    return `Se ejecutara el proceso de ${tipoTexto} de las ${tipoMensaje}.`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-gray-900">
          Módulo de  <span className="text-red-600">Digital</span>
        </h1>
        <p className="text-gray-600 mt-1">Ejecuta procesos para el área Digital</p>
      </div>

      <Card className="border-red-100 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center border-2 border-red-600/40">
              <Gpu className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle>Gestión de procesos</CardTitle>
              <CardDescription>
                Ejecuta procesos DNI correlativos y Concentración de IPs
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
                <SelectItem value="dnicorrelativos">DNI Correlativos</SelectItem>
                <SelectItem value="concentracionips">Concentracion IP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Boton */}
          <Button
            onClick={handleOpenConfirmation}
            disabled={isLoading }
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

export default function ProcessPage() {
  return (
    <RoleGuard allowedRoles={[ROLES.ADMINISTRATOR, ROLES.ANALISTA]} redirectTo403={true}>
      <ProcessPageContent />
    </RoleGuard>
  );
}