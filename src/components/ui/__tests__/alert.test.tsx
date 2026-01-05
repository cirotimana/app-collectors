import { render, screen } from "@testing-library/react"
import { Alert, AlertTitle, AlertDescription } from "../alert"

describe("Alert", () => {
    it("renders correctly", () => {
        render(
            <Alert>
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>You can add components to your app using the cli.</AlertDescription>
            </Alert>
        )

        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(screen.getByText("Heads up!")).toBeInTheDocument()
        expect(screen.getByText(/you can add components/i)).toBeInTheDocument()
    })

    it("renders destructive variant", () => {
        render(
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Something went wrong.</AlertDescription>
            </Alert>
        )

        expect(screen.getByRole("alert")).toHaveClass("text-destructive")
    })
})
