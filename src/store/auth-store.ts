import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { canDelete, canEdit, canAccessConfig, canAccessLiquidaciones, canAccessDigital, hasRole, hasAnyRole, type Role } from '@/lib/permissions'
import { logout } from '@/lib/auth'

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
  pollingIntervalId: NodeJS.Timeout | null
  
  // acciones
  setAuth: (user: any, token: string) => void
  clearAuth: () => void
  updateUserRole: (newRole: string) => void
  startRolePolling: () => void
  stopRolePolling: () => void
  
  // helpers de permisos
  canDelete: () => boolean
  canEdit: () => boolean
  canAccessConfig: () => boolean
  canAccessLiquidaciones: () => boolean
  canAccessDigital: () => boolean
  hasRole: (role: Role) => boolean
  hasAnyRole: (roles: Role[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      pollingIntervalId: null,

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
        // Detener polling antes de limpiar
        get().stopRolePolling()
        
        // Limpiar almacenamiento local y cookies
        logout()
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          pollingIntervalId: null,
        })
      },

      updateUserRole: (newRole: string) => {
        const { user } = get()
        if (!user) return

        const updatedUser: User = {
          ...user,
          role: newRole,
          roles: [newRole]
        }

        set({ user: updatedUser })
      },

      startRolePolling: () => {
        // Si ya hay polling activo, no iniciar otro
        if (get().pollingIntervalId) return

        const intervalId = setInterval(async () => {
          const { user, isAuthenticated, token } = get()
          
          // Solo hacer polling si esta autenticado y la pestaña esta activa
          if (!isAuthenticated || !user || !token || document.hidden) return

          try {
            // Importar dinamicamente para evitar dependencias circulares
            const { authApi } = await import('@/lib/api')
            const currentUser = await authApi.getCurrentUser()
            
            // Verificar si el rol cambio
            if (currentUser.role !== user.role) {
              // Actualizar el rol en el store
              get().updateUserRole(currentUser.role)
              
              // Mostrar notificacion al usuario
              const { toast } = await import('sonner')
              toast.info('Tus permisos han sido actualizados', {
                description: `Tu rol ahora es: ${currentUser.role}`
              })
            }

          } catch (error: any) {
            const errorMessage = error.message || '';
            
            // detectar si el usuario fue eliminado o desactivado (404 Not Found)
            // el backend devuelve "Recurso no encontrado" o "Usuario no encontrado" segun las constantes de error
            if (
              errorMessage.includes('Recurso no encontrado') || 
              errorMessage.includes('Usuario no encontrado') ||
              errorMessage.includes('User not found') ||
              errorMessage.includes('Error 404')
            ) {
              console.warn('Usuario no encontrado en polling (posible eliminacion/desactivacion). Cerrando sesion automaticamenete.')
              
              // importar toast dinamicamente
              const { toast } = await import('sonner')
              
              toast.error('Sesion finalizada', {
                description: 'Tu cuenta ha sido desactivada o eliminada. Contacta al administrador.'
              })
              
              // cerrar sesion
              get().clearAuth()
              return
            }

            // silenciosamente ignorar otros errores de red para no molestar al usuario
            // solo loguear en consola para debugging
            console.debug('Error checking role update:', error)
          }
        }, 5000) // Cada 5 segundos

        set({ pollingIntervalId: intervalId })
      },

      stopRolePolling: () => {
        const { pollingIntervalId } = get()
        if (pollingIntervalId) {
          clearInterval(pollingIntervalId)
          set({ pollingIntervalId: null })
        }
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

      canAccessDigital: () => {
        const { user } = get()
        return user ? canAccessDigital(user.roles) : false
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
