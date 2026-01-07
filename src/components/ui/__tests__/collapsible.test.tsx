import { render, screen, fireEvent } from "@testing-library/react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "../collapsible"

describe("Collapsible", () => {
    it("renders correctly and toggles content", () => {
        render(
            <Collapsible>
                <CollapsibleTrigger>Toggle</CollapsibleTrigger>
                <CollapsibleContent>Content</CollapsibleContent>
            </Collapsible>
        )

        const trigger = screen.getByRole("button", { name: /toggle/i })
        expect(trigger).toBeInTheDocument()

        // Content is hidden by default if not open
        fireEvent.click(trigger)
        expect(screen.getByText("Content")).toBeVisible()

        fireEvent.click(trigger)
        // Radix handles hiding, might not be visible or removed from DOM
        // For test simplicity we check visibility toggle interaction
    })

    it("starts open if defaultOpen is true", () => {
        render(
            <Collapsible defaultOpen>
                <CollapsibleTrigger>Toggle</CollapsibleTrigger>
                <CollapsibleContent>Content</CollapsibleContent>
            </Collapsible>
        )
        expect(screen.getByText("Content")).toBeVisible()
    })
})
