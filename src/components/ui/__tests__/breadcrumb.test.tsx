import { render, screen } from "@testing-library/react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../breadcrumb"

describe("Breadcrumb", () => {
    it("renders correctly", () => {
        render(
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/components">Components</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        )

        expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument()
        expect(screen.getByRole("list")).toBeInTheDocument()
        expect(screen.getByText("Home")).toBeInTheDocument()
        expect(screen.getByText("Components")).toBeInTheDocument()
        expect(screen.getByText("Breadcrumb")).toBeInTheDocument()
    })
})
