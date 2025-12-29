import { getToken, logout } from './auth'

interface HelperOptions {
  headers?: Record<string, string>
  responseType?: 'json' | 'blob'
}

interface BackendResponse<T> {
  success: boolean
  message: string
  data: T
  statusCode: number
  // Metadata de paginación
  total?: number
  page?: number
  limit?: number
  totalPages?: number
  path?: string
  timestamp?: string
}

/**
 * realiza una peticion fetch con autenticacion jwt
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken()
  
  // agregar header de autorizacion
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  // realizar peticion
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  // si es 401, el token expiró o es inválido
  if (response.status === 401) {
    logout()
    // redirigir a login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Sesion expirada')
  }
  
  return response
}

/**
 * Wrapper principal para llamadas a la API que maneja la estructura estandarizada
 */
export async function apiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(url, options)

  // Si la respuesta no es OK verificar si hay mensaje de error en el body
  if (!response.ok) {
    let errorMessage = `Error ${response.status}`
    try {
      const errorBody = await response.json()
      // El backend estandarizado puede devolver el error en message o detail
      const rawError = errorBody.message || errorBody.detail
      
      if (typeof rawError === 'string') {
        errorMessage = rawError
      } else if (Array.isArray(rawError)) {
        // Caso común en Pydantic/FastAPI: array de errores
        errorMessage = rawError.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ')
      } else if (typeof rawError === 'object' && rawError !== null) {
        errorMessage = rawError.message || rawError.detail || JSON.stringify(rawError)
      } else if (rawError) {
        errorMessage = String(rawError)
      }
    } catch {
      // Ignorar error de parseo si no es JSON
    }
    throw new Error(errorMessage)
  }

  
  const body: BackendResponse<T> = await response.json()

  // Verificar flag de éxito del wrapper
  // MODIFICACION: Validar explicitamente false para soportar endpoints que no tengan la estructura estandarizada aun
  if (body.success === false) {
    throw new Error(body.message || 'Operación fallida en el servidor')
  }

  // Si tiene la estructura estandarizada (success present y data present), desempaquetamos
  // Si no, devolvemos el body completo (modo compatibilidad)
  const isStandardResponse = body.success === true && body.data !== undefined
  const result = isStandardResponse ? body.data : (body as unknown as T)

  // Lógica de "Magia de Paginación":
  // Si result es un array y hay metadata de paginación en la raíz, la adjuntamos.
  if (Array.isArray(result)) {
    if (body.total !== undefined) {
      Object.assign(result, {
        total: body.total,
        page: body.page,
        limit: body.limit,
        totalPages: body.totalPages
      })
    }
  }

  return result
}

/**
 * helper para peticiones get con autenticacion y unwrapping
 */
export async function getWithAuth<T>(url: string): Promise<T> {
  return apiCall<T>(url, { method: 'GET' })
}

/**
 * helper para peticiones post con autenticacion y unwrapping
 */
export async function postWithAuth<T>(
  url: string,
  body?: any
): Promise<T> {
  return apiCall<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * helper para peticiones put con autenticacion y unwrapping
 */
export async function putWithAuth<T>(
  url: string,
  body?: any
): Promise<T> {
  return apiCall<T>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * helper para peticiones patch con autenticacion y unwrapping
 */
export async function patchWithAuth<T>(
  url: string,
  body?: any
): Promise<T> {
    return apiCall<T>(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

/**
 * helper para peticiones delete con autenticacion y unwrapping
 */
export async function deleteWithAuth<T>(url: string): Promise<T> {
  return apiCall<T>(url, { method: 'DELETE' })
}
