const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040/api'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Tipos de datos
export interface Liquidation {
  id: number
  collector: { name: string }
  fromDate: string
  toDate: string
  amountCollector: string
  amountLiquidation: string
  differenceAmounts: string
  recordsCollector?: number | null
  recordsLiquidation?: number | null
  debitAmountCollector?: string | null
  debitAmountLiquidation?: string | null
  creditAmountCollector?: string | null
  creditAmountLiquidation?: string | null
  unreconciledDebitAmountCollector?: string | null
  unreconciledDebitAmountLiquidation?: string | null
  unreconciledCreditAmountCollector?: string | null
  unreconciledCreditAmountLiquidation?: string | null
  unreconciledAmountCollector?: string | null
  unreconciledAmountLiquidation?: string | null
  createdAt: string
  createdBy?: { firstName: string; lastName: string }
  files: Array<{
    id: number
    liquidationFilesType: number
    filePath: string
    createdAt: string
  }>
}

export interface Conciliation {
  id: number
  collector: { name: string }
  fromDate: string
  toDate: string
  amount: string
  amountCollector: string
  differenceAmounts: string
  recordsCalimaco: number
  recordsCollector: number
  unreconciledRecordsCalimaco: number
  unreconciledRecordsCollector: number
  unreconciledAmountCalimaco: string
  unreconciledAmountCollector: string
  createdAt: string
  createdBy?: { firstName: string; lastName: string }
  files: Array<{
    id: number
    conciliationFilesType: number
    filePath: string
    createdAt: string
  }>
}

export interface Discrepancy {
  id: number
  idReport: number
  status: 'new' | 'pending' | 'closed'
  difference: string
  methodProcess: 'liquidations' | 'conciliations'
  createdAt: string
  updatedAT: string
  liquidation?: {
    id: number
    collector: { name: string }
    [key: string]: any
  } | null
  conciliation?: {
    id: number
    collector: { name: string }
    [key: string]: any
  } | null
}

// Utilidades
function formatDateForAPI(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return ''
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
}

// API de Liquidaciones
export const liquidationsApi = {
  async getAll(): Promise<Liquidation[]> {
    const response = await fetch(`${API_URL}/liquidations`)
    if (!response.ok) throw new Error('Error al obtener liquidaciones')
    return response.json()
  },

  async getByCollector(collector: string): Promise<Liquidation[]> {
    const response = await fetch(`${API_URL}/liquidations/collector/${encodeURIComponent(collector)}`)
    if (!response.ok) throw new Error('Error al obtener liquidaciones por recaudador')
    return response.json()
  },

  async getByDateRange(fromDate: string, toDate: string): Promise<Liquidation[]> {
    const from = formatDateForAPI(fromDate)
    const to = formatDateForAPI(toDate)
    const response = await fetch(`${API_URL}/liquidations/range?from=${from}&to=${to}`)
    if (!response.ok) throw new Error('Error al obtener liquidaciones por rango de fechas')
    return response.json()
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/liquidations/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Error al eliminar liquidacion')
  }
}

// API de Conciliaciones
export const conciliationsApi = {
  async getAll(): Promise<Conciliation[]> {
    const response = await fetch(`${API_URL}/conciliations`)
    if (!response.ok) throw new Error('Error al obtener conciliaciones')
    return response.json()
  },

  async getByCollector(collector: string): Promise<Conciliation[]> {
    const response = await fetch(`${API_URL}/conciliations/collector/${encodeURIComponent(collector)}`)
    if (!response.ok) throw new Error('Error al obtener conciliaciones por recaudador')
    return response.json()
  },

  async getByDateRange(fromDate: string, toDate: string): Promise<Conciliation[]> {
    const from = formatDateForAPI(fromDate)
    const to = formatDateForAPI(toDate)
    const response = await fetch(`${API_URL}/conciliations/range?from=${from}&to=${to}`)
    if (!response.ok) throw new Error('Error al obtener conciliaciones por rango de fechas')
    return response.json()
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/conciliations/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Error al eliminar conciliacion')
  }
}

// API de Discrepancias
export const discrepanciesApi = {
  async getAll(): Promise<Discrepancy[]> {
    const response = await fetch(`${API_URL}/reconciliation-discrepancies`)
    if (!response.ok) throw new Error('Error al obtener discrepancias')
    return response.json()
  },

  async getByDateRange(fromDate: string, toDate: string): Promise<Discrepancy[]> {
    const from = formatDateForAPI(fromDate)
    const to = formatDateForAPI(toDate)
    const response = await fetch(`${API_URL}/reconciliation-discrepancies/range?from=${from}&to=${to}`)
    if (!response.ok) throw new Error('Error al obtener discrepancias por rango de fechas')
    return response.json()
  },

  async getByStatus(status: 'new' | 'pending' | 'closed'): Promise<Discrepancy[]> {
    const response = await fetch(`${API_URL}/reconciliation-discrepancies/status/${status}`)
    if (!response.ok) throw new Error('Error al obtener discrepancias por estado')
    return response.json()
  },

  async updateStatus(id: number, status: 'pending' | 'closed'): Promise<void> {
    const response = await fetch(`${API_URL}/reconciliation-discrepancies/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (!response.ok) throw new Error('Error al actualizar estado')
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/reconciliation-discrepancies/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Error al eliminar discrepancia')
  }
}

// API de Dashboard
export const dashboardApi = {
  async getSummary(collectorIds: string, fromDate: string, toDate: string, endpoint: 'liquidations' | 'conciliations') {
    const url = `${API_URL}/${endpoint}/summary?collectorIds=${collectorIds}&fromDate=${fromDate}&toDate=${toDate}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Error al obtener resumen')
    return response.json()
  }
}

// API de Descargas
export const downloadApi = {
  async downloadFile(filePath: string): Promise<boolean> {
    try {
      const cleanedPath = filePath.replace(/^s3:\/\/[^\/]+\//, '')
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      const downloadUrl = `${API_BASE_URL}/digital/download/${cleanedPath}`
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: { 'x-api-key': apiKey || '' },
        redirect: 'manual'
      })

      if (response.status === 302 || response.status === 307) {
        const presignedUrl = response.headers.get('Location')
        if (presignedUrl) {
          window.open(presignedUrl, '_blank')
          return true
        }
      } else if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.open(data.url, '_blank')
          return true
        }
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = cleanedPath.split('/').pop() || 'download'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      return true
    } catch (error) {
      console.error('Error en descarga:', error)
      return false
    }
  }
}