// __tests__/Chart.test.tsx
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

// Mocks de Recharts
jest.mock("recharts", () => {
  const React = require("react")
  return {
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    Tooltip: ({ content }: any) => <div data-testid="tooltip">{content}</div>,
    Legend: ({ content }: any) => <div data-testid="legend">{content}</div>,
  }
})

import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  ChartStyle,
} from "../chart"

// Mock icon component
const MockIcon = () => <svg data-testid="mock-icon">Icon</svg>

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "#ff0000",
  },
  profit: {
    label: "Ganancia",
    theme: {
      light: "#00ff00",
      dark: "#009900",
    },
  },
  revenue: {
    label: "Revenue",
    color: "#0000ff",
    icon: MockIcon,
  },
}

describe("ChartContainer", () => {
  it("renderiza el contenedor y el ResponsiveContainer", () => {
    render(
      <ChartContainer config={chartConfig}>
        <div>Chart content</div>
      </ChartContainer>
    )

    expect(screen.getByText("Chart content")).toBeInTheDocument()
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument()
  })

  it("inyecta estilos CSS con ChartStyle", () => {
    const { container } = render(
      <ChartContainer id="test" config={chartConfig}>
        <div />
      </ChartContainer>
    )

    const style = container.querySelector("style")
    expect(style).toBeInTheDocument()
    expect(style?.innerHTML).toContain("--color-sales")
    expect(style?.innerHTML).toContain("--color-profit")
  })

  it("genera un ID único cuando no se proporciona", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <div />
      </ChartContainer>
    )

    const chartDiv = container.querySelector("[data-slot='chart']")
    expect(chartDiv).toHaveAttribute("data-chart")
  })

  it("usa el ID proporcionado", () => {
    const { container } = render(
      <ChartContainer id="custom-id" config={chartConfig}>
        <div />
      </ChartContainer>
    )

    const chartDiv = container.querySelector("[data-slot='chart']")
    expect(chartDiv).toHaveAttribute("data-chart", "chart-custom-id")
  })
})

describe("ChartStyle", () => {
  it("no renderiza nada si no hay configuración de color", () => {
    const { container } = render(
      <ChartContainer config={{}}>
        <div />
      </ChartContainer>
    )

    const style = container.querySelector("style")
    expect(style).not.toBeInTheDocument()
  })

  it("renderiza estilos para temas light y dark", () => {
    const { container } = render(
      <ChartContainer id="themed" config={chartConfig}>
        <div />
      </ChartContainer>
    )

    const style = container.querySelector("style")
    expect(style?.innerHTML).toContain("[data-chart=chart-themed]")
    expect(style?.innerHTML).toContain(".dark [data-chart=chart-themed]")
  })
})

describe("ChartTooltipContent", () => {
  it("no renderiza nada si no está activo", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent active={false} payload={[]} />
      </ChartContainer>
    )

    expect(container.querySelector(".border-border\\/50")).not.toBeInTheDocument()
  })

  it("no renderiza nada si payload está vacío", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent active={true} payload={[]} />
      </ChartContainer>
    )

    expect(container.querySelector(".border-border\\/50")).not.toBeInTheDocument()
  })

  it("renderiza tooltip con payload básico", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    expect(container.textContent).toContain("1000")
    const labels = screen.getAllByText("Ventas")
    expect(labels.length).toBeGreaterThan(0)
  })

  it("renderiza tooltip con label", () => {
    render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          label="January"
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    expect(screen.getByText("January")).toBeInTheDocument()
  })

  it("oculta label cuando hideLabel es true", () => {
    render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          label="January"
          hideLabel={true}
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    expect(screen.queryByText("January")).not.toBeInTheDocument()
  })

  it("usa labelFormatter cuando se proporciona", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          label="January"
          labelFormatter={(value) => `Month: ${value}`}
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    expect(container.textContent).toContain("Month:")
  })

  it("renderiza con indicador dot", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          indicator="dot"
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    const indicator = container.querySelector(".h-2\\.5.w-2\\.5")
    expect(indicator).toBeInTheDocument()
  })

  it("renderiza con indicador line", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          indicator="line"
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    const indicator = container.querySelector(".w-1")
    expect(indicator).toBeInTheDocument()
  })

  it("renderiza con indicador dashed", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          indicator="dashed"
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    const indicator = container.querySelector(".border-dashed")
    expect(indicator).toBeInTheDocument()
  })

  it("oculta indicador cuando hideIndicator es true", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          hideIndicator={true}
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    const indicator = container.querySelector(".h-2\\.5.w-2\\.5")
    expect(indicator).not.toBeInTheDocument()
  })

  it("renderiza icono cuando está configurado", () => {
    render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          payload={[
            {
              dataKey: "revenue",
              name: "revenue",
              value: 2000,
              color: "#0000ff",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    expect(screen.getByTestId("mock-icon")).toBeInTheDocument()
  })

  it("usa formatter personalizado cuando se proporciona", () => {
    render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          formatter={(value, name) => `${name}: $${value}`}
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    expect(screen.getByText("sales: $1000")).toBeInTheDocument()
  })

  it("filtra items con type 'none'", () => {
    render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
              type: "line",
            },
            {
              dataKey: "hidden",
              name: "hidden",
              value: 500,
              color: "#000000",
              payload: {},
              type: "none",
            },
          ]}
        />
      </ChartContainer>
    )

    const labels = screen.getAllByText("Ventas")
    expect(labels.length).toBeGreaterThan(0)
    expect(screen.queryByText("hidden")).not.toBeInTheDocument()
  })

  it("renderiza múltiples items en payload", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
            {
              dataKey: "profit",
              name: "profit",
              value: 500,
              color: "#00ff00",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    const ventas = screen.getAllByText("Ventas")
    const ganancia = screen.getAllByText("Ganancia")
    expect(ventas.length).toBeGreaterThan(0)
    expect(ganancia.length).toBeGreaterThan(0)
    expect(container.textContent).toContain("1000")
    expect(container.textContent).toContain("500")
  })

  it("usa nameKey personalizado", () => {
    render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          nameKey="customKey"
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              customKey: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    const labels = screen.getAllByText("Ventas")
    expect(labels.length).toBeGreaterThan(0)
  })

  it("usa labelKey personalizado", () => {
    render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          labelKey="customLabel"
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              customLabel: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    const labels = screen.getAllByText("Ventas")
    expect(labels.length).toBeGreaterThan(0)
  })

  it("usa color personalizado", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartTooltipContent
          active={true}
          color="#purple"
          payload={[
            {
              dataKey: "sales",
              name: "sales",
              value: 1000,
              color: "#ff0000",
              payload: {},
            },
          ]}
        />
      </ChartContainer>
    )

    const indicator = container.querySelector("[style*='--color-bg']")
    expect(indicator).toBeInTheDocument()
  })
})

