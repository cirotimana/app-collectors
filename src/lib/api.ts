import { fetchWithAuth } from './api-client'

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
    const response = await fetchWithAuth(`${API_URL}/liquidations`)
    if (!response.ok) throw new Error('Error al obtener liquidaciones')
    return response.json()
  },

  async getByCollector(collector: string): Promise<Liquidation[]> {
    const response = await fetchWithAuth(`${API_URL}/liquidations/collector/${encodeURIComponent(collector)}`)
    if (!response.ok) throw new Error('Error al obtener liquidaciones por recaudador')
    return response.json()
  },

  async getByDateRange(fromDate: string, toDate: string): Promise<Liquidation[]> {
    const from = formatDateForAPI(fromDate)
    const to = formatDateForAPI(toDate)
    const response = await fetchWithAuth(`${API_URL}/liquidations/range?from=${from}&to=${to}`)
    if (!response.ok) throw new Error('Error al obtener liquidaciones por rango de fechas')
    return response.json()
  },

  async delete(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/liquidations/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Error al eliminar liquidacion')
  }
}

// API de Conciliaciones
export const conciliationsApi = {
  async getAll(): Promise<Conciliation[]> {
    const response = await fetchWithAuth(`${API_URL}/conciliations`)
    if (!response.ok) throw new Error('Error al obtener conciliaciones')
    return response.json()
  },

  async getByCollector(collector: string): Promise<Conciliation[]> {
    const response = await fetchWithAuth(`${API_URL}/conciliations/collector/${encodeURIComponent(collector)}`)
    if (!response.ok) throw new Error('Error al obtener conciliaciones por recaudador')
    return response.json()
  },

  async getByDateRange(fromDate: string, toDate: string): Promise<Conciliation[]> {
    const from = formatDateForAPI(fromDate)
    const to = formatDateForAPI(toDate)
    const response = await fetchWithAuth(`${API_URL}/conciliations/range?from=${from}&to=${to}`)
    if (!response.ok) throw new Error('Error al obtener conciliaciones por rango de fechas')
    return response.json()
  },

  async delete(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/conciliations/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Error al eliminar conciliacion')
  }
}

// API de Discrepancias
export const discrepanciesApi = {
  async getAll(): Promise<Discrepancy[]> {
    const response = await fetchWithAuth(`${API_URL}/reconciliation-discrepancies`)
    if (!response.ok) throw new Error('Error al obtener discrepancias')
    return response.json()
  },

  async getByDateRange(fromDate: string, toDate: string): Promise<Discrepancy[]> {
    const from = formatDateForAPI(fromDate)
    const to = formatDateForAPI(toDate)
    const response = await fetchWithAuth(`${API_URL}/reconciliation-discrepancies/range?from=${from}&to=${to}`)
    if (!response.ok) throw new Error('Error al obtener discrepancias por rango de fechas')
    return response.json()
  },

  async getByStatus(status: 'new' | 'pending' | 'closed'): Promise<Discrepancy[]> {
    const response = await fetchWithAuth(`${API_URL}/reconciliation-discrepancies/status/${status}`)
    if (!response.ok) throw new Error('Error al obtener discrepancias por estado')
    return response.json()
  },

  async updateStatus(id: number, status: 'pending' | 'closed'): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/reconciliation-discrepancies/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (!response.ok) throw new Error('Error al actualizar estado')
  },

  async delete(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/reconciliation-discrepancies/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Error al eliminar discrepancia')
  }
}

// API de Dashboard
export const dashboardApi = {
  async getSummary(collectorIds: string, fromDate: string, toDate: string, endpoint: 'liquidations' | 'conciliations') {
    const url = `${API_URL}/${endpoint}/summary?collectorIds=${collectorIds}&fromDate=${fromDate}&toDate=${toDate}`
    const response = await fetchWithAuth(url)
    if (!response.ok) throw new Error('Error al obtener resumen')
    return response.json()
  },

  async getStats(collectorId: number, fromDate: string, toDate: string, endpoint: 'liquidations' | 'conciliations') {
    const url = `${API_URL}/${endpoint}/stats?collectorId=${collectorId}&fromDate=${fromDate}&toDate=${toDate}`
    const response = await fetchWithAuth(url)
    if (!response.ok) throw new Error('Error al obtener estadisticas')
    return response.json()
  }
}

