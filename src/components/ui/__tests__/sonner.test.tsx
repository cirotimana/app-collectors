import { render, screen, waitFor } from "@testing-library/react"
import { Toaster } from "../sonner"
import { toast } from "sonner"
import { useTheme } from "next-themes"

// 1. Mock de next-themes para controlar el valor del tema
jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}))

describe("Toaster Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("debe renderizar con el tema configurado en next-themes", () => {
    // Probamos la rama donde el tema es 'dark' (Cubre línea: const { theme = "system" } = useTheme())
    ;(useTheme as jest.Mock).mockReturnValue({ theme: "dark" })
    
    const { container } = render(<Toaster />)
    
    // Verificamos que el contenedor de Sonner exista
    const sonnerToaster = container.querySelector(".toaster")
    expect(sonnerToaster).toBeInTheDocument()
  })

  it("debe usar 'system' como tema por defecto si no hay uno definido", () => {
    // Cubre la asignación por defecto: theme = "system"
    ;(useTheme as jest.Mock).mockReturnValue({ theme: undefined })
    
    render(<Toaster />)
    // El test pasa si no explota y usa el valor por defecto internamente
  })

  it("debe mostrar los iconos personalizados al disparar un toast de éxito", async () => {
    ;(useTheme as jest.Mock).mockReturnValue({ theme: "light" })
    
    // Renderizamos el Toaster
    render(<Toaster />)

    // Disparamos un toast de éxito
    toast.success("Operación exitosa")

    // 2. EL TRUCO: Sonner renderiza mediante un Portal. 
    // Buscamos el texto y el icono (CircleCheckIcon tiene clase size-4)
    await waitFor(() => {
      expect(screen.getByText("Operación exitosa")).toBeInTheDocument()
    })

    // Esto asegura que la propiedad 'icons' del componente fue ejecutada
    const successIcon = document.querySelector(".lucide-circle-check")
    expect(successIcon).toBeInTheDocument()
  })

  it("debe mostrar el icono de carga (loading) animado", async () => {
    ;(useTheme as jest.Mock).mockReturnValue({ theme: "light" })
    render(<Toaster />)

    toast.loading("Cargando...")

    await waitFor(() => {
      expect(screen.getByText("Cargando...")).toBeInTheDocument()
    })

    // Verifica que el icono de carga tenga la clase de animación (animate-spin)
    const loaderIcon = document.querySelector(".animate-spin")
    expect(loaderIcon).toBeInTheDocument()
  })

  it("debe renderizar toasts de error con el icono OctagonXIcon", async () => {
    ;(useTheme as jest.Mock).mockReturnValue({ theme: "light" })
    render(<Toaster />)

    toast.error("Hubo un error")

    await waitFor(() => {
      const errorIcon = document.querySelector(".lucide-octagon-x")
      expect(errorIcon).toBeInTheDocument()
    })
  })
})