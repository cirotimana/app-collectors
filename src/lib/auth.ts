const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const TOKEN_KEY = 'auth_token'
const TOKEN_EXPIRY_KEY = 'auth_token_expiry'
const USER_KEY = 'auth_user'

// tipos para la respuesta del login
export interface LoginResponse {
  access_token: string
  user: {
    id?: number
    username?: string
    firstName?: string
    lastName?: string
    email?: string
    isActive?: boolean
    role?: string // backend devuelve role singular
    roles?: string[] // mantenemos compatibilidad interna
  }
}

export interface LoginCredentials {
  username: string
  password: string
}

/**
 * realiza login y almacena el token y datos del usuario
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error de autenticacion' }))
    throw new Error(error.detail || 'Error de autenticacion')
  }

  const data: LoginResponse = await response.json()
  
  // normalizar roles: si viene role singular, convertirlo a array roles
  if (data.user.role && !data.user.roles) {
    data.user.roles = [data.user.role]
  } else if (!data.user.roles) {
    data.user.roles = []
  }

  // asegurar que username exista si no viene
  if (!data.user.username && credentials.username) {
    data.user.username = credentials.username
  }
  
  // almacenar token y datos del usuario
  setToken(data.access_token)
  setUser(data.user)
  
  return data
}

/**
 * cierra sesion y limpia el token y datos del usuario
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    localStorage.removeItem(USER_KEY)
    // eliminar cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
  }
}

/**
 * obtiene el token almacenado
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  
  const token = localStorage.getItem(TOKEN_KEY)
  
  return token
}

/**
 * almacena el token
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(TOKEN_KEY, token)
  
  // tambien guardar en cookie para que el middleware pueda acceder
  // establecer expiracion de 24 horas
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 1)
  document.cookie = `auth_token=${token}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`
}

/**
 * almacena los datos del usuario
 */
export function setUser(user: LoginResponse['user']): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * obtiene los datos del usuario almacenados
 */
export function getUser(): LoginResponse['user'] | null {
  if (typeof window === 'undefined') return null
  
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

/**
 * verifica si el usuario esta autenticado
 */
export function isAuthenticated(): boolean {
  return getToken() !== null && getUser() !== null
}
