import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">
          <span className="text-red-600">Reportes</span>
        </h1>
        <p className="text-gray-600">Visualiza y genera reportes del </p>
      </div>

      <Card className="border-red-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-red-600" />
            <div>
              <CardTitle>Seccion en Desarrollo</CardTitle>
              <CardDescription>Esta funcionalidad estara disponible proximamente</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Aqui podras generar y visualizar reportes detallados de todas las operaciones del sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}