// Endpoints de procesamiento
const PROCESS_ENDPOINTS = {
  conciliacion: {
    kashio: "execute-getkashio",
    monnet: "execute-getmonnet",
    kushki: "execute-getkushki",
    niubiz: "execute-getniubiz",
    yape: "execute-getyape",
    nuvei: "execute-getnuvei",
    pagoefectivo: "execute-getpagoefectivo",
    safetypay: "execute-getsafetypay",
    tupay: "execute-gettupay",
  },
  liquidacion: {
    kashio: "execute-liqkashio",
    tupay: "execute-liqtupay",
    pagoefectivo: "execute-liqpagoefectivo",
  },
}

const DIGITAL_ENDPOINTS = {
  dnicorrelativos: "execute-dnicorrelatives",
  concentracionips: "execute-concentratorip",
}

// API de Procesamiento
export const processApi = {
  async executeProcess(tipo: 'conciliacion' | 'liquidacion', recaudador: string, fromDate: string, toDate: string) {
    const endpoint = PROCESS_ENDPOINTS[tipo]?.[recaudador as keyof typeof PROCESS_ENDPOINTS[typeof tipo]]
    if (!endpoint) throw new Error(`Endpoint no encontrado para ${tipo} - ${recaudador}`)
    
    const apiKey = process.env.NEXT_PUBLIC_API_KEY
    const url = `${API_BASE_URL}/digital/${endpoint}?from_date=${fromDate}&to_date=${toDate}`
    
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: { 'x-api-key': apiKey || '' },
    })
    
    const data = await response.json().catch(() => ({ message: 'Error desconocido' }))
    
    if (!response.ok) {
      // El backend ya envia el mensaje formateado correctamente
      const errorMessage = data.detail?.message || data.detail || data.message || `Error ${response.status}`
      throw new Error(errorMessage)
    }
    
    return data
  },

  async executeDigitalProcess(proceso: 'dnicorrelativos' | 'concentracionips') {
    const endpoint = DIGITAL_ENDPOINTS[proceso]
    if (!endpoint) throw new Error(`Endpoint no encontrado para ${proceso}`)
    
    const apiKey = process.env.NEXT_PUBLIC_API_KEY
    const url = `${API_BASE_URL}/digital/${endpoint}`
    
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: { 'x-api-key': apiKey || '' },
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
      throw new Error(errorData.message || `Error ${response.status}`)
    }
    
    return response.json()
  }
}

// Tipos para los nuevos endpoints de BD
export interface ConciliationReport {
  report_fecha: string
  report_collector_id: number
  aprobados_calimaco: number
  conciliados_calimaco: number
  no_conciliados_calimaco: number
  porcentaje_conciliado_calimaco: string
  porcentaje_no_conciliado_calimaco: string
  monto_total_calimaco: string
  monto_conciliado_calimaco: string
  monto_no_conciliado_calimaco: string
  porcentaje_monto_conciliado_calimaco: string
  porcentaje_monto_no_conciliado_calimaco: string
  aprobados_collector: number
  conciliados_collector: number
  no_conciliados_collector: number
  porcentaje_conciliado_collector: string
  porcentaje_no_conciliado_collector: string
  monto_total_collector: string
  monto_conciliado_collector: string
  monto_no_conciliado_collector: string
  porcentaje_monto_conciliado_collector: string
  porcentaje_monto_no_conciliado_collector: string
}

export interface ConciliatedRecord {
  calimaco_id: number
  collector_id: number
  calimaco_original: string
  calimaco_normalized: string
  calimaco_date: string
  modification_date: string
  calimaco_status: string
  calimaco_amount: string
  external_id: string
  comments: string
  collector_record_id: number
  collector_date: string
  collector_calimaco_id: string
  provider_id: string
  client_name: string
  collector_amount: string
  provider_status: string
  estado: string
}

