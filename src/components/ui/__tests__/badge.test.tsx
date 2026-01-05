import { render, screen } from "@testing-library/react"
import { Badge } from "../badge"

describe("Badge", () => {
    it("renders correctly with default props", () => {
        render(<Badge>Badge</Badge>)
        const badge = screen.getByText("Badge")
        expect(badge).toBeInTheDocument()
        expect(badge).toHaveClass("bg-primary text-primary-foreground")
    })

    it("renders with different variants", () => {
        const { rerender } = render(<Badge variant="secondary">Secondary</Badge>)
        expect(screen.getByText("Secondary")).toHaveClass("bg-secondary")

        rerender(<Badge variant="destructive">Destructive</Badge>)
        expect(screen.getByText("Destructive")).toHaveClass("bg-destructive")

        rerender(<Badge variant="outline">Outline</Badge>)
        expect(screen.getByText("Outline")).toHaveClass("text-foreground") // based on your code
    })

    it("accepts custom className", () => {
        render(<Badge className="custom-class">Custom</Badge>)
        expect(screen.getByText("Custom")).toHaveClass("custom-class")
    })
})
