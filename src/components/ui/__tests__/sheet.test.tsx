import { render, screen, fireEvent } from "@testing-library/react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "../sheet"

describe("Sheet", () => {
    it("opens on trigger click", () => {
        render(
            <Sheet>
                <SheetTrigger>Open</SheetTrigger>
                <SheetContent>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Sheet Title</SheetTitle>
                            <SheetDescription>Sheet Description</SheetDescription>
                        </SheetHeader>
                        <button>Close Sheet</button>
                    </SheetContent>
                </SheetContent>
            </Sheet>
        )

        fireEvent.click(screen.getByText("Open"))
        expect(screen.getByText("Sheet Title")).toBeInTheDocument()
        expect(screen.getByText("Sheet Description")).toBeInTheDocument()
        expect(screen.getByText("Close Sheet")).toBeInTheDocument()
    })
})
