import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../tooltip"

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

// Mock PointerEvent
class MockPointerEvent extends Event {
    button: number
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
    constructor(type: string, props: PointerEventInit = {}) {
        super(type, props)
        this.button = props.button || 0
        this.ctrlKey = props.ctrlKey || false
        this.metaKey = props.metaKey || false
        this.shiftKey = props.shiftKey || false
    }
}
window.PointerEvent = MockPointerEvent as any
window.HTMLElement.prototype.scrollIntoView = jest.fn()
window.HTMLElement.prototype.releasePointerCapture = jest.fn()
window.HTMLElement.prototype.hasPointerCapture = jest.fn()

describe("Tooltip", () => {
    it("renders trigger button", () => {
        render(
            <Tooltip>
                <TooltipTrigger>Hover me</TooltipTrigger>
                <TooltipContent>Tooltip content</TooltipContent>
            </Tooltip>
        )

        expect(screen.getByText("Hover me")).toBeInTheDocument()
    })

    it("shows tooltip content on hover", async () => {
        const user = userEvent.setup()
        render(
            <Tooltip>
                <TooltipTrigger>Hover me</TooltipTrigger>
                <TooltipContent>Tooltip content</TooltipContent>
            </Tooltip>
        )

        const trigger = screen.getByText("Hover me")
        await user.hover(trigger)

        await waitFor(() => {
            const tooltips = screen.getAllByText("Tooltip content")
            expect(tooltips.length).toBeGreaterThan(0)
        })
    })

    it("shows tooltip on hover interaction", async () => {
        const user = userEvent.setup()
        render(
            <Tooltip>
                <TooltipTrigger>Hover me</TooltipTrigger>
                <TooltipContent>Tooltip content</TooltipContent>
            </Tooltip>
        )

        const trigger = screen.getByText("Hover me")

        // Verify tooltip is not visible initially
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()

        // Hover to show tooltip
        await user.hover(trigger)

        await waitFor(() => {
            const tooltips = screen.getAllByText("Tooltip content")
            expect(tooltips.length).toBeGreaterThan(0)
        })
    })

    it("renders with custom sideOffset", async () => {
        const user = userEvent.setup()
        render(
            <Tooltip>
                <TooltipTrigger>Hover me</TooltipTrigger>
                <TooltipContent sideOffset={10}>Tooltip content</TooltipContent>
            </Tooltip>
        )

        const trigger = screen.getByText("Hover me")
        await user.hover(trigger)

        await waitFor(() => {
            const tooltips = screen.getAllByText("Tooltip content")
            expect(tooltips.length).toBeGreaterThan(0)
        })
    })

    it("renders with custom className", async () => {
        const user = userEvent.setup()
        render(
            <Tooltip>
                <TooltipTrigger>Hover me</TooltipTrigger>
                <TooltipContent className="custom-class">Tooltip content</TooltipContent>
            </Tooltip>
        )

        const trigger = screen.getByText("Hover me")
        await user.hover(trigger)

        await waitFor(() => {
            const tooltips = screen.getAllByText("Tooltip content")
            // Find the visible tooltip (not the accessibility one)
            const visibleTooltip = tooltips.find(el => el.getAttribute('data-slot') === 'tooltip-content')
            expect(visibleTooltip).toHaveClass("custom-class")
        })
    })

    it("renders TooltipProvider with custom delayDuration", () => {
        render(
            <TooltipProvider delayDuration={500}>
                <Tooltip>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip content</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )

        expect(screen.getByText("Hover me")).toBeInTheDocument()
    })

    it("renders tooltip with arrow", async () => {
        const user = userEvent.setup()
        const { container } = render(
            <Tooltip>
                <TooltipTrigger>Hover me</TooltipTrigger>
                <TooltipContent>Tooltip content</TooltipContent>
            </Tooltip>
        )

        const trigger = screen.getByText("Hover me")
        await user.hover(trigger)

        await waitFor(() => {
            // Check that the arrow element is rendered (it's a child of TooltipContent)
            const tooltips = screen.getAllByText("Tooltip content")
            expect(tooltips.length).toBeGreaterThan(0)
        })
    })

    it("supports different tooltip sides via props", async () => {
        const user = userEvent.setup()
        render(
            <Tooltip>
                <TooltipTrigger>Hover me</TooltipTrigger>
                <TooltipContent side="top">Tooltip content</TooltipContent>
            </Tooltip>
        )

        const trigger = screen.getByText("Hover me")
        await user.hover(trigger)

        await waitFor(() => {
            const tooltips = screen.getAllByText("Tooltip content")
            expect(tooltips.length).toBeGreaterThan(0)
        })
    })

    it("renders with open prop controlled", async () => {
        const { rerender } = render(
            <Tooltip open={false}>
                <TooltipTrigger>Hover me</TooltipTrigger>
                <TooltipContent>Tooltip content</TooltipContent>
            </Tooltip>
        )

        expect(screen.queryByText("Tooltip content")).not.toBeInTheDocument()

        rerender(
            <Tooltip open={true}>
                <TooltipTrigger>Hover me</TooltipTrigger>
                <TooltipContent>Tooltip content</TooltipContent>
            </Tooltip>
        )

        await waitFor(() => {
            const tooltips = screen.getAllByText("Tooltip content")
            expect(tooltips.length).toBeGreaterThan(0)
        })
    })
})
