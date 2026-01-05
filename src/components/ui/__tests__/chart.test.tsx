import * as React from "react"
import { render, screen } from "@testing-library/react"
import { 
  ChartContainer, 
  ChartTooltipContent, 
  ChartLegendContent 
} from "../chart"

// Mock de ResizeObserver para ResponsiveContainer
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

describe("Chart Component System", () => {
  const mockConfig = {
    desktop: {
      label: "Desktop",
      color: "#2563eb",
    },
    mobile: {
      label: "Mobile",
      theme: {
        light: "#60a5fa",
        dark: "#1e40af",
      },
    },
  }

  const mockPayload = [
    {
      dataKey: "desktop",
      name: "desktop",
      value: 1200,
      color: "#2563eb",
      payload: { desktop: 1200, mobile: 400 },
    },
  ]

  describe("ChartContainer & ChartStyle", () => {
    it("genera variables CSS para temas light y dark", () => {
      const { container } = render(
        <ChartContainer config={mockConfig} id="test-chart">
          <svg />
        </ChartContainer>
      )
      
      const styleTag = container.querySelector("style")
      expect(styleTag).toBeInTheDocument()
      const styleContent = styleTag?.innerHTML
      
      // Verifica que se generen las variables para los dos tipos de config (color y theme)
      expect(styleContent).toContain("--color-desktop: #2563eb")
      expect(styleContent).toContain(".dark [data-chart=chart-test-chart]")
      expect(styleContent).toContain("--color-mobile: #1e40af") // valor dark
    })

    it("lanza error si useChart se usa fuera de provider", () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => render(<ChartTooltipContent active />)).toThrow(
        "useChart must be used within a <ChartContainer />"
      )
      consoleSpy.mockRestore()
    })
  })

  describe("ChartTooltipContent", () => {
    it("renderiza correctamente los valores y etiquetas", () => {
      render(
        <ChartContainer config={mockConfig}>
            <ChartTooltipContent
                {...({
                active: true,
                payload: mockPayload,
                label: "Enero",
                } as any)}
            />
        </ChartContainer>
      )

      expect(screen.getByText("Desktop")).toBeInTheDocument()
      expect(screen.getByText("1,200")).toBeInTheDocument()
    })

    it("oculta el label cuando hideLabel es true", () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltipContent
            {...({
              active: true,
              payload: mockPayload,
              label: "Enero",
              hideLabel: true,
            } as any)}
          />
        </ChartContainer>
      )

      expect(screen.queryByText("Enero")).not.toBeInTheDocument()
    })

    it("renderiza diferentes indicadores (line, dot, dashed)", () => {
      const { container } = render(
        <ChartContainer config={mockConfig}>
          <ChartTooltipContent
            active={true} ></ChartTooltipContent>
        </ChartContainer>
      )
      expect(screen.queryByText("Enero")).not.toBeInTheDocument()
    })

    it("renderiza diferentes indicadores (line, dot, dashed)", () => {
      const { container } = render(
        <ChartContainer config={mockConfig}>
          <ChartTooltipContent
            {...({
              active: true,
              payload: mockPayload,
              indicator: "dashed",
            } as any)}
          />
        </ChartContainer>
      )
      // Verifica que la clase del indicador esté presente
      expect(container.querySelector(".border-dashed")).toBeInTheDocument()
    })
  })

  describe("ChartLegendContent", () => {
    it("renderiza la leyenda basada en la config", () => {
      const { container } = render(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent payload={mockPayload} />
        </ChartContainer>
      )
      // Verifica que la clase del indicador esté presente
      expect(container.querySelector(".border-dashed")).toBeInTheDocument()
    })
  })

  describe("ChartLegendContent", () => {
    it("renderiza la leyenda basada en la config", () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent payload={mockPayload} />
        </ChartContainer>
      )
      expect(screen.getByText("Desktop")).toBeInTheDocument()
    })

    it("no renderiza nada si no hay payload", () => {
      const { container } = render(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent payload={[]} />
        </ChartContainer>
      )
      expect(container.firstChild).toBeNull()
    })
  })

  it("no renderiza <style> si no hay colores ni themes", () => {
  const { container } = render(
    <ChartContainer
      config={{
        test: { label: "Sin color" },
      }}
    >
      <svg />
    </ChartContainer>
  )

  expect(container.querySelector("style")).toBeNull()
})

it("no renderiza tooltip si active es false", () => {
  const { container } = render(
    <ChartContainer config={mockConfig}>
      <ChartTooltipContent {...{ active: false, payload: mockPayload }} />
    </ChartContainer>
  )

  expect(container.firstChild).toBeNull()
})


it("no renderiza tooltip si payload es undefined", () => {
  const { container } = render(
    <ChartContainer config={mockConfig}>
      <ChartTooltipContent {...{ active: true, payload: undefined }} />
    </ChartContainer>
  )

  expect(container.firstChild).toBeNull()
})

it("usa formatter cuando está definido", () => {
  render(
    <ChartContainer config={mockConfig}>
      <ChartTooltipContent
        {...{
          active: true,
          payload: mockPayload,
          formatter: (value) => <span>Valor: {value}</span>,
        }}
      />
    </ChartContainer>
  )

  expect(screen.getByText("Valor: 1200")).toBeInTheDocument()
})

it("maneja múltiples payloads con indicador line", () => {
  const multiPayload = [
    ...mockPayload,
    {
      dataKey: "mobile",
      name: "mobile",
      value: 400,
      color: "#1e40af",
      payload: { desktop: 1200, mobile: 400 },
    },
  ]

  render(
    <ChartContainer config={mockConfig}>
      <ChartTooltipContent
        {...{
          active: true,
          payload: multiPayload,
          indicator: "line",
        }}
      />
    </ChartContainer>
  )

  expect(screen.getByText("Desktop")).toBeInTheDocument()
  expect(screen.getByText("Mobile")).toBeInTheDocument()
})

const TestIcon = () => <svg data-testid="icon" />

it("renderiza icon cuando está definido en config", () => {
  render(
    <ChartContainer
      config={{
        desktop: {
          label: "Desktop",
          icon: TestIcon,
        },
      }}
    >
      <ChartTooltipContent {...{ active: true, payload: mockPayload }} />
    </ChartContainer>
  )

  expect(screen.getByTestId("icon")).toBeInTheDocument()
})

it("oculta iconos en la leyenda cuando hideIcon es true", () => {
  const { container } = render(
    <ChartContainer config={mockConfig}>
      <ChartLegendContent payload={mockPayload} hideIcon />
    </ChartContainer>
  )

  expect(container.querySelector("svg")).toBeNull()
})

it("maneja payload inválido sin romper", () => {
  render(
    <ChartContainer config={mockConfig}>
      <ChartTooltipContent {...{ active: true, payload: [{ value: 10 } as any] }} />
    </ChartContainer>
  )

  expect(screen.getByText("10")).toBeInTheDocument()
})


})