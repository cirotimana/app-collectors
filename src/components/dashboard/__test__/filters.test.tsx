import { render, screen, fireEvent } from "@testing-library/react"
import { Filters } from "../filters"
import userEvent from "@testing-library/user-event"

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
})
