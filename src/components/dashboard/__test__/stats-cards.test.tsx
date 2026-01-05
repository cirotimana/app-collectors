import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StatsCards } from "../stats-cards";

describe("StatsCards", () => {
  it("renderiza los títulos correctamente", () => {
    render(
      <StatsCards
        ventaCalimaco={1500}
        ventaProveedor={2500}
        t1="Calimaco"
        t2="Proveedor"
      />
    );

    expect(screen.getByText("Calimaco")).toBeInTheDocument();
    expect(screen.getByText("Proveedor")).toBeInTheDocument();
  });

  it("muestra los montos formateados en moneda", () => {
    render(
      <StatsCards
        ventaCalimaco={1500}
        ventaProveedor={2500}
        t1="Calimaco"
        t2="Proveedor"
      />
    );

    expect(screen.getByText("S/. 1,500.00")).toBeInTheDocument();
    expect(screen.getByText("S/. 2,500.00")).toBeInTheDocument();
  });

  it("maneja valores decimales correctamente", () => {
    render(
      <StatsCards
        ventaCalimaco={1234.5}
        ventaProveedor={98765.43}
        t1="Uno"
        t2="Dos"
      />
    );

    expect(screen.getByText("S/. 1,234.50")).toBeInTheDocument();
    expect(screen.getByText("S/. 98,765.43")).toBeInTheDocument();
  });
});
