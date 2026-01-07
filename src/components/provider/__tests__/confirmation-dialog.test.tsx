import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmationDialog } from '../confirmation-dialog'

describe('ConfirmationDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Confirmar acción',
    description: '¿Estás seguro de que deseas continuar?',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  /* ================= Renderizado básico ================= */
  
  it('renderiza el diálogo cuando open es true', () => {
    render(<ConfirmationDialog {...defaultProps} />)

    expect(screen.getByText('Confirmar acción')).toBeInTheDocument()
    expect(screen.getByText('¿Estás seguro de que deseas continuar?')).toBeInTheDocument()
  })

  it('no renderiza el diálogo cuando open es false', () => {
    render(<ConfirmationDialog {...defaultProps} open={false} />)

    expect(screen.queryByText('Confirmar acción')).not.toBeInTheDocument()
  })

  it('renderiza los botones con texto por defecto', () => {
    render(<ConfirmationDialog {...defaultProps} />)

    expect(screen.getByText('Aceptar')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  /* ================= Props personalizadas ================= */

  it('usa confirmText personalizado cuando se proporciona', () => {
    render(<ConfirmationDialog {...defaultProps} confirmText="Confirmar" />)

    expect(screen.getByText('Confirmar')).toBeInTheDocument()
    expect(screen.queryByText('Aceptar')).not.toBeInTheDocument()
  })

  it('usa cancelText personalizado cuando se proporciona', () => {
    render(<ConfirmationDialog {...defaultProps} cancelText="No, volver" />)

    expect(screen.getByText('No, volver')).toBeInTheDocument()
    expect(screen.queryByText('Cancelar')).not.toBeInTheDocument()
  })

  it('renderiza título y descripción personalizados', () => {
    render(
      <ConfirmationDialog
        {...defaultProps}
        title="Eliminar usuario"
        description="Esta acción no se puede deshacer"
      />
    )

    expect(screen.getByText('Eliminar usuario')).toBeInTheDocument()
    expect(screen.getByText('Esta acción no se puede deshacer')).toBeInTheDocument()
  })

  /* ================= Interacciones ================= */

  it('llama a onConfirm cuando se hace clic en el botón de confirmar', () => {
    const onConfirm = jest.fn()
    render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />)

    const confirmButton = screen.getByText('Aceptar')
    fireEvent.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('llama a onOpenChange con false cuando se hace clic en cancelar', () => {
    const onOpenChange = jest.fn()
    render(<ConfirmationDialog {...defaultProps} onOpenChange={onOpenChange} />)

    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('NO llama a onConfirm cuando se hace clic en cancelar', () => {
    const onConfirm = jest.fn()
    render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />)

    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)

    expect(onConfirm).not.toHaveBeenCalled()
  })

  /* ================= Casos de uso reales ================= */

  it('maneja flujo completo de confirmación', () => {
    const onConfirm = jest.fn()
    const onOpenChange = jest.fn()

    const { rerender } = render(
      <ConfirmationDialog
        {...defaultProps}
        open={true}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />
    )

    // Usuario hace clic en confirmar
    fireEvent.click(screen.getByText('Aceptar'))
    expect(onConfirm).toHaveBeenCalled()

    // El componente padre cierra el diálogo
    rerender(
      <ConfirmationDialog
        {...defaultProps}
        open={false}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />
    )

    expect(screen.queryByText('Confirmar acción')).not.toBeInTheDocument()
  })

  it('maneja flujo completo de cancelación', () => {
    const onConfirm = jest.fn()
    const onOpenChange = jest.fn()

    render(
      <ConfirmationDialog
        {...defaultProps}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />
    )

    // Usuario hace clic en cancelar
    fireEvent.click(screen.getByText('Cancelar'))
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  /* ================= Accesibilidad ================= */

  it('tiene la estructura de diálogo accesible', () => {
    render(<ConfirmationDialog {...defaultProps} />)

    // AlertDialog debe tener roles ARIA apropiados
    const title = screen.getByText('Confirmar acción')
    expect(title).toBeInTheDocument()

    const description = screen.getByText('¿Estás seguro de que deseas continuar?')
    expect(description).toHaveClass('text-sm')
  })

  it('los botones son accesibles por teclado', () => {
    render(<ConfirmationDialog {...defaultProps} />)

    const confirmButton = screen.getByText('Aceptar')
    const cancelButton = screen.getByText('Cancelar')

    // Ambos botones deben ser elementos interactivos
    expect(confirmButton.tagName).toBe('BUTTON')
    expect(cancelButton.tagName).toBe('BUTTON')
  })

  /* ================= Props requeridas ================= */

  it('funciona correctamente con solo las props requeridas', () => {
    const minimalProps = {
      open: true,
      onOpenChange: jest.fn(),
      onConfirm: jest.fn(),
      title: 'Título',
      description: 'Descripción',
    }

    render(<ConfirmationDialog {...minimalProps} />)

    expect(screen.getByText('Título')).toBeInTheDocument()
    expect(screen.getByText('Descripción')).toBeInTheDocument()
    expect(screen.getByText('Aceptar')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  /* ================= Edge cases ================= */

  it('maneja título y descripción vacíos', () => {
    render(<ConfirmationDialog {...defaultProps} title="" description="" />)

    // No debería lanzar error
    expect(screen.getByText('Aceptar')).toBeInTheDocument()
  })

  it('maneja textos de botones muy largos', () => {
    render(
      <ConfirmationDialog
        {...defaultProps}
        confirmText="Sí, estoy completamente seguro de que quiero continuar con esta acción"
        cancelText="No, mejor déjame pensarlo un poco más antes de decidir"
      />
    )

    expect(
      screen.getByText('Sí, estoy completamente seguro de que quiero continuar con esta acción')
    ).toBeInTheDocument()
    expect(
      screen.getByText('No, mejor déjame pensarlo un poco más antes de decidir')
    ).toBeInTheDocument()
  })

  it('puede abrirse y cerrarse múltiples veces', () => {
    const onOpenChange = jest.fn()
    const { rerender } = render(
      <ConfirmationDialog {...defaultProps} open={true} onOpenChange={onOpenChange} />
    )

    expect(screen.getByText('Confirmar acción')).toBeInTheDocument()

    // Cerrar
    rerender(<ConfirmationDialog {...defaultProps} open={false} onOpenChange={onOpenChange} />)
    expect(screen.queryByText('Confirmar acción')).not.toBeInTheDocument()

    // Abrir nuevamente
    rerender(<ConfirmationDialog {...defaultProps} open={true} onOpenChange={onOpenChange} />)
    expect(screen.getByText('Confirmar acción')).toBeInTheDocument()

    // Cerrar nuevamente
    rerender(<ConfirmationDialog {...defaultProps} open={false} onOpenChange={onOpenChange} />)
    expect(screen.queryByText('Confirmar acción')).not.toBeInTheDocument()
  })

  it('múltiples clics en confirmar solo llaman onConfirm una vez por clic', () => {
    const onConfirm = jest.fn()
    render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />)

    const confirmButton = screen.getByText('Aceptar')
    
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledTimes(3)
  })
})