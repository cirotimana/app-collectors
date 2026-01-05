import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AppSidebar } from "../AppSidebar"

// ─────────────────────────────────────────────
// 🔥 MOCK NEXT
// ─────────────────────────────────────────────
jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}))

jest.mock("next/link", () => {
  return ({ children }: { children: React.ReactNode }) => children
})

// ─────────────────────────────────────────────
// 🔥 MOCK AUTH CONTEXT
// ─────────────────────────────────────────────
const logoutMock = jest.fn()

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      username: "leo",
      email: "leo@test.com",
    },
    logout: logoutMock,
  }),
}))

// ─────────────────────────────────────────────
// 🔥 MOCK AUTH STORE (PERMISOS)
// ─────────────────────────────────────────────
jest.mock("@/store/auth-store", () => ({
  useAuthStore: () => ({
    canAccessConfig: () => true,
    canAccessLiquidaciones: () => true,
    canAccessDigital: () => false,
  }),
}))

// ─────────────────────────────────────────────
// 🔥 MOCK COMPONENTES UI (SIMPLIFICADOS)
// ─────────────────────────────────────────────
jest.mock("@/components/ui/sidebar", () => {
  const Mock = ({ children }: any) => <div>{children}</div>
  return {
    Sidebar: Mock,
    SidebarHeader: Mock,
    SidebarContent: Mock,
    SidebarFooter: Mock,
    SidebarGroup: Mock,
    SidebarGroupLabel: ({ children }: any) => <div>{children}</div>,
    SidebarGroupContent: Mock,
    SidebarMenu: Mock,
    SidebarMenuItem: Mock,
    SidebarMenuButton: ({ children, onClick }: any) => (
      <button onClick={onClick}>{children}</button>
    ),
    SidebarMenuSub: Mock,
    SidebarMenuSubItem: Mock,
    SidebarMenuSubButton: ({ children }: any) => <button>{children}</button>,
  }
})

jest.mock("@/components/ui/collapsible", () => {
  const Mock = ({ children }: any) => <div>{children}</div>
  return {
    Collapsible: Mock,
    CollapsibleTrigger: ({ children }: any) => <div>{children}</div>,
    CollapsibleContent: ({ children }: any) => <div>{children}</div>,
  }
})

jest.mock("@/components/provider/theme-toggle", () => ({
  ModeToggle: () => <button>Toggle Theme</button>,
}))

// ─────────────────────────────────────────────
// 🧪 TESTS
// ─────────────────────────────────────────────
describe("AppSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renderiza el sidebar con módulos visibles", () => {
    render(<AppSidebar />)

    expect(screen.getByText("Dashboard Ventas")).toBeInTheDocument()
    expect(screen.getByText("Dashboard Liquidaciones")).toBeInTheDocument()
    expect(screen.getByText("Reportes")).toBeInTheDocument()
  })

  it("oculta el módulo Digital si no tiene permiso", () => {
    render(<AppSidebar />)

    expect(screen.queryByText("Digital")).not.toBeInTheDocument()
  })

  it("muestra el menú de configuración solo para admin", () => {
    render(<AppSidebar />)

    expect(screen.getByText("Configuración")).toBeInTheDocument()
    expect(screen.getByText("Usuarios")).toBeInTheDocument()
    expect(screen.getByText("Roles")).toBeInTheDocument()
  })

  it("muestra la información del usuario", () => {
    render(<AppSidebar />)

    expect(screen.getByText("leo")).toBeInTheDocument()
    expect(screen.getByText("leo@test.com")).toBeInTheDocument()
  })

  it("ejecuta logout al hacer click en Cerrar Sesión", async () => {
    const user = userEvent.setup()

    render(<AppSidebar />)

    const logoutButton = screen.getByText("Cerrar Sesion")
    await user.click(logoutButton)

    expect(logoutMock).toHaveBeenCalled()
  })
})
