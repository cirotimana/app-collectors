import { render, screen, fireEvent } from "@testing-library/react"
import { Checkbox } from "../checkbox"

describe("Checkbox", () => {
    it("renders correctly", () => {
        render(<Checkbox />)
        expect(screen.getByRole("checkbox")).toBeInTheDocument()
    })

    it("toggles state when clicked", () => {
        // Checkbox from radix-ui handles state internally or via controlled props
        const onCheckedChange = jest.fn()
        render(<Checkbox onCheckedChange={onCheckedChange} />)

        const checkbox = screen.getByRole("checkbox")
        fireEvent.click(checkbox)
        expect(onCheckedChange).toHaveBeenCalledWith(true)

        fireEvent.click(checkbox)
        expect(onCheckedChange).toHaveBeenCalledWith(false)
    })

    it("can be disabled", () => {
        render(<Checkbox disabled />)
        expect(screen.getByRole("checkbox")).toBeDisabled()
    })

    it("renders with custom className", () => {
        render(<Checkbox className="custom-class" />)
        expect(screen.getByRole("checkbox")).toHaveClass("custom-class")
    })
})
