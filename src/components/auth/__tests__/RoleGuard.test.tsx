import { render, screen } from "@testing-library/react"
import { RoleGuard } from "../RoleGuard"
import { useRoleGuard } from "@/hooks/use-role-guard"

jest.mock("@/hooks/use-role-guard")

describe("RoleGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("muestra loading cuando está cargando y redirectTo403 es true", () => {
    ;(useRoleGuard as jest.Mock).mockReturnValue({
      isAllowed: false,
      isLoading: true,
    })

    render(
      <RoleGuard redirectTo403>
        <div>Contenido</div>
      </RoleGuard>
    )

    expect(screen.getByText("Redirigiendo...")).toBeInTheDocument()
  })

  it("muestra fallback cuando no está permitido", () => {
    ;(useRoleGuard as jest.Mock).mockReturnValue({
      isAllowed: false,
      isLoading: false,
    })

    render(
      <RoleGuard fallback={<div>Sin permisos</div>}>
        <div>Contenido</div>
      </RoleGuard>
    )

    expect(screen.getByText("Sin permisos")).toBeInTheDocument()
  })

  it("renderiza children cuando está permitido", () => {
    ;(useRoleGuard as jest.Mock).mockReturnValue({
      isAllowed: true,
      isLoading: false,
    })

    render(
      <RoleGuard>
        <div>Contenido permitido</div>
      </RoleGuard>
    )

    expect(screen.getByText("Contenido permitido")).toBeInTheDocument()
  })
})
