import { render, screen, fireEvent } from "@testing-library/react"
import { PeriodPicker } from "../period-picker"

describe("PeriodPicker", () => {
    it("renders correctly", () => {
        const onChange = jest.fn()
        render(<PeriodPicker value="" onChange={onChange} />)
        expect(screen.getByRole("button", { name: /seleccionar fecha o rango/i })).toBeInTheDocument()
    })

    it("displays provided value formatted", () => {
        const onChange = jest.fn()
        render(<PeriodPicker value="20230101" onChange={onChange} />)
        expect(screen.getByRole("button", { name: /2023-01-01/i })).toBeInTheDocument()
    })

    it("displays range value formatted", () => {
        const onChange = jest.fn()
        render(<PeriodPicker value="20230101-20230131" onChange={onChange} />)
        expect(screen.getByRole("button", { name: /2023-01-01 → 2023-01-31/i })).toBeInTheDocument()
    })
})
