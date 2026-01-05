import { render, screen } from "@testing-library/react"
import {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
} from "../card"

describe("Card", () => {
    it("renders correctly with all subcomponents", () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Card Content</p>
                </CardContent>
                <CardFooter>
                    <button>Action</button>
                </CardFooter>
            </Card>
        )

        expect(screen.getByText("Card Title")).toBeInTheDocument()
        expect(screen.getByText("Card Description")).toBeInTheDocument()
        expect(screen.getByText("Card Content")).toBeInTheDocument()
        expect(screen.getByText("Action")).toBeInTheDocument()
    })

    it("applies custom className", () => {
        render(<Card className="custom-class">Content</Card>)
        expect(screen.getByText("Content").closest("div")).toHaveClass("custom-class")
    })
})