export interface NonConciliatedRecord {
  calimaco_id: number
  collector_id: number
  calimaco_normalized: string
  record_date: string
  status_calimaco: string
  amount: string
  status_match: string
  collector_record_id: number | null
  collector_amount: string | null
  status_collector: string | null
}

export interface SalesReport {
  recaudador_nombre: string
  fecha_desde: string
  fecha_hasta: string
  venta_calimaco: string
  venta_recaudador: string
  diferencia: string
  cantidad_calimaco: string
  cantidad_recaudador: string
  diferencia_cantidad: string
}

export interface CalimacoRecord {
  id: number
  collectorId: number
  calimacoId: string
  calimacoIdNormalized: string
  recordDate: string
  modificationDate: string
  status: string
  userId: string
  amount: string
  externalId: string
  comments: string
  createdAt: string
  updatedAt: string
  collector: {
    id: number
    name: string
    createdAt: string
    createdById: number
    updatedAt: string
    updatedById: number
  }
}

export interface CollectorRecord {
  id: number
  collectorId: number
  recordDate: string
  calimacoId: string
  calimacoIdNormalized: string
  providerId: string
  clientName: string
  amount: string
  providerStatus: string
  createdAt: string
  updatedAt: string
  collector: {
    id: number
    name: string
    createdAt: string
    createdById: number
    updatedAt: string
    updatedById: number
  }
}

// API de Reportes de Conciliacion
export const conciliationReportsApi = {
  async getCompleteReport(collectorIds: number[], fromDate: string, toDate: string, page = 1, limit = 50): Promise<PaginatedResponse<ConciliationReport>> {
    const params = new URLSearchParams({
      collectorIds: collectorIds.join(','),
      fromDate,
      toDate,
      page: page.toString(),
      limit: limit.toString()
    })
    const response = await fetchWithAuth(`${API_URL}/conciliation-reports/conciliacion-completa-por-dia?${params}`)
    if (!response.ok) throw new Error('Error al obtener reporte completo')
    return response.json()
  },

  async getConciliatedRecords(collectorIds: number[], fromDate: string, toDate: string, page = 1, limit = 20): Promise<PaginatedResponse<ConciliatedRecord>> {
    const params = new URLSearchParams({
      collectorIds: collectorIds.join(','),
      fromDate,
      toDate,
      page: page.toString(),
      limit: limit.toString()
    })
    const response = await fetchWithAuth(`${API_URL}/conciliation-reports/conciliados?${params}`)
    if (!response.ok) throw new Error('Error al obtener registros conciliados')
    return response.json()
  },

  async getNonConciliatedRecords(collectorIds: number[], fromDate: string, toDate: string, page = 1, limit = 20): Promise<PaginatedResponse<NonConciliatedRecord>> {
    const params = new URLSearchParams({
      collectorIds: collectorIds.join(','),
      fromDate,
      toDate,
      page: page.toString(),
      limit: limit.toString()
    })
    const response = await fetchWithAuth(`${API_URL}/conciliation-reports/no-conciliados?${params}`)
    if (!response.ok) throw new Error('Error al obtener registros no conciliados')
    return response.json()
  },

  async getSalesReport(collectorIds: number[], fromDate: string, toDate: string, page = 1, limit = 20): Promise<PaginatedResponse<ConciliationReport>> {
    const params = new URLSearchParams({
      collectorIds: collectorIds.join(','),
      fromDate,
      toDate,
      page: page.toString(),
      limit: limit.toString()
    })
    const response = await fetchWithAuth(`${API_URL}/conciliation-reports/reporte-ventas-recaudadores?${params}`)
    if (!response.ok) throw new Error('Error al obtener reporte de ventas')
    return response.json()
  },

  async fetchAllConciliatedRecords(collectorIds: number[], fromDate: string, toDate: string): Promise<ConciliatedRecord[]> {
    let allRecords: ConciliatedRecord[] = []
    let page = 1
    let totalPages = 1
    const limit = 1000 // Larger limit for efficiency

    do {
      const response = await this.getConciliatedRecords(collectorIds, fromDate, toDate, page, limit)
      allRecords = [...allRecords, ...response.data]
      totalPages = response.totalPages
      page++
    } while (page <= totalPages)

    return allRecords
  },

  async fetchAllNonConciliatedRecords(collectorIds: number[], fromDate: string, toDate: string): Promise<NonConciliatedRecord[]> {
    let allRecords: NonConciliatedRecord[] = []
    let page = 1
    let totalPages = 1
    const limit = 1000

    do {
      const response = await this.getNonConciliatedRecords(collectorIds, fromDate, toDate, page, limit)
      allRecords = [...allRecords, ...response.data]
      totalPages = response.totalPages
      page++
    } while (page <= totalPages)

    return allRecords
  }
}

