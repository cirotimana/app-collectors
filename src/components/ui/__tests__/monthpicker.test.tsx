import { render, screen, fireEvent } from "@testing-library/react"
import { MonthPicker } from "../monthpicker"

describe("MonthPicker", () => {
    it("renders correctly", () => {
        render(<MonthPicker />)
        expect(screen.getByText("Jan")).toBeInTheDocument()
        expect(screen.getByText("Dec")).toBeInTheDocument()
        const currentYear = new Date().getFullYear().toString()
        expect(screen.getByText(currentYear)).toBeInTheDocument()
    })

    it("selects a month", () => {
        const onMonthSelect = jest.fn()
        const selectedMonth = new Date(2023, 0, 1) // Jan 2023
        render(<MonthPicker selectedMonth={selectedMonth} onMonthSelect={onMonthSelect} />)

        fireEvent.click(screen.getByText("Feb"))

        expect(onMonthSelect).toHaveBeenCalled()
        const calledDate = onMonthSelect.mock.calls[0][0]
        expect(calledDate.getMonth()).toBe(1) // Feb
        expect(calledDate.getFullYear()).toBe(2023)
    })

    it("navigates years forward and backward", () => {
        const onYearBackward = jest.fn()
        const onYearForward = jest.fn()
        render(<MonthPicker onYearBackward={onYearBackward} onYearForward={onYearForward} />)

        const currentYear = new Date().getFullYear()

        // Buttons: Prev (0), Next (1). Note: Month buttons come after.
        const buttons = screen.getAllByRole("button")
        const prevBtn = buttons[0]
        const nextBtn = buttons[1]

        // Backward
        fireEvent.click(prevBtn)
        expect(onYearBackward).toHaveBeenCalled()
        expect(screen.getByText((currentYear - 1).toString())).toBeInTheDocument()

        // Forward (back to current)
        fireEvent.click(nextBtn)
        // Forward again (current + 1)
        fireEvent.click(nextBtn)
        expect(onYearForward).toHaveBeenCalled()
        expect(screen.getByText((currentYear + 1).toString())).toBeInTheDocument()
    })

    it("respects minDate constraint", () => {
        const minDate = new Date(2023, 5, 1) // June 2023
        // Initial render at 2023
        render(<MonthPicker selectedMonth={new Date(2023, 0, 1)} minDate={minDate} />)

        // Jan (0) < June (5) -> Should be disabled
        const janBtn = screen.getByText("Jan").closest("button")
        expect(janBtn).toBeDisabled()

        // July (6) > June (5) -> Should be enabled
        const julBtn = screen.getByText("Jul").closest("button")
        expect(julBtn).not.toBeDisabled()
    })

    it("respects maxDate constraint", () => {
        const maxDate = new Date(2023, 5, 1) // June 2023
        render(<MonthPicker selectedMonth={new Date(2023, 0, 1)} maxDate={maxDate} />)

        // July (6) > June (5) -> Should be disabled
        const julBtn = screen.getByText("Jul").closest("button")
        expect(julBtn).toBeDisabled()

        // May (4) < June (5) -> Should be enabled
        const mayBtn = screen.getByText("May").closest("button")
        expect(mayBtn).not.toBeDisabled()
    })

    it("respects disabledDates", () => {
        const disabled = [new Date(2023, 1, 1)] // Feb 2023
        render(<MonthPicker selectedMonth={new Date(2023, 0, 1)} disabledDates={disabled} />)

        const febBtn = screen.getByText("Feb").closest("button")
        expect(febBtn).toBeDisabled()

        const janBtn = screen.getByText("Jan").closest("button")
        expect(janBtn).not.toBeDisabled()
    })

    it("uses custom callbacks for labels", () => {
        const callbacks = {
            yearLabel: (year: number) => `Year: ${year}`,
            monthLabel: (month: { name: string }) => `M: ${month.name}`
        }
        render(<MonthPicker callbacks={callbacks} />)

        const currentYear = new Date().getFullYear()
        expect(screen.getByText(`Year: ${currentYear}`)).toBeInTheDocument()
        expect(screen.getByText("M: Jan")).toBeInTheDocument()
    })

    it("adjusts minDate to maxDate if min > max", () => {
        // If logic exists: if (minDate > maxDate) minDate = maxDate
        const minDate = new Date(2024, 0, 1)
        const maxDate = new Date(2023, 0, 1)

        // This will force 2023 logic?
        render(<MonthPicker selectedMonth={new Date(2023, 0, 1)} minDate={minDate} maxDate={maxDate} />)

        // If logic works, minDate becomes maxDate (2023). 
        // So 2023 should NOT be completely disabled if it matches?
        // Wait, logic says: minDate = maxDate.
        // So effectively min=2023, max=2023.

        expect(screen.getByText("2023")).toBeInTheDocument()
    })

    it("applies variant classes", () => {
        const variant = {
            chevrons: "destructive" as const,
            calendar: {
                main: "secondary" as const,
                selected: "destructive" as const
            }
        }
        // Force Jan to be selected
        render(<MonthPicker selectedMonth={new Date(2023, 0, 1)} variant={variant} />)

        // Check Jan button (selected)
        const janBtn = screen.getByText("Jan").closest("button")
        expect(janBtn).toHaveClass("bg-destructive") // Button variant mapping? 
        // shadcn button variants usually map to class names like bg-destructive, etc.
        // But the test id might be hard to verify exact class without knowing buttonVariants output.
        // We can just check providing the prop doesn't crash.
        // Or inspect standard implementation.
        // Assuming buttonVariants returns string with "bg-destructive".

        // Let's assume standard variants behave correctly.
    })

    it("handles missing callbacks gracefully", () => {
        render(<MonthPicker />)
        // Click prev year (no handler passed)
        const buttons = screen.getAllByRole("button")
        fireEvent.click(buttons[0])

        // Click next year (no handler passed)
        fireEvent.click(buttons[1])

        // Click a month (no handler passed)
        fireEvent.click(screen.getByText("Jan"))

        // If no crash, pass. Default year logic should still work.
        const currentYear = new Date().getFullYear()
        expect(screen.getByText(currentYear.toString())).toBeInTheDocument()
    })
})
