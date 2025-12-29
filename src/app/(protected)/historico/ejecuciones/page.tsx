import { DataTable } from "@/components/provider/data-table";

export default function DetallesPage() {
  return (
      <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              Historico de <span className="text-red-600">Ejecuciones</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión de documentos en las conciliaciones de ventas y liquidaciones - Histórico
            </p>
          </div>      
      <DataTable />
    </div>
  );
}