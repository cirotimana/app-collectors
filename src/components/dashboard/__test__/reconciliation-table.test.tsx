import { render, screen, waitFor } from "@testing-library/react"
import { ReconciliationTable } from "../reconciliation-table"
import { dashboardApi } from "@/lib/api"

jest.mock("@/lib/api")

const mockVentaData = [
  {
    dia: "01",
    mes: "01",
    collector: "Kashio",
    monto_calimaco: 100,
    monto_recaudador: 100,
    monto_calimaco_nc: 0,
    monto_recaudador_nc: 0,
  },
]

const mockLiquidacionData = [
  {
    dia: "02",
    mes: "01",
    collector: "Niubiz",
    monto_recaudador: 200,
    comision_recaudador: 10,
    neto_recaudador: 190,
    monto_liquidacion: 200,
    comision_liquidacion: 10,
    neto_liquidacion: 190,
  },
]

describe("ReconciliationTable", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("llama al endpoint de conciliations cuando proceso es venta", async () => {
    ;(dashboardApi.getSummary as jest.Mock).mockResolvedValueOnce(mockVentaData)

    render(
      <ReconciliationTable
        proceso="venta"
        metodo="kashio"
        fromDate=""
        toDate=""
      />
    )

    await waitFor(() => {
      expect(dashboardApi.getSummary).toHaveBeenCalledWith(
        "1", // kashio -> 1
        expect.any(String),
        expect.any(String),
        "conciliations"
      )
    })
  })

  it("renderiza tablas de venta", async () => {
    ;(dashboardApi.getSummary as jest.Mock).mockResolvedValueOnce(mockVentaData)

    render(
      <ReconciliationTable
        proceso="venta"
        metodo="kashio"
        fromDate=""
        toDate=""
      />
    )

    expect(await screen.findByText("Monto de Calimaco")).toBeInTheDocument()
    expect(screen.getByText("Monto del Recaudador")).toBeInTheDocument()
  })

  it("llama al endpoint de liquidations cuando proceso es liquidacion", async () => {
    ;(dashboardApi.getSummary as jest.Mock).mockResolvedValueOnce(
      mockLiquidacionData
    )

    render(
      <ReconciliationTable
        proceso="liquidacion"
        metodo="niubiz"
        fromDate=""
        toDate=""
      />
    )

    await waitFor(() => {
      expect(dashboardApi.getSummary).toHaveBeenCalledWith(
        "4", // niubiz -> 4
        expect.any(String),
        expect.any(String),
        "liquidations"
      )
    })
  })

  it("renderiza tablas de liquidación", async () => {
    ;(dashboardApi.getSummary as jest.Mock).mockResolvedValueOnce(
      mockLiquidacionData
    )

    render(
      <ReconciliationTable
        proceso="liquidacion"
        metodo="niubiz"
        fromDate=""
        toDate=""
      />
    )

    expect(await screen.findByText("Recaudador")).toBeInTheDocument()
    expect(screen.getByText("Liquidacion")).toBeInTheDocument()
  })

  it("marca filas conciliadas en verde", async () => {
    ;(dashboardApi.getSummary as jest.Mock).mockResolvedValueOnce(mockVentaData)

    render(
      <ReconciliationTable
        proceso="venta"
        metodo="kashio"
        fromDate=""
        toDate=""
      />
    )
    
    const rows = await screen.findAllByText("Kashio")

    rows.forEach((cell) => {
      expect(cell.closest("tr")).toHaveClass("bg-green-50")
    })
  })
})
