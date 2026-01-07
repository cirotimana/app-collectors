import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../select"

describe("Select", () => {
    it("renders correctly and opens options", async () => {
        render(
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Select a fruit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="apple">Apple</SelectItem>
                    <SelectItem value="banana">Banana</SelectItem>
                </SelectContent>
            </Select>
        )

        expect(screen.getByText("Select a fruit")).toBeInTheDocument()

        // Trigger open
        fireEvent.click(screen.getByRole("combobox"))

        // Radix portals content, should be in document
        await waitFor(() => {
            expect(screen.getByText("Apple")).toBeInTheDocument()
            expect(screen.getByText("Banana")).toBeInTheDocument()
        })
    })

    it("selects an option", () => {
        const onValueChange = jest.fn()
        render(
            <Select onValueChange={onValueChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="apple">Apple</SelectItem>
                </SelectContent>
            </Select>
        )

        fireEvent.click(screen.getByRole("combobox"))
        fireEvent.click(screen.getByText("Apple"))

        expect(onValueChange).toHaveBeenCalledWith("apple")
    })
})
