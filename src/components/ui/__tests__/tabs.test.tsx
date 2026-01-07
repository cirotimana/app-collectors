import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../tabs"

describe("Tabs", () => {
    it("renders and switches tabs", async () => {
        const user = userEvent.setup()
        render(
            <Tabs defaultValue="account">
                <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                </TabsList>
                <TabsContent value="account">Account content</TabsContent>
                <TabsContent value="password">Password content</TabsContent>
            </Tabs>
        )

        expect(screen.getByText("Account content")).toBeVisible()
        expect(screen.queryByText("Password content")).not.toBeInTheDocument()

        const passwordTab = screen.getByText("Password")
        await user.click(passwordTab)

        // Check if tab content is now active. Radix toggles hidden attribute or data-state
        await waitFor(() => {
            const passwordContent = screen.queryByText("Password content")
            // In JSDOM, hidden might not trigger .toBeVisible() correctly if styles are not fully loaded or computed
            // But we can check if the element exists and 'hidden' attribute is removed
            // Or check if the content wrapper has data-state="active"
            // Based on snapshot: id="radix-_r_0_-content-password"
            // It seems checking text presence might fail if it's hidden with display:none?
            // But queryByText finds hidden elements unless configured otherwise.
            // getByText fails if not found.

            // Let's try finding by role which respects hidden default
            // expect(screen.getByRole("tabpanel", { name: "Password" })).toBeVisible()

            // Or just check if the text is in the document now (if it was unmounted/hidden before)
            // If Radix unmounts, getByText works when it appears.
            // If Radix uses hidden="", getByText works but toBeVisible checks style.

            // Re-query
            const passwordContentVisible = screen.getByText("Password content")
            expect(passwordContentVisible).toBeVisible()
        })
    })
})
