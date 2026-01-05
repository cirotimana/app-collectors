import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PieChartCard } from "../pie-chart-card";

/**
 * Mock de recharts
 * (NO testeamos librerías externas)
 */
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: ({ children }: any) => <div>{children}</div>,
  Cell: () => <div />,
  Tooltip: () => <div />,
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
});
