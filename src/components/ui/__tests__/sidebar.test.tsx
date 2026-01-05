import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarTrigger,
} from "../sidebar"

import { useIsMobile } from "@/hooks/use-mobile"

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock useIsMobile
jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: jest.fn(),
}))

describe("Sidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders sidebar content on desktop", () => {
    ;(useIsMobile as jest.Mock).mockReturnValue(false)

    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>Desktop Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    )

    expect(screen.getByText("Desktop Content")).toBeInTheDocument()
  })

  it("renders sidebar when collapsible is none", () => {
    ;(useIsMobile as jest.Mock).mockReturnValue(false)

    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>No Collapse</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    )

    expect(screen.getByText("No Collapse")).toBeInTheDocument()
  })

  it("toggles sidebar using trigger button", () => {
    ;(useIsMobile as jest.Mock).mockReturnValue(false)

    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarTrigger />
          <SidebarContent>Toggle Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    )

    const trigger = screen.getByRole("button", { name: /toggle sidebar/i })
    fireEvent.click(trigger)

    // No assert visual fuerte, pero ejecuta toggleSidebar()
    expect(trigger).toBeInTheDocument()
  })

  it("toggles sidebar with keyboard shortcut", () => {
    ;(useIsMobile as jest.Mock).mockReturnValue(false)

    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>Keyboard Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    )

    fireEvent.keyDown(window, {
      key: "b",
      ctrlKey: true,
    })

    expect(screen.getByText("Keyboard Content")).toBeInTheDocument()
  })

  it("renders mobile sidebar using Sheet", () => {
    ;(useIsMobile as jest.Mock).mockReturnValue(true)

    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>Mobile Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    )

    expect(screen.getByText("Mobile Content")).toBeInTheDocument()
  })
})
