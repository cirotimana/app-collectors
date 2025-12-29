"use client"

import * as React from "react"
import { HistoricoDiscrepancias } from "@/components/historico/historico-discrepancias"
import { RoleGuard } from "@/components/auth/RoleGuard"
import { ROLES } from "@/lib/permissions"

export default function HistoricoPage() {
  return (
    <RoleGuard allowedRoles={[ROLES.ADMINISTRATOR, ROLES.ANALISTA_TESORERIA, ROLES.ANALISTA_SOPORTE, ROLES.ANALISTA]} redirectTo403={true}>
      <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-black text-gray-900">
                  Histórico de <span className="text-red-600">Discrepancias</span>
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestión completa del historial de discrepancias en conciliaciones
                </p>
              </div>      
          <HistoricoDiscrepancias />
          </div>
    </RoleGuard>
  )
}