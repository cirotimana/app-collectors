import { render, screen } from "@testing-library/react"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../table"

describe("Table", () => {
    it("renders correctly", () => {
        render(
            <Table>
                <TableCaption>A list of invoices.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>INV001</TableCell>
                        <TableCell>Paid</TableCell>
                        <TableCell>$250.00</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        )

        expect(screen.getByRole("table")).toBeInTheDocument()
        expect(screen.getByText("A list of invoices.")).toBeInTheDocument()
        expect(screen.getByText("INV001")).toBeInTheDocument()
        expect(screen.getByText("Paid")).toBeInTheDocument()
    })
})
