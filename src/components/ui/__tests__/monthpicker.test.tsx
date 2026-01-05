import { render, screen, fireEvent } from "@testing-library/react"
import { MonthPicker } from "../monthpicker"

describe("MonthPicker", () => {
    it("renders correctly", () => {
        render(<MonthPicker />)
        // Checks for month names
        expect(screen.getByText("Jan")).toBeInTheDocument()
        expect(screen.getByText("Dec")).toBeInTheDocument()
    })

    it("selects a month", () => {
        const onMonthSelect = jest.fn()
        const selectedMonth = new Date(2023, 0, 1) // Jan 2023
        render(<MonthPicker selectedMonth={selectedMonth} onMonthSelect={onMonthSelect} />)

        // Click on Feb
        fireEvent.click(screen.getByText("Feb"))

        // Should call callback with new date (Feb 2023)
        expect(onMonthSelect).toHaveBeenCalled()
        const calledDate = onMonthSelect.mock.calls[0][0]
        expect(calledDate.getMonth()).toBe(1) // 1 is Feb
        expect(calledDate.getFullYear()).toBe(2023)
    })

    it("changes year", () => {
        render(<MonthPicker />)
        // Check current year is displayed
        const currentYear = new Date().getFullYear()
        expect(screen.getByText(currentYear.toString())).toBeInTheDocument()
    })
})
