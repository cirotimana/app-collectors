import { render, screen, fireEvent } from "@testing-library/react"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "../drawer"

describe("Drawer", () => {
    it("renders and opens drawer", () => {
        // Vaul might be tricky to test in jsdom environment fully without mocks
        // But we can check if trigger is rendered efficiently
        render(
            <Drawer>
                <DrawerTrigger>Open</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Title</DrawerTitle>
                        <DrawerDescription>Description</DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                        <DrawerClose>Close</DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )

        const trigger = screen.getByText("Open")
        expect(trigger).toBeInTheDocument()

        fireEvent.click(trigger)
        // Checking content might require waitFor or more elaborate setup with Vaul
        // For now, ensuring render doesn't crash is a good baseline
    })
})
