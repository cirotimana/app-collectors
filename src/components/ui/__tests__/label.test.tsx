import { render, screen } from "@testing-library/react"
import { Label } from "../label"

describe("Label", () => {
    it("renders correctly", () => {
        render(<Label htmlFor="input">Label Text</Label>)
        const label = screen.getByText("Label Text")
        expect(label).toBeInTheDocument()
        expect(label).toHaveAttribute("for", "input")
        expect(label).toHaveClass("text-sm font-medium leading-none")
    })

    it("applies custom className", () => {
        render(<Label className="custom-class">Custom Label</Label>)
        expect(screen.getByText("Custom Label")).toHaveClass("custom-class")
    })
})
