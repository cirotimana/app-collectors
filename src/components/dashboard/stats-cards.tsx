import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardsProps {
  ventaCalimaco: number
  ventaProveedor: number
  t1: string
  t2: string
}

export function StatsCards({ ventaCalimaco, ventaProveedor, t1, t2 }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return `S/. ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg font-bold text-center uppercase tracking-wide">
          {t1}
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
          {t2}
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