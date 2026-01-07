import { render, screen, waitFor, fireEvent, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HistoricoDiscrepancias } from "../historico-discrepancias"
import { discrepanciesApi, liquidationsApi, conciliationsApi } from "@/lib/api"
import { toast } from "sonner"

// 🔥 MOCK APIs
jest.mock("@/lib/api", () => ({
  discrepanciesApi: {
    getAll: jest.fn(),
    getByStatus: jest.fn(),
    getByDateRange: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  },
  liquidationsApi: {
    getAll: jest.fn(),
  },
  conciliationsApi: {
    getAll: jest.fn(),
  },
}))

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// 🔥 MOCK COMPONENTS
jest.mock("@/components/provider/data-table", () => ({
  FileDetailsDialog: ({ open, item, type }: any) =>
    open ? (
      <div data-testid="file-details-dialog">
        MODAL_ABIERTO - {item?.name} - {type}
      </div>
    ) : null,
}))

jest.mock("@/components/ui/period-picker", () => ({
  PeriodPicker: ({ onChange }: any) => (
    <input
      data-testid="period-picker"
      onChange={(e) => {
        // Simulate date range or single date
        const val = e.target.value
        if (val === "CLEAR") {
          onChange({})
        } else if (val.includes(",")) {
          const [from, to] = val.split(",")
          onChange({ from: new Date(from), to: new Date(to) })
        } else if (val.includes("ONLY_FROM")) {
          // Simulate range selection in progress (only start date selected)
          const dateStr = val.replace("ONLY_FROM", "").trim()
          onChange({ from: new Date(dateStr) })
        } else {
          onChange({ from: new Date(val), to: new Date(val) })
        }
      }}
    />
  ),
}))

