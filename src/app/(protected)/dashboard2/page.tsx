"use client"

import * as React from "react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { Filters } from "@/components/dashboard/filters"
import { ReconciliationTable } from "@/components/dashboard/reconciliation-table"
import { PieChartCard } from "@/components/dashboard/pie-chart-card"
import { BarChartCard } from "@/components/dashboard/bar-chart-card"

export default function DashboardPage() {
  const [filters, setFilters] = React.useState({
    proceso: "",
    metodo: "",
    fecha: ""
  })

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              Modulo de <span className="text-red-600">Conciliaciones</span>
            </h1>
            <p className="text-gray-600 mt-1">Resumen de los procesos de ventas y liquidaciones</p>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards 
          ventaCalimaco={1458594.00}
          ventaProveedor={1598254.30}
        />

        {/* Filters */}
        <Filters 
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tables */}
          <div className="lg:col-span-2 space-y-6">
            <ReconciliationTable />
          </div>

          {/* Right Column - Charts */}
          <div className="space-y-6">
            <PieChartCard />
            <BarChartCard />
          </div>
        </div>
      </div>
    </div>
  )
}