// Interfaz para paginacion
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// API de Registros Calimaco
export const calimacoRecordsApi = {
  async getAll(page = 1, limit = 20, collectorId?: number, fromDate?: string, toDate?: string, status?: string): Promise<PaginatedResponse<CalimacoRecord>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    
    if (collectorId) params.append('collectorId', collectorId.toString())
    if (fromDate) params.append('fromDate', fromDate)
    if (toDate) params.append('toDate', toDate)
    if (status) params.append('status', status)
    
    const response = await fetchWithAuth(`${API_URL}/calimaco-records/filter?${params}`)
    if (!response.ok) throw new Error('Error al obtener registros Calimaco')
    return response.json()
  },

  async getById(id: number): Promise<CalimacoRecord> {
    const response = await fetchWithAuth(`${API_URL}/calimaco-records/${id}`)
    if (!response.ok) throw new Error('Error al obtener registro Calimaco')
    return response.json()
  },

  async update(id: number, data: Partial<CalimacoRecord>): Promise<CalimacoRecord> {
    const response = await fetchWithAuth(`${API_URL}/calimaco-records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Error al actualizar registro Calimaco')
    return response.json()
  },

  async delete(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/calimaco-records/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Error al eliminar registro Calimaco')
  },

  async getByCollector(collectorId: number): Promise<CalimacoRecord[]> {
    const response = await fetchWithAuth(`${API_URL}/calimaco-records/by-collector/${collectorId}`)
    if (!response.ok) throw new Error('Error al obtener registros por recaudador')
    return response.json()
  },

  async getByStatus(status: string): Promise<CalimacoRecord[]> {
    const response = await fetchWithAuth(`${API_URL}/calimaco-records/by-status?status=${encodeURIComponent(status)}`)
    if (!response.ok) throw new Error('Error al obtener registros por estado')
    return response.json()
  },

  async getByCalimacoId(calimacoId: string): Promise<CalimacoRecord[]> {
    const response = await fetchWithAuth(`${API_URL}/calimaco-records/by-calimaco-id/${encodeURIComponent(calimacoId)}`)
    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      throw new Error('Error al buscar por Calimaco ID')
    }
    return response.json()
  }
}

// API de Registros Collector
export const collectorRecordsApi = {
  async getAll(page = 1, limit = 20, collectorId?: number, fromDate?: string, toDate?: string, providerStatus?: string): Promise<PaginatedResponse<CollectorRecord>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    
    if (collectorId) params.append('collectorId', collectorId.toString())
    if (fromDate) params.append('fromDate', fromDate)
    if (toDate) params.append('toDate', toDate)
    if (providerStatus) params.append('providerStatus', providerStatus)
    
    const response = await fetchWithAuth(`${API_URL}/collector-records/filter?${params}`)
    if (!response.ok) throw new Error('Error al obtener registros Collector')
    return response.json()
  },

  async getById(id: number): Promise<CollectorRecord> {
    const response = await fetchWithAuth(`${API_URL}/collector-records/${id}`)
    if (!response.ok) throw new Error('Error al obtener registro Collector')
    return response.json()
  },

  async update(id: number, data: Partial<CollectorRecord>): Promise<CollectorRecord> {
    const response = await fetchWithAuth(`${API_URL}/collector-records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Error al actualizar registro Collector')
    return response.json()
  },

  async delete(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/collector-records/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Error al eliminar registro Collector')
  },

  async getByCollector(collectorId: number): Promise<CollectorRecord[]> {
    const response = await fetchWithAuth(`${API_URL}/collector-records/by-collector/${collectorId}`)
    if (!response.ok) throw new Error('Error al obtener registros por recaudador')
    return response.json()
  },

  async getByProviderStatus(providerStatus: string): Promise<CollectorRecord[]> {
    const response = await fetchWithAuth(`${API_URL}/collector-records/by-provider-status?providerStatus=${encodeURIComponent(providerStatus)}`)
    if (!response.ok) throw new Error('Error al obtener registros por estado del proveedor')
    return response.json()
  },

  async getByCalimacoId(calimacoId: string): Promise<CollectorRecord[]> {
    const response = await fetchWithAuth(`${API_URL}/collector-records/by-calimaco-id/${encodeURIComponent(calimacoId)}`)
    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      throw new Error('Error al buscar por Calimaco ID')
    }
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
      
      const response = await fetchWithAuth(downloadUrl, {
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
  },

  async downloadProcessedFile(tipo: 'conciliaciones' | 'liquidaciones', fileName: string): Promise<boolean> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      const downloadUrl = `${API_BASE_URL}/digital/apps/total-secure/${tipo}/processed/${fileName}`
      
      const response = await fetchWithAuth(downloadUrl, {
        method: 'GET',
        headers: { 'x-api-key': apiKey || '' },
      })

      if (!response.ok) throw new Error('Error al descargar archivo procesado')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      return true
    } catch (error) {
      console.error('Error en descarga de archivo procesado:', error)
      return false
    }
  }
}

