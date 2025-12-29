"use client"

import { useAuthStore } from '@/store/auth-store'
import { type Role } from '@/lib/permissions'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: Role[]
  requireDelete?: boolean
  requireEdit?: boolean
  fallback?: React.ReactNode
  redirectTo403?: boolean
}

export function RoleGuard({
  children,
  allowedRoles,
  requireDelete = false,
  requireEdit = false,
  fallback = null,
  redirectTo403 = false,
}: RoleGuardProps) {
  const router = useRouter()
  const { user, canDelete: userCanDelete, canEdit: userCanEdit, hasAnyRole } = useAuthStore()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  // Verificar permisos y determinar si debe redirigir
  useEffect(() => {
    if (!user && redirectTo403) {
      setShouldRedirect(true)
      return
    }

    if (user && allowedRoles && allowedRoles.length > 0) {
      if (!hasAnyRole(allowedRoles) && redirectTo403) {
        setShouldRedirect(true)
      }
    }
  }, [user, allowedRoles, hasAnyRole, redirectTo403])

  // Realizar la redireccion en un efecto separado
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/403')
    }
  }, [shouldRedirect, router])

  // Mostrar loading mientras redirige
  if (shouldRedirect) {
    return <div className="flex items-center justify-center min-h-screen">Redirigiendo...</div>
  }

  if (!user) {
    return <>{fallback}</>
  }

  // verificar roles permitidos
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasAnyRole(allowedRoles)) {
      return <>{fallback}</>
    }
  }

  // verificar permiso de eliminar
  if (requireDelete && !userCanDelete()) {
    return <>{fallback}</>
  }

  // verificar permiso de editar
  if (requireEdit && !userCanEdit()) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
