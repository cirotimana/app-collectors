import { fetchWithAuth, getWithAuth, postWithAuth, putWithAuth, patchWithAuth, deleteWithAuth, apiCall } from './api-client'

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

function toPaginatedResponse<T>(result: T[]): PaginatedResponse<T> {
  // Los metadatos fueron inyectados en el array por apiCall
  const meta = result as any
  return {
    data: result,
    total: meta.total || 0,
    page: meta.page || 1,
    limit: meta.limit || 20,
    totalPages: meta.totalPages || 0
  }
}

// API de Liquidaciones
export const liquidationsApi = {
  async getAll(): Promise<Liquidation[]> {
    return getWithAuth<Liquidation[]>(`${API_URL}/liquidations`)
  },

  async getByCollector(collector: string): Promise<Liquidation[]> {
    return getWithAuth<Liquidation[]>(`${API_URL}/liquidations/collector/${encodeURIComponent(collector)}`)
  },

  async getByDateRange(fromDate: string, toDate: string): Promise<Liquidation[]> {
    const from = formatDateForAPI(fromDate)
    const to = formatDateForAPI(toDate)
    return getWithAuth<Liquidation[]>(`${API_URL}/liquidations/range?from=${from}&to=${to}`)
  },

  async delete(id: number): Promise<void> {
    return deleteWithAuth<void>(`${API_URL}/liquidations/${id}`)
  }
}

// API de Conciliaciones
export const conciliationsApi = {
  async getAll(): Promise<Conciliation[]> {
    return getWithAuth<Conciliation[]>(`${API_URL}/conciliations`)
  },

  async getByCollector(collector: string): Promise<Conciliation[]> {
    return getWithAuth<Conciliation[]>(`${API_URL}/conciliations/collector/${encodeURIComponent(collector)}`)
  },

  async getByDateRange(fromDate: string, toDate: string): Promise<Conciliation[]> {
    const from = formatDateForAPI(fromDate)
    const to = formatDateForAPI(toDate)
    return getWithAuth<Conciliation[]>(`${API_URL}/conciliations/range?from=${from}&to=${to}`)
  },

  async delete(id: number): Promise<void> {
    return deleteWithAuth<void>(`${API_URL}/conciliations/${id}`)
  }
}

// API de Discrepancias
export const discrepanciesApi = {
  async getAll(): Promise<Discrepancy[]> {
    return getWithAuth<Discrepancy[]>(`${API_URL}/reconciliation-discrepancies`)
  },

  async getByDateRange(fromDate: string, toDate: string): Promise<Discrepancy[]> {
    const from = formatDateForAPI(fromDate)
    const to = formatDateForAPI(toDate)
    return getWithAuth<Discrepancy[]>(`${API_URL}/reconciliation-discrepancies/range?from=${from}&to=${to}`)
  },

  async getByStatus(status: 'new' | 'pending' | 'closed'): Promise<Discrepancy[]> {
    return getWithAuth<Discrepancy[]>(`${API_URL}/reconciliation-discrepancies/status/${status}`)
  },

  async updateStatus(id: number, status: 'pending' | 'closed'): Promise<void> {
    return patchWithAuth<void>(`${API_URL}/reconciliation-discrepancies/${id}/status`, { status })
  },

  async delete(id: number): Promise<void> {
    return deleteWithAuth<void>(`${API_URL}/reconciliation-discrepancies/${id}`)
  }
}

