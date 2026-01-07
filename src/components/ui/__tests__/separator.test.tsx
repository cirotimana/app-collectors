import { render } from "@testing-library/react"
import { Separator } from "../separator"

describe("Separator", () => {
    it("renders correctly with default props", () => {
        const { container } = render(<Separator />)
        const separator = container.firstChild
        expect(separator).toHaveClass("bg-border shrink-0")
        expect(separator).toHaveAttribute("data-orientation", "horizontal")
    })

    it("renders vertical orientation", () => {
        const { container } = render(<Separator orientation="vertical" />)
        const separator = container.firstChild
        expect(separator).toHaveAttribute("data-orientation", "vertical")
        // Check for specific utility classes if needed, or just attribute
    })

    it("applies custom className", () => {
        const { container } = render(<Separator className="custom-class" />)
        expect(container.firstChild).toHaveClass("custom-class")
    })
})
