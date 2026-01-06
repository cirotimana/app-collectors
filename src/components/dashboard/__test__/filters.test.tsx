import { render, screen, fireEvent } from "@testing-library/react"
import { Filters } from "../filters"
import userEvent from "@testing-library/user-event"

jest.mock("@/components/ui/period-picker", () => ({
  PeriodPicker: ({ onChange }: any) => (
    <input 
      data-testid="period-picker-input" 
      onChange={(e) => onChange(e.target.value)} 
    />
  ),
}))

describe("Filters", () => {
  const defaultFilters = {
    proceso: "",
    metodo: "",
    fromDate: "",
    toDate: "",
  }

  it("renderiza los filtros principales", () => {
    render(
      <Filters
        filters={defaultFilters}
        onFiltersChange={jest.fn()}
      />
    )

    expect(screen.getByText("PROCESO")).toBeInTheDocument()
    expect(screen.getByText("MÉTODO")).toBeInTheDocument()
    expect(screen.getByText("PERÍODO")).toBeInTheDocument()
  })

  it("llama onFiltersChange al cambiar proceso", () => {
    const onChange = jest.fn()

    render(
      <Filters
        filters={defaultFilters}
        onFiltersChange={onChange}
      />
    )

    fireEvent.click(screen.getByText("Seleccionar proceso..."))
    fireEvent.click(screen.getByText("Liquidación"))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        proceso: "liquidacion",
      })
    )
  })

  it("permite seleccionar un método", async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()

    render(
      <Filters
        filters={defaultFilters}
        onFiltersChange={onChange}
      />
    )

    // abrir popover
    await user.click(screen.getByText("Seleccionar método..."))

    // esperar a que aparezca el item
    const yapeOption = await screen.findByText("Yape")

    // seleccionar
    await user.click(yapeOption)

    expect(onChange).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        metodo: "yape",
      })
    )
  })

  it("maneja el cambio de período correctamente (limpieza y parsing)", async () => {
    const onChange = jest.fn()
    render(<Filters filters={defaultFilters} onFiltersChange={onChange} />)

    // Buscamos el PeriodPicker. Como es un componente custom, 
    // asumimos que expone un input o el componente llama a onChange.
    // Simulamos la llamada que haría el PeriodPicker internamente:
    
    const periodPicker = screen.getByTestId("period-picker-input") // Ajusta según tu componente

    // Caso 1: Rango de fechas (Línea 68)
    fireEvent.change(periodPicker, { target: { value: "2023/01/01-2023/01/31" } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      fromDate: "2023/01/01",
      toDate: "2023/01/31"
    }))

    // Caso 2: Limpieza (Líneas 63-66)
    fireEvent.change(periodPicker, { target: { value: "" } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      fromDate: "",
      toDate: ""
    }))
  });

  it("maneja el cambio de período correctamente (limpieza y parsing)", async () => {
    const onChange = jest.fn()
    render(<Filters filters={defaultFilters} onFiltersChange={onChange} />)

    // Buscamos el PeriodPicker. Como es un componente custom, 
    // asumimos que expone un input o el componente llama a onChange.
    // Simulamos la llamada que haría el PeriodPicker internamente:
    
    const periodPicker = screen.getByTestId("period-picker-input") // Ajusta según tu componente

    // Caso 1: Rango de fechas (Línea 68)
    fireEvent.change(periodPicker, { target: { value: "2023/01/01-2023/01/31" } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      fromDate: "2023/01/01",
      toDate: "2023/01/31"
    }))

    // Caso 2: Limpieza (Líneas 63-66)
    fireEvent.change(periodPicker, { target: { value: "" } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      fromDate: "",
      toDate: ""
    }))
  });

  it("inicializa múltiples métodos desde los props", () => {
    const multipleFilters = { ...defaultFilters, metodo: "yape,kashio" }
    render(<Filters filters={multipleFilters} onFiltersChange={jest.fn()} />)

    expect(screen.getByText("2 seleccionados")).toBeInTheDocument()
  })
})
