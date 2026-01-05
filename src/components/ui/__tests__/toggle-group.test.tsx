import { render, screen, fireEvent } from "@testing-library/react"
import { ToggleGroup, ToggleGroupItem } from "../toggle-group"

describe("ToggleGroup", () => {
    it("renders correctly", () => {
        render(
            <ToggleGroup type="single">
                <ToggleGroupItem value="a">A</ToggleGroupItem>
                <ToggleGroupItem value="b">B</ToggleGroupItem>
                <ToggleGroupItem value="c">C</ToggleGroupItem>
            </ToggleGroup>
        )

        expect(screen.getByText("A")).toBeInTheDocument()
        expect(screen.getByText("B")).toBeInTheDocument()
        expect(screen.getByText("C")).toBeInTheDocument()
    })

    it("handles single selection", () => {
        const onValueChange = jest.fn()
        render(
            <ToggleGroup type="single" onValueChange={onValueChange}>
                <ToggleGroupItem value="a">A</ToggleGroupItem>
                <ToggleGroupItem value="b">B</ToggleGroupItem>
            </ToggleGroup>
        )

        fireEvent.click(screen.getByText("A"))
        expect(onValueChange).toHaveBeenCalledWith("a")
    })

    it("handles multiple selection", () => {
        const onValueChange = jest.fn()
        render(
            <ToggleGroup type="multiple" onValueChange={onValueChange}>
                <ToggleGroupItem value="a">A</ToggleGroupItem>
                <ToggleGroupItem value="b">B</ToggleGroupItem>
            </ToggleGroup>
        )

        fireEvent.click(screen.getByText("A"))
        expect(onValueChange).toHaveBeenCalledWith(["a"])
    })
})
