"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { MonthPicker } from "@/components/ui/monthpicker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { es } from "date-fns/locale"

interface PeriodPickerProps {
  value: string
  onChange: (value: string) => void
}

export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const [date, setDate] = React.useState<Date>()
  const [periodType, setPeriodType] = React.useState<"day" | "month">("day")

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return
    setDate(selectedDate)

    const formatted =
      periodType === "day"
        ? format(selectedDate, "yyyyMMdd")
        : format(selectedDate, "yyyyMM")

    onChange(formatted)
  }

  return (
    <div className="flex gap-2">
      <Select
        value={periodType}
        onValueChange={(v) => {
          setPeriodType(v as "day" | "month")
          setDate(undefined)
          onChange("")
        }}
      >
        <SelectTrigger className="w-28">
          <SelectValue placeholder="Periodo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Dia</SelectItem>
          <SelectItem value="month">Mes</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-48 justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value
              ? formatPeriodDisplay(value, periodType)
              : "Seleccionar periodo"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0">
          {periodType === "day" ? (
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              locale={es}
              initialFocus
            />
          ) : (
            <MonthPicker
              selectedMonth={date}
              onMonthSelect={handleDateSelect}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Funcion auxiliar para mostrar el periodo formateado
function formatPeriodDisplay(value: string, type: "day" | "month"): string {
  if (!value) return ""

  if (type === "day" && value.length === 8) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  } else if (type === "month" && value.length === 6) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}`
  }

  return value
}
