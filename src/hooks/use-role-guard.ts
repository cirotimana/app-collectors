import { useAuthStore } from '@/store/auth-store'
import { type Role } from '@/lib/permissions'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export interface UseRoleGuardOptions {
  allowedRoles?: Role[]
  requireDelete?: boolean
  requireEdit?: boolean
  redirectTo403?: boolean
}

export interface UseRoleGuardResult {
  isAllowed: boolean
  isLoading: boolean
  user: any 
}

export function useRoleGuard({
  allowedRoles,
  requireDelete = false,
  requireEdit = false,
  redirectTo403 = false,
}: UseRoleGuardOptions): UseRoleGuardResult {
  const router = useRouter()
  // usar AuthContext para el estado de carga inicial de autenticación
  const { loading: authLoading } = useAuth()
  const { user, canDelete: userCanDelete, canEdit: userCanEdit, hasAnyRole } = useAuthStore()
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)

  // efecto principal para verificar permisos
  useEffect(() => {
    // si todavia esta cargando la autenticación inicial, esperamos
    if (authLoading) return

    let allowed = true

    // verificar si hay usuario
    if (!user) {
      allowed = false
    }

    // verificar roles permitidos
    if (allowed && allowedRoles && allowedRoles.length > 0) {
      if (!hasAnyRole(allowedRoles)) {
        allowed = false
      }
    }

    // verificar permiso de eliminar
    if (allowed && requireDelete && !userCanDelete()) {
      allowed = false
    }

    // verificar permiso de editar
    if (allowed && requireEdit && !userCanEdit()) {
      allowed = false
    }

    setIsAllowed(allowed)

    // manejar redireccion si es necesaria y no esta permitido
    if (!allowed && redirectTo403) {
      setShouldRedirect(true)
    } else {
      setShouldRedirect(false)
    }

  }, [user, allowedRoles, requireDelete, requireEdit, redirectTo403, hasAnyRole, userCanDelete, userCanEdit, authLoading])

  // efecto separado para la navegacion
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/403')
    }
  }, [shouldRedirect, router])

  return {
    isAllowed,
    isLoading: shouldRedirect || authLoading, // consideramos loading si esta redirigiendo o cargando auth (auqnue es innecesario por la carga)
    user
  }
}
