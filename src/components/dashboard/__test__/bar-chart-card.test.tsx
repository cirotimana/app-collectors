import { render, screen } from "@testing-library/react"
import { BarChartCard } from "../bar-chart-card"

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
})
