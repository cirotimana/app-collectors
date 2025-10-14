import { DataTable } from "@/components/provider/data-table";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground ">
          Gestion de liquidaciones y conciliaciones
        </p>
      </div>
      
      <DataTable />
    </div>
  );
}