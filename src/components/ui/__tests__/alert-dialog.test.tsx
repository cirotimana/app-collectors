import { render, screen, fireEvent } from "@testing-library/react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../alert-dialog"

describe("AlertDialog", () => {
    it("renders correctly and opens on trigger click", () => {
        render(
            <AlertDialog>
                <AlertDialogTrigger>Open</AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )

        fireEvent.click(screen.getByText("Open"))

        expect(screen.getByText("Are you sure?")).toBeInTheDocument()
        expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument()
        expect(screen.getByText("Cancel")).toBeInTheDocument()
        expect(screen.getByText("Continue")).toBeInTheDocument()
    })
})
