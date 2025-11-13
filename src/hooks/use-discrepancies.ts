import { useState, useEffect } from 'react'
import { discrepanciesApi, type Discrepancy } from '@/lib/api'
import { toast } from 'sonner'

export function useDiscrepancies() {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDiscrepancies = async () => {
    try {
      setLoading(true)
      const data = await discrepanciesApi.getAll()
      setDiscrepancies(data)
    } catch (error) {
      console.error('Error fetching discrepancies:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: number, status: 'pending' | 'closed') => {
    try {
      await discrepanciesApi.updateStatus(id, status)
      await fetchDiscrepancies()
      toast.success('Estado actualizado correctamente')
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const deleteDiscrepancy = async (id: number) => {
    try {
      await discrepanciesApi.delete(id)
      await fetchDiscrepancies()
      toast.success('Discrepancia eliminada correctamente')
    } catch (error) {
      toast.error('Error al eliminar discrepancia')
    }
  }

  useEffect(() => {
    fetchDiscrepancies()
  }, [])

  const hasNewDiscrepancies = discrepancies.some(d => d.status === 'new' || d.status === 'pending')

  return {
    discrepancies,
    loading,
    hasNewDiscrepancies,
    updateStatus,
    deleteDiscrepancy,
    refetch: fetchDiscrepancies
  }
}