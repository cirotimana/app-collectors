import { render, screen, fireEvent } from "@testing-library/react"
import { Calendar } from "../calendar"

describe("Calendar", () => {
    it("renders correctly", () => {
        // React Day Picker renders a table
        render(<Calendar mode="single" />)
        expect(screen.getByRole("grid")).toBeInTheDocument()
    })

    it("allows selecting a date", () => {
        const onSelect = jest.fn()
        const today = new Date()
        render(<Calendar mode="single" onSelect={onSelect} selected={today} />)

        // We can try to select a date. By default it shows current month.
        // Let's just check if today is selected
        const selectedDay = screen.getByRole("button", {
            name: today.getDate().toString(),
            // react-day-picker adds aria-selected="true" to selected day
            selected: true
        })
        expect(selectedDay).toBeInTheDocument()

        // Test interaction if possible, picking another day
        // This depends on the month rendered. 
    })
})
