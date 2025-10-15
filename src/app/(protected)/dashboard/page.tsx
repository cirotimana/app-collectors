import { DataTable } from "@/components/provider/data-table";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Modulo <span className="text-red-600">Principal</span>
        </h1>
        <p className="text-gray-600">
          Gestion de liquidaciones y conciliaciones
        </p>
      </div>
      
      <DataTable />
    </div>
  );
}