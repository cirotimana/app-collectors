import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AuthForm } from "../AuthForm"
import { toast } from "sonner"

// 🔹 mock de login
const mockLogin = jest.fn()

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}))

// 🔹 mock de toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// 🔹 mock icon
jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader" />,
}))

describe("AuthForm", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  const fillAndSubmit = async () => {
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "testuser" } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "password123" } })
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesion/i }))
  }

  it("renderiza el formulario correctamente", () => {
    render(<AuthForm />)

    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /iniciar sesion/i })
    ).toBeInTheDocument()
  })

  it("muestra errores si se envía vacío", async () => {
    render(<AuthForm />)

    fireEvent.click(
      screen.getByRole("button", { name: /iniciar sesion/i })
    )

    await waitFor(() => {
      expect(screen.getByText(/mínimo 3 caracteres/i)).toBeInTheDocument()
      expect(screen.getByText(/mínimo 6 caracteres/i)).toBeInTheDocument()
    })
  })

  it("muestra error si username es muy corto", async () => {
    render(<AuthForm />)

    fireEvent.change(screen.getByLabelText(/usuario/i), {
      target: { value: "ab" },
    })

    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "123456" },
    })

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText(/mínimo 3 caracteres/i)).toBeInTheDocument()
    })
  })

  it("muestra error si password es muy corta", async () => {
    render(<AuthForm />)

    fireEvent.change(screen.getByLabelText(/usuario/i), {
      target: { value: "usuario" },
    })

    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "123" },
    })

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText(/mínimo 6 caracteres/i)).toBeInTheDocument()
    })
  })

  it("ejecuta login correctamente con datos válidos", async () => {
    mockLogin.mockResolvedValueOnce({})

    render(<AuthForm />)

    fireEvent.change(screen.getByLabelText(/usuario/i), {
      target: { value: "usuario" },
    })

    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "123456" },
    })

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: "usuario",
        password: "123456",
      })
    })
  })

  it("muestra error si login falla", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Credenciales incorrectas"))

    render(<AuthForm />)

    fireEvent.change(screen.getByLabelText(/usuario/i), {
      target: { value: "usuario" },
    })

    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "123456" },
    })

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })
  })

  it("debe mostrar el mensaje de error que viene de la API (error.message)", async () => {
    // Escenario 1: El error tiene un mensaje definido
    const apiErrorMessage = "Credenciales inválidas"
    mockLogin.mockRejectedValueOnce(new Error(apiErrorMessage))

    render(<AuthForm />)
    await fillAndSubmit()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(apiErrorMessage)
    })
  })

  it("debe mostrar el mensaje por defecto cuando el error no tiene mensaje", async () => {
    // Escenario 2: El error no tiene propiedad .message (Línea del ||)
    mockLogin.mockRejectedValueOnce({}) // Un objeto vacío no tiene .message

    render(<AuthForm />)
    await fillAndSubmit()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error en la autenticacion")
    })
  })

  it("debe loguear el error en consola para debugging", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    const rawError = { code: 500 }
    mockLogin.mockRejectedValueOnce(rawError)

    render(<AuthForm />)
    await fillAndSubmit()

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Error:", rawError)
    })
    consoleSpy.mockRestore()
  })
})
