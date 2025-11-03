"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Props {
  proceso: string
  metodo: string
  fromDate: string
  toDate: string
}

export function ReconciliationTable({ proceso, metodo, fromDate, toDate }: Props) {
  const [data, setData] = React.useState<any[]>([])

  const today = new Date()
  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)

  const fromDatet = fromDate || lastWeek.toISOString().split("T")[0]
  const toDatet = toDate || today.toISOString().split("T")[0]

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const collectorMap: Record<string, number> = {
          kashio: 1,
          monnet: 2,
          kushki: 3,
          niubiz: 4,
          yape: 5,
          nuvei: 6,
          "pago-efectivo": 7,
          safetypay: 8,
          tupay: 9,
          prometeo: 10,
        }

        const collectorIds = metodo
          .split(",")
          .map((m) => collectorMap[m.trim()])
          .filter((id) => id !== undefined)
          .join(",")

        const endpoint =
          proceso === "liquidacion" ? "liquidations" : "conciliations"

        const url = `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}/summary?collectorIds=${collectorIds}&fromDate=${fromDatet}&toDate=${toDatet}`

        const res = await fetch(url)
        if (!res.ok) throw new Error("Error al obtener datos")

        const json = await res.json()
        setData(json)
      } catch (e) {
        console.error(e)
        setData([])
      }
    }

    fetchData()
  }, [proceso, metodo, fromDate, toDate])

  const renderTable = (title: string, field: string) => {
    const total = data.reduce(
      (acc, item) => acc + Number(item[field] || 0),
      0
    )

    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {proceso === "venta"
              ? `Detalle - ${title}`
              : `Detalle - ${title}`}
          </CardDescription>
        </CardHeader>

        {/* Scroll vertical en el contenido */}
        <CardContent className="flex-1 pb-0">
          <div className="max-h-[380px] overflow-y-auto rounded-md border border-gray-200">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="border-b-2 border-black">
                  <TableHead className="font-bold">Dia</TableHead>
                  <TableHead className="font-bold">Mes</TableHead>
                  <TableHead className="font-bold">Metodo</TableHead>
                  <TableHead className="font-bold text-right">
                    Monto (S/.)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-gray-200">
                    <TableCell>{item.dia}</TableCell>
                    <TableCell>{item.mes}</TableCell>
                    <TableCell>{item.collector}</TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(item[field] || 0).toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <CardFooter>
          <span className="font-bold text-gray-800">
            Total S/.{" "}
            {total.toLocaleString("es-PE", {
              minimumFractionDigits: 2,
            })}
          </span>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {proceso === "venta" ? (
        <>
          {renderTable("Monto de Calimaco", "monto_calimaco")}
          {renderTable("Monto del Recaudador", "monto_recaudador")}
          {renderTable("Monto de Calimaco No Conciliado", "monto_calimaco_nc")}
          {renderTable("Monto del Recaudador No Conciliado", "monto_recaudador_nc")}
        </>
      ) : (
        <>
          {renderTable("Monto del Recaudador", "monto_recaudador")}
          {renderTable("Monto de la Liquidacion", "monto_liquidacion")}
          {renderTable("Monto Neto del Recaudador", "neto_recaudador")}
          {renderTable("Monto Neto de la Liquidacion", "neto_liquidacion")}
        </>
      )}
    </div>
  )
}
