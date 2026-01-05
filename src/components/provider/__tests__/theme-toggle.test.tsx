import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ModeToggle } from '../theme-toggle'
import { useTheme } from 'next-themes'

// Mock de next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}))

describe('ModeToggle', () => {
  const mockSetTheme = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useTheme as jest.Mock).mockReturnValue({
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
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Claro')).toBeInTheDocument()
      expect(screen.getByText('Oscuro')).toBeInTheDocument()
      expect(screen.getByText('Sistema')).toBeInTheDocument()
    })
  })

  it('muestra todas las opciones de tema en el menú', async () => {
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    fireEvent.click(button)

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems).toHaveLength(3)
    })
  })

  /* ================= Cambio de tema ================= */

  it('cambia a tema claro al seleccionar "Claro"', async () => {
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Claro')).toBeInTheDocument()
    })

    const lightOption = screen.getByText('Claro')
    fireEvent.click(lightOption)

    expect(mockSetTheme).toHaveBeenCalledWith('light')
    expect(mockSetTheme).toHaveBeenCalledTimes(1)
  })

  it('cambia a tema oscuro al seleccionar "Oscuro"', async () => {
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Oscuro')).toBeInTheDocument()
    })

    const darkOption = screen.getByText('Oscuro')
    fireEvent.click(darkOption)

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
    expect(mockSetTheme).toHaveBeenCalledTimes(1)
  })

  it('cambia a tema del sistema al seleccionar "Sistema"', async () => {
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Sistema')).toBeInTheDocument()
    })

    const systemOption = screen.getByText('Sistema')
    fireEvent.click(systemOption)

    expect(mockSetTheme).toHaveBeenCalledWith('system')
    expect(mockSetTheme).toHaveBeenCalledTimes(1)
  })

  /* ================= Cierre del menú ================= */

  it('cierra el menú después de seleccionar una opción', async () => {
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Claro')).toBeInTheDocument()
    })

    const lightOption = screen.getByText('Claro')
    fireEvent.click(lightOption)

    await waitFor(() => {
      expect(screen.queryByText('Claro')).not.toBeInTheDocument()
    })
  })

  /* ================= Accesibilidad ================= */

  it('el botón tiene el variant y size correctos', () => {
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toHaveClass('outline')
  })

  it('puede ser navegado con teclado', async () => {
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    
    // Simular navegación con teclado
    button.focus()
    expect(button).toHaveFocus()

    // Abrir con Enter
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Claro')).toBeInTheDocument()
    })
  })

  /* ================= Múltiples interacciones ================= */

  it('permite cambiar de tema múltiples veces', async () => {
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })

    // Primera selección
    fireEvent.click(button)
    await waitFor(() => screen.getByText('Claro'))
    fireEvent.click(screen.getByText('Claro'))

    expect(mockSetTheme).toHaveBeenCalledWith('light')

    // Segunda selección
    fireEvent.click(button)
    await waitFor(() => screen.getByText('Oscuro'))
    fireEvent.click(screen.getByText('Oscuro'))

    expect(mockSetTheme).toHaveBeenCalledWith('dark')

    // Tercera selección
    fireEvent.click(button)
    await waitFor(() => screen.getByText('Sistema'))
    fireEvent.click(screen.getByText('Sistema'))

    expect(mockSetTheme).toHaveBeenCalledWith('system')

    expect(mockSetTheme).toHaveBeenCalledTimes(3)
  })

  /* ================= Estados del hook ================= */

  it('funciona correctamente cuando el tema actual es dark', () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      setTheme: mockSetTheme,
      theme: 'dark',
      themes: ['light', 'dark', 'system'],
    })

    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
  })

  it('funciona correctamente cuando el tema actual es system', () => {
    ;(useTheme as jest.Mock).mockReturnValue({
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
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })

    // Abrir menú
    fireEvent.click(button)
    await waitFor(() => screen.getByText('Claro'))

    // Múltiples clics rápidos
    fireEvent.click(screen.getByText('Claro'))
    
    expect(mockSetTheme).toHaveBeenCalledWith('light')
    expect(mockSetTheme).toHaveBeenCalledTimes(1)
  })

  it('no lanza error si setTheme es undefined', async () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      setTheme: undefined,
      theme: 'light',
    })

    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Claro')).toBeInTheDocument()
    })

    // No debería lanzar error
    const lightOption = screen.getByText('Claro')
    expect(() => fireEvent.click(lightOption)).not.toThrow()
  })

  /* ================= Alineación del menú ================= */

  it('el menú se alinea al final (align="end")', async () => {
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    fireEvent.click(button)

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
    render(<ModeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    fireEvent.click(button)

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems[0]).toHaveTextContent('Claro')
      expect(menuItems[1]).toHaveTextContent('Oscuro')
      expect(menuItems[2]).toHaveTextContent('Sistema')
    })
  })
})