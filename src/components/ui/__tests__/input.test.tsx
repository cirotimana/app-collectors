import { render, screen, fireEvent } from "@testing-library/react"
import { Input } from "../input"

describe("Input", () => {
    it("renders correctly", () => {
        render(<Input placeholder="Enter text" />)
        const input = screen.getByPlaceholderText("Enter text")
        expect(input).toBeInTheDocument()
        expect(input).toHaveClass("rounded-md", "border")
    })

    it("accepts value and onChange", () => {
        const handleChange = jest.fn()
        render(<Input value="test" onChange={handleChange} />)
        const input = screen.getByDisplayValue("test")
        expect(input).toBeInTheDocument()

        fireEvent.change(input, { target: { value: "new value" } })
        expect(handleChange).toHaveBeenCalled()
    })

    it("supports different types", () => {
        render(<Input type="password" placeholder="Password" />)
        expect(screen.getByPlaceholderText("Password")).toHaveAttribute("type", "password")
    })

    it("can be disabled", () => {
        render(<Input disabled placeholder="Disabled" />)
        expect(screen.getByPlaceholderText("Disabled")).toBeDisabled()
    })

    it("applies custom className", () => {
        render(<Input className="custom-class" placeholder="Custom" />)
        expect(screen.getByPlaceholderText("Custom")).toHaveClass("custom-class")
    })
})
