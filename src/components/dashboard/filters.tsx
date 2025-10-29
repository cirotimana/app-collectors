import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PeriodPicker } from "@/components/ui/period-picker"

interface FiltersProps {
  filters: {
    proceso: string
    metodo: string
    fecha: string
  }
  onFiltersChange: (filters: any) => void
}

export function Filters({ filters, onFiltersChange }: FiltersProps) {
  const handleChange = (field: string, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    })
  }

   const [searchPeriod, setSearchPeriod] = React.useState('')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="metodo" className="font-bold uppercase text-sm">PROCESO</Label>
        <Select value={filters.proceso} onValueChange={(value) => handleChange('proceso', value)}>
          <SelectTrigger className="border-2 border-gray-300 focus:border-red-500 focus:ring-red-500">
            <SelectValue placeholder="Seleccionar proceso..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kashio">Conciliacion</SelectItem>
            <SelectItem value="tupay">Liquidacion</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="metodo" className="font-bold uppercase text-sm">METODO</Label>
        <Select value={filters.metodo} onValueChange={(value) => handleChange('metodo', value)}>
          <SelectTrigger className="border-2 border-gray-300 focus:border-red-500 focus:ring-red-500">
            <SelectValue placeholder="Seleccionar método..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kashio">Kashio</SelectItem>
            <SelectItem value="tupay">Tupay</SelectItem>
            <SelectItem value="pago-efectivo">Pago Efectivo</SelectItem>
            <SelectItem value="monnet">Monnet</SelectItem>
            <SelectItem value="kushkit">Kushki</SelectItem>
            <SelectItem value="yape">Yape</SelectItem>
            <SelectItem value="niubiz">Niubiz</SelectItem>
            <SelectItem value="safetypay">Safetypay</SelectItem>
            <SelectItem value="tupay">Tupay</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fecha" className="font-bold uppercase text-sm">FECHA</Label>
        <PeriodPicker
          value={searchPeriod}
          onChange={setSearchPeriod}
        />
      </div>
    </div>
  )
}