import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuGroup,
    DropdownMenuShortcut,
    DropdownMenuPortal,
} from "../dropdown-menu"
import React from "react"

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

describe("DropdownMenu", () => {
    it("renders and opens menu", async () => {
        const user = userEvent.setup()
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

        const trigger = screen.getByText("Open")
        await user.click(trigger)

        await waitFor(() => {
            expect(screen.getByText("My Account")).toBeInTheDocument()
            expect(screen.getByText("Profile")).toBeInTheDocument()
        })
    })

    it("renders with checkbox items", async () => {
        const TestComponent = () => {
            const [checked, setChecked] = React.useState(false)
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuCheckboxItem
                            checked={checked}
                            onCheckedChange={setChecked}
                        >
                            Show Status Bar
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }

        const user = userEvent.setup()
        render(<TestComponent />)
        await user.click(screen.getByText("Open"))

        const checkboxItem = await screen.findByRole("menuitemcheckbox")
        expect(checkboxItem).toBeInTheDocument()
        expect(checkboxItem).toHaveAttribute("aria-checked", "false")

        await user.click(checkboxItem)
        await waitFor(() => expect(checkboxItem).toHaveAttribute("aria-checked", "true"))
    })

    it("renders with radio group and items", async () => {
        const TestComponent = () => {
            const [position, setPosition] = React.useState("bottom")
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                            <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }

        const user = userEvent.setup()
        render(<TestComponent />)
        await user.click(screen.getByText("Open"))

        const topItem = await screen.findByRole("menuitemradio", { name: "Top" })
        const bottomItem = screen.getByRole("menuitemradio", { name: "Bottom" })

        expect(bottomItem).toHaveAttribute("aria-checked", "true")
        expect(topItem).toHaveAttribute("aria-checked", "false")

        await user.click(topItem)
        await waitFor(() => expect(topItem).toHaveAttribute("aria-checked", "true"))
    })

    it("renders submenus correctly", async () => {
        const user = userEvent.setup()
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Item 1</DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        )

        await user.click(screen.getByText("Open"))
        const subTrigger = await screen.findByText("More Options")

        // Hover/focus on subtrigger to open
        await user.hover(subTrigger)

        // Check if subcontent appears
        const subItem = await screen.findByText("Sub Item 1")
        expect(subItem).toBeInTheDocument()
    })

    it("renders with inset props and variant", async () => {
        const user = userEvent.setup()
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel inset>Title</DropdownMenuLabel>
                    <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive">Destructive Item</DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger inset>Inset Sub</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem>Sub</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        )

        await user.click(screen.getByText("Open"))

        const insetItem = await screen.findByText("Inset Item")
        // Check if data attributes or classes are applied (Radix applies data-inset)
        // We can check the class name or attribute if we want to be strict, or just reliance that it rendered.
        // The coverage report will confirm if the code path for `inset` was hit.
        expect(insetItem.closest('[role="menuitem"]')).toHaveAttribute("data-inset")

        const destructiveItem = screen.getByText("Destructive Item")
        expect(destructiveItem.closest('[role="menuitem"]')).toHaveAttribute("data-variant", "destructive")

        const insetLabel = screen.getByText("Title")
        // Label doesn't have a role but we can check the element
        expect(insetLabel).toHaveAttribute("data-inset")

        const insetSub = screen.getByText("Inset Sub")
        expect(insetSub.closest('[role="menuitem"]')).toHaveAttribute("data-inset")
    })

    it("renders shortcuts and groups", async () => {
        const user = userEvent.setup()
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            Settings
                            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        )

        await user.click(screen.getByText("Open"))
        await screen.findByText("Settings")
        expect(screen.getByText("⌘S")).toHaveClass("ml-auto")
    })

    it("renders DropdownMenuPortal", async () => {
        // DropdownMenuPortal is a wrapper. We just need to make sure it doesn't crash.
        // Effectively tested by DropdownMenuContent which uses it, 
        // but we can use it explicitly if we want to test the export/component isolation.
        const user = userEvent.setup()
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuContent>
                        <DropdownMenuItem>Item</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenuPortal>
            </DropdownMenu>
        )
        await user.click(screen.getByText("Open"))
        const menu = await screen.findByRole("menu")
        expect(menu).toBeInTheDocument()
    })
})