// API de Dashboard
export const dashboardApi = {
  async getSummary(collectorIds: string, fromDate: string, toDate: string, endpoint: 'liquidations' | 'conciliations') {
    const url = `${API_URL}/${endpoint}/summary?collectorIds=${collectorIds}&fromDate=${fromDate}&toDate=${toDate}`
    return getWithAuth<any>(url)
  },

  async getStats(collectorId: number, fromDate: string, toDate: string, endpoint: 'liquidations' | 'conciliations') {
    const url = `${API_URL}/${endpoint}/stats?collectorId=${collectorId}&fromDate=${fromDate}&toDate=${toDate}`
    return getWithAuth<any>(url)
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
    
    // Usamos apiCall directamente para pasar headers custom
    // Nota: importamos apiCall desde api-client implicitamente a traves de las variables globales?
    // No, necesito asegurar que apiCall este importado o usar apiCall.
    // Como no agregue apiCall al import inicial de este archivo, necesito agregarlo.
    // Voy a usar getWithAuth que no soporta headers? No.
    // Necesito importar apiCall. 
    // Como estoy en un replace parcial, asumire que luego arreglare el import. 
    // O mejor, usare fetchWithAuth y manejare el json manual? 
    // NO, quiero usar la logica unificada de apiCall. 
    // Voy a cambiar el replaceContent #1 para incluir apiCall? No puedo retroceder.
    // Voy a usar "return apiCall...". Y en el proximo paso arreglare el import.
     
    return apiCall<any>(url, {
      method: 'GET',
      headers: { 'x-api-key': apiKey || '' },
    })
  },

  async executeDigitalProcess(proceso: 'dnicorrelativos' | 'concentracionips') {
    const endpoint = DIGITAL_ENDPOINTS[proceso]
    if (!endpoint) throw new Error(`Endpoint no encontrado para ${proceso}`)
    
    const apiKey = process.env.NEXT_PUBLIC_API_KEY
    const url = `${API_BASE_URL}/digital/${endpoint}`
    
    return apiCall<any>(url, {
      method: 'GET',
      headers: { 'x-api-key': apiKey || '' },
    })
  }
}

// Tipos para los nuevos endpoints de BD
export interface ConciliationReport {
  fecha_desde?: string
  fecha_hasta?: string
  report_fecha?: string
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
  async getAccumulatedReport(collectorIds?: number[], fromDate?: string, toDate?: string): Promise<ConciliationReport[]> {
    const params = new URLSearchParams()
    
    if (collectorIds && collectorIds.length > 0) {
      params.append('collectorIds', collectorIds.join(','))
    }
    if (fromDate) {
      params.append('fromDate', fromDate)
    }
    if (toDate) {
      params.append('toDate', toDate)
    }
    
    return getWithAuth<ConciliationReport[]>(`${API_URL}/conciliation-reports/conciliacion-completa-acumulado?${params}`)
  },

  async getCompleteReport(collectorIds: number[], fromDate: string, toDate: string, page = 1, limit = 50): Promise<PaginatedResponse<ConciliationReport>> {
    const params = new URLSearchParams({
      collectorIds: collectorIds.join(','),
      fromDate,
      toDate,
      page: page.toString(),
      limit: limit.toString()
    })
    const result = await getWithAuth<ConciliationReport[]>(`${API_URL}/conciliation-reports/conciliacion-completa-por-dia?${params}`)
    return toPaginatedResponse(result)
  },

  async getConciliatedRecords(collectorIds: number[], fromDate: string, toDate: string, page = 1, limit = 20): Promise<PaginatedResponse<ConciliatedRecord>> {
    const params = new URLSearchParams({
      collectorIds: collectorIds.join(','),
      fromDate,
      toDate,
      page: page.toString(),
      limit: limit.toString()
    })
    const result = await getWithAuth<ConciliatedRecord[]>(`${API_URL}/conciliation-reports/conciliados?${params}`)
    return toPaginatedResponse(result)
  },

  async getNonConciliatedRecords(collectorIds: number[], fromDate: string, toDate: string, page = 1, limit = 20): Promise<PaginatedResponse<NonConciliatedRecord>> {
    const params = new URLSearchParams({
      collectorIds: collectorIds.join(','),
      fromDate,
      toDate,
      page: page.toString(),
      limit: limit.toString()
    })
    const result = await getWithAuth<NonConciliatedRecord[]>(`${API_URL}/conciliation-reports/no-conciliados?${params}`)
    return toPaginatedResponse(result)
  },

  async getSalesReport(collectorIds: number[], fromDate: string, toDate: string, page = 1, limit = 20): Promise<PaginatedResponse<ConciliationReport>> {
    const params = new URLSearchParams({
      collectorIds: collectorIds.join(','),
      fromDate,
      toDate,
      page: page.toString(),
      limit: limit.toString()
    })
    const result = await getWithAuth<ConciliationReport[]>(`${API_URL}/conciliation-reports/reporte-ventas-recaudadores?${params}`)
    return toPaginatedResponse(result)
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
    
    const result = await getWithAuth<CalimacoRecord[]>(`${API_URL}/calimaco-records/filter?${params}`)
    return toPaginatedResponse(result)
  },

