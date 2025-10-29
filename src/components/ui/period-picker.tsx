"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"

interface PeriodPickerProps {
  value: string
  onChange: (value: string) => void
}

export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const [range, setRange] = React.useState<DateRange | undefined>()

  const handleSelect = (selected: DateRange | undefined) => {
    setRange(selected)

    if (!selected?.from) {
      onChange("")
      return
    }

    const from = format(selected.from, "yyyyMMdd")

    if (selected.to) {
      const to = format(selected.to, "yyyyMMdd")
      onChange(`${from}-${to}`)
    } else {
      onChange(from)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-60 justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatPeriodDisplay(value) : "Seleccionar fecha o rango"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          locale={es}
          initialFocus
          numberOfMonths={1}
        />
      </PopoverContent>
    </Popover>
  )
}

function formatPeriodDisplay(value: string): string {
  if (!value) return ""
  if (value.includes("-")) {
    const [from, to] = value.split("-")
    return `${formatDisplayDate(from)} → ${formatDisplayDate(to)}`
  }
  return formatDisplayDate(value)
}

function formatDisplayDate(value: string): string {
  if (value.length !== 8) return value
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}
