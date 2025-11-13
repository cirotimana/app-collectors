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

        const { dashboardApi } = await import('@/lib/api')
        const json = await dashboardApi.getSummary(collectorIds, fromDatet, toDatet, endpoint as 'liquidations' | 'conciliations')
        setData(json)
      } catch (e) {
        console.error(e)
        setData([])
      }
    }

    fetchData()
  }, [proceso, metodo, fromDate, toDate])

  // Funcion para verificar coincidencia entre dos montos
  const checkMatch = (value1: number, value2: number): boolean => {
    return Math.abs(value1 - value2) < 0.01 // Tolerancia de 1 centavo
  }

  // Funcion para obtener el color de la fila segun coincidencia
  const getRowColor = (item: any, compareField1: string, compareField2: string): string => {
    const val1 = Number(item[compareField1] || 0)
    const val2 = Number(item[compareField2] || 0)
    return checkMatch(val1, val2) ? "bg-green-50" : "bg-red-50"
  }

  const renderTableVenta = (title: string, field: string, compareField: string) => {
    const total = data.reduce(
      (acc, item) => acc + Number(item[field] || 0),
      0
    )

    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>Detalle - {title}</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 pb-0">
          <div className="max-h-[380px] overflow-y-auto rounded-md border border-gray-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b-2 border-black">
                  <th className="font-bold text-left p-2">Dia</th>
                  <th className="font-bold text-left p-2">Mes</th>
                  <th className="font-bold text-left p-2">Metodo</th>
                  <th className="font-bold text-right p-2">Monto (S/.)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b border-gray-200 ${getRowColor(item, field, compareField)}`}
                  >
                    <td className="p-2">{item.dia}</td>
                    <td className="p-2">{item.mes}</td>
                    <td className="p-2">{item.collector}</td>
                    <td className="text-right font-mono p-2">
                      {Number(item[field] || 0).toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

  const renderTableLiquidacion = (
    title: string, 
    fields: { monto: string; comision: string; neto: string },
    compareFields: { monto: string; comision: string; neto: string }
  ) => {
    const totalMonto = data.reduce(
      (acc, item) => acc + Number(item[fields.monto] || 0),
      0
    )
    const totalComision = data.reduce(
      (acc, item) => acc + Number(item[fields.comision] || 0),
      0
    )
    const totalNeto = data.reduce(
      (acc, item) => acc + Number(item[fields.neto] || 0),
      0
    )

    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>Detalle - {title}</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 pb-0">
          <div className="max-h-[380px] overflow-y-auto rounded-md border border-gray-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b-2 border-black">
                  <th className="font-bold text-left p-2">Dia</th>
                  <th className="font-bold text-left p-2">Mes</th>
                  <th className="font-bold text-left p-2">Metodo</th>
                  <th className="font-bold text-right p-2">Monto (S/.)</th>
                  <th className="font-bold text-right p-2">Comision (S/.)</th>
                  <th className="font-bold text-right p-2">Neto (S/.)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b border-gray-200 ${getRowColor(item, fields.monto, compareFields.monto)}`}
                  >
                    <td className="p-2">{item.dia}</td>
                    <td className="p-2">{item.mes}</td>
                    <td className="p-2">{item.collector}</td>
                    <td className="text-right font-mono p-2">
                      {Number(item[fields.monto] || 0).toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-right font-mono p-2">
                      {Number(item[fields.comision] || 0).toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-right font-mono p-2">
                      {Number(item[fields.neto] || 0).toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-1">
          <span className="font-bold text-gray-800">
            Total Monto: S/. {totalMonto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </span>
          <span className="font-bold text-gray-800">
            Total Comision: S/. {totalComision.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </span>
          <span className="font-bold text-gray-800">
            Total Neto: S/. {totalNeto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </span>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {proceso === "venta" ? (
        <>
          {renderTableVenta("Monto de Calimaco", "monto_calimaco", "monto_recaudador")}
          {renderTableVenta("Monto del Recaudador", "monto_recaudador", "monto_calimaco")}
          {renderTableVenta("Monto de Calimaco No Conciliado", "monto_calimaco_nc", "monto_recaudador_nc")}
          {renderTableVenta("Monto del Recaudador No Conciliado", "monto_recaudador_nc", "monto_calimaco_nc")}
        </>
      ) : (
        <>
          {renderTableLiquidacion(
            "Recaudador",
            { 
              monto: "monto_recaudador", 
              comision: "comision_recaudador", 
              neto: "neto_recaudador" 
            },
            { 
              monto: "monto_liquidacion", 
              comision: "comision_liquidacion", 
              neto: "neto_liquidacion" 
            }
          )}
          {renderTableLiquidacion(
            "Liquidacion",
            { 
              monto: "monto_liquidacion", 
              comision: "comision_liquidacion", 
              neto: "neto_liquidacion" 
            },
            { 
              monto: "monto_recaudador", 
              comision: "comision_recaudador", 
              neto: "neto_recaudador" 
            }
          )}
          {renderTableLiquidacion(
            "Recaudador No Conciliado",
            { 
              monto: "nc_monto_recaudador", 
              comision: "nc_comision_recaudador", 
              neto: "nc_neto_recaudador" 
            },
            { 
              monto: "nc_monto_liquidacion", 
              comision: "nc_comision_liquidacion", 
              neto: "nc_neto_liquidacion" 
            }
          )}
          {renderTableLiquidacion(
            "Liquidacion No Conciliada",
            { 
              monto: "nc_monto_liquidacion", 
              comision: "nc_comision_liquidacion", 
              neto: "nc_neto_liquidacion" 
            },
            { 
              monto: "nc_monto_recaudador", 
              comision: "nc_comision_recaudador", 
              neto: "nc_neto_recaudador" 
            }
          )}
        </>
      )}
    </div>
  )
}