  async getById(id: number): Promise<CalimacoRecord> {
    return getWithAuth<CalimacoRecord>(`${API_URL}/calimaco-records/${id}`)
  },

  async update(id: number, data: Partial<CalimacoRecord>): Promise<CalimacoRecord> {
    return patchWithAuth<CalimacoRecord>(`${API_URL}/calimaco-records/${id}`, data)
  },

  async delete(id: number): Promise<void> {
    return deleteWithAuth<void>(`${API_URL}/calimaco-records/${id}`)
  },

  async getByCollector(collectorId: number): Promise<CalimacoRecord[]> {
    return getWithAuth<CalimacoRecord[]>(`${API_URL}/calimaco-records/by-collector/${collectorId}`)
  },

  async getByStatus(status: string): Promise<CalimacoRecord[]> {
    return getWithAuth<CalimacoRecord[]>(`${API_URL}/calimaco-records/by-status?status=${encodeURIComponent(status)}`)
  },

  async getByCalimacoId(calimacoId: string): Promise<CalimacoRecord[]> {
    try {
      const result = await getWithAuth<CalimacoRecord[]>(`${API_URL}/calimaco-records/by-calimaco-id/${encodeURIComponent(calimacoId)}`)
      return result
    } catch (e: any) {
      // Si es 404, apiCall lanza error. Si queremos retornar vacio en 404:
      if (e.message?.includes('404')) return []
      throw e
    }
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
    
    const result = await getWithAuth<CollectorRecord[]>(`${API_URL}/collector-records/filter?${params}`)
    return toPaginatedResponse(result)
  },

  async getById(id: number): Promise<CollectorRecord> {
    return getWithAuth<CollectorRecord>(`${API_URL}/collector-records/${id}`)
  },

  async update(id: number, data: Partial<CollectorRecord>): Promise<CollectorRecord> {
    return patchWithAuth<CollectorRecord>(`${API_URL}/collector-records/${id}`, data)
  },

  async delete(id: number): Promise<void> {
    return deleteWithAuth<void>(`${API_URL}/collector-records/${id}`)
  },

  async getByCollector(collectorId: number): Promise<CollectorRecord[]> {
    return getWithAuth<CollectorRecord[]>(`${API_URL}/collector-records/by-collector/${collectorId}`)
  },

  async getByProviderStatus(providerStatus: string): Promise<CollectorRecord[]> {
    return getWithAuth<CollectorRecord[]>(`${API_URL}/collector-records/by-provider-status?providerStatus=${encodeURIComponent(providerStatus)}`)
  },

  async getByCalimacoId(calimacoId: string): Promise<CollectorRecord[]> {
    try {
      const result = await getWithAuth<CollectorRecord[]>(`${API_URL}/collector-records/by-calimaco-id/${encodeURIComponent(calimacoId)}`)
      return result
    } catch (e: any) {
      if (e.message?.includes('404')) return []
      throw e
    }
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
    return getWithAuth<Role[]>(`${API_URL}/roles`)
  },

  async create(data: CreateRoleData): Promise<Role> {
    return postWithAuth<Role>(`${API_URL}/roles`, data)
  },

  async update(id: number, data: UpdateRoleData): Promise<Role> {
    return patchWithAuth<Role>(`${API_URL}/roles/${id}`, data)
  },

  async delete(id: number): Promise<void> {
    return deleteWithAuth<void>(`${API_URL}/roles/${id}`)
  }
}

// api de usuarios
export const usersApi = {
  async getAll(page = 1, limit = 10): Promise<PaginatedResponse<User>> { // Changed return type to generic standard
    const result = await getWithAuth<User[]>(`${API_URL}/users?page=${page}&limit=${limit}`)
    return toPaginatedResponse(result)
  },

  async getById(id: number): Promise<User> {
    return getWithAuth<User>(`${API_URL}/users/${id}`)
  },

  async create(data: CreateUserData): Promise<User> {
    return postWithAuth<User>(`${API_URL}/users`, data)
  },

  async update(id: number, data: UpdateUserData): Promise<User> {
    return patchWithAuth<User>(`${API_URL}/users/${id}`, data)
  },

  async delete(id: number): Promise<void> {
    return deleteWithAuth<void>(`${API_URL}/users/${id}`)
  }
}
