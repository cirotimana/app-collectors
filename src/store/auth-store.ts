import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { canDelete, canEdit, canAccessConfig, canAccessLiquidaciones, hasRole, hasAnyRole, type Role } from '@/lib/permissions'

export interface User {
  id?: number
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  roles: string[]
  role?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  
  // acciones
  setAuth: (user: any, token: string) => void
  clearAuth: () => void
  
  // helpers de permisos
  canDelete: () => boolean
  canEdit: () => boolean
  canAccessConfig: () => boolean
  canAccessLiquidaciones: () => boolean
  hasRole: (role: Role) => boolean
  hasAnyRole: (roles: Role[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (userData, token) => {
        // asegurar que roles sea un array
        const roles = Array.isArray(userData.roles) 
          ? userData.roles 
          : userData.role 
            ? [userData.role] 
            : []

        const user: User = {
          ...userData,
          roles
        }

        set({
          user,
          token,
          isAuthenticated: true,
        })
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      // helpers de permisos
      canDelete: () => {
        const { user } = get()
        return user ? canDelete(user.roles) : false
      },

      canEdit: () => {
        const { user } = get()
        return user ? canEdit(user.roles) : false
      },

      canAccessConfig: () => {
        const { user } = get()
        return user ? canAccessConfig(user.roles) : false
      },

      canAccessLiquidaciones: () => {
        const { user } = get()
        return user ? canAccessLiquidaciones(user.roles) : false
      },

      hasRole: (role) => {
        const { user } = get()
        return user ? hasRole(user.roles, role) : false
      },

      hasAnyRole: (roles) => {
        const { user } = get()
        return user ? hasAnyRole(user.roles, roles) : false
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
