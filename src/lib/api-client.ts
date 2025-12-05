import { getToken, logout } from './auth'

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
  
  // si es 401, el token expiro o es invalido
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
 * helper para peticiones get con autenticacion
 */
export async function getWithAuth(url: string): Promise<Response> {
  return fetchWithAuth(url, { method: 'GET' })
}

/**
 * helper para peticiones post con autenticacion
 */
export async function postWithAuth(
  url: string,
  body?: any
): Promise<Response> {
  return fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * helper para peticiones put con autenticacion
 */
export async function putWithAuth(
  url: string,
  body?: any
): Promise<Response> {
  return fetchWithAuth(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * helper para peticiones delete con autenticacion
 */
export async function deleteWithAuth(url: string): Promise<Response> {
  return fetchWithAuth(url, { method: 'DELETE' })
}
