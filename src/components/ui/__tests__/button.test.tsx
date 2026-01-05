import { render, screen, fireEvent } from "@testing-library/react"
import { Button } from "../button"

describe("Button", () => {
    it("renders correctly with default props", () => {
        render(<Button>Click me</Button>)
        const button = screen.getByRole("button", { name: /click me/i })
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass("bg-primary text-primary-foreground")
    })

    it("renders with different variants", () => {
        const { rerender } = render(<Button variant="destructive">Destructive</Button>)
        expect(screen.getByRole("button", { name: /destructive/i })).toHaveClass("bg-destructive")

        rerender(<Button variant="outline">Outline</Button>)
        expect(screen.getByRole("button", { name: /outline/i })).toHaveClass("border bg-background")

        rerender(<Button variant="secondary">Secondary</Button>)
        expect(screen.getByRole("button", { name: /secondary/i })).toHaveClass("bg-secondary")

        rerender(<Button variant="ghost">Ghost</Button>)
        expect(screen.getByRole("button", { name: /ghost/i })).toHaveClass("hover:bg-accent")

        rerender(<Button variant="link">Link</Button>)
        expect(screen.getByRole("button", { name: /link/i })).toHaveClass("text-primary underline-offset-4")
    })

    it("renders with different sizes", () => {
        const { rerender } = render(<Button size="sm">Small</Button>)
        expect(screen.getByRole("button", { name: /small/i })).toHaveClass("h-8")

        rerender(<Button size="lg">Large</Button>)
        expect(screen.getByRole("button", { name: /large/i })).toHaveClass("h-10")

        rerender(<Button size="icon">Icon</Button>)
        expect(screen.getByRole("button", { name: /icon/i })).toHaveClass("size-9")
    })

    it("handles click events", () => {
        const handleClick = jest.fn()
        render(<Button onClick={handleClick}>Click me</Button>)
        fireEvent.click(screen.getByRole("button", { name: /click me/i }))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it("renders as a child component when asChild is true", () => {
        render(
            <Button asChild>
                <a href="/link">Link Button</a>
            </Button>
        )
        const link = screen.getByRole("link", { name: /link button/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute("href", "/link")
        expect(link).toHaveClass("bg-primary")
    })

    it("can be disabled", () => {
        render(<Button disabled>Disabled</Button>)
        expect(screen.getByRole("button", { name: /disabled/i })).toBeDisabled()
    })
})
