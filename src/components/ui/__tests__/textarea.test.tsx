import { render, screen, fireEvent } from "@testing-library/react"
import { Textarea } from "../textarea"

describe("Textarea", () => {
    it("renders correctly", () => {
        render(<Textarea placeholder="Enter text" />)
        const textarea = screen.getByPlaceholderText("Enter text")
        expect(textarea).toBeInTheDocument()
        expect(textarea).toHaveClass("min-h-16 w-full rounded-md border")
    })

    it("accepts value and onChange", () => {
        const handleChange = jest.fn()
        render(<Textarea value="test" onChange={handleChange} />)
        const textarea = screen.getByDisplayValue("test")
        expect(textarea).toBeInTheDocument()

        fireEvent.change(textarea, { target: { value: "new value" } })
        expect(handleChange).toHaveBeenCalled()
    })

    it("can be disabled", () => {
        render(<Textarea disabled placeholder="Disabled" />)
        expect(screen.getByPlaceholderText("Disabled")).toBeDisabled()
    })

    it("applies custom className", () => {
        render(<Textarea className="custom-class" placeholder="Custom" />)
        expect(screen.getByPlaceholderText("Custom")).toHaveClass("custom-class")
    })
})
