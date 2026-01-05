import * as React from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

// import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PeriodPicker } from "@/components/ui/period-picker"

interface FiltersProps {
  filters: {
    proceso: string
    metodo: string
    fromDate: string
    toDate: string
  }
  onFiltersChange: (filters: any) => void
}

const metodoOptions = [
  { value: "kashio", label: "Kashio" },
  { value: "tupay", label: "Tupay" },
  { value: "pago-efectivo", label: "Pago Efectivo" },
  { value: "monnet", label: "Monnet" },
  { value: "kushki", label: "Kushki" },
  { value: "nuvei", label: "Nuvei" },
  { value: "yape", label: "Yape" },
  { value: "niubiz", label: "Niubiz" },
  { value: "safetypay", label: "SafetyPay" },
]


export function Filters({ filters, onFiltersChange }: FiltersProps) {
  const handleChange = (field: string, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    })
  }

  const [searchPeriod, setSearchPeriod] = React.useState(() => {
     if (filters.fromDate && filters.toDate) {
       return `${filters.fromDate}-${filters.toDate}`
     }
     return ""
  })
  const [open, setOpen] = React.useState(false)
  const [selectedMetodos, setSelectedMetodos] = React.useState<string[]>(
    filters.metodo ? filters.metodo.split(",") : []
  )

  const handlePeriodChange = (value: string) => {
    setSearchPeriod(value)
    if (!value) {
      onFiltersChange({ ...filters, fromDate: "", toDate: "" })
      return
    }
    const [from, to] = value.includes("-") ? value.split("-") : [value, value]
    onFiltersChange({ ...filters, fromDate: from, toDate: to })
  }

  const toggleMetodo = (value: string) => {
    const updated = selectedMetodos.includes(value)
      ? selectedMetodos.filter((v) => v !== value)
      : [...selectedMetodos, value]
    setSelectedMetodos(updated)
    handleChange("metodo", updated.join(","))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      {/* PROCESO */}
      <div className="space-y-2">
        <Label className="font-bold uppercase text-sm">PROCESO</Label>
        <Select
          value={filters.proceso}
          onValueChange={(value) => handleChange("proceso", value)}
        >
          <SelectTrigger className="w-full h-9 justify-between border-2 border-gray-400 focus:border-red-500 focus:ring-red-500">
            <SelectValue placeholder="Seleccionar proceso..." />
          </SelectTrigger>
          <SelectContent>
            {/* <SelectItem value="venta">Venta</SelectItem> */}
            <SelectItem value="liquidacion">Liquidación</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* METODO - multiple */}
      <div className="space-y-2">
        <Label className="font-bold uppercase text-sm">MÉTODO</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild >
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between border-2 border-gray-400 focus:border-red-500 focus:ring-red-500"
            >
              {selectedMetodos.length > 0
                ? `${selectedMetodos.length} seleccionados`
                : "Seleccionar método..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandList>
                <CommandGroup>
                  {metodoOptions.map((metodo) => (
                    <CommandItem
                      key={metodo.value}
                      onSelect={() => toggleMetodo(metodo.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedMetodos.includes(metodo.value)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {metodo.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* PERIODO */}
      <div className="space-y-2">
        <Label className="font-bold uppercase text-sm">PERÍODO</Label>
        <PeriodPicker value={searchPeriod} onChange={handlePeriodChange} />
      </div>
    </div>
  )
}