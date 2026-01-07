import { render, screen } from "@testing-library/react"
import { BarChartCard } from "../bar-chart-card"

// Mock ResizeObserver to avoid Recharts warnings
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

// Mock UI components that might be using context or complex logic
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Specialized mock for Recharts to expose internal props/formatters
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div style={{ width: 800, height: 800 }}>{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  XAxis: (props: any) => {
    // Render a hidden element to verify props or invoke formatters if needed
    return (
      <div data-testid="x-axis">
        {props.tickFormatter ? props.tickFormatter("test-tick") : null}
      </div>
    )
  },
  Bar: () => <div>Bar</div>,
  ChartTooltip: (props: any) => {
    return <div data-testid="chart-tooltip">{props.content}</div>;
  },
}))

// Mock ChartTooltipContent from ui/chart
jest.mock("@/components/ui/chart", () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChartTooltip: (props: any) => <div data-testid="chart-tooltip">{props.content}</div>,
  ChartTooltipContent: (props: any) => {
    // Invoke labelFormatter to cover that line
    const formattedLabel = props.labelFormatter ? props.labelFormatter("test-label") : "";
    return <div data-testid="tooltip-content">{formattedLabel}</div>
  }
}))

describe("BarChartCard", () => {
  it("muestra mensaje cuando no hay data", () => {
    render(<BarChartCard data={[]} proceso="venta" />)

    expect(
      screen.getByText("Sin datos disponibles")
    ).toBeInTheDocument()
  })

  it("muestra labels correctos cuando proceso es venta", () => {
    const data = [
      {
        metodo: "Yape",
        calimaco: 100,
        proveedor: 80,
        proceso: "venta",
      },
    ]

    render(<BarChartCard data={data} proceso="venta" />)

    expect(
      screen.getByText(/Comparativa Calimaco vs Recaudador/i)
    ).toBeInTheDocument()
  })

  it("muestra labels correctos cuando proceso es liquidacion", () => {
    const data = [
      {
        metodo: "Transferencia",
        calimaco: 200,
        proveedor: 150,
        proceso: "liquidacion",
      },
    ]

    render(<BarChartCard data={data} proceso="liquidacion" />)

    expect(
      screen.getByText(/Comparativa Recaudador vs Liquidacion/i)
    ).toBeInTheDocument()
  })

  it("renderiza correctamente los ejes y tooltips (cubriendo formatters)", () => {
    const data = [
      {
        metodo: "Yape",
        calimaco: 100,
        proveedor: 80,
        proceso: "venta",
      },
    ]

    render(<BarChartCard data={data} proceso="venta" />)

    // Check coverage for XAxis tickFormatter (mock renders it)
    expect(screen.getByText("test-tick")).toBeInTheDocument();

    // Check coverage for ChartTooltipContent labelFormatter (mock renders it)
    expect(screen.getByText("Método: test-label")).toBeInTheDocument();
  })
})
