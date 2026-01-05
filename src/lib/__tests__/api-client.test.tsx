import { 
  fetchWithAuth, 
  apiCall, 
  getWithAuth, 
  postWithAuth, 
  putWithAuth, 
  patchWithAuth, 
  deleteWithAuth 
} from '../api-client'
import * as auth from '../auth'

// Mock de las funciones de auth
jest.mock('../auth', () => ({
  getToken: jest.fn(),
  logout: jest.fn(),
}))

describe('API helpers', () => {
  const originalLocation = window.location
  
  // 1. Creamos un objeto de "estado" para simular la URL
  let mockLocation: { href: string };

  beforeAll(() => {
    global.fetch = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Eliminamos el location de JSDOM
    // @ts-ignore
    delete window.location

    // Creamos un objeto simple. 
    // Al NO tener la lógica interna de JSDOM, guardará el string exacto que le pases.
    window.location = {
      href: '',
      assign: jest.fn(),
      replace: jest.fn(),
    } as any
  })

  afterAll(() => {
    // 3. Restauramos el objeto original al terminar todos los tests
    window.location = originalLocation
  })

  /* ================= fetchWithAuth ================= */

  it('agrega Authorization cuando hay token', async () => {
    ;(auth.getToken as jest.Mock).mockReturnValue('token-123')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      ok: true,
    })

    await fetchWithAuth('/test-url')

    expect(global.fetch).toHaveBeenCalledWith(
      '/test-url',
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    )
    
    // Verificamos que el header se haya enviado
    const callArgs = (global.fetch as jest.Mock).mock.calls[0][1]
    expect(callArgs.headers.get('Authorization')).toBe('Bearer token-123')
  })

  it('NO agrega Authorization cuando no hay token', async () => {
    ;(auth.getToken as jest.Mock).mockReturnValue(null)
    ;(global.fetch as jest.Mock).mockResolvedValue({ status: 200, ok: true })

    await fetchWithAuth('/test-url')

    const callArgs = (global.fetch as jest.Mock).mock.calls[0][1]
    expect(callArgs.headers.get('Authorization')).toBeNull()
  })

  it('en 401 hace logout, redirige y lanza error', async () => {
    // Configuramos el fetch para que devuelva 401
    ;(global.fetch as jest.Mock).mockResolvedValue({
      status: 401,
      ok: false,
    })

    // Ejecutamos la función
    await expect(fetchWithAuth('/test-url')).rejects.toThrow('Sesion expirada')
    
    // Verificamos el logout
    expect(auth.logout).toHaveBeenCalled()

    // AHORA SÍ: Debería recibir exactamente lo que asignaste
    expect(window.location.href).toBe('http://localhost/')
  })

  /* ================= apiCall ================= */

  it('devuelve data cuando success=true', async () => {
    const mockData = { id: 1, name: 'Test' }
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockData,
      }),
    })

    const result = await apiCall('/url')
    expect(result).toEqual(mockData)
  })

  it('lanza error cuando success=false', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        message: 'Error desde backend',
      }),
    })

    await expect(apiCall('/url')).rejects.toThrow('Error desde backend')
  })

  it('lanza error con mensaje del backend cuando response no ok', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        message: 'Bad Request Detail',
      }),
    })

    await expect(apiCall('/url')).rejects.toThrow('Bad Request Detail')
  })

  it('soporta respuesta no estandarizada', async () => {
    const rawResponse = { simple: 'data' }
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => rawResponse,
    })

    const result = await apiCall('/url')
    expect(result).toEqual(rawResponse)
  })

  it('adjunta metadata de paginacion a arrays', async () => {
    const mockItems = [{ id: 1 }]
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockItems,
        total: 100,
        page: 1,
        totalPages: 10
      }),
    })

    const result = await apiCall<any[]>('/url')
    expect(result).toEqual(mockItems)
    expect(result.total).toBe(100)
    expect(result.totalPages).toBe(10)
  })

  /* ================= Verbos HTTP ================= */

  it('getWithAuth usa GET', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    })

    await getWithAuth('/test')
    expect(global.fetch).toHaveBeenCalledWith('/test', expect.objectContaining({ method: 'GET' }))
  })

  it('postWithAuth usa POST', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    })

    await postWithAuth('/test', { key: 'val' })
    expect(global.fetch).toHaveBeenCalledWith('/test', expect.objectContaining({ 
      method: 'POST',
      body: JSON.stringify({ key: 'val' })
    }))
  })

  it('putWithAuth usa PUT', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    })

    await putWithAuth('/test', { key: 'val' })
    expect(global.fetch).toHaveBeenCalledWith('/test', expect.objectContaining({ method: 'PUT' }))
  })

  it('patchWithAuth usa PATCH', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    })

    await patchWithAuth('/test', { key: 'val' })
    expect(global.fetch).toHaveBeenCalledWith('/test', expect.objectContaining({ method: 'PATCH' }))
  })

  it('deleteWithAuth usa DELETE', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    })

    await deleteWithAuth('/test')
    expect(global.fetch).toHaveBeenCalledWith('/test', expect.objectContaining({ method: 'DELETE' }))
  })

  /* ================= Tests para ramas de error específicas ================= */

  it('maneja errores cuando rawError es un Array (Formato FastAPI/Pydantic)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        message: [
          { msg: 'El campo es requerido', loc: ['body', 'username'] },
          { msg: 'Mínimo 5 caracteres', loc: ['body', 'password'] }
        ]
      }),
    })

    // Debe unir los mensajes con comas
    await expect(apiCall('/url')).rejects.toThrow('El campo es requerido, Mínimo 5 caracteres')
  })

  it('maneja errores cuando rawError es un Objeto', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        detail: {
          message: 'Error de validación interna',
          code: 'ERR_001'
        }
      }),
    })

    await expect(apiCall('/url')).rejects.toThrow('Error de validación interna')
  })

  it('maneja errores cuando rawError es un valor simple (no string)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        message: 500123 // Un número de error, por ejemplo
      }),
    })

    // El código hace String(rawError)
    await expect(apiCall('/url')).rejects.toThrow('500123')
  })

  it('usa mensaje por defecto si el JSON de error es inválido o no tiene mensaje', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({}) // JSON vacío
    })

    await expect(apiCall('/url')).rejects.toThrow('Error 502')
  })

  /* ================= Tests para completar cobertura (Líneas 106-170) ================= */

  it('maneja errores cuando rawError es un objeto complejo sin message/detail', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        message: { unknown_field: 'error_data' }
      }),
    })
    // Debe caer en el JSON.stringify(rawError)
    await expect(apiCall('/url')).rejects.toThrow('{"unknown_field":"error_data"}')
  })

  it('no adjunta paginación si el resultado no es un array', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: 1 }, // Objeto, no array
        total: 100
      }),
    })
    const result: any = await apiCall('/url')
    expect(result.total).toBeUndefined()
  })

  it('maneja el caso donde success es false pero no hay mensaje', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false
        // message ausente
      }),
    })
    await expect(apiCall('/url')).rejects.toThrow('Operación fallida en el servidor')
  })
})