// tipos para roles
export interface Role {
  id: number
  name: string
  description: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface UserRole {
  id: number
  userId: number
  roleId: number
  role: Role
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

// tipos para usuarios
export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  username: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  userRoles?: UserRole[]
}

export interface CreateUserData {
  firstName: string
  lastName: string
  email: string
  username: string
  password: string
  roleId: number
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  email?: string
  username?: string
  password?: string
  roleId?: number
}

export interface PaginatedUsers {
  data: User[]
  total: number
}

export interface CreateRoleData {
  name: string
  description: string
}

export interface UpdateRoleData {
  name?: string
  description?: string
}

// api de roles
export const rolesApi = {
  async getAll(): Promise<Role[]> {
    const response = await fetchWithAuth(`${API_URL}/roles`)
    if (!response.ok) throw new Error('Error al obtener roles')
    return response.json()
  },

  async create(data: CreateRoleData): Promise<Role> {
    const response = await fetchWithAuth(`${API_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error al crear rol' }))
      throw new Error(error.detail || 'Error al crear rol')
    }
    return response.json()
  },

  async update(id: number, data: UpdateRoleData): Promise<Role> {
    const response = await fetchWithAuth(`${API_URL}/roles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error al actualizar rol' }))
      throw new Error(error.detail || 'Error al actualizar rol')
    }
    return response.json()
  },

  async delete(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/roles/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Error al eliminar rol')
  }
}

// api de usuarios
export const usersApi = {
  async getAll(page = 1, limit = 10): Promise<PaginatedUsers> {
    const response = await fetchWithAuth(`${API_URL}/users?page=${page}&limit=${limit}`)
    if (!response.ok) throw new Error('Error al obtener usuarios')
    return response.json()
  },

  async getById(id: number): Promise<User> {
    const response = await fetchWithAuth(`${API_URL}/users/${id}`)
    if (!response.ok) throw new Error('Error al obtener usuario')
    return response.json()
  },

  async create(data: CreateUserData): Promise<User> {
    const response = await fetchWithAuth(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error al crear usuario' }))
      throw new Error(error.detail || 'Error al crear usuario')
    }
    return response.json()
  },

  async update(id: number, data: UpdateUserData): Promise<User> {
    const response = await fetchWithAuth(`${API_URL}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error al actualizar usuario' }))
      throw new Error(error.detail || 'Error al actualizar usuario')
    }
    return response.json()
  },

  async delete(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/users/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Error al eliminar usuario')
  }
}
