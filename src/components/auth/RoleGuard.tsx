"use client"

import { useAuthStore } from '@/store/auth-store'
import { type Role } from '@/lib/permissions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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

  useEffect(() => {
    if (!user && redirectTo403) {
      router.push('/403')
    }
  }, [user, redirectTo403, router])

  if (!user) {
    return fallback
  }

  // verificar roles permitidos
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasAnyRole(allowedRoles)) {
      if (redirectTo403) {
        router.push('/403')
        return null
      }
      return fallback
    }
  }

  // verificar permiso de eliminar
  if (requireDelete && !userCanDelete()) {
    return fallback
  }

  // verificar permiso de editar
  if (requireEdit && !userCanEdit()) {
    return fallback
  }

  return <>{children}</>
}
