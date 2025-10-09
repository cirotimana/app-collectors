import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">
          <span className="text-red-600">Configuración</span>
        </h1>
        <p className="text-gray-600">Administra las configuraciones del sistema</p>
      </div>

      <Card className="border-red-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-red-600" />
            <div>
              <CardTitle>Sección en Desarrollo</CardTitle>
              <CardDescription>Esta funcionalidad estará disponible próximamente</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Aquí podrás configurar parámetros del sistema, usuarios, permisos y más.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}