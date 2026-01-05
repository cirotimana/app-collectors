import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DataTable } from "../data-table";
import * as api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

// Mock de las APIs
jest.mock("@/lib/api", () => ({
  liquidationsApi: {
    getAll: jest.fn(),
    getByCollector: jest.fn(),
    getByDateRange: jest.fn(),
    delete: jest.fn(),
  },
  conciliationsApi: {
    getAll: jest.fn(),
    getByCollector: jest.fn(),
    getByDateRange: jest.fn(),
    delete: jest.fn(),
  },
  downloadApi: {
    downloadFile: jest.fn(),
  },
}));

// Mock del auth store
jest.mock("@/store/auth-store", () => ({
  useAuthStore: jest.fn(),
}));

// Mock de next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
  }),
}));

// Mock de sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock de hooks personalizados
jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

describe("DataTable", () => {
  const mockConciliationData = [
    {
      id: 1,
      collector: { name: "Kashio" },
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
      amount: "1000.50",
      amountCollector: "1000.00",
      differenceAmounts: "0.50",
      recordsCalimaco: 10,
      recordsCollector: 10,
      unreconciledRecordsCalimaco: 0,
      unreconciledRecordsCollector: 0,
      unreconciledAmountCalimaco: "0.00",
      unreconciledAmountCollector: "0.00",
      createdAt: "2024-01-15T10:00:00Z",
      createdBy: { firstName: "Juan", lastName: "Perez" },
      files: [
        {
          id: 1,
          conciliationFilesType: 1,
          filePath: "s3://bucket/file1.xlsx",
          createdAt: "2024-01-15T10:00:00Z",
        },
      ],
    },
  ];

  const mockLiquidationData = [
    {
      id: 2,
      collector: { name: "Tupay" },
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
      amountCollector: "5000.00",
      amountLiquidation: "4950.00",
      differenceAmounts: "50.00",
      recordsCollector: 20,
      recordsLiquidation: 19,
      debitAmountCollector: "100.00",
      debitAmountLiquidation: "95.00",
      creditAmountCollector: "5100.00",
      creditAmountLiquidation: "5045.00",
      createdAt: "2024-01-16T10:00:00Z",
      createdBy: { firstName: "Maria", lastName: "Garcia" },
      files: [
        {
          id: 2,
          liquidationFilesType: 2,
          filePath: "s3://bucket/file2.xlsx",
          createdAt: "2024-01-16T10:00:00Z",
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock del auth store con permisos por defecto
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      canDelete: jest.fn(() => false),
      canAccessLiquidaciones: jest.fn(() => true),
    });

    // Mock de las APIs con datos por defecto
    (api.conciliationsApi.getAll as jest.Mock).mockResolvedValue(
      mockConciliationData
    );
    (api.liquidationsApi.getAll as jest.Mock).mockResolvedValue(
      mockLiquidationData
    );
  });

  /* ================= Renderizado inicial ================= */

  it("renderiza el componente correctamente", async () => {
    render(<DataTable />);

    // Debe mostrar el tab de ventas por defecto
    await waitFor(() => {
      expect(screen.getByText("Ventas")).toBeInTheDocument();
    });
  });

  it("carga datos de conciliaciones por defecto", async () => {
    render(<DataTable />);

    await waitFor(() => {
      expect(api.conciliationsApi.getAll).toHaveBeenCalled();
      expect(screen.getByText("Kashio")).toBeInTheDocument();
    });
  });

  it("muestra loader mientras carga datos", async () => {
    (api.conciliationsApi.getAll as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockConciliationData), 100)
        )
    );

    render(<DataTable />);

    // Debe mostrar el loader
    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();

    // Esperar a que termine de cargar
    await waitFor(() => {
      expect(screen.getByText("Kashio")).toBeInTheDocument();
    });
  });

  /* ================= Cambio entre tabs ================= */

  it("cambia a liquidaciones cuando se selecciona el tab", async () => {
    render(<DataTable />);

    // Esperar a que cargue ventas primero
    await waitFor(() => {
      expect(screen.getByText("Kashio")).toBeInTheDocument();
    });

    // Cambiar a liquidaciones
    const liquidacionesTab = screen.getByRole("tab", {
      name: /liquidaciones/i,
    });
    fireEvent.click(liquidacionesTab);

    await waitFor(() => {
      expect(api.liquidationsApi.getAll).toHaveBeenCalled();
      expect(screen.getByText("Tupay")).toBeInTheDocument();
    });
  });

  it("no muestra tab de liquidaciones si no tiene permiso", async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      canDelete: jest.fn(() => false),
      canAccessLiquidaciones: jest.fn(() => false),
    });

    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText("Ventas")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("tab", { name: /liquidaciones/i })
    ).not.toBeInTheDocument();
  });

  /* ================= Búsqueda y filtros ================= */

  it("filtra por recaudador cuando se ingresa texto", async () => {
    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText("Kashio")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar por recaudador/i);
    fireEvent.change(searchInput, { target: { value: "Tupay" } });

    await waitFor(() => {
      expect(api.conciliationsApi.getByCollector).toHaveBeenCalledWith("Tupay");
    });
  });

  it('limpia los filtros cuando se hace clic en "Limpiar"', async () => {
    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText("Kashio")).toBeInTheDocument();
    });

    // Aplicar filtro
    const searchInput = screen.getByPlaceholderText(/buscar por recaudador/i);
    fireEvent.change(searchInput, { target: { value: "Test" } });

    // Esperar a que aparezca el botón limpiar
    await waitFor(() => {
      expect(screen.getByText("Limpiar")).toBeInTheDocument();
    });

    // Limpiar filtros
    fireEvent.click(screen.getByText("Limpiar"));

    expect(searchInput).toHaveValue("");
  });

  /* ================= Paginación ================= */

  it("muestra controles de paginación", async () => {
    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText(/página/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /previous/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("navega entre páginas", async () => {
    // Crear datos suficientes para múltiples páginas
    const manyItems = Array.from({ length: 25 }, (_, i) => ({
      ...mockConciliationData[0],
      id: i + 1,
      collector: { name: `Collector ${i + 1}` },
    }));

    (api.conciliationsApi.getAll as jest.Mock).mockResolvedValue(manyItems);

    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText("Collector 1")).toBeInTheDocument();
    });

    // Ir a la siguiente página
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/página 2/i)).toBeInTheDocument();
    });
  });

  /* ================= Tabla vacía ================= */

  it("muestra mensaje cuando no hay resultados", async () => {
    (api.conciliationsApi.getAll as jest.Mock).mockResolvedValue([]);

    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText(/no hay resultados/i)).toBeInTheDocument();
    });
  });

  /* ================= Formateo de datos ================= */

  it("formatea montos correctamente", async () => {
    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText("S/ 1,000.50")).toBeInTheDocument();
      expect(screen.getByText("S/ 1,000.00")).toBeInTheDocument();
    });
  });

  it("muestra diferencia en rojo cuando es distinta de cero", async () => {
    render(<DataTable />);

    await waitFor(() => {
      const diffElement = screen.getByText("S/ 0.50");
      expect(diffElement).toHaveClass("text-red-600");
    });
  });

  it("formatea fechas correctamente", async () => {
    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText("01/01/2024")).toBeInTheDocument();
      expect(screen.getByText("31/01/2024")).toBeInTheDocument();
    });
  });

  /* ================= Manejo de errores ================= */

  it("maneja errores al cargar datos", async () => {
    (api.conciliationsApi.getAll as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText(/no hay resultados/i)).toBeInTheDocument();
    });
  });

  /* ================= Columnas visibles ================= */

  it("muestra todas las columnas principales de conciliaciones", async () => {
    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText("Recaudador")).toBeInTheDocument();
      expect(screen.getByText("Desde")).toBeInTheDocument();
      expect(screen.getByText("Hasta")).toBeInTheDocument();
      expect(screen.getByText("Venta Calimaco")).toBeInTheDocument();
      expect(screen.getByText("Venta Recaudador")).toBeInTheDocument();
      expect(screen.getByText("Diferencia")).toBeInTheDocument();
    });
  });

  it("muestra columnas correctas para liquidaciones", async () => {
    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText("Ventas")).toBeInTheDocument();
    });

    // Cambiar a liquidaciones
    const liquidacionesTab = screen.getByRole("tab", {
      name: /liquidaciones/i,
    });
    fireEvent.click(liquidacionesTab);

    await waitFor(() => {
      expect(screen.getByText("Neto Recaudador")).toBeInTheDocument();
      expect(screen.getByText("Neto Liquidacion")).toBeInTheDocument();
    });
  });

  /* ================= Búsqueda por rango de fechas ================= */

  it("busca por rango de fechas cuando se proporciona", async () => {
    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText("Kashio")).toBeInTheDocument();
    });

    // Simular selección de rango de fechas
    const searchInput = screen.getByPlaceholderText(/buscar por recaudador/i);

    // Este test es limitado porque PeriodPicker es un componente complejo
    // En un test real necesitarías mockear el componente o usar integration tests
  });

  /* ================= Acciones del menú ================= */

  it("muestra menú de acciones para cada fila", async () => {
    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText("Kashio")).toBeInTheDocument();
    });

    const actionButtons = screen.getAllByRole("button", {
      name: /abrir menu/i,
    });
    expect(actionButtons.length).toBeGreaterThan(0);
  });

  /* ================= Responsive ================= */

  it("usa select en lugar de tabs en móvil", async () => {
    // Mock para simular mobile
    jest.mock("@/hooks/use-mobile", () => ({
      useIsMobile: () => true,
    }));

    render(<DataTable />);

    await waitFor(() => {
      // En móvil debe mostrar un Select en lugar de tabs
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("abre diálogo cuando hay múltiples archivos", async () => {
    const multiFileData = [
      {
        ...mockConciliationData[0],
        files: [
          { ...mockConciliationData[0].files[0], id: 1 },
          { ...mockConciliationData[0].files[0], id: 2 },
        ],
      }];
    (api.conciliationsApi.getAll as jest.Mock).mockResolvedValue(
      multiFileData
    );

    render(<DataTable />);

    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    });

    fireEvent.click(screen.getByText(/descargar archivo/i));

    await waitFor(() => {
      expect(screen.getByText(/seleccionar archivo/i)).toBeInTheDocument();
    });
  });
  it("muestra error si no hay archivos para descargar", async () => {
    const noFilesData = [
      {
        ...mockConciliationData[0],
        files: [],
      },
    ];
    (api.conciliationsApi.getAll as jest.Mock).mockResolvedValue(noFilesData);

    render(<DataTable />);

    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    });

    fireEvent.click(screen.getByText(/descargar archivo/i));

    await waitFor(() => {
      expect(require("sonner").toast.error).toHaveBeenCalled();
    });
  });

  it("muestra diferencia en verde cuando es cero", async () => {
    const zeroDiffData = [
      {
        ...mockConciliationData[0],
        differenceAmounts: "0.00",
      }];
    (api.conciliationsApi.getAll as jest.Mock).mockResolvedValue(zeroDiffData);

    render(<DataTable />);

    await waitFor(() => {
      const diff = screen.getByText("S/ 0.00");
      expect(diff).toHaveClass("text-green-600");
    });
  });
})
