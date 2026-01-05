import { render, screen, fireEvent } from "@testing-library/react"
import { Toggle } from "../toggle"

describe("Toggle", () => {
    it("renders correctly", () => {
        render(<Toggle aria-label="Toggle italic">Italic</Toggle>)
        expect(screen.getByLabelText("Toggle italic")).toBeInTheDocument()
        expect(screen.getByText("Italic")).toBeInTheDocument()
    })

    it("toggles state", () => {
        const onPressedChange = jest.fn()
        render(<Toggle aria-label="Toggle" onPressedChange={onPressedChange}>Toggle</Toggle>)

        const toggle = screen.getByRole("button", { name: /toggle/i })
        fireEvent.click(toggle)
        expect(onPressedChange).toHaveBeenCalledWith(true)

        fireEvent.click(toggle)
        expect(onPressedChange).toHaveBeenCalledWith(false)
    })

    it("renders with variants", () => {
        render(<Toggle variant="outline">Outline</Toggle>)
        expect(screen.getByRole("button")).toHaveClass("border")
    })

    it("renders with sizes", () => {
        render(<Toggle size="lg">Large</Toggle>)
        expect(screen.getByRole("button")).toHaveClass("h-10")
    })
})