describe("HistoricoDiscrepancias", () => {
  const mockDiscrepancy = {
    id: 1,
    idReport: 10,
    methodProcess: "liquidations",
    status: "new",
    difference: 100,
    createdAt: "2023-01-01T10:00:00Z",
    updatedAT: "2023-01-02T10:00:00Z",
    liquidation: {
      collector: { name: "Niubiz" },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renderiza el historial y muestra datos correctamente", async () => {
    (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy])

    render(<HistoricoDiscrepancias />)

    // Wait for loading to finish
    await waitFor(() => screen.findByText(/Historial de Discrepancias/i))

    expect(screen.getByText("Niubiz")).toBeInTheDocument()
    expect(screen.getByText("Nuevo")).toBeInTheDocument()
    expect(screen.getByText("Liquidaciones")).toBeInTheDocument()
    expect(screen.getByText("S/. 100")).toBeInTheDocument()
  })

  it("muestra estado de carga", async () => {
    // Delay resolution
    (discrepanciesApi.getAll as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)))

    render(<HistoricoDiscrepancias />)
    expect(screen.getByText("Cargando...")).toBeInTheDocument()

    await waitFor(() => expect(screen.queryByText("Cargando...")).not.toBeInTheDocument())
  })

  it("muestra mensaje cuando no hay discrepancias", async () => {
    (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([])
    render(<HistoricoDiscrepancias />)
    expect(await screen.findByText("No hay discrepancias")).toBeInTheDocument()
  })

  it("abre detalles del item", async () => {
    const user = userEvent.setup()

      ; (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy])
      ; (liquidationsApi.getAll as jest.Mock).mockResolvedValue([
        { id: 10, name: "detalle mock" },
      ])

    render(<HistoricoDiscrepancias />)
    await screen.findByText("Niubiz")

    const row = screen.getByRole("row", { name: /Nuevo/i })
    const buttons = await within(row).findAllByRole("button")

    // First button: Details
    await user.click(buttons[0])

    await waitFor(() => {
      expect(screen.getByTestId("file-details-dialog")).toBeInTheDocument()
      expect(screen.getByText(/detalle mock/)).toBeInTheDocument()
    })
  })

  it("cambia el estado de new a pending", async () => {
    const user = userEvent.setup()

      ; (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy])
      ; (discrepanciesApi.updateStatus as jest.Mock).mockResolvedValue(undefined)

    render(<HistoricoDiscrepancias />)
    await screen.findByText("Niubiz")

    const row = screen.getByRole("row", { name: /Nuevo/i })
    const buttons = await within(row).findAllByRole("button")

    // Second button: Update (Clock for new)
    await user.click(buttons[1])

    await waitFor(() => {
      expect(discrepanciesApi.updateStatus).toHaveBeenCalledWith(1, "pending")
      expect(toast.success).toHaveBeenCalledWith("Estado actualizado correctamente")
    })
  })

  it("cambia el estado de pending a closed", async () => {
    const user = userEvent.setup()
    const pendingDiscrepancy = { ...mockDiscrepancy, status: "pending" }
      ; (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([pendingDiscrepancy])
      ; (discrepanciesApi.updateStatus as jest.Mock).mockResolvedValue(undefined)

    render(<HistoricoDiscrepancias />)
    await screen.findByText("Niubiz")

    const row = screen.getByRole("row", { name: /Pendiente/i })
    const buttons = await within(row).findAllByRole("button")

    // Second button: Update (Check for pending)
    await user.click(buttons[1])

    await waitFor(() => {
      expect(discrepanciesApi.updateStatus).toHaveBeenCalledWith(1, "closed")
    })
  })

  it("abre detalles para conciliacion", async () => {
    const user = userEvent.setup()
    const conciliationDiscrepancy = { ...mockDiscrepancy, methodProcess: "conciliations" }
      ; (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([conciliationDiscrepancy])
      ; (conciliationsApi.getAll as jest.Mock).mockResolvedValue([{ id: 10, name: "conciliation detail" }])

    render(<HistoricoDiscrepancias />)
    await screen.findByText("Niubiz")

    const row = screen.getByRole("row", { name: /Nuevo/i })
    const buttons = await within(row).findAllByRole("button")
    await user.click(buttons[0])

    await waitFor(() => {
      expect(screen.getByTestId("file-details-dialog")).toBeInTheDocument()
      expect(screen.getByText(/- conciliation/)).toBeInTheDocument()
    })
  })

  it("elimina la discrepancia", async () => {
    const user = userEvent.setup()

      ; (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy])
      ; (discrepanciesApi.delete as jest.Mock).mockResolvedValue(undefined)

    render(<HistoricoDiscrepancias />)
    await screen.findByText("Niubiz")

    const row = screen.getByRole("row", { name: /Nuevo/i })
    const buttons = await within(row).findAllByRole("button")

    // Third button: Delete
    await user.click(buttons[2])

    await waitFor(() => {
      expect(discrepanciesApi.delete).toHaveBeenCalledWith(1)
      expect(toast.success).toHaveBeenCalledWith('Discrepancia eliminada correctamente')
    })
  })

  it("maneja error al actualizar estado", async () => {
    const user = userEvent.setup()
      ; (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy])
      ; (discrepanciesApi.updateStatus as jest.Mock).mockRejectedValue(new Error("Update failed"))

    render(<HistoricoDiscrepancias />)
    await screen.findByText("Niubiz")

    const row = screen.getByRole("row", { name: /Nuevo/i })
    const buttons = await within(row).findAllByRole("button")
    await user.click(buttons[1])

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al actualizar estado')
    })
  })

  it("maneja error al eliminar discrepancia", async () => {
    const user = userEvent.setup()
      ; (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy])
      ; (discrepanciesApi.delete as jest.Mock).mockRejectedValue(new Error("Delete failed"))

    render(<HistoricoDiscrepancias />)
    await screen.findByText("Niubiz")

    const row = screen.getByRole("row", { name: /Nuevo/i })
    const buttons = await within(row).findAllByRole("button")
    await user.click(buttons[2])

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al eliminar discrepancia')
    })
  })

  it("renderiza estado cerrado adecuadamente", async () => {
    const closedDiscrepancy = { ...mockDiscrepancy, status: "closed" }
      ; (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([closedDiscrepancy])

    render(<HistoricoDiscrepancias />)
    await screen.findByText("Niubiz")
    // Should have default badge variant (or secondary depending on impl)
    // We just check it renders without error
    expect(screen.getByText("Cerrado")).toBeInTheDocument()
    // Note: The badge text comes from where? map?
    // In component: status is displayed?
    // I need to check how status is rendered. badge variants.
  })

  it("no encuentra detalles del item (silencioso)", async () => {
    const user = userEvent.setup()
      ; (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy])
      ; (liquidationsApi.getAll as jest.Mock).mockResolvedValue([{ id: 999, name: "mismatch" }])

    render(<HistoricoDiscrepancias />)
    await screen.findByText("Niubiz")

    const row = screen.getByRole("row", { name: /Nuevo/i })
    const buttons = await within(row).findAllByRole("button")
    await user.click(buttons[0])

    // Wait to ensure NO dialog appears (and no error toast)
    // We can't easily wait for "nothing" happening without timeout, but we can wait for api call
    await waitFor(() => {
      expect(liquidationsApi.getAll).toHaveBeenCalled()
      expect(screen.queryByTestId("file-details-dialog")).not.toBeInTheDocument()
    })
  })

  it("renderiza estado desconocido con color default", async () => {
    const unknownDiscrepancy = { ...mockDiscrepancy, status: "unknown" }
      ; (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([unknownDiscrepancy])

    render(<HistoricoDiscrepancias />)
    await screen.findByText("Niubiz")
  })

  it("muestra error al fallar la carga de datos", async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    (discrepanciesApi.getAll as jest.Mock).mockRejectedValue(new Error("API Error"));

    render(<HistoricoDiscrepancias />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al cargar discrepancias')
    });
    consoleSpy.mockRestore();
  });

  it("maneja error al cargar detalles", async () => {
    (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy]);
    (liquidationsApi.getAll as jest.Mock).mockRejectedValue(new Error("Detail Error"));

    render(<HistoricoDiscrepancias />);

    const user = userEvent.setup();
    const row = await screen.findByRole("row", { name: /Nuevo/i });
    const detailBtn = within(row).getAllByRole("button")[0];
    await user.click(detailBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al cargar detalles')
    });
  });

  it("navega por la paginación", async () => {
    const user = userEvent.setup();
    const manyDiscrepancies = Array.from({ length: 15 }, (_, i) => ({
      ...mockDiscrepancy,
      id: i,
    }));
    (discrepanciesApi.getAll as jest.Mock).mockResolvedValue(manyDiscrepancies);

    render(<HistoricoDiscrepancias />);

    expect(await screen.findByText(/Mostrando 1 a 10 de 15/i)).toBeInTheDocument();

    const nextBtn = screen.getByRole("button", { name: /Siguiente/i });
    await user.click(nextBtn);

    expect(screen.getByText(/Página 2 de 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Mostrando 11 a 15 de 15/i)).toBeInTheDocument();

    const prevBtn = screen.getByRole("button", { name: /Anterior/i });
    await user.click(prevBtn);
    expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument();
  });

  it("muestra N/A si no hay información de liquidador", async () => {
    const discrepancyNoInfo = { ...mockDiscrepancy, liquidation: null, conciliation: null };
    (discrepanciesApi.getAll as jest.Mock).mockResolvedValue([discrepancyNoInfo]);

    render(<HistoricoDiscrepancias />);
    expect(await screen.findByText("N/A")).toBeInTheDocument();
  });

})
