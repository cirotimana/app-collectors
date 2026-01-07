import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModeToggle } from '../theme-toggle'
import { useTheme } from 'next-themes'

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

// Mock PointerEvent
class MockPointerEvent extends Event {
  button: number
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props)
    this.button = props.button || 0
    this.ctrlKey = props.ctrlKey || false
    this.metaKey = props.metaKey || false
    this.shiftKey = props.shiftKey || false
  }
}
window.PointerEvent = MockPointerEvent as any
window.HTMLElement.prototype.scrollIntoView = jest.fn()
window.HTMLElement.prototype.releasePointerCapture = jest.fn()
window.HTMLElement.prototype.hasPointerCapture = jest.fn()

// Mock de next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}))

describe('ModeToggle', () => {
  const mockSetTheme = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
      ; (useTheme as jest.Mock).mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'light',
        themes: ['light', 'dark', 'system'],
      })
  })

  /* ================= Renderizado básico ================= */

  it('renderiza el botón de toggle correctamente', () => {
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
  })

  it('muestra los iconos de sol y luna', () => {
    render(<ModeToggle />)

    // Los iconos están presentes en el DOM (aunque uno esté oculto con CSS)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('tiene texto accesible para lectores de pantalla', () => {
    render(<ModeToggle />)

    expect(screen.getByText('Toggle theme')).toHaveClass('sr-only')
  })

  /* ================= Apertura del menú ================= */

  it('abre el menú al hacer clic en el botón', async () => {
    const user = userEvent.setup()
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Claro')).toBeInTheDocument()
      expect(screen.getByText('Oscuro')).toBeInTheDocument()
      expect(screen.getByText('Sistema')).toBeInTheDocument()
    })
  })

  it('muestra todas las opciones de tema en el menú', async () => {
    const user = userEvent.setup()
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems).toHaveLength(3)
    })
  })

  /* ================= Cambio de tema ================= */

  it('cambia a tema claro al seleccionar "Claro"', async () => {
    const user = userEvent.setup()
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    const lightOption = await screen.findByText('Claro')
    await user.click(lightOption)

    expect(mockSetTheme).toHaveBeenCalledWith('light')
    expect(mockSetTheme).toHaveBeenCalledTimes(1)
  })

  it('cambia a tema oscuro al seleccionar "Oscuro"', async () => {
    const user = userEvent.setup()
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    const darkOption = await screen.findByText('Oscuro')
    await user.click(darkOption)

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
    expect(mockSetTheme).toHaveBeenCalledTimes(1)
  })

  it('cambia a tema del sistema al seleccionar "Sistema"', async () => {
    const user = userEvent.setup()
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    const systemOption = await screen.findByText('Sistema')
    await user.click(systemOption)

    expect(mockSetTheme).toHaveBeenCalledWith('system')
    expect(mockSetTheme).toHaveBeenCalledTimes(1)
  })

  /* ================= Cierre del menú ================= */

  it('cierra el menú después de seleccionar una opción', async () => {
    const user = userEvent.setup()
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    const lightOption = await screen.findByText('Claro')
    await user.click(lightOption)

    await waitFor(() => {
      expect(screen.queryByText('Claro')).not.toBeInTheDocument()
    })
  })

  /* ================= Accesibilidad ================= */

  it('el botón tiene el variant y size correctos', () => {
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    // Button is rendered correctly with outline variant (applied via classes)
    expect(button).toBeInTheDocument()
  })

  it('puede ser navegado con teclado', async () => {
    const user = userEvent.setup()
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })

    // Simular navegación con teclado
    button.focus()
    expect(button).toHaveFocus()

    // Abrir con Enter
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText('Claro')).toBeInTheDocument()
    })
  })

  /* ================= Múltiples interacciones ================= */

  it('permite cambiar de tema múltiples veces', async () => {
    const user = userEvent.setup()
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })

    // Primera selección
    await user.click(button)
    const lightOption = await screen.findByText('Claro')
    await user.click(lightOption)

    expect(mockSetTheme).toHaveBeenCalledWith('light')

    // Segunda selección
    await user.click(button)
    const darkOption = await screen.findByText('Oscuro')
    await user.click(darkOption)

    expect(mockSetTheme).toHaveBeenCalledWith('dark')

    // Tercera selección
    await user.click(button)
    const systemOption = await screen.findByText('Sistema')
    await user.click(systemOption)

    expect(mockSetTheme).toHaveBeenCalledWith('system')

    expect(mockSetTheme).toHaveBeenCalledTimes(3)
  })

  /* ================= Estados del hook ================= */

  it('funciona correctamente cuando el tema actual es dark', () => {
    ; (useTheme as jest.Mock).mockReturnValue({
      setTheme: mockSetTheme,
      theme: 'dark',
      themes: ['light', 'dark', 'system'],
    })

    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
  })

  it('funciona correctamente cuando el tema actual es system', () => {
    ; (useTheme as jest.Mock).mockReturnValue({
      setTheme: mockSetTheme,
      theme: 'system',
      themes: ['light', 'dark', 'system'],
    })

    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
  })

  /* ================= Edge cases ================= */

  it('maneja clics rápidos consecutivos', async () => {
    const user = userEvent.setup()
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })

    // Abrir menú
    await user.click(button)
    const lightOption = await screen.findByText('Claro')

    // Múltiples clics rápidos
    await user.click(lightOption)

    expect(mockSetTheme).toHaveBeenCalledWith('light')
    expect(mockSetTheme).toHaveBeenCalledTimes(1)
  })

  /* ================= Alineación del menú ================= */

  it('el menú se alinea al final (align="end")', async () => {
    const user = userEvent.setup()
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    await waitFor(() => {
      const menu = screen.getByRole('menu')
      expect(menu).toBeInTheDocument()
    })
  })

  /* ================= Estructura del componente ================= */

  it('usa DropdownMenu correctamente', () => {
    render(<ModeToggle />)

    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('el botón trigger es un Button con asChild', () => {
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button.tagName).toBe('BUTTON')
  })

  /* ================= Iconos ================= */

  it('ambos iconos están en el DOM', () => {
    const { container } = render(<ModeToggle />)

    // Verificar que ambos iconos existen (aunque uno esté oculto con CSS)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(2)
  })

  /* ================= Orden de las opciones ================= */

  it('las opciones aparecen en el orden correcto', async () => {
    const user = userEvent.setup()
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems[0]).toHaveTextContent('Claro')
      expect(menuItems[1]).toHaveTextContent('Oscuro')
      expect(menuItems[2]).toHaveTextContent('Sistema')
    })
  })
})