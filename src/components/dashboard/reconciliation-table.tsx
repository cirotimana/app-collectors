import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { TrendingUp } from "lucide-react"

// Datos de ejemplo
const reconciliationData = [
  { id: 1, monto: 1250.50, trx: 45 },
  { id: 2, monto: 2340.75, trx: 67 },
  { id: 3, monto: 890.00, trx: 23 },
  { id: 4, monto: 1560.25, trx: 38 },
]

const noReconciledCalimaco = [
  { description: "Transacción pendiente 1", amount: 350.00 },
  { description: "Transacción pendiente 2", amount: 125.50 },
]

const noReconciledRecaudo = [
  { description: "Pago no identificado 1", amount: 450.75 },
  { description: "Pago no identificado 2", amount: 200.00 },
]

const originalData = [
  { description: "Registro original 1", amount: 1200.00 },
  { description: "Registro original 2", amount: 800.50 },
]

export function ReconciliationTable() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Conciliacion Total</CardTitle>
        <CardDescription>Conciliacion total de recaudador Kashio</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-black">
                <TableHead className="w-12 font-bold">#</TableHead>
                <TableHead className="font-bold">MONTO</TableHead>
                <TableHead className="font-bold">TRX</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliationData.map((item) => (
                <TableRow key={item.id} className="border-b border-gray-200">
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell className="font-mono">S/. {item.monto.toFixed(2)}</TableCell>
                  <TableCell>{item.trx}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </CardContent>
    </Card>

      {/* No Conciliado Calimaco */}
      <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>No Conciliados calimaco</CardTitle>
        <CardDescription>No conciliados en los periodos de A - B</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {noReconciledCalimaco.map((item, index) => (
              <div key={index} className="flex justify-between text-sm border-b border-gray-200 pb-2">
                <span className="text-gray-700">{item.description}</span>
                <span className="font-bold font-mono">S/. {item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* No Conciliado Recaudo */}
      <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>No conciliados Recaudo</CardTitle>
        <CardDescription>No conciliados en los periodos de A - B</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {noReconciledRecaudo.map((item, index) => (
              <div key={index} className="flex justify-between text-sm border-b border-gray-200 pb-2">
                <span className="text-gray-700">{item.description}</span>
                <span className="font-bold font-mono">S/. {item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Original Recaudo */}
      <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Data Original Recaudo</CardTitle>
        <CardDescription>No conciliados en los periodos de A - B</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {originalData.map((item, index) => (
              <div key={index} className="flex justify-between text-sm border-b border-gray-200 pb-2">
                <span className="text-gray-700">{item.description}</span>
                <span className="font-bold font-mono">S/. {item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}