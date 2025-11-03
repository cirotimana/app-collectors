import { DataTable } from "@/components/provider/data-table";

export default function DetailsPage() {
  return (
      <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              Modulo de <span className="text-red-600">Detalles</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Gestion de documentos en las conciliaciones de ventas y liquidaciones
            </p>
          </div>      
      <DataTable />
    </div>
  );
}