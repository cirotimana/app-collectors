import { render, screen, fireEvent } from "@testing-library/react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../dialog"

describe("Dialog", () => {
    it("opens on trigger click", () => {
        render(
            <Dialog>
                <DialogTrigger>Open</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dialog Title</DialogTitle>
                        <DialogDescription>Dialog Description</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button>Close Dialog</button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )

        fireEvent.click(screen.getByText("Open"))
        expect(screen.getByText("Dialog Title")).toBeInTheDocument()
        expect(screen.getByText("Dialog Description")).toBeInTheDocument()
        expect(screen.getByText("Close Dialog")).toBeInTheDocument()
    })
})
