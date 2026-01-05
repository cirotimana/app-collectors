import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../tooltip"

describe("Tooltip", () => {
    it("shows tooltip on hover", async () => {
        render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip Content</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )

        fireEvent.mouseEnter(screen.getByText("Hover me"))

        await waitFor(() => {
            expect(screen.getByText("Tooltip Content")).toBeInTheDocument()
        })
    })
})
