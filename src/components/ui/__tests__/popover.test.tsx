import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../popover"

describe("Popover", () => {
    it("opens on trigger click", async () => {
        render(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>Popover Content</PopoverContent>
            </Popover>
        )

        fireEvent.click(screen.getByText("Open"))

        await waitFor(() => {
            expect(screen.getByText("Popover Content")).toBeInTheDocument()
        })
    })
})
