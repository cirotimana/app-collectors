import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardsProps {
  ventaCalimaco: number
  ventaProveedor: number
}

export function StatsCards({ ventaCalimaco, ventaProveedor }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return `S/. ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg font-bold text-center uppercase tracking-wide">
          Venta Calimaco
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="text-4xl font-black text-center text-gray-900">
          {formatCurrency(ventaCalimaco)}
        </div>
      </CardContent>
    </Card>

    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg font-bold text-center uppercase tracking-wide">
          Venta Proveedor
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="text-4xl font-black text-center text-gray-900">
          {formatCurrency(ventaProveedor)}
        </div>
      </CardContent>
    </Card>
  </div>
  )
}