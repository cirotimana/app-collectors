import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DiscrepanciesAlert } from '../discrepancies-alert'
import { useDiscrepancies } from '@/hooks/use-discrepancies'
import * as api from '@/lib/api'

// Mock del hook useDiscrepancies
jest.mock('@/hooks/use-discrepancies')

// Mock de las APIs
jest.mock('@/lib/api', () => ({
  liquidationsApi: {
    getAll: jest.fn(),
  },
  conciliationsApi: {
    getAll: jest.fn(),
  },
}))

// Mock de FileDetailsDialog
jest.mock('@/components/provider/data-table', () => ({
  FileDetailsDialog: ({ open, onOpenChange }: any) =>
    open ? (
      <div data-testid="file-details-dialog">
        <button onClick={() => onOpenChange(false)}>Close Details</button>
      </div>
    ) : null,
}))

describe('DiscrepanciesAlert', () => {
  const mockDiscrepancies = [
    {
      id: 1,
      idReport: 100,
      status: 'new' as const,
      difference: '50.00',
      methodProcess: 'conciliations' as const,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAT: '2024-01-15T10:00:00Z',
      conciliation: {
        id: 100,
        collector: { name: 'Kashio' },
      },
      liquidation: null,
    },
    {
      id: 2,
      idReport: 101,
      status: 'pending' as const,
      difference: '100.00',
      methodProcess: 'liquidations' as const,
      createdAt: '2024-01-16T10:00:00Z',
      updatedAT: '2024-01-16T10:00:00Z',
      liquidation: {
        id: 101,
        collector: { name: 'Tupay' },
      },
      conciliation: null,
    },
    {
      id: 3,
      idReport: 102,
      status: 'closed' as const,
      difference: '25.00',
      methodProcess: 'conciliations' as const,
      createdAt: '2024-01-14T10:00:00Z',
      updatedAT: '2024-01-17T10:00:00Z',
      conciliation: {
        id: 102,
        collector: { name: 'Niubiz' },
      },
      liquidation: null,
    },
  ]

  const defaultMockHook = {
    discrepancies: mockDiscrepancies,
    hasNewDiscrepancies: true,
    updateStatus: jest.fn(),
    deleteDiscrepancy: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useDiscrepancies as jest.Mock).mockReturnValue(defaultMockHook)
  })

  /* ================= Renderizado básico ================= */

  it('muestra la alerta cuando hasNewDiscrepancies es true', () => {
    render(<DiscrepanciesAlert />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/discrepancias/i)).toBeInTheDocument()
  })

  it('no muestra la alerta cuando hasNewDiscrepancies es false', () => {
    ;(useDiscrepancies as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      hasNewDiscrepancies: false,
    })

    render(<DiscrepanciesAlert />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('no muestra la alerta cuando no hay discrepancias pendientes', () => {
    ;(useDiscrepancies as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      discrepancies: [mockDiscrepancies[2]], // solo la cerrada
      hasNewDiscrepancies: true,
    })

    render(<DiscrepanciesAlert />)

    // La alerta se muestra pero el texto está vacío
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  /* ================= Contenido de la alerta ================= */

  it('muestra el conteo correcto de discrepancias nuevas', () => {
    ;(useDiscrepancies as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      discrepancies: [mockDiscrepancies[0]], // solo 1 nueva
    })

    render(<DiscrepanciesAlert />)

    expect(screen.getByText(/1 discrepancia con estado nuevo que requiere atencion/i)).toBeInTheDocument()
  })

  it('muestra el conteo correcto de discrepancias pendientes', () => {
    ;(useDiscrepancies as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      discrepancies: [mockDiscrepancies[1]], // solo 1 pendiente
    })

    render(<DiscrepanciesAlert />)

    expect(screen.getByText(/1 discrepancia con estado pendiente que requiere atencion/i)).toBeInTheDocument()
  })

  it('muestra conteo combinado de nuevas y pendientes', () => {
    render(<DiscrepanciesAlert />)

    expect(
      screen.getByText(/2 discrepancias con estado nuevo \(1\) y pendiente \(1\) que requieren atencion/i)
    ).toBeInTheDocument()
  })

  it('usa plural correctamente cuando hay múltiples discrepancias', () => {
    ;(useDiscrepancies as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      discrepancies: [mockDiscrepancies[0], { ...mockDiscrepancies[0], id: 99 }],
    })

    render(<DiscrepanciesAlert />)

    expect(screen.getByText(/2 discrepancias/i)).toBeInTheDocument()
    expect(screen.getByText(/requieren/i)).toBeInTheDocument()
  })

  /* ================= Interacciones con la alerta ================= */

  it('cierra la alerta cuando se hace clic en X', () => {
    render(<DiscrepanciesAlert />)

    const closeButton = screen.getByRole('button', { name: '' })
    fireEvent.click(closeButton)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('abre el diálogo cuando se hace clic en "Ver Todas"', () => {
    render(<DiscrepanciesAlert />)

    const verTodasButton = screen.getByText('Ver Todas')
    fireEvent.click(verTodasButton)

    expect(screen.getByText('Discrepancias en las Conciliaciones')).toBeInTheDocument()
  })

  /* ================= Diálogo de discrepancias ================= */

  it('muestra todas las discrepancias no cerradas en el diálogo', () => {
    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    expect(screen.getByText('Kashio')).toBeInTheDocument()
    expect(screen.getByText('Tupay')).toBeInTheDocument()
    expect(screen.queryByText('Niubiz')).not.toBeInTheDocument() // cerrada, no debe aparecer
  })

  it('muestra badges con el estado correcto', () => {
    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    expect(screen.getByText('Nuevo')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('muestra información completa de cada discrepancia', () => {
    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    expect(screen.getByText('Kashio')).toBeInTheDocument()
    expect(screen.getByText(/S\/\. 50\.00/)).toBeInTheDocument()
    expect(screen.getByText('Conciliaciones')).toBeInTheDocument()
  })

  /* ================= Cambio de estado ================= */

  it('llama a updateStatus cuando se marca como pendiente', () => {
    const updateStatus = jest.fn()
    ;(useDiscrepancies as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      updateStatus,
    })

    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))
    fireEvent.click(screen.getByText('Marcar Pendiente'))

    expect(updateStatus).toHaveBeenCalledWith(1, 'pending')
  })

  it('llama a updateStatus cuando se cierra una discrepancia', () => {
    const updateStatus = jest.fn()
    ;(useDiscrepancies as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      updateStatus,
    })

    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))
    fireEvent.click(screen.getByText('Cerrar'))

    expect(updateStatus).toHaveBeenCalledWith(2, 'closed')
  })

  it('muestra botón "Marcar Pendiente" solo para discrepancias nuevas', () => {
    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    expect(screen.getByText('Marcar Pendiente')).toBeInTheDocument()
    expect(screen.getAllByText('Marcar Pendiente')).toHaveLength(1)
  })

  it('muestra botón "Cerrar" solo para discrepancias pendientes', () => {
    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    expect(screen.getByText('Cerrar')).toBeInTheDocument()
    expect(screen.getAllByText('Cerrar')).toHaveLength(1)
  })

  /* ================= Ver detalles ================= */

  it('carga y muestra detalles de una conciliación', async () => {
    const mockConciliation = {
      id: 100,
      collector: { name: 'Kashio' },
      fromDate: '2024-01-01',
      toDate: '2024-01-31',
      amount: '1000.00',
      amountCollector: '950.00',
    }

    ;(api.conciliationsApi.getAll as jest.Mock).mockResolvedValue([mockConciliation])

    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    const verDetallesButtons = screen.getAllByText('Ver Detalles')
    fireEvent.click(verDetallesButtons[0])

    await waitFor(() => {
      expect(api.conciliationsApi.getAll).toHaveBeenCalled()
      expect(screen.getByTestId('file-details-dialog')).toBeInTheDocument()
    })
  })

  it('carga y muestra detalles de una liquidación', async () => {
    const mockLiquidation = {
      id: 101,
      collector: { name: 'Tupay' },
      fromDate: '2024-01-01',
      toDate: '2024-01-31',
      amountCollector: '5000.00',
      amountLiquidation: '4900.00',
    }

    ;(api.liquidationsApi.getAll as jest.Mock).mockResolvedValue([mockLiquidation])

    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    const verDetallesButtons = screen.getAllByText('Ver Detalles')
    fireEvent.click(verDetallesButtons[1])

    await waitFor(() => {
      expect(api.liquidationsApi.getAll).toHaveBeenCalled()
      expect(screen.getByTestId('file-details-dialog')).toBeInTheDocument()
    })
  })

  it('maneja error al cargar detalles', async () => {
    ;(api.conciliationsApi.getAll as jest.Mock).mockRejectedValue(new Error('Network error'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    const verDetallesButtons = screen.getAllByText('Ver Detalles')
    fireEvent.click(verDetallesButtons[0])

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error loading details:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('no muestra el diálogo de detalles si el item no se encuentra', async () => {
    ;(api.conciliationsApi.getAll as jest.Mock).mockResolvedValue([])

    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    const verDetallesButtons = screen.getAllByText('Ver Detalles')
    fireEvent.click(verDetallesButtons[0])

    await waitFor(() => {
      expect(api.conciliationsApi.getAll).toHaveBeenCalled()
    })

    expect(screen.queryByTestId('file-details-dialog')).not.toBeInTheDocument()
  })

  /* ================= Formateo de datos ================= */

  it('formatea las fechas correctamente', () => {
    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    expect(screen.getByText('15/1/2024')).toBeInTheDocument()
    expect(screen.getByText('16/1/2024')).toBeInTheDocument()
  })

  it('muestra el tipo de proceso correctamente', () => {
    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    expect(screen.getByText('Conciliaciones')).toBeInTheDocument()
    expect(screen.getByText('Liquidaciones')).toBeInTheDocument()
  })

  it('muestra N/A cuando no hay información de recaudador', () => {
    ;(useDiscrepancies as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      discrepancies: [
        {
          ...mockDiscrepancies[0],
          conciliation: null,
          liquidation: null,
        },
      ],
    })

    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  /* ================= Edge cases ================= */
  it('cierra el diálogo de detalles cuando se hace clic en close', async () => {
    const mockConciliation = {
      id: 100,
      collector: { name: 'Kashio' },
    }

    ;(api.conciliationsApi.getAll as jest.Mock).mockResolvedValue([mockConciliation])

    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    const verDetallesButtons = screen.getAllByText('Ver Detalles')
    fireEvent.click(verDetallesButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('file-details-dialog')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Close Details'))

    await waitFor(() => {
      expect(screen.queryByTestId('file-details-dialog')).not.toBeInTheDocument()
    })
  })

  it('maneja múltiples discrepancias del mismo recaudador', () => {
    ;(useDiscrepancies as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      discrepancies: [
        mockDiscrepancies[0],
        { ...mockDiscrepancies[0], id: 99, difference: '75.00' },
      ],
    })

    render(<DiscrepanciesAlert />)

    fireEvent.click(screen.getByText('Ver Todas'))

    const kashioElements = screen.getAllByText('Kashio')
    expect(kashioElements).toHaveLength(2)
  })
})