"use client"

import { type Role } from '@/lib/permissions'
import { useRoleGuard } from '@/hooks/use-role-guard'

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
  
  const { isAllowed, isLoading } = useRoleGuard({
    allowedRoles,
    requireDelete,
    requireEdit,
    redirectTo403
  })

  // mostrar loading mientras redirige o carga auth(auqnue innecesario)
  if (isLoading && redirectTo403) {
    return <div className="flex items-center justify-center min-h-screen">Redirigiendo...</div>
  }

  // si no esta permitido y no redirigimos, mostramos fallback (o null)
  if (!isAllowed) {
    return <>{fallback}</>
  }

  // si esta permitido, mostramos el contenido
  return <>{children}</>
}
