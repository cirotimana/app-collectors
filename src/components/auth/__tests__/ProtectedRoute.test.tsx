import { render, screen } from "@testing-library/react"
import { ProtectedRoute } from "../ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

jest.mock("@/contexts/AuthContext")
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

const mockPush = jest.fn()

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it("muestra loading mientras carga", () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    })

    render(
      <ProtectedRoute>
        <div>Contenido protegido</div>
      </ProtectedRoute>
    )

    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument()
  })

  it("redirige a /auth/login si no hay usuario", () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    })

    render(
      <ProtectedRoute>
        <div>Contenido protegido</div>
      </ProtectedRoute>
    )

    expect(mockPush).toHaveBeenCalledWith("/auth/login")
  })

  it("renderiza los children si el usuario existe", () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, name: "Leo" },
      loading: false,
    })

    render(
      <ProtectedRoute>
        <div>Contenido protegido</div>
      </ProtectedRoute>
    )

    expect(screen.getByText("Contenido protegido")).toBeInTheDocument()
  })
})
