import { renderHook, waitFor, act } from '@testing-library/react'
import { useDiscrepancies } from '../use-discrepancies' // Ajusta la ruta
import { discrepanciesApi } from '@/lib/api'
import { toast } from 'sonner'

// Mock de la API y de Sonner
jest.mock('@/lib/api', () => ({
  discrepanciesApi: {
    getAll: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('useDiscrepancies Hook', () => {
  const mockData = [
    { id: 1, status: 'new', description: 'Test 1' },
    { id: 2, status: 'closed', description: 'Test 2' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    // Configuración por defecto para getAll
    ;(discrepanciesApi.getAll as jest.Mock).mockResolvedValue(mockData)
  })

  it('debe cargar las discrepancias al montar el hook', async () => {
    const { result } = renderHook(() => useDiscrepancies())

    // Estado inicial: loading debe ser true al principio
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.discrepancies).toEqual(mockData)
    expect(discrepanciesApi.getAll).toHaveBeenCalledTimes(1)
  })

  it('debe calcular correctamente hasNewDiscrepancies', async () => {
    const { result } = renderHook(() => useDiscrepancies())

    await waitFor(() => {
      expect(result.current.discrepancies).toHaveLength(2)
    })

    // Como hay una con status 'new', debe ser true
    expect(result.current.hasNewDiscrepancies).toBe(true)
  })

  it('debe actualizar el estado y mostrar toast de éxito', async () => {
    ;(discrepanciesApi.updateStatus as jest.Mock).mockResolvedValue({})
    const { result } = renderHook(() => useDiscrepancies())

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateStatus(1, 'closed')
    })

    expect(discrepanciesApi.updateStatus).toHaveBeenCalledWith(1, 'closed')
    expect(discrepanciesApi.getAll).toHaveBeenCalledTimes(2) // Una al montar, otra al actualizar
    expect(toast.success).toHaveBeenCalledWith('Estado actualizado correctamente')
  })

  it('debe manejar errores al actualizar el estado', async () => {
    ;(discrepanciesApi.updateStatus as jest.Mock).mockRejectedValue(new Error('API Error'))
    const { result } = renderHook(() => useDiscrepancies())

    await act(async () => {
      await result.current.updateStatus(1, 'closed')
    })

    expect(toast.error).toHaveBeenCalledWith('Error al actualizar estado')
  })

  it('debe eliminar una discrepancia y refrescar la lista', async () => {
    ;(discrepanciesApi.delete as jest.Mock).mockResolvedValue({})
    const { result } = renderHook(() => useDiscrepancies())

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteDiscrepancy(1)
    })

    expect(discrepanciesApi.delete).toHaveBeenCalledWith(1)
    expect(discrepanciesApi.getAll).toHaveBeenCalledTimes(2)
    expect(toast.success).toHaveBeenCalledWith('Discrepancia eliminada correctamente')
  })

  it('debe manejar errores al eliminar', async () => {
    ;(discrepanciesApi.delete as jest.Mock).mockRejectedValue(new Error('Delete Error'))
    const { result } = renderHook(() => useDiscrepancies())

    await act(async () => {
      await result.current.deleteDiscrepancy(1)
    })

    expect(toast.error).toHaveBeenCalledWith('Error al eliminar discrepancia')
  })
})