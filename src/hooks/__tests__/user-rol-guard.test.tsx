import { renderHook } from "@testing-library/react"
import { useRoleGuard } from "../use-role-guard"
import * as authContext from "@/contexts/AuthContext"
import * as authStore from "@/store/auth-store"
import { useRouter } from "next/navigation"

// ------------------
// Mocks
// ------------------
const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

jest.mock("@/contexts/AuthContext")
jest.mock("@/store/auth-store")

describe("useRoleGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })

    ;(authContext.useAuth as jest.Mock).mockReturnValue({
      loading: false,
    })

    ;(authStore.useAuthStore as jest.Mock).mockReturnValue({
      user: { id: 1, username: "leo", roles: ["ADMIN"] },
      hasAnyRole: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
      canEdit: jest.fn().mockReturnValue(true),
    })
  })

  it("permite acceso cuando el usuario cumple roles", () => {
    const { result } = renderHook(() =>
      useRoleGuard({ allowedRoles: ["ADMIN"] })
    )

    expect(result.current.isAllowed).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it("deniega acceso cuando no hay usuario", () => {
    ;(authStore.useAuthStore as jest.Mock).mockReturnValue({
      user: null,
      hasAnyRole: jest.fn(),
      canDelete: jest.fn(),
      canEdit: jest.fn(),
    })

    const { result } = renderHook(() =>
      useRoleGuard({ allowedRoles: ["ADMIN"] })
    )

    expect(result.current.isAllowed).toBe(false)
  })

  it("deniega acceso cuando no tiene rol permitido", () => {
    ;(authStore.useAuthStore as jest.Mock).mockReturnValue({
      user: { id: 1 },
      hasAnyRole: jest.fn().mockReturnValue(false),
      canDelete: jest.fn(),
      canEdit: jest.fn(),
    })

    const { result } = renderHook(() =>
      useRoleGuard({ allowedRoles: ["ADMIN"] })
    )

    expect(result.current.isAllowed).toBe(false)
  })

  it("redirige a /403 si no está permitido y redirectTo403=true", () => {
    ;(authStore.useAuthStore as jest.Mock).mockReturnValue({
      user: { id: 1 },
      hasAnyRole: jest.fn().mockReturnValue(false),
      canDelete: jest.fn(),
      canEdit: jest.fn(),
    })

    renderHook(() =>
      useRoleGuard({
        allowedRoles: ["ADMIN"],
        redirectTo403: true,
      })
    )

    expect(mockPush).toHaveBeenCalledWith("/403")
  })

  it("NO redirige si redirectTo403=false", () => {
    ;(authStore.useAuthStore as jest.Mock).mockReturnValue({
      user: { id: 1 },
      hasAnyRole: jest.fn().mockReturnValue(false),
      canDelete: jest.fn(),
      canEdit: jest.fn(),
    })

    renderHook(() =>
      useRoleGuard({
        allowedRoles: ["ADMIN"],
        redirectTo403: false,
      })
    )

    expect(mockPush).not.toHaveBeenCalled()
  })

  it("mantiene loading mientras auth está cargando", () => {
    ;(authContext.useAuth as jest.Mock).mockReturnValue({
      loading: true,
    })

    const { result } = renderHook(() =>
      useRoleGuard({ allowedRoles: ["ADMIN"] })
    )

    expect(result.current.isLoading).toBe(true)
  })
})
