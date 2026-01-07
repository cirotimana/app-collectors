import {
  liquidationsApi,
  conciliationsApi,
  discrepanciesApi,
  dashboardApi,
  processApi,
  conciliationReportsApi,
  calimacoRecordsApi,
  collectorRecordsApi,
  authApi,
  downloadApi,
  rolesApi,
  usersApi,
} from '../api'
import * as apiClient from '../api-client'

// Mock del módulo api-client
jest.mock('../api-client', () => ({
  getWithAuth: jest.fn(),
  postWithAuth: jest.fn(),
  putWithAuth: jest.fn(),
  patchWithAuth: jest.fn(),
  deleteWithAuth: jest.fn(),
  fetchWithAuth: jest.fn(),
  apiCall: jest.fn(),
}))

// Mock de variables de entorno
const originalEnv = process.env

describe('API module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: 'http://localhost:3040/api',
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8000',
      NEXT_PUBLIC_API_KEY: 'test-api-key',
    }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  /* ================= Liquidations API ================= */
  describe('liquidationsApi', () => {
    it('getAll llama a getWithAuth con la URL correcta', async () => {
      const mockData = [{ id: 1, collector: { name: 'Test' } }]
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockData)

      const result = await liquidationsApi.getAll()

      expect(apiClient.getWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/liquidations')
      expect(result).toEqual(mockData)
    })

    it('getByCollector codifica correctamente el nombre del recaudador', async () => {
      const mockData = [{ id: 1 }]
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockData)

      await liquidationsApi.getByCollector('Test & Co')

      expect(apiClient.getWithAuth).toHaveBeenCalledWith(
        'http://localhost:3040/api/liquidations/collector/Test%20%26%20Co'
      )
    })

    it('getByDateRange formatea las fechas correctamente', async () => {
      const mockData = [{ id: 1 }]
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockData)

      await liquidationsApi.getByDateRange('20240101', '20240131')

      expect(apiClient.getWithAuth).toHaveBeenCalledWith(
        'http://localhost:3040/api/liquidations/range?from=2024-01-01&to=2024-01-31'
      )
    })

    it('delete llama a deleteWithAuth con el ID correcto', async () => {
      ;(apiClient.deleteWithAuth as jest.Mock).mockResolvedValue(undefined)

      await liquidationsApi.delete(123)

      expect(apiClient.deleteWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/liquidations/123')
    })
  })

  /* ================= Conciliations API ================= */
  describe('conciliationsApi', () => {
    it('getAll obtiene todas las conciliaciones', async () => {
      const mockData = [{ id: 1 }]
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockData)

      const result = await conciliationsApi.getAll()

      expect(apiClient.getWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/conciliations')
      expect(result).toEqual(mockData)
    })

    it('getByDateRange formatea fechas correctamente', async () => {
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue([])

      await conciliationsApi.getByDateRange('20240201', '20240228')

      expect(apiClient.getWithAuth).toHaveBeenCalledWith(
        'http://localhost:3040/api/conciliations/range?from=2024-02-01&to=2024-02-28'
      )
    })
  })

  /* ================= Discrepancies API ================= */
  describe('discrepanciesApi', () => {
    it('getByStatus filtra por estado', async () => {
      const mockData = [{ id: 1, status: 'pending' }]
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockData)

      await discrepanciesApi.getByStatus('pending')

      expect(apiClient.getWithAuth).toHaveBeenCalledWith(
        'http://localhost:3040/api/reconciliation-discrepancies/status/pending'
      )
    })

    it('updateStatus actualiza el estado de una discrepancia', async () => {
      ;(apiClient.patchWithAuth as jest.Mock).mockResolvedValue(undefined)

      await discrepanciesApi.updateStatus(5, 'closed')

      expect(apiClient.patchWithAuth).toHaveBeenCalledWith(
        'http://localhost:3040/api/reconciliation-discrepancies/5/status',
        { status: 'closed' }
      )
    })
  })

  /* ================= Dashboard API ================= */
  describe('dashboardApi', () => {
    it('getSummary construye la URL correctamente', async () => {
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue({ total: 100 })

      await dashboardApi.getSummary('1,2,3', '2024-01-01', '2024-01-31', 'liquidations')

      expect(apiClient.getWithAuth).toHaveBeenCalledWith(
        'http://localhost:3040/api/liquidations/summary?collectorIds=1,2,3&fromDate=2024-01-01&toDate=2024-01-31'
      )
    })

    it('getStats construye la URL con parámetros correctos', async () => {
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue({ stats: [] })

      await dashboardApi.getStats(5, '2024-01-01', '2024-01-31', 'conciliations')

      expect(apiClient.getWithAuth).toHaveBeenCalledWith(
        'http://localhost:3040/api/conciliations/stats?collectorId=5&fromDate=2024-01-01&toDate=2024-01-31'
      )
    })
  })

  /* ================= Process API ================= */
  describe('processApi', () => {
    it('executeProcess llama al endpoint correcto de conciliación', async () => {
      ;(apiClient.apiCall as jest.Mock).mockResolvedValue({ success: true })

      await processApi.executeProcess('conciliacion', 'kashio', '20240101', '20240131')

      // Verificar que se llamó con los parámetros correctos (aceptando localhost o 127.0.0.1)
      const call = (apiClient.apiCall as jest.Mock).mock.calls[0]
      expect(call[0]).toMatch(/execute-getkashio\?from_date=20240101&to_date=20240131$/)
      expect(call[1]).toEqual({
        method: 'GET',
        headers: { 'x-api-key': 'test-api-key' },
      })
    })

    it('executeProcess llama al endpoint correcto de liquidación', async () => {
      ;(apiClient.apiCall as jest.Mock).mockResolvedValue({ success: true })

      await processApi.executeProcess('liquidacion', 'tupay', '20240101', '20240131')

      const call = (apiClient.apiCall as jest.Mock).mock.calls[0]
      expect(call[0]).toMatch(/execute-liqtupay\?from_date=20240101&to_date=20240131$/)
      expect(call[1]).toEqual({
        method: 'GET',
        headers: { 'x-api-key': 'test-api-key' },
      })
    })

    it('executeProcess lanza error si el endpoint no existe', async () => {
      await expect(
        processApi.executeProcess('conciliacion', 'invalido', '20240101', '20240131')
      ).rejects.toThrow('Endpoint no encontrado')
    })

    it('executeDigitalProcess llama al endpoint correcto', async () => {
      ;(apiClient.apiCall as jest.Mock).mockResolvedValue({ success: true })

      await processApi.executeDigitalProcess('dnicorrelativos')

      const call = (apiClient.apiCall as jest.Mock).mock.calls[0]
      expect(call[0]).toMatch(/execute-dnicorrelatives$/)
      expect(call[1]).toEqual({
        method: 'GET',
        headers: { 'x-api-key': 'test-api-key' },
      })
    })
  })

  /* ================= Conciliation Reports API ================= */
  describe('conciliationReportsApi', () => {
    it('getAccumulatedReport construye params correctamente', async () => {
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue([])

      await conciliationReportsApi.getAccumulatedReport([1, 2], '2024-01-01', '2024-01-31')

      const call = (apiClient.getWithAuth as jest.Mock).mock.calls[0][0]
      expect(call).toContain('collectorIds=1%2C2')
      expect(call).toContain('fromDate=2024-01-01')
      expect(call).toContain('toDate=2024-01-31')
    })

    it('getCompleteReport retorna respuesta paginada', async () => {
      const mockData = [{ report_collector_id: 1 }]
      Object.assign(mockData, { total: 1, page: 1, limit: 50, totalPages: 1 })
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockData)

      const result = await conciliationReportsApi.getCompleteReport([1], '2024-01-01', '2024-01-31')

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page')
      expect(result).toHaveProperty('totalPages')
    })

    it('fetchAllConciliatedRecords hace múltiples llamadas si hay múltiples páginas', async () => {
      // Primera llamada: página 1 de 2
      const page1Data = [{ calimaco_id: 1 }]
      Object.assign(page1Data, { total: 2, page: 1, limit: 1, totalPages: 2 })

      // Segunda llamada: página 2 de 2
      const page2Data = [{ calimaco_id: 2 }]
      Object.assign(page2Data, { total: 2, page: 2, limit: 1, totalPages: 2 })

      ;(apiClient.getWithAuth as jest.Mock)
        .mockResolvedValueOnce(page1Data)
        .mockResolvedValueOnce(page2Data)

      const result = await conciliationReportsApi.fetchAllConciliatedRecords([1], '2024-01-01', '2024-01-31')

      expect(apiClient.getWithAuth).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(2)
      expect(result[0].calimaco_id).toBe(1)
      expect(result[1].calimaco_id).toBe(2)
    })
  })

  /* ================= Calimaco Records API ================= */
  describe('calimacoRecordsApi', () => {
    it('getAll construye query params correctamente', async () => {
      const mockData = [{ id: 1 }]
      Object.assign(mockData, { total: 1, page: 1, limit: 20, totalPages: 1 })
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockData)

      await calimacoRecordsApi.getAll(1, 20, 5, '2024-01-01', '2024-01-31', 'APROBADO')

      const call = (apiClient.getWithAuth as jest.Mock).mock.calls[0][0]
      expect(call).toContain('page=1')
      expect(call).toContain('limit=20')
      expect(call).toContain('collectorId=5')
      expect(call).toContain('fromDate=2024-01-01')
      expect(call).toContain('toDate=2024-01-31')
      expect(call).toContain('status=APROBADO')
    })

    it('update llama a patchWithAuth', async () => {
      const updateData = { status: 'RECHAZADO' }
      ;(apiClient.patchWithAuth as jest.Mock).mockResolvedValue({ id: 1, ...updateData })

      await calimacoRecordsApi.update(1, updateData)

      expect(apiClient.patchWithAuth).toHaveBeenCalledWith(
        'http://localhost:3040/api/calimaco-records/1',
        updateData
      )
    })

    it('getByCalimacoId retorna array vacío en error 404', async () => {
      ;(apiClient.getWithAuth as jest.Mock).mockRejectedValue(new Error('404 Not Found'))

      const result = await calimacoRecordsApi.getByCalimacoId('ABC123')

      expect(result).toEqual([])
    })

    it('getByCalimacoId lanza error si no es 404', async () => {
      ;(apiClient.getWithAuth as jest.Mock).mockRejectedValue(new Error('500 Server Error'))

      await expect(calimacoRecordsApi.getByCalimacoId('ABC123')).rejects.toThrow('500 Server Error')
    })
  })

  /* ================= Collector Records API ================= */
  describe('collectorRecordsApi', () => {
    it('getAll retorna respuesta paginada', async () => {
      const mockData = [{ id: 1 }]
      Object.assign(mockData, { total: 1, page: 1, limit: 20, totalPages: 1 })
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockData)

      const result = await collectorRecordsApi.getAll()

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
    })

    it('getByProviderStatus codifica el estado correctamente', async () => {
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue([])

      await collectorRecordsApi.getByProviderStatus('PAID & VERIFIED')

      const call = (apiClient.getWithAuth as jest.Mock).mock.calls[0][0]
      expect(call).toContain('providerStatus=PAID%20%26%20VERIFIED')
    })
  })

  /* ================= Auth API ================= */
  describe('authApi', () => {
    it('getCurrentUser obtiene datos del usuario actual', async () => {
      const mockUser = { id: 1, username: 'test', role: 'admin' }
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockUser)

      const result = await authApi.getCurrentUser()

      expect(apiClient.getWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/auth/me')
      expect(result).toEqual(mockUser)
    })
  })

  /* ================= Download API ================= */
  describe('downloadApi', () => {
    let mockOpen: jest.SpyInstance
    let mockCreateElement: jest.SpyInstance
    let mockAppendChild: jest.SpyInstance
    let mockRemoveChild: jest.SpyInstance

    beforeEach(() => {
      mockOpen = jest.spyOn(window, 'open').mockImplementation(() => null)
      
      const mockLink = {
        style: {},
        click: jest.fn(),
      }
      
      mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)
      
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = jest.fn()
    })

    afterEach(() => {
      mockOpen.mockRestore()
      mockCreateElement.mockRestore()
      mockAppendChild.mockRestore()
      mockRemoveChild.mockRestore()
    })

    it('downloadFile maneja redirección 302', async () => {
      const mockResponse = {
        status: 302,
        headers: {
          get: jest.fn().mockReturnValue('https://presigned-url.com/file'),
        },
      }
      ;(apiClient.fetchWithAuth as jest.Mock).mockResolvedValue(mockResponse)

      const result = await downloadApi.downloadFile('s3://bucket/path/to/file.pdf')

      expect(mockOpen).toHaveBeenCalledWith('https://presigned-url.com/file', '_blank')
      expect(result).toBe(true)
    })

    it('downloadFile maneja respuesta con URL en JSON', async () => {
      const mockResponse = {
        status: 200,
        ok: true,
        json: jest.fn().mockResolvedValue({ url: 'https://download-url.com/file' }),
      }
      ;(apiClient.fetchWithAuth as jest.Mock).mockResolvedValue(mockResponse)

      const result = await downloadApi.downloadFile('s3://bucket/file.pdf')

      expect(mockOpen).toHaveBeenCalledWith('https://download-url.com/file', '_blank')
      expect(result).toBe(true)
    })

    it('downloadFile maneja descarga de blob directamente', async () => {
      const mockBlob = new Blob(['test content'])
      const mockResponse = {
        status: 200,
        ok: true,
        headers: { get: jest.fn().mockReturnValue(null) },
        json: jest.fn().mockResolvedValue({}),
        blob: jest.fn().mockResolvedValue(mockBlob),
      }
      ;(apiClient.fetchWithAuth as jest.Mock).mockResolvedValue(mockResponse)

      const result = await downloadApi.downloadFile('s3://bucket/file.txt')

      expect(result).toBe(true)
      expect(mockCreateElement).toHaveBeenCalledWith('a')
    })

    it('downloadFile retorna false en caso de error', async () => {
      ;(apiClient.fetchWithAuth as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await downloadApi.downloadFile('s3://bucket/file.pdf')

      expect(result).toBe(false)
    })
  })

  /* ================= Roles API ================= */
  describe('rolesApi', () => {
    it('getAll obtiene todos los roles', async () => {
      const mockRoles = [{ id: 1, name: 'Admin' }]
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockRoles)

      const result = await rolesApi.getAll()

      expect(apiClient.getWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/roles')
      expect(result).toEqual(mockRoles)
    })

    it('create crea un nuevo rol', async () => {
      const newRole = { name: 'Editor', description: 'Can edit content' }
      ;(apiClient.postWithAuth as jest.Mock).mockResolvedValue({ id: 2, ...newRole })

      await rolesApi.create(newRole)

      expect(apiClient.postWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/roles', newRole)
    })

    it('update actualiza un rol', async () => {
      const updateData = { description: 'Updated description' }
      ;(apiClient.patchWithAuth as jest.Mock).mockResolvedValue({ id: 1, ...updateData })

      await rolesApi.update(1, updateData)

      expect(apiClient.patchWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/roles/1', updateData)
    })

    it('delete elimina un rol', async () => {
      ;(apiClient.deleteWithAuth as jest.Mock).mockResolvedValue(undefined)

      await rolesApi.delete(1)

      expect(apiClient.deleteWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/roles/1')
    })
  })

  /* ================= Users API ================= */
  describe('usersApi', () => {
    it('getAll retorna usuarios paginados', async () => {
      const mockData = [{ id: 1, username: 'user1' }]
      Object.assign(mockData, { total: 1, page: 1, limit: 10, totalPages: 1 })
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockData)

      const result = await usersApi.getAll(1, 10)

      expect(apiClient.getWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/users?page=1&limit=10')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
    })

    it('getById obtiene un usuario por ID', async () => {
      const mockUser = { id: 5, username: 'testuser' }
      ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockUser)

      const result = await usersApi.getById(5)

      expect(apiClient.getWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/users/5')
      expect(result).toEqual(mockUser)
    })

    it('create crea un nuevo usuario', async () => {
      const newUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        username: 'johndoe',
        password: 'password123',
        roleId: 1,
      }
      ;(apiClient.postWithAuth as jest.Mock).mockResolvedValue({ id: 10, ...newUser })

      await usersApi.create(newUser)

      expect(apiClient.postWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/users', newUser)
    })

    it('update actualiza un usuario', async () => {
      const updateData = { firstName: 'Jane' }
      ;(apiClient.patchWithAuth as jest.Mock).mockResolvedValue({ id: 5, ...updateData })

      await usersApi.update(5, updateData)

      expect(apiClient.patchWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/users/5', updateData)
    })

    it('delete elimina un usuario', async () => {
      ;(apiClient.deleteWithAuth as jest.Mock).mockResolvedValue(undefined)

      await usersApi.delete(5)

      expect(apiClient.deleteWithAuth).toHaveBeenCalledWith('http://localhost:3040/api/users/5')
    })
  })
  
it('toPaginatedResponse usa valores por defecto si no hay metadata', async () => {
  const data = [{ id: 1 }]
  ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(data)

  const result = await conciliationReportsApi.getCompleteReport(
    [1],
    '2024-01-01',
    '2024-01-31'
  )

  expect(result.total).toBe(0)
  expect(result.page).toBe(1)
  expect(result.limit).toBe(20)
  expect(result.totalPages).toBe(0)
})

it('executeDigitalProcess lanza error si el proceso no existe', async () => {
  await expect(
    processApi.executeDigitalProcess('otro' as any)
  ).rejects.toThrow('Endpoint no encontrado')
})

it('downloadProcessedFile descarga correctamente', async () => {
  const mockBlob = new Blob(['file'])
  ;(apiClient.fetchWithAuth as jest.Mock).mockResolvedValue({
    ok: true,
    blob: jest.fn().mockResolvedValue(mockBlob),
  })

  const result = await downloadApi.downloadProcessedFile(
    'conciliaciones',
    'file.zip'
  )

  expect(result).toBe(true)
})

it('downloadProcessedFile descarga correctamente', async () => {
  const mockBlob = new Blob(['file'])
  ;(apiClient.fetchWithAuth as jest.Mock).mockResolvedValue({
    ok: true,
    blob: jest.fn().mockResolvedValue(mockBlob),
  })

  const result = await downloadApi.downloadProcessedFile(
    'conciliaciones',
    'file.zip'
  )

  expect(result).toBe(true)
})

it('getByCalimacoId retorna registros si no hay error', async () => {
  const mockData = [{ id: 1 }]
  ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockData)

  const result = await calimacoRecordsApi.getByCalimacoId('ABC')

  expect(result).toEqual(mockData)
})

it('getByCalimacoId retorna registros si no hay error', async () => {
  const mockData = [{ id: 1 }]
  ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockData)

  const result = await calimacoRecordsApi.getByCalimacoId('ABC')

  expect(result).toEqual(mockData)
})

it('getByCalimacoId retorna registros si no hay error', async () => {
  const mockData = [{ id: 1 }]
  ;(apiClient.getWithAuth as jest.Mock).mockResolvedValue(mockData)

  const result = await calimacoRecordsApi.getByCalimacoId('ABC')

  expect(result).toEqual(mockData)
})
})