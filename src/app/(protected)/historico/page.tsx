"use client"

import * as React from "react"
import { HistoricoDiscrepancias } from "@/components/historico/historico-discrepancias"

export default function HistoricoPage() {
  return (
    <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-black text-gray-900">
                  Historico de <span className="text-red-600">Discrepancias</span>
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestion completa del historial de discrepancias en conciliaciones
                </p>
              </div>      
          <HistoricoDiscrepancias />
        </div>
  )
}