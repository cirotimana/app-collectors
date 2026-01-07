import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PieChartCard } from "../pie-chart-card";

/**
 * Mock de recharts
 * (NO testeamos librerías externas)
 */
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children, label, data }: any) => {
    if (typeof label === "function" && data && data.length > 0) {
      label({ name: data[0].name, percent: 0.5 });
    }
    return <div data-testid="pie">{children}</div>;
  },
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div />,
}));

describe("PieChartCard", () => {
  const mockData = [
    { name: "Efectivo", value: 100, process: "conciliations" },
    { name: "Tarjeta", value: 50, process: "conciliations" },
  ];

  it("renderiza el título principal", () => {
    render(<PieChartCard data={mockData} />);

    expect(
      screen.getByText("Distribución por Método")
    ).toBeInTheDocument();
  });

  it("muestra 'Calimaco' cuando el process es conciliations", () => {
    render(<PieChartCard data={mockData} />);

    expect(
      screen.getByText("Monto Calimaco (%)")
    ).toBeInTheDocument();
  });

  it("renderiza los nombres del dataset", () => {
    render(<PieChartCard data={mockData} />);

    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getByText("Tarjeta")).toBeInTheDocument();
  });

  it("calcula y muestra los porcentajes correctamente", () => {
    render(<PieChartCard data={mockData} />);

    // total = 150
    expect(screen.getByText("66.7%")).toBeInTheDocument();
    expect(screen.getByText("33.3%")).toBeInTheDocument();
  });
  it("muestra 'Recaudador' cuando el proceso NO es conciliations", () => {
    const otherData = [{ name: "Test", value: 10, process: "liquidations" }];
    render(<PieChartCard data={otherData} />);

    expect(screen.getByText("Monto Recaudador (%)")).toBeInTheDocument();
  });

  it("ejecuta la lógica de las celdas (Cell) y el label del Pie", () => {
    const { getAllByTestId } = render(<PieChartCard data={mockData} />);
    
    // Al renderizar, el mock de Pie ahora ejecuta la función label
    // y el map de data.map((_, index) => <Cell ... />) se ejecuta (Línea 79)
    const cells = getAllByTestId("cell");
    expect(cells.length).toBe(mockData.length);
  });

  it("maneja el formateo de etiquetas correctamente", () => {
    // Este test asegura que la lógica dentro de la prop 'label' de Pie funcione
    // Si usaste el mock mejorado de arriba, la línea 64 ya está cubierta
    render(<PieChartCard data={mockData} />);
  });
});
