import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AuthProvider, useAuth } from "../AuthContext"
import * as authLib from "@/lib/auth"
import { useAuthStore } from "@/store/auth-store"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock("@/lib/auth", () => ({
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: jest.fn(),
  getUser: jest.fn(),
}))

function TestComponent() {
  const { user, loading, isAuthenticated, login, logout } = useAuth()

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="username">{user?.username || ""}</div>

      <button onClick={() => login({ username: "a@a.com", password: "123" })}>
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

describe("AuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    useAuthStore.getState().clearAuth()
  })

  it("inicializa sin sesión", async () => {
    ;(authLib.isAuthenticated as jest.Mock).mockReturnValue(false)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
    })
  })

  it("carga sesión existente desde localStorage", async () => {
    const user = { id: 1, username: "leo", email: "leo@test.com", role: "admin" }

    ;(authLib.isAuthenticated as jest.Mock).mockReturnValue(true)
    ;(authLib.getUser as jest.Mock).mockReturnValue(user)

    localStorage.setItem("auth_token", "token123")

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true")
      expect(screen.getByTestId("username")).toHaveTextContent("leo")
    })
  })

  it("login exitoso guarda auth y redirige", async () => {
    const user = { id: 1, username: "leo", email: "leo@test.com", role: "admin" }

    ;(authLib.isAuthenticated as jest.Mock).mockReturnValue(false)
    ;(authLib.login as jest.Mock).mockResolvedValue({
      user,
      access_token: "token123",
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await userEvent.click(screen.getByText("login"))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard/sales")
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true")
    })
  })

  it("logout limpia sesión y redirige", async () => {
    ;(authLib.isAuthenticated as jest.Mock).mockReturnValue(false)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await userEvent.click(screen.getByText("logout"))

    expect(authLib.logout).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith("/auth/login")
  })

it("login error NO autentica ni redirige", async () => {
  ;(authLib.login as jest.Mock).mockRejectedValue(new Error("Invalid credentials"))

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  )

  userEvent.click(screen.getByText("login"))

  await waitFor(() => {
    expect(mockPush).not.toHaveBeenCalled()
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
  })
})

it("login lanza error cuando falla", async () => {
  const error = new Error("Invalid credentials")

  ;(authLib.isAuthenticated as jest.Mock).mockReturnValue(false)
  ;(authLib.login as jest.Mock).mockRejectedValue(error)

  let ctx: any

  function Test() {
    ctx = useAuth()
    return null
  }

  render(
    <AuthProvider>
      <Test />
    </AuthProvider>
  )

  await expect(
    ctx.login({ email: "a@a.com", password: "123" })
  ).rejects.toThrow("Invalid credentials")
})

it("logout desde sesión activa limpia estado y UI", async () => {
  const user = { id: 1, username: "leo", email: "leo@test.com", role: "admin" }

  // Simula sesión activa
  ;(authLib.isAuthenticated as jest.Mock).mockReturnValue(true)
  ;(authLib.getUser as jest.Mock).mockReturnValue(user)

  localStorage.setItem("auth_token", "token123")

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  )

  // Confirmamos estado inicial autenticado
  await waitFor(() => {
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true")
    expect(screen.getByTestId("username")).toHaveTextContent("leo")
  })

  // Click logout
  await userEvent.click(screen.getByText("logout"))

  // Verificaciones CLAVE (branches)
  await waitFor(() => {
    expect(authLib.logout).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith("/auth/login")
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
    expect(screen.getByTestId("username")).toHaveTextContent("")
  })

  // Limpieza real
  expect(localStorage.getItem("auth_token")).toBeNull()
})

it("NO sincroniza auth cuando isAuthenticated es true pero no hay userData", async () => {
  // isAuthenticated dice que sí
  ;(authLib.isAuthenticated as jest.Mock).mockReturnValue(true)

  // pero getUser NO devuelve usuario
  ;(authLib.getUser as jest.Mock).mockReturnValue(null)

  localStorage.setItem("auth_token", "token123")

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  )

  await waitFor(() => {
    // Nunca se autentica
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
    expect(screen.getByTestId("username")).toHaveTextContent("")
  })
})
it("sin token usa string vacío al sincronizar auth", async () => {
  const user = { id: 1, username: "leo", email: "leo@test.com", role: "admin" }

  ;(authLib.isAuthenticated as jest.Mock).mockReturnValue(true)
  ;(authLib.getUser as jest.Mock).mockReturnValue(user)

  // IMPORTANTE: NO seteamos auth_token
  localStorage.removeItem("auth_token")

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  )

  await waitFor(() => {
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true")
    expect(screen.getByTestId("username")).toHaveTextContent("leo")
  })
})

})
