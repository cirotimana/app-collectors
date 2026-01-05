import { render } from "@testing-library/react"
import { Skeleton } from "../skeleton"

describe("Skeleton", () => {
    it("renders correctly", () => {
        const { container } = render(<Skeleton className="w-10 h-10" />)
        const skeleton = container.firstChild
        expect(skeleton).toHaveClass("bg-accent animate-pulse rounded-md w-10 h-10")
    })
})
