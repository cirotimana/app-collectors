"use client"

import * as React from "react"
import { HistoricoDiscrepancias } from "@/components/historico/historico-discrepancias"

export default function HistoricoPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Historico de Discrepancias</h1>
        <p className="text-muted-foreground">
          Gestion completa del historial de discrepancias en conciliaciones
        </p>
      </div>
      
      <HistoricoDiscrepancias />
    </div>
  )
}