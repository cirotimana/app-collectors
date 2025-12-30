"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert, Home } from 'lucide-react'

export default function ForbiddenPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-3xl font-black">
            Acceso <span className="text-red-600">Denegado</span>
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Error 403 - Forbidden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            No tienes permisos para acceder a esta página o realizar esta acción.
          </p>
          <p className="text-center text-sm text-gray-500">
            Si crees que esto es un error, contacta con el administrador del sistema.
          </p>
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1"
            >
              Volver
            </Button>
            <Button
              onClick={() => router.push('/dashboard/sales')}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir al Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
