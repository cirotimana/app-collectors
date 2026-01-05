import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../dropdown-menu"

describe("DropdownMenu", () => {
    it("renders and opens menu", () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Billing</DropdownMenuItem>
                    <DropdownMenuItem>Team</DropdownMenuItem>
                    <DropdownMenuItem>Subscription</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )

        fireEvent.click(screen.getByText("Open"))

        waitFor(() => {
            expect(screen.getByText("My Account")).toBeInTheDocument()
            expect(screen.getByText("Profile")).toBeInTheDocument()
        })
    })
})