describe("ChartLegendContent", () => {
  it("no renderiza nada si payload está vacío", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartLegendContent payload={[]} />
      </ChartContainer>
    )

    expect(container.querySelector(".flex.items-center")).not.toBeInTheDocument()
  })

  it("renderiza la leyenda con labels", () => {
    render(
      <ChartContainer config={chartConfig}>
        <ChartLegendContent
          payload={[
            {
              dataKey: "sales",
              value: "sales",
              color: "#ff0000",
              type: "line",
            },
            {
              dataKey: "profit",
              value: "profit",
              color: "#00ff00",
              type: "line",
            },
          ]}
        />
      </ChartContainer>
    )

    expect(screen.getByText("Ventas")).toBeInTheDocument()
    expect(screen.getByText("Ganancia")).toBeInTheDocument()
  })

  it("renderiza icono cuando está configurado y hideIcon es false", () => {
    render(
      <ChartContainer config={chartConfig}>
        <ChartLegendContent
          hideIcon={false}
          payload={[
            {
              dataKey: "revenue",
              value: "revenue",
              color: "#0000ff",
              type: "line",
            },
          ]}
        />
      </ChartContainer>
    )

    expect(screen.getByTestId("mock-icon")).toBeInTheDocument()
  })

  it("oculta icono cuando hideIcon es true", () => {
    render(
      <ChartContainer config={chartConfig}>
        <ChartLegendContent
          hideIcon={true}
          payload={[
            {
              dataKey: "revenue",
              value: "revenue",
              color: "#0000ff",
              type: "line",
            },
          ]}
        />
      </ChartContainer>
    )

    expect(screen.queryByTestId("mock-icon")).not.toBeInTheDocument()
  })

  it("aplica padding correcto para verticalAlign top", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartLegendContent
          verticalAlign="top"
          payload={[
            {
              dataKey: "sales",
              value: "sales",
              color: "#ff0000",
              type: "line",
            },
          ]}
        />
      </ChartContainer>
    )

    const legend = container.querySelector(".pb-3")
    expect(legend).toBeInTheDocument()
  })

  it("aplica padding correcto para verticalAlign bottom", () => {
    const { container } = render(
      <ChartContainer config={chartConfig}>
        <ChartLegendContent
          verticalAlign="bottom"
          payload={[
            {
              dataKey: "sales",
              value: "sales",
              color: "#ff0000",
              type: "line",
            },
          ]}
        />
      </ChartContainer>
    )

    const legend = container.querySelector(".pt-3")
    expect(legend).toBeInTheDocument()
  })

  it("filtra items con type 'none'", () => {
    render(
      <ChartContainer config={chartConfig}>
        <ChartLegendContent
          payload={[
            {
              dataKey: "sales",
              value: "sales",
              color: "#ff0000",
              type: "line",
            },
            {
              dataKey: "hidden",
              value: "hidden",
              color: "#000000",
              type: "none",
            },
          ]}
        />
      </ChartContainer>
    )

    expect(screen.getByText("Ventas")).toBeInTheDocument()
    expect(screen.queryByText("hidden")).not.toBeInTheDocument()
  })

  it("usa nameKey personalizado", () => {
    render(
      <ChartContainer config={chartConfig}>
        <ChartLegendContent
          nameKey="customKey"
          payload={[
            {
              dataKey: "sales",
              customKey: "sales",
              value: "sales",
              color: "#ff0000",
              type: "line",
            },
          ]}
        />
      </ChartContainer>
    )

    expect(screen.getByText("Ventas")).toBeInTheDocument()
  })
})

describe("useChart hook", () => {
  it("lanza error cuando se usa fuera de ChartContainer", () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()

    const TestComponent = () => {
      const { ChartTooltipContent } = require("../chart")
      return <ChartTooltipContent active={true} payload={[]} />
    }

    expect(() => render(<TestComponent />)).toThrow(
      "useChart must be used within a <ChartContainer />"
    )

    console.error = originalError
  })
})
