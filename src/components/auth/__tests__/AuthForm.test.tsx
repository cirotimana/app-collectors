import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AuthForm } from "../AuthForm"

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
})
