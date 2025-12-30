"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { login as authLogin, logout as authLogout, isAuthenticated, getUser } from '@/lib/auth'
import { useAuthStore, type User } from '@/store/auth-store'
import type { LoginCredentials } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => { },
  logout: () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, setAuth, clearAuth } = useAuthStore()

  // verificar si hay sesion al cargar
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const userData = getUser()
        if (userData) {
          // sincronizar con zustand store si hay datos en localStorage
          setAuth(userData, localStorage.getItem('auth_token') || '')
        }
      } else {
        clearAuth()
      }
      setLoading(false)
    }

    checkAuth()
  }, [setAuth, clearAuth])

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authLogin(credentials)

      // guardar en zustand store
      setAuth(response.user, response.access_token)

      router.push('/dashboard/sales')
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  }

  const logout = () => {
    authLogout()
    clearAuth()
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: user !== null,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)