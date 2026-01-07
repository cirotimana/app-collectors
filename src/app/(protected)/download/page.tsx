"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, FileText, Loader2, CloudDownload, ArrowUpRight } from "lucide-react";
import { ConfirmationDialog } from "@/components/provider/confirmation-dialog";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ROLES } from "@/lib/permissions";

function DownloadPageContent() {
  const [archivo, setArchivo] = useState("");
  const [tipo, setTipo] = useState("conciliacion");
  const [recaudador, setRecaudador] = useState("kashio");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Funcion que se llama al hacer clic en "Descargar Archivo"
  const handleOpenConfirmation = () => {
    if (!archivo) {
      toast.error("Por favor ingresa un nombre de archivo");
      return;
    }

    setShowConfirmation(true);
  };

  // Funcion que se ejecuta cuando se confirma en el dialogo
  const handleConfirmDownload = async () => {
    setShowConfirmation(false);

    setIsLoading(true);
    const toastId = toast.loading("Solicitando archivo del servidor");

    try {
      const { downloadApi } = await import('@/lib/api');

      let success = false;
      if (tipo === "conciliacion") {
        success = await downloadApi.downloadProcessedFile('conciliaciones', archivo);
      } else {
        // Para liquidaciones, construir la ruta completa
        const fullPath = `digital/collectors/${recaudador.toLowerCase()}/liquidations/processed/${archivo}`;
        success = await downloadApi.downloadFile(`s3://bucket/${fullPath}`);
      }

      if (success) {
        toast.success("Descarga iniciada", {
          id: toastId,
          description: "El archivo se está descargando"
        });
      } else {
        throw new Error("Error en la descarga");
      }
    } catch (error: any) {
      toast.error("Error en la descarga", {
        id: toastId,
        description: error.message === "Error 404"
          ? "Archivo no encontrado"
          : error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generar el mensaje de confirmacion para descarga
  const getConfirmationMessage = () => {
    const tipoTexto = tipo === "conciliacion" ? "conciliacion" : "liquidacion";
    const recaudadorTexto = tipo === "liquidacion"
      ? ` del recaudador ${recaudador.charAt(0).toUpperCase() + recaudador.slice(1)}`
      : "";

    return `Se va a descargar el archivo de ${tipoTexto}${recaudadorTexto}: ${archivo}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-gray-900">
          Modulo de <span className="text-red-600">Descargas</span>
        </h1>
        <p className="text-gray-600 mt-1">Descarga archivos procesados de ventas y liquidaciones</p>
      </div>

      <Card className="border-red-100 shadow-lg">
        <CardHeader >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center border-2 border-red-600/40">
              <CloudDownload className="text-red-600" />
            </div>
            <div>
              <CardTitle>Gestión de Descarga</CardTitle>
              <CardDescription>
                Ingresa el nombre del archivo que deseas descargar
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
          {tipo === "liquidacion" && (
            <div className="space-y-2">
              <Label htmlFor="recaudador" className="text-sm font-semibold text-gray-700">
                Recaudador
              </Label>
              <Select value={recaudador} onValueChange={setRecaudador}>
                <SelectTrigger id="recaudador" className="border-red-200 focus:ring-red-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kashio">Kashio</SelectItem>
                  <SelectItem value="monnet">Monnet</SelectItem>
                  <SelectItem value="kushki">Kushki</SelectItem>
                  <SelectItem value="nuvei">Nuvei</SelectItem>
                  <SelectItem value="niubiz">Niubiz</SelectItem>
                  <SelectItem value="yape">Yape</SelectItem>
                  <SelectItem value="pagoefectivo">PagoEfectivo</SelectItem>
                  <SelectItem value="safetypay">Safetypay</SelectItem>
                  <SelectItem value="tupay">Tupay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Archivo */}
          <div className="space-y-2">
            <Label htmlFor="archivo" className="text-sm font-semibold text-gray-700">
              Nombre del Archivo
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="archivo"
                type="text"
                value={archivo}
                onChange={(e) => setArchivo(e.target.value)}
                placeholder="archivo_ejemplo.xlsx"
                className="pl-10 border-red-200 focus-visible:ring-red-600"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Incluye la extension del archivo (ej: .xlsx, .csv, .pdf)
            </p>
          </div>

          {/* Boton */}
          <Button
            onClick={handleOpenConfirmation}
            disabled={isLoading || !archivo}
            className="w-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Descargando...
              </>
            ) : (
              <>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Descargar Archivo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Dialogo de confirmacion para descarga */}
      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleConfirmDownload}
        title="Confirmar Descarga"
        description={getConfirmationMessage()}
        confirmText="Descargar"
        cancelText="Cancelar"
      />
    </div>
  );
}

export default function DownloadPage() {
  return (
    <RoleGuard allowedRoles={[ROLES.ADMINISTRATOR]} redirectTo403={true}>
      <DownloadPageContent />
    </RoleGuard>
  );
}