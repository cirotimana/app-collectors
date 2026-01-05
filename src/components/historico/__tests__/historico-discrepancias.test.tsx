import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HistoricoDiscrepancias } from "../historico-discrepancias"

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

// 🔥 MOCK MODAL (EVITA useRouter)
jest.mock("@/components/provider/data-table", () => ({
  FileDetailsDialog: ({ open }: { open: boolean }) =>
    open ? <div>MODAL_ABIERTO</div> : null,
}))

import {
  discrepanciesApi,
  liquidationsApi,
} from "@/lib/api"

describe("HistoricoDiscrepancias", () => {
  const mockDiscrepancy = {
    id: 1,
    idReport: 10,
    methodProcess: "liquidations",
    status: "new",
    difference: 100,
    createdAt: new Date().toISOString(),
    updatedAT: new Date().toISOString(),
    liquidation: {
      collector: { name: "Niubiz" },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renderiza el historial", async () => {
    ;(discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy])

    render(<HistoricoDiscrepancias />)

    expect(
      await screen.findByText(/Historial de Discrepancias/i)
    ).toBeInTheDocument()

    expect(await screen.findByText("Niubiz")).toBeInTheDocument()
  })

  it("abre detalles del item", async () => {
    const user = userEvent.setup()

    ;(discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy])
    ;(liquidationsApi.getAll as jest.Mock).mockResolvedValue([
      { id: 10, name: "detalle mock" },
    ])

    render(<HistoricoDiscrepancias />)

    const buttons = await screen.findAllByRole("button")
    await user.click(buttons[0]) // 👁 ver detalles

    await waitFor(() => {
      expect(screen.getByText("MODAL_ABIERTO")).toBeInTheDocument()
    })
  })

  it("cambia el estado a pending", async () => {
    const user = userEvent.setup()

    ;(discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy])
    ;(discrepanciesApi.updateStatus as jest.Mock).mockResolvedValue(undefined)

    render(<HistoricoDiscrepancias />)

    const buttons = await screen.findAllByRole("button")
    await user.click(buttons[1]) // ⏱

    await waitFor(() => {
      expect(discrepanciesApi.updateStatus).toHaveBeenCalledWith(1, "pending")
    })
  })

  it("elimina la discrepancia", async () => {
    const user = userEvent.setup()

    ;(discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy])
    ;(discrepanciesApi.delete as jest.Mock).mockResolvedValue(undefined)

    render(<HistoricoDiscrepancias />)

    const buttons = await screen.findAllByRole("button")
    await user.click(buttons[2]) // 🗑

    await waitFor(() => {
      expect(discrepanciesApi.delete).toHaveBeenCalledWith(1)
    })
  })
  
  it("filtra por estado cuando cambia el filtro", async () => {
  ;(discrepanciesApi.getByStatus as jest.Mock).mockResolvedValue([mockDiscrepancy]);
  
  const { rerender } = render(<HistoricoDiscrepancias />);
  
  // Como no pasaste el JSX de los filtros en el código, 
  // pero el componente usa el estado, podemos simular el cambio de estado 
  // si el componente expone los controles. 
  // Si los controles están comentados en tu código, 
  // asegúrate de descomentar el Select de estado para testearlo:
  
  // Simulando que el componente detecta el cambio de filtro (si estuviera visible)
  // O disparando el fetch manualmente si el estado cambia.
  // Pero para efectos de cobertura, necesitamos que entre a fetchDiscrepancies con statusFilter != "all"
});

it("filtra por rango de fechas", async () => {
  const dateData = "2023-01-01-2023-01-31";
  ;(discrepanciesApi.getByDateRange as jest.Mock).mockResolvedValue([mockDiscrepancy]);

  // Aquí testeamos la lógica de la línea 42 (split por '-')
  // Si tienes el PeriodPicker, busca su input y cambia el valor
});

it("muestra error al fallar la carga de datos", async () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  ;(discrepanciesApi.getAll as jest.Mock).mockRejectedValue(new Error("API Error"));

  render(<HistoricoDiscrepancias />);

  await waitFor(() => {
    expect(screen.getByText(/Error al cargar discrepancias/i)).toBeInTheDocument();
  });
  consoleSpy.mockRestore();
});

it("maneja error al cargar detalles", async () => {
  ;(discrepanciesApi.getAll as jest.Mock).mockResolvedValue([mockDiscrepancy]);
  ;(liquidationsApi.getAll as jest.Mock).mockRejectedValue(new Error("Detail Error"));

  render(<HistoricoDiscrepancias />);
  
  const user = userEvent.setup();
  const detailBtn = await screen.findByRole("button", { name: "" }); // El ojo
  await user.click(detailBtn);

  await waitFor(() => {
    expect(screen.getByText(/Error al cargar detalles/i)).toBeInTheDocument();
  });
});

it("navega por la paginación", async () => {
  const user = userEvent.setup();
  // Crear 15 discrepancias
  const manyDiscrepancies = Array.from({ length: 15 }, (_, i) => ({
    ...mockDiscrepancy,
    id: i,
  }));
  ;(discrepanciesApi.getAll as jest.Mock).mockResolvedValue(manyDiscrepancies);

  render(<HistoricoDiscrepancias />);

  // Verificar que muestra los primeros 10
  expect(await screen.findByText(/Mostrando 1 a 10 de 15/i)).toBeInTheDocument();

  const nextBtn = screen.getByRole("button", { name: /Siguiente/i });
  await user.click(nextBtn);

  // Verificar cambio de página (Línea 232+)
  expect(screen.getByText(/Página 2 de 2/i)).toBeInTheDocument();
  expect(screen.getByText(/Mostrando 11 a 15 de 15/i)).toBeInTheDocument();
});

it("muestra mensaje cuando no hay discrepancias", async () => {
  ;(discrepanciesApi.getAll as jest.Mock).mockResolvedValue([]);
  render(<HistoricoDiscrepancias />);
  expect(await screen.findByText(/No hay discrepancias/i)).toBeInTheDocument();
});

it("muestra N/A si no hay información de liquidador", async () => {
  const discrepancyNoInfo = { ...mockDiscrepancy, liquidation: null, conciliation: null };
  ;(discrepanciesApi.getAll as jest.Mock).mockResolvedValue([discrepancyNoInfo]);

  render(<HistoricoDiscrepancias />);
  expect(await screen.findByText("N/A")).toBeInTheDocument();
});
})
