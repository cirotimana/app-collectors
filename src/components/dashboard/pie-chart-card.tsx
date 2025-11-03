"use client";

import { TrendingUp } from "lucide-react"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const COLORS = ["#FF6B35", "#FFA500", "#FFD166", "#06D6A0", "#118AB2"];

interface DataItem {
  name: string;
  value: number;
  process: string;
}

interface PieChartCardProps {
  data: DataItem[];
}

export function PieChartCard({ data }: PieChartCardProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const processes: string[] = data.map(item => item.process);

  const titulo = processes[0] === "conciliations" ? "Calimaco" : "Recaudador";

  // console.log("proceso pie-chart: ", processes)

  return (
    <Card>
      <CardHeader className="text-lg font-semibold mb-2 text-gray-800">
      <CardTitle>Distribucion por Metodo</CardTitle>
      <CardDescription>
        Monto {titulo} (%)
      </CardDescription>
      </CardHeader>

      <CardContent>

      <div className="w-full h-100">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={130}
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(1)}%`
              }
              labelLine={true}
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `S/. ${value.toLocaleString()}`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full mt-6 space-y-2">
        {data.map((item, index) => {
          const percent = ((item.value / total) * 100).toFixed(1);
          return (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm text-gray-700"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span>{item.name}</span>
              </div>
              <span className="font-semibold">{percent}%</span>
            </div>
          );
        })}
      </div>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="text-sm text-gray-500 mt-4">
          Distribucion porcentual — Datos segun el filtro aplicado
        </div>
      </CardFooter>
    </Card>
  );
}
