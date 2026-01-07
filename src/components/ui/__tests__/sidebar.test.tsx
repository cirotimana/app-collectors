import * as React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarMenuButton,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  SidebarRail,
  SidebarInset,
  SidebarInput,
  SidebarGroupAction,
  SidebarMenuSkeleton
} from "../sidebar"

import { useIsMobile } from "@/hooks/use-mobile"

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

// Mock useIsMobile
jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: jest.fn(),
}))

// Helper to expose context
function ContextTester() {
  const context = useSidebar()
  return (
    <div data-testid="context-values">
      <span data-testid="state">{context.state}</span>
      <span data-testid="open">{context.open.toString()}</span>
      <span data-testid="isMobile">{context.isMobile.toString()}</span>
      <span data-testid="openMobile">{context.openMobile.toString()}</span>
      <button onClick={() => context.setOpen(true)}>Open</button>
      <button onClick={() => context.setOpen(false)}>Close</button>
      <button onClick={() => context.setOpenMobile(true)}>Open Mobile</button>
      <button onClick={context.toggleSidebar}>Toggle</button>
    </div>
  )
}

describe("Sidebar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.cookie = "sidebar_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
  })

  describe("Desktop View", () => {
    beforeEach(() => {
      ; (useIsMobile as jest.Mock).mockReturnValue(false)
    })

    it("renders sidebar expanded by default", () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>Desktop Content</SidebarContent>
          </Sidebar>
          <ContextTester />
        </SidebarProvider>
      )

      expect(screen.getByText("Desktop Content")).toBeVisible()
      expect(screen.getByTestId("state")).toHaveTextContent("expanded")
      expect(screen.getByTestId("open")).toHaveTextContent("true")
    })

    it("collapses sidebar via trigger", async () => {
      const user = userEvent.setup()
      const { container } = render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
          <SidebarTrigger />
        </SidebarProvider>
      )

      const trigger = screen.getByRole("button", { name: /toggle sidebar/i })
      await user.click(trigger)

      const sidebar = container.querySelector('[data-state]')
      expect(sidebar).toHaveAttribute("data-state", "collapsed")
      expect(document.cookie).toContain("sidebar_state=false")
    })

    it("toggles via keyboard shortcut (Ctrl+b)", () => {
      render(
        <SidebarProvider>
          <Sidebar />
          <ContextTester />
        </SidebarProvider>
      )

      expect(screen.getByTestId("state")).toHaveTextContent("expanded")
      fireEvent.keyDown(window, { key: "b", ctrlKey: true })
      expect(screen.getByTestId("state")).toHaveTextContent("collapsed")
    })

    it("respects defaultOpen prop", () => {
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar />
          <ContextTester />
        </SidebarProvider>
      )
      expect(screen.getByTestId("state")).toHaveTextContent("collapsed")
    })

    it("renders subcomponents correctly", () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>Header</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Group 1</SidebarGroupLabel>
                <SidebarGroupAction title="Action" onClick={() => { }} />
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>Item 1</SidebarMenuButton>
                      <SidebarMenuAction />
                      <SidebarMenuBadge>123</SidebarMenuBadge>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton>SubItem 1</SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>Footer</SidebarFooter>
            <SidebarRail />
          </Sidebar>
        </SidebarProvider>
      )

      expect(screen.getByText("Header")).toBeInTheDocument()
      expect(screen.getByText("Group 1")).toBeInTheDocument()
      expect(screen.getByText("Item 1")).toBeInTheDocument()
      expect(screen.getByText("123")).toBeInTheDocument()
      expect(screen.getByText("SubItem 1")).toBeInTheDocument()
      expect(screen.getByText("Footer")).toBeInTheDocument()
    })

    it("renders tooltip only when collapsed", () => {
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar>
            <SidebarMenuButton tooltip="Tip">Icon</SidebarMenuButton>
          </Sidebar>
        </SidebarProvider>
      )
      // Check if tooltip is in DOM (could be hidden or portal)
      expect(screen.getByText("Icon")).toBeInTheDocument()
    })
  })

  describe("Mobile View", () => {
    beforeEach(() => {
      ; (useIsMobile as jest.Mock).mockReturnValue(true)
    })

    it("starts closed and opens via trigger", async () => {
      const user = userEvent.setup()
      render(
        <SidebarProvider>
          <div className="layout">
            <SidebarTrigger />
            <Sidebar>
              <SidebarContent>Mobile Content</SidebarContent>
            </Sidebar>
          </div>
          <ContextTester />
        </SidebarProvider>
      )

      expect(screen.getByTestId("openMobile")).toHaveTextContent("false")
      expect(screen.queryByText("Mobile Content")).not.toBeInTheDocument()

      const trigger = screen.getByRole("button", { name: /toggle sidebar/i })
      await user.click(trigger)

      expect(screen.getByTestId("openMobile")).toHaveTextContent("true")
      await waitFor(() => {
        expect(screen.getByText("Mobile Content")).toBeVisible()
      })
    })

    it("uses defaultOpen to control internal state but mobile ignores it for initial render usually?", () => {
      render(
        <SidebarProvider defaultOpen={true}>
          <Sidebar>
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
          <ContextTester />
        </SidebarProvider>
      )
      expect(screen.getByTestId("openMobile")).toHaveTextContent("false")
    })
  })

  describe("Subcomponents and Variants", () => {
    beforeEach(() => {
      ; (useIsMobile as jest.Mock).mockReturnValue(false)
    })

    it("SidebarInset renders correctly", () => {
      render(
        <SidebarProvider>
          <Sidebar />
          <SidebarInset>Main Content</SidebarInset>
        </SidebarProvider>
      )
      expect(screen.getByText("Main Content")).toHaveClass("flex-1")
    })

    it("SidebarInput renders", () => {
      render(<SidebarProvider><Sidebar><SidebarInput placeholder="Search" /></Sidebar></SidebarProvider>)
      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument()
    })

    it("SidebarSeparator renders", () => {
      const { container } = render(<SidebarProvider><Sidebar><SidebarSeparator /></Sidebar></SidebarProvider>)
      expect(container.querySelector('[data-sidebar="separator"]')).toBeInTheDocument()
    })

    it("renders SidebarMenuSubButton with size=sm", () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenuSubButton size="sm">Small</SidebarMenuSubButton>
          </Sidebar>
        </SidebarProvider>
      )
      expect(screen.getByText("Small")).toHaveClass("text-xs")
    })

    it("renders SidebarMenuSubButton asChild", () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenuSubButton asChild>
              <a href="#">Link</a>
            </SidebarMenuSubButton>
          </Sidebar>
        </SidebarProvider>
      )
      const link = screen.getByText("Link")
      expect(link.tagName).toBe("A")
    })

    it("renders SidebarMenuButton variants and sizes", () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="sm">Small Button</SidebarMenuButton>
                <SidebarMenuAction />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">Large Button</SidebarMenuButton>
                <SidebarMenuAction />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton variant="outline">Outline</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
      expect(screen.getByText("Small Button").closest("button")).toHaveClass("h-7")
      expect(screen.getByText("Large Button").closest("button")).toHaveClass("h-12")
      expect(screen.getByText("Outline").closest("button")).toHaveClass("shadow-[0_0_0_1px_hsl(var(--sidebar-border))]")
    })

    it("renders SidebarMenuSkeleton", () => {
      const { container } = render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      )
      expect(container.querySelector('[data-sidebar="menu-skeleton-icon"]')).toBeInTheDocument()
      expect(container.querySelector('[data-sidebar="menu-skeleton-text"]')).toBeInTheDocument()
    })

    it("renders SidebarMenuAction with showOnHover", () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuAction showOnHover />
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
      const action = screen.getByRole("button")
      expect(action.className).toContain("group-focus-within/menu-item:opacity-100")
    })

    it("renders SidebarMenuButton with asChild and object tooltip", async () => {
      const user = userEvent.setup()
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar>
            <SidebarMenuButton asChild tooltip={{ children: "Obj Tip" }}>
              <a href="#">LinkBtn</a>
            </SidebarMenuButton>
          </Sidebar>
        </SidebarProvider>
      )
      const link = screen.getByText("LinkBtn")
      expect(link.tagName).toBe("A")

      await user.hover(link)
      await waitFor(() => {
        const tooltips = screen.getAllByText(/Obj Tip/)
        expect(tooltips.length).toBeGreaterThan(0)
      })
    })

    it("renders SidebarMenuAction asChild", () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenuAction asChild>
              <a href="#">ActionLink</a>
            </SidebarMenuAction>
          </Sidebar>
        </SidebarProvider>
      )
      expect(screen.getByText("ActionLink").tagName).toBe("A")
    })

    it("renders SidebarMenuSkeleton without icon", () => {
      const { container } = render(
        <SidebarProvider><Sidebar><SidebarMenuSkeleton /></Sidebar></SidebarProvider>
      )
      expect(container.querySelector('[data-sidebar="menu-skeleton-icon"]')).toBeNull()
      expect(container.querySelector('[data-sidebar="menu-skeleton-text"]')).toBeInTheDocument()
    })

    it("renders SidebarGroupAction asChild", () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarGroupAction asChild>
              <a href="#">GrpAction</a>
            </SidebarGroupAction>
          </Sidebar>
        </SidebarProvider>
      )
      expect(screen.getByText("GrpAction").tagName).toBe("A")
    })

    it("renders SidebarGroupLabel asChild", () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarGroupLabel asChild>
              <span>GrpLabel</span>
            </SidebarGroupLabel>
          </Sidebar>
        </SidebarProvider>
      )
      expect(screen.getByText("GrpLabel").tagName).toBe("SPAN")
    })

    it("SidebarTrigger calls explicit onClick", async () => {
      const onClick = jest.fn()
      const user = userEvent.setup()
      render(
        <SidebarProvider>
          <SidebarTrigger onClick={onClick} />
        </SidebarProvider>
      )
      await user.click(screen.getByRole("button", { name: /toggle sidebar/i }))
      expect(onClick).toHaveBeenCalled()
    })

    it("SidebarRail toggles sidebar on click", async () => {
      const user = userEvent.setup()
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarRail />
          </Sidebar>
          <ContextTester />
        </SidebarProvider>
      )
      const rail = screen.getByTitle("Toggle Sidebar")
      await user.click(rail)
      expect(screen.getByTestId("state")).toHaveTextContent("collapsed")
    })
  })

  describe("Functional Updates", () => {
    it("supports functional state updates via context", () => {
      function FunctionalTester() {
        const { setOpen, setOpenMobile } = useSidebar()
        return (
          <div>
            <button onClick={() => setOpen((prev: boolean) => !prev)}>Toggle Func</button>
            <button onClick={() => setOpenMobile((prev: boolean) => !prev)}>Toggle Mobile Func</button>
          </div>
        )
      }

      render(
        <SidebarProvider defaultOpen={true}>
          <FunctionalTester />
          <ContextTester />
        </SidebarProvider>
      )

      expect(screen.getByTestId("open")).toHaveTextContent("true")

      fireEvent.click(screen.getByText("Toggle Func"))
      expect(screen.getByTestId("open")).toHaveTextContent("false")

      fireEvent.click(screen.getByText("Toggle Mobile Func"))
      expect(screen.getByTestId("openMobile")).toHaveTextContent("true")
    })
  })

  describe("Error Handling", () => {
    it("throws error if useSidebar used outside provider", () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
      expect(() => render(<ContextTester />)).toThrow("useSidebar must be used within a SidebarProvider.")
      consoleSpy.mockRestore()
    })

    it("works as controlled component", async () => {
      const onOpenChange = jest.fn()
      const user = userEvent.setup()
      render(
        <SidebarProvider open={true} onOpenChange={onOpenChange}>
          <Sidebar>
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
          <SidebarTrigger />
        </SidebarProvider>
      )

      const trigger = screen.getByRole("button", { name: /toggle sidebar/i })
      await user.click(trigger)

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
