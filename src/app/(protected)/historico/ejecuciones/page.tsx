import { DataTable } from "@/components/provider/data-table";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ROLES } from "@/lib/permissions";

export default function DetallesPage() {
  return (
    <RoleGuard allowedRoles={[ROLES.ADMINISTRATOR, ROLES.ANALISTA_TESORERIA, ROLES.ANALISTA_SOPORTE, ROLES.ANALISTA]} redirectTo403={true}>
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
    </RoleGuard>
  );
}